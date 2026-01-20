# Initializing Pipeline

> High-level design for efficient plan generation during onboarding

## Problem Statement

The current tool-calling approach for plan generation makes individual calls for each entity (microcycle, session, exercise, set), resulting in dozens of round-trips. While this granular approach aligns with the ChangeSet pattern principles for the agent session flow (where users iteratively modify plans), it creates a poor user experience during onboarding where the goal is to generate a complete initial plan quickly.

## Design Principle

Separate the **initialization flow** (bulk creation) from the **modification flow** (iterative changes):

- **Initializing Pipeline**: Used once at onboarding to create the full plan efficiently
- **ChangeSet Pattern**: Used post-onboarding for incremental modifications via agent chat

This preserves the ChangeSet pattern's principles for ongoing interactions while optimizing the first-time experience.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INITIALIZING PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐           │
│  │   Step 1     │      │   Step 2     │      │   Step 3     │           │
│  │   Planning   │ ───► │  Structured  │ ───► │  Scaffolding │ ───► State│
│  │    Agent     │      │    Output    │      │    (Code)    │           │
│  └──────────────┘      └──────────────┘      └──────────────┘           │
│                                                                          │
│  - Extended thinking   - Simple JSON        - Deterministic              │
│  - Context analysis    - Flat structure     - Expand sets                │
│  - Session planning    - DB-aligned fields  - Add defaults               │
│  - Exercise IDs        - No nested sets     - Generate IDs               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
                                              In-Memory Plan State
                                              (Ready for UI Review)
```

## Step 1: Planning Agent

**Purpose**: Analyze user context and design the training plan structure

**Capabilities**:
- Extended thinking enabled for deeper reasoning
- Access to exercise library for exercise selection with IDs
- Outputs a planning summary with specific exercise choices

**Output**: Natural language plan outline including:
- Weekly structure and session distribution
- Session focus areas and descriptions (the "why")
- **Specific exercises with IDs** from the library
- Sets, reps, weight, RPE, rest time for each exercise
- Progression strategy

## Step 2: Structured Output Agent

**Purpose**: Convert the plan outline into structured data

**Capabilities**:
- Structured output mode with JSON schema enforcement
- Takes planning summary as input
- Outputs **simple, flat JSON** matching database columns

**Output**: Single JSON object containing:
- Microcycles with names (week info embedded in name)
- Sessions with day (number), name, description
- Exercises with exercise_id, sets, reps, weight, rpe, rest_time (FLAT - not nested)

**Key Design Decision**: The schema is intentionally simple:
- No nested set objects - just `sets: 4, reps: 6`
- Only fields that exist in database
- AI focuses on creative decisions, not structural complexity

## Step 3: Scaffolding (Deterministic Code)

**Purpose**: Transform simple AI output into full in-memory plan state

**Process**:
- Expand `sets: 4` into array of 4 set objects with `set_index`
- Add `exercise_order` from array position
- Generate UUIDs for all entities
- Add default values where needed
- Output matches ChangeSet in-memory state format

**Why Separate Step**:
- AI shouldn't deal with structural expansion (error-prone)
- Deterministic code is reliable and fast
- Clear separation of concerns

## Step 2 Schema (Finalized)

```typescript
{
  plan_name: string,
  plan_description: string,
  microcycles: [
    {
      name: string,                    // "Week 1 - Foundation"
      sessions: [
        {
          day: number,                 // 0-6 (Sun=0, Mon=1, etc.)
          name: string,                // "Upper Body"
          description: string,         // WHY - agent reasoning
          exercises: [
            {
              exercise_id: number,     // from library
              sets: number,            // 4
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

## Output

The pipeline produces an **in-memory plan state** that:
- Is ready for UI display and review
- Matches the format expected by ChangeSet (for later modifications)
- Can be saved to database when user approves

## Benefits

1. **Faster initial generation**: 2 API calls instead of 20+
2. **Reliable schema**: Simple flat JSON that AI can generate correctly
3. **Clear separation**: AI does creative work, code does structural work
4. **Preserved flexibility**: ChangeSet pattern still available for modifications
5. **DB alignment**: Step 2 output matches actual database columns

## Related Documents

- `20260118-initializing-pipeline-tech-design.md` - Technical implementation
- `20260118-initializing-pipeline-philosophy.md` - Design decisions and learnings
- `20260107-concept-changeset-principles.md` - ChangeSet pattern principles
