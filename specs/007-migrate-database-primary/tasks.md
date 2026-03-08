# Tasks: Migrate Database Primary Keys to UUID

**Input**: Design documents from `/specs/007-migrate-database-primary/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/web/` is primary application
- **Migrations**: `supabase/migrations/`
- **Contracts**: `specs/007-migrate-database-primary/contracts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backup database and prepare migration environment

- [x] T001 Create database backup before migration (Supabase dashboard or `pg_dump`)
- [x] T002 [P] Document pre-migration row counts for all 6 tables in verification checklist
- [x] T003 [P] Verify `gen_random_uuid()` function available in Supabase (run test query)

---

## Phase 2: User Story 2 - Existing Data Migration (Priority: P1) 🎯 MVP

**Goal**: Migrate all existing integer IDs to UUIDs while preserving relationships and data integrity

**Independent Test**: Run migration on database and verify row counts match pre/post, all FK relationships intact

**Why First**: Database migration MUST complete before TypeScript code changes can work. This is the foundational blocking step.

### Implementation for User Story 2

- [x] T004 [US2] Copy `contracts/01_add_uuid_columns.sql` to `supabase/migrations/20260103000001_uuid_migration_step1_add_columns.sql`
- [x] T005 [US2] Apply step 1 migration: Add UUID columns to all 6 tables
- [x] T006 [US2] Verify new `new_id` columns exist on session_plans, session_plan_exercises, session_plan_sets, workout_logs, workout_log_exercises, workout_log_sets
- [x] T007 [US2] Copy `contracts/02_populate_uuids.sql` to `supabase/migrations/20260103000002_uuid_migration_step2_populate.sql`
- [x] T008 [US2] Apply step 2 migration: Populate UUIDs and update FK references
- [x] T009 [US2] Verify all rows have UUIDs populated (no NULL values in new_id columns)
- [x] T010 [US2] Verify all FK references updated (no NULL values in new_*_id columns)
- [x] T011 [US2] Check for orphaned records using verification queries in contracts/02_populate_uuids.sql
- [x] T012 [US2] Copy `contracts/03_swap_columns.sql` to `supabase/migrations/20260103000003_uuid_migration_step3_swap_columns.sql`

**Checkpoint**: UUID columns added and populated. Ready for TypeScript changes before swap.

---

## Phase 3: User Story 3 - Application Code Compatibility (Priority: P2)

**Goal**: Update all TypeScript types, server actions, and UI components to work with string UUIDs

**Independent Test**: Application builds with zero type errors, manual CRUD operations work

**Why Now**: Code changes must be ready BEFORE swap migration (step 3) is applied

### Implementation for User Story 3

#### Type Definitions

- [ ] T013 [P] [US3] Update `id` type from `number` to `string` for SessionPlan in `apps/web/types/database.ts`
- [ ] T014 [P] [US3] Update `id` and `session_plan_id` types from `number` to `string` for SessionPlanExercise in `apps/web/types/database.ts`
- [ ] T015 [P] [US3] Update `id` and `session_plan_exercise_id` types from `number` to `string` for SessionPlanSet in `apps/web/types/database.ts`
- [ ] T016 [P] [US3] Update `id` type from `number` to `string` for WorkoutLog in `apps/web/types/database.ts`
- [ ] T017 [P] [US3] Update `id`, `workout_log_id`, and `session_plan_id` types from `number` to `string` for WorkoutLogExercise in `apps/web/types/database.ts`
- [ ] T018 [P] [US3] Update `id` and `workout_log_exercise_id` types from `number` to `string` for WorkoutLogSet in `apps/web/types/database.ts`

#### Server Actions - Session Plans

- [ ] T019 [US3] Update session plan actions to use string IDs in `apps/web/actions/plans/plan-actions.ts`
- [ ] T020 [US3] Update session plan exercise actions to use string IDs in `apps/web/actions/plans/plan-actions.ts`
- [ ] T021 [US3] Update session plan set actions to use string IDs in `apps/web/actions/plans/plan-actions.ts`

#### Server Actions - Workout Logs

- [ ] T022 [P] [US3] Update workout log actions to use string IDs in `apps/web/actions/workout/`
- [ ] T023 [P] [US3] Update workout log exercise actions to use string IDs in `apps/web/actions/workout/`
- [ ] T024 [P] [US3] Update workout log set actions to use string IDs in `apps/web/actions/workout/`

#### UI Components

- [ ] T025 [US3] Update session planner components for string IDs in `apps/web/components/features/training/`
- [ ] T026 [US3] Update workout components for string IDs in `apps/web/components/features/workout/`

#### Verification

- [ ] T027 [US3] Run `npm run type-check` to verify zero type errors
- [ ] T028 [US3] Run `npm run build` to verify application builds

**Checkpoint**: TypeScript code ready for UUID schema. Ready to apply swap migration.

---

## Phase 4: Apply Schema Swap (Blocking Step)

**Purpose**: Apply the breaking schema change after code is ready

**⚠️ CRITICAL**: This step changes the database schema. Code must be deployed alongside or immediately after.

- [ ] T029 [US2] Apply step 3 migration: Swap columns (UUID becomes primary, integer becomes backup) in Supabase
- [ ] T030 [US2] Verify `id` columns now contain UUIDs (spot check a few records)
- [ ] T031 [US2] Verify foreign key constraints are working (insert test should succeed)
- [ ] T032 [US3] Regenerate Supabase types: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae`
- [ ] T033 [US3] Update generated types file in `apps/web/types/supabase.ts` (if using generated types)

**Checkpoint**: Database schema swapped. Application should now work with UUIDs.

---

## Phase 5: User Story 4 - AI Tool UUID Generation (Priority: P2)

**Goal**: Replace temp ID generation with native `crypto.randomUUID()` in AI tools

**Independent Test**: Call createExerciseChangeRequest tool and verify it returns valid UUID format

### Implementation for User Story 4

#### Core ID Generation

- [ ] T034 [US4] Replace `generateTempId()` with `generateEntityId()` using `crypto.randomUUID()` in `apps/web/lib/changeset/buffer-utils.ts`
- [ ] T035 [US4] Update `TEMP_ID_PREFIX` constant usage or remove if no longer needed in `apps/web/lib/changeset/buffer-utils.ts`
- [ ] T036 [US4] Update `isTempId()` function to handle UUID format or remove if no longer needed in `apps/web/lib/changeset/buffer-utils.ts`

#### Coach Domain Tools

- [ ] T037 [US4] Update coach proposal tools to use `generateEntityId()` in `apps/web/lib/changeset/tools/coach-proposal-tools.ts`
- [ ] T038 [US4] Update transformations for UUID extraction in `apps/web/lib/changeset/transformations.ts`
- [ ] T039 [US4] Update coach execution layer for UUID handling in `apps/web/lib/changeset/execute.ts`

#### Athlete Domain Tools

- [ ] T040 [US4] Update athlete proposal tools to use `generateEntityId()` in `apps/web/lib/changeset/tools/athlete-proposal-tools.ts`
- [ ] T041 [US4] Update athlete execution layer for UUID handling in `apps/web/lib/changeset/execute-workout.ts`

**Checkpoint**: AI tools now generate real UUIDs. Ready to test core functionality.

---

## Phase 6: User Story 1 - AI Creates Exercise with Sets (Priority: P1) 🎯 Core Feature

**Goal**: Verify AI can create exercise with sets in single flow using UUIDs

**Independent Test**: Ask AI "add bench press with 3 sets of 10 reps" and verify both exercise AND all 3 sets created with correct relationships

**Why Last**: This is the validation phase - all infrastructure must be in place first

### Implementation for User Story 1

- [ ] T042 [US1] Test coach domain: Create session plan exercise with sets via AI assistant
- [ ] T043 [US1] Test athlete domain: Create workout log exercise with sets via AI assistant
- [ ] T044 [US1] Verify parent-child UUID relationships in database for coach domain
- [ ] T045 [US1] Verify parent-child UUID relationships in database for athlete domain
- [ ] T046 [US1] Test edge case: Multiple exercises with multiple sets in single conversation

**Checkpoint**: Core problem solved - AI can create exercise + sets in single conversation.

---

## Phase 7: Cleanup & Verification

**Purpose**: Remove backup columns, temp ID code, and verify success criteria

### Database Cleanup

- [ ] T047 Verify all CRUD operations work for all 6 tables (manual test)
- [ ] T048 Verify row counts match pre-migration counts (from T002 documentation)
- [ ] T049 Copy `contracts/04_cleanup.sql` to `supabase/migrations/20260103000004_uuid_migration_step4_cleanup.sql`
- [ ] T050 Apply step 4 migration: Drop backup columns and sequences (IRREVERSIBLE)
- [ ] T051 Verify no `old_*` columns remain in database schema

### Code Cleanup

- [ ] T052 [P] Remove unused temp ID generation code in `apps/web/lib/changeset/buffer-utils.ts`
- [ ] T053 [P] Remove temp ID resolution logic from `apps/web/lib/changeset/execute.ts` if no longer needed
- [ ] T054 [P] Remove temp ID resolution logic from `apps/web/lib/changeset/execute-workout.ts` if no longer needed
- [ ] T055 Remove `TEMP_ID_PREFIX` constant if unused in `apps/web/lib/changeset/buffer-utils.ts`

### Final Verification

- [ ] T056 Run `npm run type-check` - verify zero type errors
- [ ] T057 Run `npm run build` - verify build succeeds
- [ ] T058 Run `npm test` - verify existing tests pass
- [ ] T059 Validate all success criteria from quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **US2 - Migration (Phase 2)**: Depends on Setup - BLOCKS TypeScript changes
- **US3 - Code Compatibility (Phase 3)**: Depends on Phase 2 step 1-2 completion (columns added)
- **Schema Swap (Phase 4)**: Depends on Phase 3 completion - BLOCKS deployment
- **US4 - AI Tools (Phase 5)**: Depends on Phase 4 completion
- **US1 - Testing (Phase 6)**: Depends on Phase 5 completion
- **Cleanup (Phase 7)**: Depends on Phase 6 verification

### User Story Dependencies

```
US2 (P1: Migration) ──────────┐
                              ├──→ Phase 4 (Swap) ──→ US4 (P2: AI Tools) ──→ US1 (P1: Testing) ──→ Cleanup
US3 (P2: Code Compatibility) ─┘
```

- **User Story 2 (P1)**: Foundation - must complete first
- **User Story 3 (P2)**: Can start after US2 step 1-2, must complete before swap
- **User Story 4 (P2)**: Starts after swap, prerequisite for US1 testing
- **User Story 1 (P1)**: Validation phase - tests the complete solution

### Parallel Opportunities

Within Phase 1 (Setup):
- T002 and T003 can run in parallel

Within Phase 3 (Code Compatibility):
- T013-T018 (type definitions) can all run in parallel
- T022-T024 (workout actions) can run in parallel
- After type definitions complete, server actions can proceed

Within Phase 7 (Cleanup):
- T052-T054 (code cleanup) can run in parallel

---

## Parallel Example: Phase 3 Type Definitions

```bash
# Launch all type definition updates together:
Task: "Update id type for SessionPlan in apps/web/types/database.ts"
Task: "Update id and session_plan_id types for SessionPlanExercise in apps/web/types/database.ts"
Task: "Update id and session_plan_exercise_id types for SessionPlanSet in apps/web/types/database.ts"
Task: "Update id type for WorkoutLog in apps/web/types/database.ts"
Task: "Update id, workout_log_id, session_plan_id types for WorkoutLogExercise in apps/web/types/database.ts"
Task: "Update id and workout_log_exercise_id types for WorkoutLogSet in apps/web/types/database.ts"
```

---

## Implementation Strategy

### MVP First (US2 + US3 + Swap + US4 + US1)

1. Complete Phase 1: Setup (backup, document counts)
2. Complete Phase 2: US2 - Add UUID columns and populate
3. Complete Phase 3: US3 - Update TypeScript code
4. Complete Phase 4: Apply schema swap
5. Complete Phase 5: US4 - Update AI tools
6. Complete Phase 6: US1 - **VALIDATE** core feature works
7. **STOP**: Verify AI creates exercise + sets successfully
8. Complete Phase 7: Cleanup (optional, can defer)

### Rollback Points

1. **Before Phase 4 (Swap)**: Can rollback easily - just drop new columns
2. **After Phase 4, Before Phase 7**: Use `contracts/rollback.sql`
3. **After Phase 7 (Cleanup)**: No rollback - restore from backup only

### Critical Path

```
T001 → T004-T011 → T013-T028 → T029-T033 → T034-T041 → T042-T046 → T047-T059
Setup   Migration    TypeScript     Swap        AI Tools     Validation   Cleanup
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 (Migration) is foundational - blocks all other stories
- US1 (Testing) is validation - depends on all other stories
- Verify at each checkpoint before proceeding
- Keep backup columns until Phase 7 cleanup to enable rollback
- Total tasks: 59
