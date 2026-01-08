# Research: ChangeSet Prompt Alignment

**Feature**: 009-changeset-prompt-alignment
**Date**: 2026-01-07

## Overview

This document captures decisions made during the analysis phase before implementation planning.

---

## Decision 1: Tool Naming Convention

### Decision
Use database entity names as tool prefixes for consistency and clarity.

### Rationale
- Coach domain uses `session_plans`, `session_plan_exercises`, `session_plan_sets` tables
- Athlete domain uses `workout_logs`, `workout_log_exercises`, `workout_log_sets` tables
- Tool names should directly reflect the entities they operate on
- Verbose but unambiguous naming is preferred over short but confusing names

### Alternatives Considered

| Option | Example | Rejected Because |
|--------|---------|------------------|
| No prefix (current coach) | `createExerciseChangeRequest` | Doesn't indicate which domain/entity |
| Short prefix | `createPlanExerciseChangeRequest` | "Plan" is ambiguous (could be macrocycle, mesocycle, etc.) |
| Training prefix (current athlete) | `createTrainingSetChangeRequest` | "Training" doesn't match database entity names |

### Final Naming

**Coach Domain:**
- `createSessionPlanExerciseChangeRequest`
- `updateSessionPlanExerciseChangeRequest`
- `deleteSessionPlanExerciseChangeRequest`
- `createSessionPlanSetChangeRequest`
- `updateSessionPlanSetChangeRequest`
- `deleteSessionPlanSetChangeRequest`
- `updateSessionPlanChangeRequest`

**Athlete Domain:**
- `createWorkoutLogExerciseChangeRequest`
- `updateWorkoutLogExerciseChangeRequest`
- `deleteWorkoutLogExerciseChangeRequest`
- `createWorkoutLogSetChangeRequest`
- `updateWorkoutLogSetChangeRequest`
- `deleteWorkoutLogSetChangeRequest`
- `updateWorkoutLogChangeRequest`

---

## Decision 2: Delete Operations in Athlete Domain

### Decision
Add delete tools to athlete domain with transformation layer validation.

### Rationale
- Athletes need to remove proposals from buffer before confirmation
- Currently forced to reset entire changeset if one proposal is wrong
- Deletion of already-saved data should be prevented (data integrity)

### Implementation

**Transformation Layer Logic:**
```
IF entityId.startsWith('temp-')
  THEN remove from buffer (allowed)
ELSE
  THEN reject with guidance message
```

**Rejection Message:**
> "Deleting logged workout data is not allowed. To mark as incomplete, use updateWorkoutLogSetChangeRequest with completed: false instead."

### Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| No delete tools | Athletes can't remove individual proposals |
| Allow all deletes | Would allow deletion of saved workout data |
| Soft delete only | Overcomplicates the mental model |

---

## Decision 3: Goal-Oriented Prompting

### Decision
Refactor prompts to follow goal-oriented patterns, removing procedural step-by-step instructions.

### Rationale
- Procedural prompts constrain agent flexibility
- Goal-oriented prompts let agents adapt to context
- Tool results should guide agent behavior naturally
- Documented in `specs/005-ai-athlete-workout/references/20260107-concept-changeset-prompting.md`

### Key Changes

1. **Remove numbered workflow steps** - Replace with goals and constraints
2. **Separate constraints from guidance** - Hard rules vs. soft principles
3. **Remove helper functions** - `buildRejectionFollowUpPrompt()` and `buildExecutionFailurePrompt()` not needed; tool results guide agent
4. **Simplify tool descriptions** - Outcome-focused, not procedural

### Prompt Structure

```
PERSONA
  - Goal-oriented identity
  - Capabilities (what, not how)

CONSTRAINTS
  - confirmChangeSet() required
  - resetChangeSet() to start fresh

SOFT_GUIDANCE
  - Gather context when helpful
  - Make reasonable assumptions
  - Ask when truly ambiguous

DOMAIN_KNOWLEDGE
  - Business rules
  - Entity relationships

CONTEXT_SECTION
  - Dynamic, injected per request
```

---

## Decision 4: Function Naming

### Decision
Use domain prefix for all prompt builder functions.

### Rationale
- Consistency between domains
- Clear which domain a function belongs to
- Easier to search/navigate codebase

### Final Naming

| File | Function |
|------|----------|
| `session-planner.ts` | `buildCoachSystemPrompt()` |
| `workout-athlete.ts` | `buildAthleteSystemPrompt()` (already correct) |

---

## Decision 5: Revision/Rejection Handling

### Decision
Do not add explicit revision handling sections to prompts.

### Rationale
- Follows goal-oriented prompting principle
- Tool results naturally guide agent on rejection
- Agent doesn't need to know internal state transitions
- Reduces prompt complexity

### Implementation
- Remove `buildRejectionFollowUpPrompt()` function
- Remove `buildExecutionFailurePrompt()` function
- Tool results contain sufficient context for agent to adapt

---

## Summary

| Topic | Decision |
|-------|----------|
| Tool naming | Database entity prefix (SessionPlan*, WorkoutLog*) |
| Delete in athlete | Add with temp-ID check in transformation layer |
| Prompting style | Goal-oriented, remove procedural steps |
| Function naming | Domain prefix (buildCoachSystemPrompt, buildAthleteSystemPrompt) |
| Revision handling | Let tool results guide agent (no explicit prompt section) |
