# Implementation Plan: AI Athlete Workout Assistant

**Branch**: `005-ai-athlete-workout` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification + 002-ai-session-assistant reference architecture
**Parent Feature**: 002-ai-session-assistant (Coach version)

## Summary

Extend the AI Session Assistant from Coach domain to Athlete domain. Athletes can use natural language to log workout performance, swap exercises, adjust weights, and add session notes. The feature reuses the existing ChangeSet pattern infrastructure (16 components) and implements athlete-specific tools, API route, and page integration.

**Core Pattern**: Human-in-the-loop AI with proposal → approval → execution flow (same as coach).

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16
**Primary Dependencies**: Vercel AI SDK (`useChat`, `streamText`, `tool`), React Context, Zod
**Storage**: Supabase (`workout_logs`, `workout_log_exercises`, `workout_log_sets` tables)
**Testing**: Manual E2E testing (matching 002 approach)
**Target Platform**: Web (responsive, mobile-first, PWA-ready)
**Project Type**: Web application (monorepo at `apps/web/`)
**Performance Goals**: Sub-2-second time to first AI token
**Constraints**:
- Must reuse existing ChangeSet pattern from 002
- Must use existing `execute-workout.ts` adapter
- Must use existing UI components from `components/features/ai-assistant/`
**Scale/Scope**: Athlete domain only (extends coach assistant)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Reuse existing infrastructure | PASS | 16 components from 002 are reusable |
| No new database tables | PASS | Uses existing `workout_logs`, `workout_log_exercises`, `workout_log_sets` |
| RLS compliance | PASS | All queries go through existing auth flow |
| ActionState pattern | PASS | Execution layer returns `ActionState<T>` |
| Server Actions for mutations | PASS | Uses existing `addExercisePerformanceAction`, `updateExercisePerformanceAction` |
| No `any` types | PASS | All new code uses strict TypeScript |

## Architecture Overview

### Reuse Strategy

This feature maximizes reuse from 002-ai-session-assistant:

```
Reusable (16 components)          New (8 components)
─────────────────────────────     ────────────────────────────
lib/changeset/types.ts            lib/changeset/tools/athlete-proposal-tools.ts
lib/changeset/ChangeSetContext    lib/changeset/tools/index.ts (extend)
lib/changeset/useChangeSet.ts     lib/changeset/prompts/workout-athlete.ts
lib/changeset/execute-workout.ts  lib/changeset/tool-implementations/workout-read-impl.ts
lib/changeset/buffer-utils.ts     app/api/ai/workout-assistant/route.ts
lib/changeset/errors.ts           app/(protected)/workout/[id]/WorkoutAssistantWrapper.tsx
components/ai-assistant/*
```

### Tool Categories (Athlete Domain)

| Category | Tools | Count |
|----------|-------|-------|
| **Read Tools** | `getWorkoutContext`, `getExerciseHistory`, `searchExercises` | 3 |
| **Proposal Tools** | `createTrainingSetChangeRequest`, `updateTrainingSetChangeRequest`, `createTrainingExerciseChangeRequest`, `updateTrainingExerciseChangeRequest`, `updateTrainingSessionChangeRequest` | 5 |
| **Coordination Tools** | `confirmChangeSet`, `resetChangeSet` | 2 |
| **Total** | | 10 |

### Key Differences from Coach Domain

| Aspect | Coach (002) | Athlete (005) |
|--------|-------------|---------------|
| Entity prefix | `session_plan_*` | `workout_log_*` |
| Delete operations | Yes | No (swap or skip instead) |
| Tool count | 12 | 10 |
| Read context | Session structure | Prescribed vs actual data |
| Execution adapter | `execute.ts` | `execute-workout.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/005-ai-athlete-workout/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── athlete-tools.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (new files only)

```text
apps/web/
├── lib/changeset/
│   ├── tools/
│   │   ├── athlete-proposal-tools.ts   # NEW: Athlete proposal tools
│   │   └── index.ts                     # MODIFY: Add athleteDomainTools export
│   ├── tool-implementations/
│   │   └── workout-read-impl.ts         # NEW: getWorkoutContext, getExerciseHistory
│   └── prompts/
│       └── workout-athlete.ts           # NEW: Athlete system prompt
│
├── app/api/ai/
│   └── workout-assistant/
│       └── route.ts                     # NEW: Athlete AI streaming endpoint
│
└── app/(protected)/workout/[id]/
    └── WorkoutAssistantWrapper.tsx      # NEW: Integration component
```

### Existing Files to Modify

```text
apps/web/
├── lib/changeset/tools/index.ts         # Add athleteDomainTools export
├── lib/changeset/tool-handler.ts        # May need athlete-specific handling
└── app/(protected)/workout/[id]/page.tsx # Wire up assistant wrapper
```

## Key Integration Points

### 1. Existing Workout Server Actions

```typescript
// apps/web/actions/sessions/training-session-actions.ts
export async function addExercisePerformanceAction(
  workoutLogExerciseId: number,
  setData: Partial<WorkoutLogSet>
): Promise<ActionState<WorkoutLogSet>>

export async function updateExercisePerformanceAction(
  setId: number,
  updates: Partial<WorkoutLogSet>
): Promise<ActionState<WorkoutLogSet>>
```

**Already integrated** in `lib/changeset/execute-workout.ts`.

### 2. Entity Mappings (Athlete Domain)

| Tool Field | Database Column |
|------------|-----------------|
| `workoutLogId` | `workout_logs.id` |
| `workoutLogExerciseId` | `workout_log_exercises.id` |
| `workoutLogSetId` | `workout_log_sets.id` |
| `reps` | `workout_log_sets.reps` |
| `weight` | `workout_log_sets.weight` |
| `rpe` | `workout_log_sets.rpe` |
| `completed` | `workout_log_sets.completed` |

### 3. Context Data Structure

```typescript
// Return type for getWorkoutContext
interface WorkoutContext {
  session: {
    id: number
    name: string
    sessionStatus: 'assigned' | 'ongoing' | 'completed'
    dateTime: string
    notes: string | null
  }
  exercises: Array<{
    id: number
    workoutLogExerciseId: number
    exerciseName: string
    exerciseOrder: number
    prescribed: { reps: number; weight: number | null; rpe: number | null }
    sets: Array<{
      setIndex: number
      prescribed: { reps: number; weight: number | null; rpe: number | null }
      actual: { reps: number | null; weight: number | null; rpe: number | null; completed: boolean } | null
    }>
  }>
  progress: {
    totalSets: number
    completedSets: number
    skippedSets: number
  }
}
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| UI component incompatibility | Verify `AIEnhancedSetRow` works with workout entity types |
| Entity type confusion | Separate `athlete-proposal-tools.ts` with clear naming |
| Execution adapter gaps | `execute-workout.ts` already handles sets; may need exercise support |
| Permission checking | Defer to P2; document as assumption that athletes can modify |

## Success Criteria

From spec.md:

- [ ] Athletes can log set performance via natural language and approve changes
- [ ] AI response time for simple queries is under 2 seconds
- [ ] Exercise search returns relevant alternatives
- [ ] Zero data corruption incidents
- [ ] Approval flow works end-to-end: propose → review → approve/regenerate/dismiss

## Implementation Phases

### Phase 0: Research (Already Complete)

- ✅ Identified reusable components (16)
- ✅ Identified new components needed (8)
- ✅ Validated existing execution adapter
- ✅ Documented entity mappings

### Phase 1: Core Tools & API

1. Create `athlete-proposal-tools.ts` with 5 proposal tools
2. Update `tools/index.ts` with `athleteDomainTools` export
3. Create `workout-read-impl.ts` for workout context
4. Create `workout-athlete.ts` system prompt
5. Create `/api/ai/workout-assistant/route.ts`

### Phase 2: Page Integration

1. Create `WorkoutAssistantWrapper.tsx`
2. Integrate with workout page layout
3. Wire up `ChangeSetProvider` and `useChat`
4. Test end-to-end flow

### Phase 3: Polish & Testing (P2)

1. Add `getExerciseHistory` tool
2. Implement permission checking
3. E2E test scenarios

## Reference Documents

All architecture follows `specs/002-ai-session-assistant/reference/`:

| Document | Relevance |
|----------|-----------|
| `20251221-changeset-principles.md` | Core pattern (reuse as-is) |
| `20251221-changeset-architecture.md` | State machine (reuse as-is) |
| `20251221-session-entity-model.md` | Athlete entity mappings (reference) |
| `20251221-session-tool-definitions.md` | Athlete tool schemas (implement) |

## Next Steps

Run `/speckit.tasks` to generate detailed task breakdown.

Critical path:
```
athlete-proposal-tools.ts → tools/index.ts → workout-read-impl.ts →
workout-athlete.ts → route.ts → WorkoutAssistantWrapper.tsx → page integration
```
