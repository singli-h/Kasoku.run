# Agent Tools Plan: First Experience Plan Generator

**Feature**: Individual User First Experience
**Focus**: Agent Tool Definitions for AI Plan Generation
**Created**: 2026-01-18
**Updated**: 2026-01-18
**Status**: Draft

---

## Overview

This document defines the agent tools required for the AI-powered plan generation in the first experience flow. It follows the established ChangeSet pattern with `{operation}{EntityType}ChangeRequest` naming convention.

### Context

- **User Flow**: User completes personalization (days, duration, equipment) → AI generates Week 1 → User reviews → AI generates remaining weeks → User approves → Plan saved
- **Two-Step Approval**: Week 1 reviewed separately before generating full plan
- **Existing Infrastructure**: ChangeSet pattern already implements session-level tools; we need plan-level tools

---

## 1. Agent Mental Model

**Core Principle**: The agent does NOT know about changesets or buffers.

From the agent's perspective:
- It **reads** current plan data (which is base data + pending changes merged)
- It **creates/updates/deletes** entities directly
- It **confirms** when ready for user to review
- Tool results guide next steps

### What Agent Knows

| Concept | Agent's Understanding |
|---------|----------------------|
| Operations | Create, update, delete entities |
| Confirmation | "Call confirm when ready for user review" |
| IDs | "I get an entityId back, use it for children/updates" |

### What Agent Does NOT Know

| Hidden Detail | Handled By |
|---------------|------------|
| Temp IDs vs real IDs | Transformation layer |
| Buffer/changeset state | useChangeSet hook |
| Week 1 restriction | Tool result messages |
| Pause/resume mechanics | Coordination tools |

### Tool Results as Teacher

```
Agent calls: createMicrocycleChangeRequest({ weekNumber: 2, ... })

If Week 1 only mode:
  Returns: { success: false, error: "Week 1 must be approved first. Only Week 1 entities can be created." }

If full plan mode:
  Returns: { success: true, entityId: "temp-xxx", message: "Week 2 added" }
```

The agent learns from results what it can/cannot do without needing to understand the underlying state machine.

---

## 2. Entity Hierarchy

```
mesocycles (training block - created deterministically, NOT by agent)
    └── microcycles (weeks)
            └── session_plans (sessions)
                    └── session_plan_exercises
                            └── session_plan_sets
```

### Entity to Table Mapping (Direct 1:1)

| Tool Entity | Database Table | Notes |
|-------------|---------------|-------|
| Microcycle | `microcycles` | Week within the block |
| SessionPlan | `session_plans` | Training session |
| SessionPlanExercise | `session_plan_exercises` | Exercise in a session |
| SessionPlanSet | `session_plan_sets` | Set parameters |

### Pre-Created Entity (Not Agent-Generated)

| Entity | Database Table | Notes |
|--------|---------------|-------|
| Mesocycle | `mesocycles` | Created deterministically before AI runs |

**Rationale**: For individual first experience, there's always exactly 1 mesocycle. Creating it deterministically:
- Simplifies agent logic (no need to create parent first)
- Reduces tool count
- The mesocycle ID is passed as context to the agent

---

## 3. Tool Categories

Following the ChangeSet pattern:

| Category | Purpose | Runs On | Returns Tool Result? |
|----------|---------|---------|---------------------|
| **Read Tools** | Fetch context, current state | Server/Client | Yes (immediate) |
| **Proposal Tools** | Build changeset (CRUD entities) | Client | Yes (immediate) |
| **Coordination Tools** | Control flow (confirm, pause) | Client | Delayed (after user) |

---

## 4. Read Tools

### 4.1 `getPlanGenerationContext`

**Purpose**: Gather all context needed for plan generation in a single call.

```typescript
const getPlanGenerationContextSchema = z.object({
  // No inputs - uses current user context
})

// Returns:
interface PlanGenerationContext {
  user: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    primaryGoal: string
    secondaryGoals: string[]
  }
  preferences: {
    trainingDays: string[]              // ['monday', 'wednesday', 'friday']
    sessionDuration: number             // minutes
    equipment: 'full_gym' | 'home' | 'bodyweight' | 'dumbbells'
  }
  constraints: {
    injuriesOrLimitations: string[]
    availableEquipment: string[]
  }
}
```

**Rationale**: Single read tool reduces round trips. Contains all personalization data entered in Steps 1-2 of the wizard.

---

### 4.2 `searchExercisesForPlan`

**Purpose**: Search exercise library with equipment and muscle group filters.

```typescript
const searchExercisesForPlanSchema = z.object({
  muscleGroups: z.array(z.string()).describe('Target muscle groups'),
  equipment: z.array(z.string()).optional().describe('Available equipment'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  limit: z.number().int().default(10),
})

// Returns:
interface ExerciseSearchResult {
  exercises: Array<{
    id: string
    name: string
    primaryMuscles: string[]
    secondaryMuscles: string[]
    equipment: string[]
    difficulty: string
    category: string    // compound, isolation, cardio
  }>
}
```

**Rationale**: Extends existing exercise search. AI uses this to select appropriate exercises based on user's equipment and goals.

---

### 4.3 `getCurrentPlanState` ⭐ Critical

**Purpose**: Return the current plan state (base data + pending changes merged).

This is how the agent "sees" what it has built so far. The agent doesn't know about changesets - it just reads the current state.

```typescript
const getCurrentPlanStateSchema = z.object({
  // No inputs - returns current merged state
})

// Returns (aligned with DB schema):
interface CurrentPlanState {
  mesocycle: {
    id: string              // Real ID (pre-created)
    name: string
    goal_type: string
    duration_weeks: number
  }

  microcycles: Array<{
    id: string              // Could be temp-xxx or real ID
    week_number: number
    name: string
    focus?: string
    is_deload: boolean
    session_plans: Array<{
      id: string
      name: string
      day_of_week: string
      session_type: string
      estimated_duration: number
      session_plan_exercises: Array<{
        id: string
        exercise_id: string
        exercise_name: string
        exercise_order: number
        notes?: string
        session_plan_sets: Array<{
          id: string
          set_number: number
          reps?: number
          rpe?: number
          rest_seconds?: number
          tempo?: string
        }>
      }>
    }>
  }>
}
```

**Key Behavior**:
- Returns merged view: base data (mesocycle pre-created) + all pending changes applied
- Agent uses this to understand what exists before making updates
- Uses snake_case to match database column names

**Example Usage**:
```
User: "Actually, change the Monday session to Tuesday"

Agent:
1. Calls getCurrentPlanState() to see current sessions
2. Finds the Monday session with id "temp-session-123"
3. Calls updateSessionPlanChangeRequest({ session_plan_id: "temp-session-123", day_of_week: "tuesday" })
```

---

## 5. Proposal Tools

All proposal tools follow the `{operation}{EntityType}ChangeRequest` pattern with snake_case fields matching DB columns.

**Note**: Mesocycle is pre-created deterministically - no agent tools for it.

### 5.1 Microcycle (Week)

#### `createMicrocycleChangeRequest`

```typescript
const createMicrocycleChangeRequestSchema = z.object({
  mesocycle_id: z.string().describe('Parent mesocycle ID (pre-created)'),
  week_number: z.number().int().min(1).describe('Week number within block'),
  name: z.string().describe("Week name (e.g., 'Week 1 - Foundation')"),
  focus: z.string().optional().describe('Training focus for this week'),
  is_deload: z.boolean().default(false).describe('Whether this is a deload week'),
  reasoning: z.string().describe('Why this week structure'),
})

// Returns:
{ success: true, entity_id: "temp-{uuid}", message: "Week 1 created" }

// Week 1 restriction:
// If week_number > 1 AND week1OnlyMode is true:
{ success: false, error: "Week 1 must be approved first. Only Week 1 can be created now." }
```

#### `updateMicrocycleChangeRequest`

```typescript
const updateMicrocycleChangeRequestSchema = z.object({
  microcycle_id: z.string().describe('ID of week to update'),
  name: z.string().optional(),
  focus: z.string().optional(),
  is_deload: z.boolean().optional(),
  reasoning: z.string().describe('Why this change'),
})
```

#### `deleteMicrocycleChangeRequest`

```typescript
const deleteMicrocycleChangeRequestSchema = z.object({
  microcycle_id: z.string().describe('ID of week to delete'),
  reasoning: z.string().describe('Why deleting'),
})
```

---

### 5.2 SessionPlan (Session)

#### `createSessionPlanChangeRequest`

```typescript
const createSessionPlanChangeRequestSchema = z.object({
  microcycle_id: z.string().describe('Parent week ID'),
  name: z.string().describe("Session name (e.g., 'Upper Body A')"),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .describe('Scheduled day'),
  session_type: z.enum(['strength', 'hypertrophy', 'cardio', 'recovery', 'mixed'])
    .describe('Type of session'),
  estimated_duration: z.number().int().describe('Estimated duration in minutes'),
  notes: z.string().optional().describe('Session notes'),
  reasoning: z.string().describe('Why this session'),
})

// Returns:
{ success: true, entity_id: "temp-{uuid}", message: "Session created" }
```

#### `updateSessionPlanChangeRequest`

```typescript
const updateSessionPlanChangeRequestSchema = z.object({
  session_plan_id: z.string().describe('ID of session to update'),
  name: z.string().optional(),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  session_type: z.enum(['strength', 'hypertrophy', 'cardio', 'recovery', 'mixed']).optional(),
  estimated_duration: z.number().int().optional(),
  notes: z.string().optional(),
  reasoning: z.string().describe('Why this change'),
})
```

#### `deleteSessionPlanChangeRequest`

```typescript
const deleteSessionPlanChangeRequestSchema = z.object({
  session_plan_id: z.string().describe('ID of session to delete'),
  reasoning: z.string().describe('Why deleting'),
})
```

---

### 5.3 SessionPlanExercise

#### `createSessionPlanExerciseChangeRequest`

```typescript
const createSessionPlanExerciseChangeRequestSchema = z.object({
  session_plan_id: z.string().describe('Parent session ID'),
  exercise_id: z.string().describe('Exercise ID from library'),
  exercise_name: z.string().describe('Exercise name for display'),
  exercise_order: z.number().int().describe('Position in session (0-based)'),
  superset_group: z.string().optional().describe('Superset group identifier'),
  notes: z.string().optional().describe('Exercise-specific notes'),
  reasoning: z.string().describe('Why this exercise'),
})

// Returns:
{ success: true, entity_id: "temp-{uuid}", message: "Exercise added" }
```

#### `updateSessionPlanExerciseChangeRequest`

```typescript
const updateSessionPlanExerciseChangeRequestSchema = z.object({
  session_plan_exercise_id: z.string().describe('ID of exercise to update'),
  exercise_id: z.string().optional().describe('New exercise ID (for swapping)'),
  exercise_name: z.string().optional().describe('New name (required if swapping)'),
  exercise_order: z.number().int().optional(),
  superset_group: z.string().optional(),
  notes: z.string().optional(),
  reasoning: z.string().describe('Why this change'),
})
```

#### `deleteSessionPlanExerciseChangeRequest`

```typescript
const deleteSessionPlanExerciseChangeRequestSchema = z.object({
  session_plan_exercise_id: z.string().describe('ID of exercise to delete'),
  reasoning: z.string().describe('Why deleting'),
})
```

---

### 5.4 SessionPlanSet

#### `createSessionPlanSetChangeRequest`

```typescript
const createSessionPlanSetChangeRequestSchema = z.object({
  session_plan_exercise_id: z.string().describe('Parent exercise ID'),
  set_count: z.number().int().min(1).default(1)
    .describe('Number of sets to add with same params'),
  reps: z.number().int().optional().describe('Target reps'),
  rpe: z.number().int().min(1).max(10).optional().describe('Target RPE'),
  rest_seconds: z.number().int().optional().describe('Rest between sets'),
  tempo: z.string().optional().describe('Tempo (e.g., "3-1-2-0")'),
  notes: z.string().optional().describe('Set notes'),
  reasoning: z.string().describe('Why these parameters'),
})

// Returns:
{ success: true, entity_ids: ["temp-{uuid}", ...], message: "3 sets added" }
```

#### `updateSessionPlanSetChangeRequest`

```typescript
const updateSessionPlanSetChangeRequestSchema = z.object({
  session_plan_set_id: z.string().optional().describe('Direct set ID'),
  session_plan_exercise_id: z.string().optional().describe('Parent exercise (with set_index)'),
  set_index: z.number().int().min(1).optional().describe('Which set (1-based)'),
  apply_to_all_sets: z.boolean().optional().describe('Apply to all sets of exercise'),
  reps: z.number().int().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  rest_seconds: z.number().int().optional(),
  tempo: z.string().optional(),
  notes: z.string().optional(),
  reasoning: z.string().describe('Why this change'),
})
```

#### `deleteSessionPlanSetChangeRequest`

```typescript
const deleteSessionPlanSetChangeRequestSchema = z.object({
  session_plan_set_id: z.string().optional().describe('Direct set ID'),
  session_plan_exercise_id: z.string().optional().describe('Parent exercise (with set_index)'),
  set_index: z.number().int().min(1).optional().describe('Which set to remove'),
  remove_count: z.number().int().min(1).default(1).describe('Remove N sets from end'),
  reasoning: z.string().describe('Why deleting'),
})
```

---

## 6. Coordination Tools

### 6.1 `confirmPlanChangeSet`

**Purpose**: Submit the plan changeset for user approval.

```typescript
const confirmPlanChangeSetSchema = z.object({
  title: z.string().describe('Summary title for approval banner'),
  description: z.string().describe('Description of what was generated'),
})
```

**Behavior**:
- Sets changeset status to `pending_approval`
- Pauses AI stream (returns `'PAUSE'`)
- Resumes when user makes decision

**Resume Results**:

```typescript
// User approves Week 1 (week1OnlyMode was true)
{
  status: 'approved',
  message: 'Week 1 approved. You can now generate the remaining weeks.',
  week1OnlyMode: false  // Now unlocked
}

// User approves full plan (week1OnlyMode was false)
{
  status: 'approved',
  message: 'Plan applied successfully. All entities created.',
  executed: true
}

// User requests changes
{
  status: 'rejected',
  feedback: 'Change the Monday session to have more compound movements',
  message: 'User requested changes. Modify the plan and confirm again.'
}
```

---

### 6.2 `resetPlanChangeSet`

**Purpose**: Clear changeset and start over (rare use case).

```typescript
const resetPlanChangeSetSchema = z.object({
  reason: z.string().describe('Why resetting'),
})
```

---

## 7. Tool Summary

### Read Tools (3)

| Tool | Purpose | Runs On |
|------|---------|---------|
| `getPlanGenerationContext` | Get user profile & preferences | Server |
| `searchExercisesForPlan` | Search exercise library | Server |
| `getCurrentPlanState` | Get merged current state | Client |

### Proposal Tools (12 = 4 entities × 3 operations)

| Entity | Create | Update | Delete |
|--------|--------|--------|--------|
| Microcycle | `createMicrocycleChangeRequest` | `updateMicrocycleChangeRequest` | `deleteMicrocycleChangeRequest` |
| SessionPlan | `createSessionPlanChangeRequest` | `updateSessionPlanChangeRequest` | `deleteSessionPlanChangeRequest` |
| SessionPlanExercise | `createSessionPlanExerciseChangeRequest` | `updateSessionPlanExerciseChangeRequest` | `deleteSessionPlanExerciseChangeRequest` |
| SessionPlanSet | `createSessionPlanSetChangeRequest` | `updateSessionPlanSetChangeRequest` | `deleteSessionPlanSetChangeRequest` |

**Note**: Mesocycle is pre-created (not agent-generated)

### Coordination Tools (2)

| Tool | Purpose |
|------|---------|
| `confirmPlanChangeSet` | Submit for approval |
| `resetPlanChangeSet` | Clear and restart |

**Total: 17 tools**

---

## 8. Execution Order

When changeset is approved (full plan), entities are created in dependency order:

```
Pre-existing: mesocycles (already created before AI runs)
Order 0: microcycles (references mesocycle_id - real ID)
Order 1: session_plans (references microcycle_id)
Order 2: session_plan_exercises (references session_plan_id)
Order 3: session_plan_sets (references session_plan_exercise_id)
```

### ID Resolution

Temp IDs (`temp-{uuid}`) are resolved during execution:

```typescript
const idMap = new Map<string, string>()  // temp-id → real-id

// mesocycle_id is already real (pre-created)

// When creating microcycle
const { data } = await supabase.from('microcycles').insert({
  ...changeRequest.proposed_data,
  mesocycle_id: changeRequest.proposed_data.mesocycle_id  // Already real
}).select('id').single()
idMap.set('temp-micro-abc', data.id)

// When creating session_plan, replace microcycle reference
const sessionPlanData = {
  ...proposedData,
  microcycle_id: idMap.get(proposedData.microcycle_id) || proposedData.microcycle_id
}
```

---

## 9. Two-Step Flow (week1OnlyMode)

The two-step approval is controlled by a `week1OnlyMode` boolean flag, NOT separate phases in the tool schema.

### How It Works

```typescript
// State managed in transformation layer
let week1OnlyMode = true  // Starts as true

// When AI tries to create Week 2+
function handleCreateMicrocycle(input) {
  if (week1OnlyMode && input.weekNumber > 1) {
    return {
      success: false,
      error: "Week 1 must be approved first. Only Week 1 can be created now."
    }
  }
  // ... proceed with creation
}

// When user approves Week 1
function handleApproval() {
  week1OnlyMode = false  // Unlock remaining weeks
  // Resume AI stream with:
  // { status: 'approved', message: 'Week 1 approved. Generate remaining weeks.', week1OnlyMode: false }
}
```

### Flow Diagram

```
User completes personalization
        │
        ▼
┌─────────────────────────────────────────────────┐
│  SETUP (Deterministic)                          │
├─────────────────────────────────────────────────┤
│  Create mesocycle record in database            │
│  Pass mesocycle_id to AI as context             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  PHASE 1: week1OnlyMode = true                  │
├─────────────────────────────────────────────────┤
│  AI calls getPlanGenerationContext              │
│  AI calls searchExercisesForPlan (×N)           │
│  AI creates:                                    │
│    - 1× Microcycle (Week 1 only)                │
│    - 3× SessionPlans                            │
│    - 12× SessionPlanExercises                   │
│    - 36× SessionPlanSets                        │
│  AI calls confirmPlanChangeSet(...)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
              UI shows Week 1
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
 "Looks Good"    "Change X"      "Start Over"
    │                │                │
    │                │                ▼
    │                │          resetPlanChangeSet
    │                │                │
    │                ▼                ▼
    │         AI modifies ──► confirmPlanChangeSet
    │                              │
    ▼                              │
┌───────────────────────────────────────────────┐
│  week1OnlyMode = false (unlocked)             │
└───────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  PHASE 2: week1OnlyMode = false                 │
├─────────────────────────────────────────────────┤
│  AI receives: "Week 1 approved. Generate rest." │
│  AI creates:                                    │
│    - 3× Microcycles (Weeks 2-4)                 │
│    - 9× SessionPlans                            │
│    - 36× SessionPlanExercises                   │
│    - 108× SessionPlanSets                       │
│  AI calls confirmPlanChangeSet(...)             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
           UI shows full plan
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
 "Apply Plan"    "Adjust"        "Start Over"
    │                │                │
    │                │                ▼
    │                │          resetPlanChangeSet
    │                ▼
    │         AI modifies ──► confirmPlanChangeSet
    │
    ▼
┌─────────────────────────────────────────────────┐
│  EXECUTION                                       │
├─────────────────────────────────────────────────┤
│  Execute all ChangeRequests in order            │
│  Create: Microcycles → SessionPlans → ...       │
│  Resolve temp IDs → real IDs                    │
│  (mesocycle already exists)                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
               ✅ Success
```

### Key Points

1. **Single Changeset**: Everything accumulates in ONE changeset buffer
2. **No Partial Execution**: Database writes only happen at "Apply Plan"
3. **Tool Results Control Flow**: Agent learns what's allowed from tool results
4. **Seamless Iteration**: User can request changes at any point before final approval

---

## 10. V1 Scope Notes

| Aspect | V1 Approach | Notes |
|--------|-------------|-------|
| **Operations** | Full CRUD | Create, Update, Delete for all entities |
| **Read State** | `getCurrentPlanState` | Agent sees merged view of changes |
| **Execution** | Sequential creates | Ordered by entity hierarchy |
| **Week Control** | `week1OnlyMode` flag | Tool results teach the agent |
| **Feedback** | Text-based chat | Agent modifies via update/delete tools |

### Future Enhancements (Not V1)

- Batch/transaction RPC for execution
- Granular week-by-week approval (beyond 2-step)
- Structured modification UI (drag-drop exercises)
- Undo/redo within changeset

---

## 11. File Structure

```
apps/web/lib/changeset/
├── tools/
│   ├── plan-generator/
│   │   ├── read-tools.ts           # getPlanGenerationContext, searchExercisesForPlan, getCurrentPlanState
│   │   ├── proposal-tools.ts       # All 15 create/update/delete tools
│   │   └── coordination-tools.ts   # confirmPlanChangeSet, resetPlanChangeSet
│   └── index.ts                    # Export all
├── prompts/
│   └── plan-generator.ts           # System prompt for plan generation
├── transformations/
│   └── plan-generator-transform.ts # Tool input → ChangeRequest conversion
├── state/
│   └── plan-state-merger.ts        # Merge base data + pending changes for getCurrentPlanState
└── execute-plan.ts                 # Execution logic for plan entities
```

---

## 12. Integration Points

### With Existing ChangeSet Infrastructure

- Reuse `useChangeSet` hook for buffer management
- Reuse `ChangeSetStatus` state machine
- Reuse execution pattern (adapt for plan entities)

### With UI Components

- `PlanGenerationReview.tsx` displays changeset
- `WeekStepper.tsx` visualizes weeks in changeset
- `ProposedSessionCard.tsx` shows session details

### With Server Actions

- New `createGeneratedPlanAction` for batch entity creation
- Reuse existing `searchExercises` action

---

## 13. Next Steps

1. **Define Tool Schemas** - Zod schemas for all 20 tools
2. **Implement Read Tools** - Including `getCurrentPlanState` with state merger
3. **Implement Proposal Tools** - With week1OnlyMode checks
4. **Create Transformation Layer** - Tool input → ChangeRequest conversion
5. **Implement Execution Logic** - Create entities in correct order with ID resolution
6. **Create System Prompt** - Guide AI on tool usage (goal-oriented, not procedural)
7. **Wire to UI** - Connect changeset to `PlanGenerationReview`

---

*Plan created: 2026-01-18*
*Updated: 2026-01-18*
- Added agent mental model, getCurrentPlanState, update/delete tools, week1OnlyMode clarification
- Aligned naming with database schema (snake_case, session_plan_*, microcycles)
- Removed mesocycle tools (pre-created deterministically, mesocycle_id passed as context)
- Reduced from 20 tools to 17 tools

*Status: Ready for Review*
