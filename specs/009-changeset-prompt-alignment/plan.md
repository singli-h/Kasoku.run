# Implementation Plan: ChangeSet Prompt Alignment

**Branch**: `009-changeset-prompt-alignment` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-changeset-prompt-alignment/spec.md`

## Summary

Align AI assistant tool naming with database schema (SessionPlan*, WorkoutLog*) and refactor prompts to follow goal-oriented patterns. Add delete operations to athlete domain with transformation layer checks.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Vercel AI SDK, Zod (validation)
**Storage**: Supabase PostgreSQL (session_plans, workout_logs tables)
**Testing**: Manual testing via AI chat interface
**Target Platform**: Next.js 16 web application
**Project Type**: Web application (monorepo: apps/web)
**Performance Goals**: N/A (refactoring, no performance changes)
**Constraints**: Must maintain backward compatibility with existing changeset architecture
**Scale/Scope**: 2 prompt files, associated tool definitions, transformation layer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file contains template placeholders only - no specific gates defined. Proceeding with standard best practices:

- [x] Changes are focused and minimal
- [x] No unnecessary abstractions introduced
- [x] Maintains existing architecture patterns
- [x] Changes are independently testable

## Project Structure

### Documentation (this feature)

```text
specs/009-changeset-prompt-alignment/
├── plan.md              # This file
├── research.md          # Phase 0 output - decisions from prior discussion
├── quickstart.md        # Phase 1 output - implementation guide
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (files to modify)

```text
apps/web/lib/changeset/
├── prompts/
│   ├── session-planner.ts      # Coach domain prompt
│   └── workout-athlete.ts      # Athlete domain prompt
└── tool-implementations/       # Transformation layer
```

**Structure Decision**: Modifying existing files in the changeset module. No new directories needed.

## Implementation Tasks

### Task 1: Rename Coach Domain Tools (FR-001)

Rename all tool references in `session-planner.ts`:

| Current | New |
|---------|-----|
| `createExerciseChangeRequest` | `createSessionPlanExerciseChangeRequest` |
| `updateExerciseChangeRequest` | `updateSessionPlanExerciseChangeRequest` |
| `deleteExerciseChangeRequest` | `deleteSessionPlanExerciseChangeRequest` |
| `createSetChangeRequest` | `createSessionPlanSetChangeRequest` |
| `updateSetChangeRequest` | `updateSessionPlanSetChangeRequest` |
| `deleteSetChangeRequest` | `deleteSessionPlanSetChangeRequest` |
| `updateSessionChangeRequest` | `updateSessionPlanChangeRequest` |

### Task 2: Rename Athlete Domain Tools (FR-002)

Rename all tool references in `workout-athlete.ts`:

| Current | New |
|---------|-----|
| `createTrainingExerciseChangeRequest` | `createWorkoutLogExerciseChangeRequest` |
| `updateTrainingExerciseChangeRequest` | `updateWorkoutLogExerciseChangeRequest` |
| `createTrainingSetChangeRequest` | `createWorkoutLogSetChangeRequest` |
| `updateTrainingSetChangeRequest` | `updateWorkoutLogSetChangeRequest` |
| `updateTrainingSessionChangeRequest` | `updateWorkoutLogChangeRequest` |

### Task 3: Add Delete Tools to Athlete Domain (FR-003, FR-004)

Add new tools to `workout-athlete.ts`:
- `deleteWorkoutLogExerciseChangeRequest`
- `deleteWorkoutLogSetChangeRequest`

Implement transformation layer logic:
- If entity ID starts with `temp-` → remove from buffer (allowed)
- If entity ID is a real database ID → reject with message:
  > "Deleting logged workout data is not allowed. To mark as incomplete, use updateWorkoutLogSetChangeRequest with completed: false instead."

### Task 4: Rename Function (FR-008)

| File | Current | New |
|------|---------|-----|
| `session-planner.ts` | `buildSystemPrompt()` | `buildCoachSystemPrompt()` |

Note: `workout-athlete.ts` already uses `buildAthleteSystemPrompt()` - no change needed.

### Task 5: Refactor Prompts to Goal-Oriented (FR-005, FR-006, FR-007)

Apply principles from `specs/005-ai-athlete-workout/references/20260107-concept-changeset-prompting.md`:

**For both prompts:**
1. Remove step-by-step numbered workflow instructions
2. Replace with goals and constraints
3. Separate hard constraints from soft guidance
4. Remove `buildRejectionFollowUpPrompt()` and `buildExecutionFailurePrompt()` - tool results guide agent
5. Simplify tool descriptions to be outcome-focused

**Structure to follow:**
```
PERSONA (goal-oriented)
CONSTRAINTS (must-follow rules)
SOFT_GUIDANCE (principles, adapt to context)
DOMAIN_KNOWLEDGE (business rules)
CONTEXT_SECTION (dynamic)
```

### Task 6: Update Tool Definitions (if separate files exist)

Search for tool definition files and update:
- Tool names to match new naming convention
- Tool descriptions to be concise and outcome-focused

## Complexity Tracking

No constitution violations - changes are straightforward refactoring.

## Dependencies

- Existing changeset architecture must be understood
- Prompting concepts document: `specs/005-ai-athlete-workout/references/20260107-concept-changeset-prompting.md`
- Database schema reference: `session_plans`, `session_plan_exercises`, `session_plan_sets`, `workout_logs`, `workout_log_exercises`, `workout_log_sets`
