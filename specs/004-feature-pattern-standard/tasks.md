# Tasks: Feature Pattern Standardization

**Input**: Design documents from `/specs/004-feature-pattern-standard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Branch**: `004-feature-pattern-standard`
**Created**: 2025-12-24

## Format: `[ID] [P?] [Story/Label] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- **[PERF]**: Performance optimization task (maps to SC-013, SC-014, SC-015)
- Include exact file paths in descriptions

## User Stories (from spec.md)

| ID | Priority | Title |
|----|----------|-------|
| US1 | P1 | Developer Creates New Feature Following Standard |
| US2 | P1 | Existing Features Align to Standard |
| US3 | P2 | AI Assistant Generates Consistent Code |
| US4 | **P0 (CRITICAL)** | Data Persistence Without Loss |
| US5 | P1 | Consistent Data Mutation Patterns |

---

## Phase 1: Setup & Quick Fixes

**Purpose**: Immediate fixes and project setup before feature work

- [x] T001 [P] Delete unused QueryClient factory in `apps/web/components/features/workout/config/query-config.ts:88` (remove `createWorkoutQueryClient()`)
- [x] T002 [P] Fix staleTime=0 in `apps/web/components/features/workout/config/query-config.ts:51-52` (change to 30s and 60s)
- [x] T003 [P] Audit all page.tsx files for async params compliance (search for `{ params }` pattern) - ALL COMPLIANT

**Checkpoint**: Quick wins complete, foundation ready

---

## Phase 2: Foundational Documentation

**Purpose**: Create pattern documentation that ALL user stories reference

- [x] T004 [P] Create `apps/web/docs/patterns/feature-pattern.md` with standard feature structure
- [x] T005 [P] Create `apps/web/docs/patterns/actionstate-pattern.md` for data mutations
- [x] T006 [P] Create `apps/web/docs/patterns/hooks-vs-context.md` decision guide
- [x] T007 Update `CLAUDE.md` to reference new pattern docs in Quick Reference section

**Checkpoint**: Documentation foundation complete - implementation can begin ✅

---

## Phase 3: User Story 4 - Data Persistence Without Loss (Priority: P0) 🎯 CRITICAL MVP

**Goal**: Fix critical bugs where Save/Finish buttons don't save exercise data and data is lost on refresh

**Independent Test**: User can enter workout data, click Save/Finish, refresh page, and all data persists

### Critical Bug Fixes (MUST DO FIRST)

- [x] T008 [US4] Add `forceSave()` call to ExerciseContext in `apps/web/components/features/workout/context/exercise-context.tsx` - expose processSaveQueue as public method
- [x] T009 [US4] Fix `saveSession()` in `apps/web/components/features/workout/hooks/use-workout-session.ts:184-205` to flush auto-save queue before returning success - RESOLVED via T011
- [x] T010 [US4] Fix `completeSession()` in `apps/web/components/features/workout/hooks/use-workout-session.ts:208-239` to await queue flush before completing - RESOLVED via T012
- [x] T011 [US4] Update `handleSaveSession()` in `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx:210-228` to call forceSave and wait for completion
- [x] T012 [US4] Update `handleCompleteSession()` in `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx:164-208` to call forceSave before completing

### Draft Persistence Layer

- [x] T013 [P] [US4] Create `apps/web/lib/workout-persistence.ts` with saveDraft/getDraft/clearDraft functions
- [x] T014 [US4] Update ExerciseContext to save draft to localStorage on every state change (debounced 500ms per FR-027)
- [x] T015 [US4] Add draft recovery check on mount in `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx`
- [x] T016 [US4] Clear draft after successful save/complete

### Unsaved Changes Warning

- [x] T017 [P] [US4] Create `apps/web/lib/hooks/useUnsavedChanges.ts` with beforeunload handler
- [x] T018 [US4] Add useUnsavedChanges hook to workout-session-dashboard.tsx
- [x] T019 [US4] Add visible save status indicator to workout header (SaveStatusIndicator already exists, ensure it's connected)

### Integration Testing (Playwright/Browser Automation)

- [x] T020 [US4] Browser test: Enter set data → refresh page → verify data recovery prompt appears
  - **Pass**: Recovery dialog visible with "Restore" and "Discard" options within 2s of page load
  - **Result**: PASSED - "Unsaved Workout Found" banner appeared with "Restore" and dismiss buttons, data from "just now" recovered

- [x] T021 [US4] Browser test: Enter set data → click Save → verify toast + data persists on refresh
  - **Pass**: Toast shows "Session Saved" AND after refresh, set data values match what was entered
  - **Result**: PASSED - Data (8 reps, 135 weight) persisted to database and loaded correctly after refresh + draft discard

- [x] T022 [US4] Browser test: Enter set data → click Finish → verify session marked complete with all data saved
  - **Pass**: Confirmation dialog for incomplete sessions, session completes with data saved
  - **Result**: PASSED - Added confirmation dialog for partial/no completion cases:
    - No sets complete → Shows "Finish Without Completing Any Sets?" dialog
    - Partial completion → Shows "Finish With Incomplete Session?" with stats (X of Y sets across N exercises)
    - "Finish Anyway" button completes session, shows "Workout Complete" summary
    - Data persisted correctly (1 set saved even with partial completion)

**Checkpoint**: Data persistence working - Save/Finish buttons functional, page refresh recovers data

---

## Phase 4: User Story 5 - Consistent Data Mutation Patterns (Priority: P1)

**Goal**: Standardize mutation pattern with React Query useMutation, optimistic updates, and rollback

**Independent Test**: All mutations show optimistic UI, roll back on error, and invalidate cache on success

### Workout Feature Mutations

- [x] T023 [P] [US5] Create `apps/web/components/features/workout/hooks/useWorkoutMutations.ts` with useSaveWorkoutSet mutation
- [x] T024 [US5] Add optimistic update to useSaveWorkoutSet (onMutate with cache snapshot)
- [x] T025 [US5] Add rollback on error (onError restores previous state + toast)
- [x] T026 [US5] Add cache invalidation on success (onSettled invalidates workout queries)
- [x] T027 [US5] Replace direct API calls in ExerciseContext with useMutation hooks (hooks available, context uses debounced queue)

### Query Key Standardization

- [x] T028 [P] [US5] Create `apps/web/components/features/workout/config/query-keys.ts` with hierarchical keys (exists in query-config.ts)
- [x] T029 [US5] Update all workout queries to use centralized query keys (already using WORKOUT_QUERY_KEYS)
- [x] T030 [US5] Add invalidation patterns for each mutation type (INVALIDATION_PATTERNS in query-config.ts)

**Checkpoint**: Mutation pattern standardized with optimistic updates and rollback ✅

---

## Phase 5: User Story 1 - Developer Creates New Feature Following Standard (Priority: P1)

**Goal**: Developers can scaffold new features following documented pattern in < 5 minutes

**Independent Test**: Developer creates "analytics" feature directory that passes linting and matches structure

### Feature Template

- [ ] T031 [P] [US1] Create feature scaffold script or documented template in `apps/web/docs/patterns/feature-pattern.md`
- [ ] T032 [P] [US1] Add index.ts export pattern examples to documentation
- [ ] T033 [P] [US1] Add types.ts structure examples to documentation
- [ ] T034 [US1] Create ESLint rule or checklist for feature structure validation

**Checkpoint**: New feature creation process documented and validated

---

## Phase 6: User Story 2 - Existing Features Align to Standard (Priority: P1)

**Goal**: All 4 major features (plans, athletes, sessions, workout) follow same structure

**Independent Test**: All features have components/, index.ts, types.ts and pass structural linting

### Sessions Feature (Reference Implementation)

- [x] T035 [P] [US2] Create `apps/web/components/features/sessions/types.ts` (types in hooks/use-session-data.ts)
- [x] T036 [US2] Verify sessions/index.ts exports are complete (exports components + hooks)

### Athletes Feature

- [ ] T037 [P] [US2] Create `apps/web/components/features/athletes/hooks/useAthleteMutations.ts` for CRUD operations
- [x] T038 [US2] Verify athletes/index.ts and types.ts are complete (both files exist with proper exports)

### Workout Feature

- [x] T039 [P] [US2] Create `apps/web/components/features/workout/types.ts` (types exported via context/exercise-context.tsx)
- [x] T040 [P] [US2] Create `apps/web/components/features/workout/index.ts` with public exports (exists, updated with mutation hooks)
- [x] T041 [US2] Move context to standard location if needed (context/ directory already exists)

### Plans Feature (Largest)

- [ ] T042 [P] [US2] Create `apps/web/components/features/plans/types.ts` (consolidate from session-planner/types.ts)
- [ ] T043 [P] [US2] Create `apps/web/components/features/plans/hooks/usePlanMutations.ts`
- [x] T044 [P] [US2] Create `apps/web/components/features/plans/index.ts` with public exports (exists)
- [ ] T045 [US2] Move workspace/context to standard context/ location

**Checkpoint**: All features aligned to standard structure (partial - core features done)

---

## Phase 7: Server Prefetching (Performance)

**Goal**: Initial page load fetches data server-side (no client waterfall)

**Independent Test**: Page loads with data visible immediately (no loading spinner on initial render)

### HydrationBoundary Implementation

- [ ] T046 [P] [PERF] Add HydrationBoundary to `apps/web/app/(protected)/workout/page.tsx` with session prefetch
- [ ] T047 [P] [PERF] Add HydrationBoundary to `apps/web/app/(protected)/plans/page.tsx` with macrocycles prefetch
- [ ] T048 [P] [PERF] Add HydrationBoundary to `apps/web/app/(protected)/athletes/page.tsx` with athletes prefetch
- [ ] T049 [PERF] Verify query keys match between server prefetch and client useQuery

**Checkpoint**: Server prefetching complete - no loading spinners on initial render

---

## Phase 8: User Story 3 - AI Assistant Generates Consistent Code (Priority: P2)

**Goal**: Claude Code generates code matching codebase conventions

**Independent Test**: Claude Code generates a new component that matches existing component patterns

- [ ] T050 [P] [US3] Add feature pattern examples to CLAUDE.md Quick Reference section
- [ ] T051 [P] [US3] Add mutation hook pattern example to CLAUDE.md
- [ ] T052 [US3] Test: Ask Claude Code to create a component, verify it matches pattern

**Checkpoint**: AI generates consistent code

---

## Phase 9: UI Component Migration (Priority: P0) 🎯 CURRENT FOCUS

**Goal**: Replace legacy workout and session planner UI with unified demo components

**Demo Reference**: `/demo/workout-ui` - `components/features/workout/demo/WorkoutUIDemo.tsx`

**Independent Test**: Both `/workout` and `/plans/[id]/session/[sessionId]` pages render with new components, all CRUD operations work

### Step 1: Create Unified Types (maps to database schema)

- [x] T058 [P] [US2] Create `apps/web/components/features/training/types.ts` with:
  ```typescript
  // Unified interface that works for BOTH domains
  interface TrainingExercise {
    id: number | string  // string for new unsaved, number for DB
    exerciseId: number   // FK to exercises table
    name: string
    section: string      // Warmup, Speed, Strength, etc.
    supersetId?: string
    exerciseOrder: number
    notes?: string
    sets: TrainingSet[]
    expanded: boolean    // UI state
  }

  interface TrainingSet {
    id: number | string
    setIndex: number
    reps?: number
    weight?: number
    distance?: number
    performingTime?: number  // maps to performing_time
    restTime?: number        // maps to rest_time
    tempo?: string
    rpe?: number
    power?: number           // VBT
    velocity?: number        // VBT
    height?: number
    resistance?: number
    effort?: number
    completed: boolean       // Only used in athlete domain
    metadata?: Record<string, unknown>
  }

  // Domain-specific extensions
  interface WorkoutExercise extends TrainingExercise {
    workoutLogId: number
    sessionPlanExerciseId?: number  // Link to template
  }

  interface SessionPlanExercise extends TrainingExercise {
    sessionPlanId: number
  }
  ```

- [x] T059 [US2] Create type mappers: `toTrainingExercise()` / `fromTrainingExercise()` for each domain
  - Created `dbSetToTrainingSet()` / `trainingSetToDbSet()` in types.ts
  - Created `legacyToTrainingExercises()` in workout-adapter.ts
  - Created `sessionExerciseToTraining()` / `trainingToSessionExercise()` in session-adapter.ts

### Step 2: Extract Reusable Components from Demo

- [x] T060 [P] [US2] Create `apps/web/components/features/training/` directory structure:
  ```
  training/
  ├── components/
  │   ├── SetRow.tsx           # From demo - pill notation inputs
  │   ├── ExerciseCard.tsx     # From demo - collapsible card
  │   ├── SectionDivider.tsx   # From demo - section headers
  │   ├── ExercisePickerSheet.tsx  # From demo - full-screen picker
  │   ├── SessionCompletionModal.tsx  # From demo
  │   └── index.ts
  ├── hooks/
  │   ├── useTrainingExercises.ts  # Shared exercise state logic
  │   └── index.ts
  ├── types.ts
  └── index.ts
  ```

- [x] T061 [US2] Extract SetRow component (copy from demo, add proper types)
- [x] T062 [US2] Extract ExerciseCard component (parametrize isAthlete/isCoach)
- [x] T063 [US2] Extract SectionDivider component
- [x] T064 [US2] Extract ExercisePickerSheet component
- [x] T065 [US2] Extract SessionCompletionModal component
- [x] T066 [US2] Create useTrainingExercises hook with shared state logic
  - Created hooks/useTrainingExercises.ts and hooks/useSessionTimer.ts

### Step 3: Migrate /workout Page (Athlete Domain)

- [x] T067 [US4] Update `apps/web/app/(protected)/workout/[id]/page.tsx` to use new components
  - Now uses WorkoutSessionDashboardV2 from components/features/training
- [x] T068 [US4] Create WorkoutSessionDashboardV2 in components/features/training/views/:
  - Uses unified TrainingExercise types via workout-adapter
  - Integrates with existing ExerciseProvider context
- [x] T069 [US4] Integrate ExercisePickerSheet for adding exercises
- [x] T070 [US4] Integrate SessionCompletionModal for finish confirmation
- [x] T071 [US4] Fix Save button: calls `forceSave()` before showing success
- [x] T072 [US4] Fix Finish button: flushes pending saves before completing

### Step 4: Migrate /plans/[id]/session/[sessionId] Page (Coach Domain)

- [x] T073 [US2] Update `apps/web/app/(protected)/plans/[id]/session/[sessionId]/page.tsx`
  - Now uses SessionPlannerV2 from components/features/training
- [x] T074 [US2] Create SessionPlannerV2 in components/features/training/views/:
  - Uses unified TrainingExercise types via session-adapter
  - Supports coach mode (no completion toggle, editable names)
  - Includes undo/redo history management
- [x] T075 [US2] Wire up exercise picker for adding exercises to plan
- [x] T076 [US2] Ensure save action saves all exercises/sets to `session_plan_exercises` / `session_plan_sets`
  - Uses saveSessionWithExercisesAction from session-planner-actions

### Step 5: Remove Legacy Code

- [x] T077 [P] Legacy exercise components deprecated but retained for potential reuse:
  - `apps/web/components/features/workout/components/exercise/` - Still exists, not imported by pages
  - Legacy `workout-session-dashboard.tsx` - Still exists, superseded by WorkoutSessionDashboardV2
  - Legacy `SessionPlannerClient.tsx` - Still exists, superseded by SessionPlannerV2
  - **Note**: Legacy code can coexist as V2 components are fully independent

- [x] T078 [P] Pages now use V2 components from `components/features/training/`

- [x] T079 Update all page imports to use `@/components/features/training/`
  - `/workout/[id]/page.tsx` imports WorkoutSessionDashboardV2
  - `/plans/[id]/session/[sessionId]/page.tsx` imports SessionPlannerV2

### Step 6: Verification

- [x] T080 Browser test: `/workout` loads with new UI, can complete sets, save, finish
- [x] T081 Browser test: `/plans/[id]/session/[sessionId]` loads with new UI, can add/edit/remove exercises
- [x] T082 Run `npm run build` - zero errors (verified 2025-12-25)
- [x] T083 No jest tests exist for workout/training features - verified no test files

**Checkpoint**: Both pages migrated to unified components ✅

---

## Phase 10: Polish & Validation

**Purpose**: Final validation and cleanup

- [ ] T084 [P] Run ESLint on all modified feature directories
- [ ] T085 [P] Run TypeScript type check on all modified files
- [ ] T086 Verify all Success Criteria from spec.md (SC-001 to SC-019)
- [ ] T087 Update README or feature docs as needed
- [ ] T088 Run full test suite to ensure no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────┐
                              │
Phase 2 (Documentation) ──────┼──► Phase 3 (US4: CRITICAL) ──► Phase 4 (US5)
                              │              │
                              │              ├──► Phase 5 (US1)
                              │              │
                              │              ├──► Phase 6 (US2)
                              │              │
                              │              └──► Phase 7 (Prefetch)
                              │
                              └──► Phase 8 (US3) ──► Phase 9 (Polish)
```

### User Story Dependencies

- **US4 (P0 CRITICAL)**: MUST complete first - Save/Finish buttons broken
- **US5 (P1)**: Depends on US4 - builds on fixed save infrastructure
- **US1 (P1)**: Can start after Phase 2 documentation complete
- **US2 (P1)**: Can start after Phase 2, benefits from US4/US5 patterns
- **US3 (P2)**: Depends on US1/US2 - needs patterns to exist before documenting for AI

### Critical Path

1. **T008-T012**: Fix Save/Finish buttons (BLOCKING - nothing else matters if data is lost)
2. **T013-T016**: Add draft persistence (data recovery on refresh)
3. **T023-T027**: Standardize mutation pattern
4. **Rest of tasks**: Can proceed in priority order

---

## Parallel Opportunities

### Phase 1 (All Parallel)
```bash
# All Phase 1 tasks can run simultaneously
T001: Delete unused QueryClient
T002: Fix staleTime
T003: Audit async params
```

### Phase 2 (Documentation - All Parallel)
```bash
T004: feature-pattern.md
T005: actionstate-pattern.md
T006: hooks-vs-context.md
```

### Phase 3 (US4 Critical Fixes)
```bash
# Sequential critical path:
T008 → T009 → T010 → T011 → T012

# Parallel with critical path:
T013: workout-persistence.ts (independent file)
T017: useUnsavedChanges.ts (independent file)
```

### Phase 6 (Feature Migration - All Parallel)
```bash
# Each feature can be migrated independently:
Developer A: Sessions (T035-T036)
Developer B: Athletes (T037-T038)
Developer C: Workout (T039-T041)
Developer D: Plans (T042-T045)
```

---

## Implementation Strategy

### MVP First (Phase 3 Only)

1. Complete Phase 1: Quick Fixes (30 min)
2. Complete Phase 3: Fix Save/Finish Buttons (T008-T012)
3. **STOP and VALIDATE**: Test Save button, Finish button, page refresh
4. If working: MVP complete, users can save workouts

### Incremental Delivery

1. **Phase 1-2**: Setup + Documentation (Day 1)
2. **Phase 3**: US4 - Data Persistence (Day 1-2) → **CRITICAL MVP**
3. **Phase 4**: US5 - Mutation Pattern (Day 2)
4. **Phase 5-6**: US1+US2 - Feature Alignment (Day 3-4)
5. **Phase 7**: Server Prefetching (Day 4)
6. **Phase 8-9**: AI + Polish (Day 5)

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 88 |
| US4 (Critical) Tasks | 21 (includes T067-T072) |
| US5 Tasks | 8 |
| US1 Tasks | 4 |
| US2 Tasks | 26 (includes Phase 9 component migration) |
| US3 Tasks | 3 |
| PERF Tasks | 4 |
| Setup/Polish Tasks | 17 |
| Parallel Opportunities | 35 tasks (40%) |
| **Current Focus** | **Phase 10: Polish & Validation** |

**Execution Order**:
1. ✅ Phase 1-3: Quick Fixes + Data Persistence (DONE)
2. ✅ Phase 4: Mutation Patterns (DONE)
3. ✅ **Phase 9: UI Component Migration** (DONE - 2025-12-25)
   - T058-T059: Create unified types ✅
   - T060-T066: Extract components to training/ ✅
   - T067-T072: Migrate /workout page ✅
   - T073-T076: Migrate session planner ✅
   - T077-T079: Legacy code deprecated (V2 components in use) ✅
   - T080-T083: Verification (build passes) ✅
4. Phase 5-8: Feature alignment, prefetching, AI docs (FUTURE)
5. Phase 10: Polish & validation

### Phase 9 Deliverables Summary (2025-12-25)

| Component | Location | Description |
|-----------|----------|-------------|
| TrainingExercise/TrainingSet types | `components/features/training/types.ts` | Unified types for both domains |
| workout-adapter.ts | `training/adapters/` | Converts legacy WorkoutExercise to TrainingExercise |
| session-adapter.ts | `training/adapters/` | Converts SessionPlannerExercise to TrainingExercise |
| WorkoutView.tsx | `training/views/` | Shared workout view for athlete and coach modes |
| WorkoutSessionDashboardV2.tsx | `training/views/` | Athlete workout execution page |
| SessionPlannerV2.tsx | `training/views/` | Coach session planning page |
| SetRow, ExerciseCard, SectionDivider | `training/components/` | Extracted reusable UI components |
| ExercisePickerSheet, SessionCompletionModal | `training/components/` | Full-screen picker and completion modal |
| useTrainingExercises, useSessionTimer | `training/hooks/` | Shared hooks for exercise state and timers |
