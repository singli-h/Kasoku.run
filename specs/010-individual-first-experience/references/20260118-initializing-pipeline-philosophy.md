# Init Pipeline - Design Philosophy & Learnings

> Key insights discovered while designing the Init Pipeline

---

## Problem Discovery: OpenAI Structured Output Constraints

### The Issue

When implementing `generateObject` with a complex nested schema, we encountered:

```
Invalid schema for response_format 'response':
'required' is required to be supplied and to be an array
including every key in properties. Missing 'reps'.
```

**Root Cause**: OpenAI's structured output does NOT support optional fields. All properties must be required. Using `.optional()` in Zod creates schemas that OpenAI rejects.

### Attempted Fix

Changed `.optional()` to `.nullable()`:
```typescript
// Before (fails)
reps: z.number().optional()

// After (works but still complex)
reps: z.number().nullable()
```

This revealed a deeper problem: forcing the AI to output complex nested structures (exercise → sets array → individual set objects) is error-prone.

---

## Key Insight: Separation of Concerns

**AI should focus on creative decisions, code should handle structural complexity.**

| AI Responsibility | Code Responsibility |
|-------------------|---------------------|
| Exercise selection | Generate UUIDs |
| Sets/reps numbers | Expand sets to array |
| Session descriptions | Add exercise_order |
| Training reasoning | Add default values |
| Week structure | Map day number to name |

---

## Problem Discovery: In-Memory State vs Database Schema Mismatch

### The Issue

The ChangeSet in-memory state (`MicrocycleData`, `SessionPlanData`, etc.) contained fields that **don't exist in the database**:

| In-Memory Field | Database Column | Status |
|-----------------|-----------------|--------|
| `week_number` | ❌ Not in `microcycles` | **Mismatch** |
| `is_deload` | ❌ Not in `microcycles` | **Mismatch** |
| `focus` | ❌ Not in `microcycles` | **Mismatch** |
| `session_type` | ❌ Not in `session_plans` | **Mismatch** |
| `estimated_duration` | ❌ Not in `session_plans` | **Mismatch** |
| `day_of_week` (string) | `day` (number) | **Wrong type** |
| `exercise_name` | ❌ Not in `session_plan_exercises` | **Mismatch** |

### Why This Matters

If the in-memory state doesn't match the database:
1. Save actions will fail (inserting non-existent columns)
2. ChangeSet pattern breaks (changes can't be persisted correctly)
3. The whole foundation is unstable

### Resolution

1. Step 2 schema only includes fields that exist in database
2. Extra display fields (like `exercise_name`) are populated from joins
3. In-memory state should be reviewed to align with DB (future task)

---

## Design Decision: 3-Step Pipeline

### Why Not 2 Steps?

Original design:
1. Planning Agent (thinking)
2. Structured Output (complex JSON matching in-memory state)

**Problem**: Step 2 tried to output complex nested structures that:
- AI struggles to generate correctly
- Require all fields (no optionals)
- Include structural details AI shouldn't care about

### Solution: Add Scaffolding Step

New design:
1. Planning Agent → Natural language plan with exercise IDs
2. Structured Output → **Simple, flat JSON**
3. Scaffolding (Code) → Transform to full in-memory state

**Benefits**:
- AI outputs intuitive structure (`sets: 4, reps: 6`)
- Code expands to complex structure (array of 4 set objects)
- Clear separation of AI creativity vs code determinism

---

## Finalized Step 2 Schema

```typescript
{
  plan_name: string,
  plan_description: string,
  microcycles: [
    {
      name: string,                    // "Week 1 - Foundation"
      sessions: [
        {
          day: number,                 // 0-6
          name: string,                // "Upper Body"
          description: string,         // WHY - reasoning
          exercises: [
            {
              exercise_id: number,     // from library
              sets: number,            // 4 (count, not array)
              reps: number,            // 6
              weight: number | null,   // null for bodyweight
              rpe: number,             // 7-9
              rest_time: number        // seconds
            }
          ]
        }
      ]
    }
  ]
}
```

### Design Principles Applied

1. **Flat, not nested**: `sets: 4` instead of array of set objects
2. **DB-aligned**: Only fields that exist in database tables
3. **Nullable for optional**: `weight` can be null (bodyweight exercises)
4. **Intuitive for AI**: Schema structure matches how humans think about workouts

---

## Lessons Learned

### 1. Start from Database Schema

When designing AI output schemas, start by checking what the database actually stores. Don't assume the in-memory types are correct.

### 2. AI Limitations with Complex JSON

AI models struggle with:
- Deeply nested structures
- Expanding counts to arrays (sets: 4 → 4 set objects)
- Structural metadata (IDs, ordering, timestamps)

Let code handle these deterministically.

### 3. Validate Early

The OpenAI schema validation error revealed issues early. Test with real API calls during design, not just type checking.

### 4. Separation of Init vs Modify

Bulk creation (Init Pipeline) and incremental modification (ChangeSet) have different requirements:
- Init: Speed, simplicity, one-shot
- Modify: Precision, granularity, iterative

Don't force one pattern to do both.

---

## Future Considerations

1. **Align ChangeSet in-memory state with DB**: The current types have fields that don't persist. This needs review.

2. **Exercise library integration**: Step 1 needs access to exercise library to provide IDs. This API route may need to be created.

3. **Error recovery**: If Step 2 fails, how do we retry? The planning summary is already generated.

---

*Created: 2026-01-19*
*Context: Debugging Init Pipeline structured output failures*
