# Tasks: Database Schema Optimization

**Input**: Design documents from `/specs/003-database-schema-optimization/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md
**Branch**: `003-database-schema-optimization`

**Tests**: Not requested for this feature (manual SQL verification instead)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

## Path Conventions

- **Web app monorepo**: `apps/web/` at repository root
- **Types**: `apps/web/types/`
- **Actions**: `apps/web/actions/`
- **Components**: `apps/web/components/`
- **Lib**: `apps/web/lib/`
- **Docs**: `apps/web/docs/`

---

## Phase 1: Setup (Not Required)

**Purpose**: Project already exists - no setup needed

This is an existing project optimization. Skip to Phase 2.

---

## Phase 2: Foundational - Database Migration

**Purpose**: Core database changes that MUST complete before ANY code updates

**⚠️ CRITICAL**: All code updates depend on these database changes completing first

### 2.1 Table Renames (Coach Planning Domain)

- [ ] T001 Rename table `exercise_preset_groups` to `session_plans` via Supabase SQL Editor
- [ ] T002 Rename table `exercise_presets` to `session_plan_exercises` via Supabase SQL Editor
- [ ] T003 Rename table `exercise_preset_details` to `session_plan_sets` via Supabase SQL Editor

### 2.2 Table Renames (Athlete Recording Domain)

- [ ] T004 Rename table `exercise_training_sessions` to `workout_logs` via Supabase SQL Editor
- [ ] T005 Rename table `exercise_training_details` to `workout_log_sets` via Supabase SQL Editor

### 2.3 Foreign Key Column Renames

- [ ] T006 Rename column `session_plan_exercises.exercise_preset_group_id` to `session_plan_id` via Supabase SQL Editor
- [ ] T007 Rename column `session_plan_sets.exercise_preset_id` to `session_plan_exercise_id` via Supabase SQL Editor
- [ ] T008 Rename column `workout_log_sets.exercise_training_session_id` to `workout_log_id` via Supabase SQL Editor

### 2.4 Verify Database Migration

- [ ] T009 Verify all table renames applied correctly via `SELECT * FROM session_plans LIMIT 1`
- [ ] T010 Verify all FK column renames applied correctly via `SELECT session_plan_id FROM session_plan_exercises LIMIT 1`
- [ ] T011 Verify RLS policies still apply to renamed tables via Supabase Dashboard > Authentication > Policies

**Checkpoint**: Database schema renamed - code updates can now begin

---

## Phase 3: User Story 3 - Schema Clarity & Performance (Priority: P2)

**Goal**: Clear table naming, appropriate data types (`TEXT` instead of `VARCHAR`), proper timestamps

**Independent Test**: Run `\d session_plans` in psql - all text columns should show `text` type, not `character varying`

> Note: User Story 3 is implemented before US1/US2 because VARCHAR→TEXT and timestamps are non-breaking changes that should happen alongside table renames

### 3.1 VARCHAR to TEXT Conversion

- [ ] T012 [P] [US3] Convert `exercises.name` from VARCHAR to TEXT via Supabase SQL Editor
- [ ] T013 [P] [US3] Convert `exercises.description` from VARCHAR to TEXT via Supabase SQL Editor
- [ ] T014 [P] [US3] Convert `workout_logs.notes` from VARCHAR to TEXT via Supabase SQL Editor
- [ ] T015 [P] [US3] Convert `tags.name` from VARCHAR to TEXT via Supabase SQL Editor
- [ ] T016 [P] [US3] Convert `units.name` and `units.abbreviation` from VARCHAR to TEXT via Supabase SQL Editor

### 3.2 Timestamp Additions (P1 Tables)

- [ ] T017 [P] [US3] Add `created_at` and `updated_at` to `athletes` table via Supabase SQL Editor
- [ ] T018 [P] [US3] Add `created_at` and `updated_at` to `coaches` table via Supabase SQL Editor
- [ ] T019 [P] [US3] Add `created_at` and `updated_at` to `exercises` table via Supabase SQL Editor
- [ ] T020 [P] [US3] Add `created_at` and `updated_at` to `session_plan_exercises` table via Supabase SQL Editor

### 3.3 Timestamp Additions (P2 Tables)

- [ ] T021 [P] [US3] Add `updated_at` to `athlete_groups` table via Supabase SQL Editor
- [ ] T022 [P] [US3] Add `updated_at` to `session_plan_sets` table via Supabase SQL Editor
- [ ] T023 [P] [US3] Add `updated_at` to `workout_log_sets` table via Supabase SQL Editor
- [ ] T024 [P] [US3] Add `updated_at` to `macrocycles`, `mesocycles`, `microcycles` tables via Supabase SQL Editor

### 3.4 Timestamp Defaults and Type Fixes

- [ ] T025 [US3] Add `DEFAULT now()` to all nullable `created_at` columns without defaults via Supabase SQL Editor
- [ ] T026 [US3] Fix `workout_logs.updated_at` type from `timestamp` to `timestamptz` via Supabase SQL Editor

### 3.5 Updated_at Trigger Function

- [ ] T027 [US3] Create `update_updated_at_column()` trigger function via Supabase SQL Editor
- [ ] T028 [US3] Apply `updated_at` trigger to `athletes`, `coaches`, `exercises`, `session_plan_exercises` tables
- [ ] T029 [US3] Apply `updated_at` trigger to `athlete_groups`, `session_plan_sets`, `workout_log_sets` tables
- [ ] T030 [US3] Apply `updated_at` trigger to `macrocycles`, `mesocycles`, `microcycles`, `workout_logs` tables

**Checkpoint**: US3 complete - schema clarity achieved, data types optimized

---

## Phase 4: User Story 2 - Data Integrity on Deletion (Priority: P1)

**Goal**: User deletions cascade properly so no orphaned data remains

**Independent Test**: Delete test workout_log, verify all workout_log_sets deleted automatically

### 4.1 CASCADE Constraints

- [ ] T031 [US2] Add `ON DELETE CASCADE` to `workout_log_sets.workout_log_id` FK via Supabase SQL Editor
- [ ] T032 [US2] Add `ON DELETE CASCADE` to `workout_logs.athlete_id` FK via Supabase SQL Editor
- [ ] T033 [US2] Add `ON DELETE CASCADE` to `macrocycles.user_id` FK via Supabase SQL Editor
- [ ] T034 [US2] Add `ON DELETE CASCADE` to `athlete_cycles.athlete_id` FK via Supabase SQL Editor
- [ ] T035 [US2] Add `ON DELETE CASCADE` to `athlete_cycles.macrocycle_id` FK via Supabase SQL Editor

### 4.2 Verify CASCADE Behavior

- [ ] T036 [US2] Create test workout_log with workout_log_sets, delete workout_log, verify sets deleted
- [ ] T037 [US2] Create test macrocycle, delete parent user, verify macrocycle deleted

**Checkpoint**: US2 complete - data integrity ensured

---

## Phase 5: User Story 1 - Data Security at Database Level (Priority: P1)

**Goal**: Training data protected at database level, private exercises hidden from other users

**Independent Test**: Query exercises as User A, verify only global + User A's private exercises returned

### 5.1 RLS Policy Updates

- [ ] T038 [US1] Drop existing "Public read access" policy on `exercises` table via Supabase SQL Editor
- [ ] T039 [US1] Create new `exercises` policy: `visibility = 'global' OR owner_user_id = auth.uid()` via Supabase SQL Editor
- [ ] T040 [US1] Drop existing "Users can manage own macrocycles" policy on `macrocycles` table
- [ ] T041 [US1] Create new `macrocycles` policy with coach access via `athlete_group_id` join
- [ ] T042 [US1] Verify `ai_memories` RLS: Keep RLS disabled (service-role only for AI operations per CLAUDE.md)
- [ ] T042.1 [US1] Verify `workout_logs` policy allows coaches to view/manage sessions for their athlete groups (FR-004)

### 5.2 Verify RLS Security

- [ ] T043 [US1] Test: Query exercises as User A - should return only global + private owned by A
- [ ] T044 [US1] Test: Query macrocycles as Coach - should return own + athlete group macrocycles
- [ ] T045 [US1] Test: Query macrocycles as Athlete - should return only own macrocycles

**Checkpoint**: US1 complete - database-level security enforced

---

## Phase 6: User Story 4 - Analytics-Ready Columns (Priority: P2)

**Goal**: Training metrics remain as explicit columns for direct SQL analytics

**Independent Test**: Run `SELECT AVG(height) FROM workout_log_sets WHERE height IS NOT NULL` - should work without JSONB extraction

### Implementation

- [ ] T046 [US4] Verify all analytics columns (`height`, `effort`, `tempo`, `resistance`, `velocity`, `power`) still exist in `session_plan_sets`
- [ ] T047 [US4] Verify all analytics columns still exist in `workout_log_sets`
- [ ] T048 [US4] Test: Run `SELECT AVG(height) FROM workout_log_sets` - confirm direct aggregation works

**Checkpoint**: US4 complete - no changes needed (columns kept per research.md decision)

---

## Phase 7: Code Updates - TypeScript Types

**Purpose**: Update application code to use new table/column names

**Prerequisite**: All database changes (Phases 2-6) must be complete

### 7.1 Type Regeneration

- [ ] T049 Regenerate database types: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > apps/web/types/database.ts`

### 7.2 Type Alias Updates

- [ ] T050 Add type aliases to `apps/web/types/database.ts`: SessionPlan, SessionPlanExercise, SessionPlanSet, WorkoutLog, WorkoutLogSet
- [ ] T051 Add legacy type aliases (deprecated) to `apps/web/types/database.ts` for backward compatibility

### 7.3 Extended Type Updates

- [ ] T052 Update `apps/web/types/training.ts` - rename `ExercisePresetGroupWithDetails` → `SessionPlanWithDetails`
- [ ] T053 Update `apps/web/types/training.ts` - rename `ExercisePresetWithDetails` → `SessionPlanExerciseWithDetails`
- [ ] T054 Update `apps/web/types/training.ts` - rename `ExerciseTrainingSessionWithDetails` → `WorkoutLogWithDetails`
- [ ] T055 Update `apps/web/types/training.ts` - update field references to new names
- [ ] T056 Update `apps/web/types/index.ts` - update re-exports for renamed types

### 7.4 Type Verification

- [ ] T057 Run `npm run type-check` - verify no type errors after type updates

**Checkpoint**: Types updated - server action updates can begin

---

## Phase 8: Code Updates - Server Actions

**Purpose**: Update all server actions to use new table/column names

### 8.1 Plan Actions (4 files)

- [ ] T058 [P] Update `apps/web/actions/plans/plan-actions.ts` - replace all old table/field names (12 refs)
- [ ] T059 [P] Update `apps/web/actions/plans/session-plan-actions.ts` - replace all old table/field names (25+ refs)
- [ ] T060 [P] Update `apps/web/actions/plans/session-planner-actions.ts` - replace all old table/field names (10 refs)
- [ ] T061 [P] Update `apps/web/actions/plans/plan-assignment-actions.ts` - replace all old table/field names (5 refs)

### 8.2 Session/Workout Actions (2 files)

- [ ] T062 [P] Update `apps/web/actions/sessions/training-session-actions.ts` - replace all old table/field names (40+ refs)
- [ ] T063 [P] Update `apps/web/actions/workout/workout-session-actions.ts` - replace all old table/field names (15 refs)

### 8.3 Other Actions (2 files)

- [ ] T064 [P] Update `apps/web/actions/library/exercise-actions.ts` - replace all old table/field names (30+ refs)
- [ ] T065 [P] Update `apps/web/actions/dashboard/dashboard-actions.ts` - replace all old table/field names (3 refs)

### 8.4 Action Verification

- [ ] T066 Run `npm run type-check` - verify no type errors after action updates

**Checkpoint**: Actions updated - component updates can begin

---

## Phase 9: Code Updates - Components

**Purpose**: Update all components to use new type names and field references

### 9.1 Workout Feature (~10 files)

- [ ] T067 Update `apps/web/components/features/workout/context/exercise-context.tsx` - update field references
- [ ] T068 [P] Update `apps/web/components/features/workout/components/exercise/exercise-card.tsx` - update field names
- [ ] T069 [P] Update `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx` - update field names
- [ ] T070 [P] Update `apps/web/components/features/workout/hooks/use-workout-session.ts` - update types and fields
- [ ] T071 [P] Update `apps/web/components/features/workout/hooks/use-workout-api.ts` - update types
- [ ] T072 [P] Update `apps/web/components/features/workout/hooks/use-workout-queries.ts` - update types

### 9.2 Plans Feature (~5 files)

- [ ] T073 Update `apps/web/components/features/plans/session-planner/types.ts` - update type names and references
- [ ] T074 Update `apps/web/app/(protected)/plans/[id]/page.tsx` - update field names
- [ ] T075 Update `apps/web/app/(protected)/plans/[id]/session/[sessionId]/page.tsx` - update field names

### 9.3 Session Feature (~2 files)

- [ ] T076 Update `apps/web/components/features/sessions/hooks/use-session-data.ts` - update commented subscription code

### 9.4 Composed Components

- [ ] T077 [P] Update `apps/web/components/composed/workout-session-exercise-count.tsx` - update field names
- [ ] T078 [P] Update `apps/web/components/composed/workout-session-duration-display.tsx` - update field names

### 9.5 Component Verification

- [ ] T079 Run `npm run type-check` - verify no type errors after component updates

**Checkpoint**: Components updated - utility updates can begin

---

## Phase 10: Code Updates - Utilities & Validation

**Purpose**: Update utility files with new table/field mappings

### 10.1 Changeset/Entity Mappings

- [ ] T080 Update `apps/web/lib/changeset/entity-mappings.ts` - update table and field mappings
- [ ] T081 Update `apps/web/lib/changeset/tool-implementations/read-impl.ts` - update table names

### 10.2 Validation Schemas

- [ ] T082 Update `apps/web/lib/validation/training-schemas.ts` - update schema names

### 10.3 Utility Verification

- [ ] T083 Run `npm run type-check` - verify no type errors after utility updates

**Checkpoint**: All code updates complete

---

## Phase 11: Polish & Verification

**Purpose**: Final verification and documentation updates

### 11.1 Build Verification

- [ ] T084 Run `npm run type-check` - full type verification
- [ ] T085 Run `npm run lint` - full lint verification
- [ ] T086 Run `npm run build` - full production build

### 11.2 CRUD Verification (Manual Testing)

- [ ] T087 Test: Create session plan in UI
- [ ] T088 Test: Add exercises to session plan
- [ ] T089 Test: Start workout from plan (creates workout_log)
- [ ] T090 Test: Log sets in workout (creates workout_log_sets)
- [ ] T091 Test: Delete session plan - verify cascade to exercises/sets
- [ ] T092 Test: Coach views athlete workout history

### 11.3 Documentation Updates

- [ ] T093 [P] Remove "Planned Rename" notes from `apps/web/docs/database-schema.md`
- [ ] T094 [P] Remove "Planned Rename" notes from `apps/web/docs/security/row-level-security-analysis.md`
- [ ] T095 [P] Update table references in `apps/web/docs/integrations/supabase-integration.md`
- [ ] T096 [P] Update table references in `apps/web/docs/development/api-architecture.md`
- [ ] T097 [P] Update table references in `apps/web/docs/features/feature-overview.md`
- [ ] T098 Update spec reference in `apps/web/docs/features/feature-overview.md` from `005` to `003`
- [ ] T099 Update spec reference in `apps/web/docs/database-schema.md` from `005` to `003`

**Checkpoint**: Feature complete - all user stories implemented and verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies - must start first
- **Phase 3-6 (User Stories)**: Depends on Phase 2 completion
- **Phase 7-10 (Code Updates)**: Depends on ALL database changes (Phases 2-6)
- **Phase 11 (Polish)**: Depends on all code updates

### User Story Dependencies

- **US3 (Schema Clarity)**: Start first - non-breaking data type changes
- **US2 (Cascade)**: Can start after US3 - FK constraint updates
- **US1 (Security)**: Can start after US3 - RLS policy updates
- **US4 (Analytics)**: Verification only - no changes needed

### Parallel Opportunities

**Phase 2**: T001-T005 can run in parallel (different tables)
**Phase 3**: T012-T016 can run in parallel (different columns), T017-T024 can run in parallel (different tables)
**Phase 7-10**: All tasks marked [P] can run in parallel (different files)

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 2 | T001-T011 | Database migration (foundational) |
| Phase 3 | T012-T030 | US3: Schema clarity |
| Phase 4 | T031-T037 | US2: Data integrity |
| Phase 5 | T038-T045 | US1: Security |
| Phase 6 | T046-T048 | US4: Analytics (verification) |
| Phase 7 | T049-T057 | TypeScript types |
| Phase 8 | T058-T066 | Server actions |
| Phase 9 | T067-T079 | Components |
| Phase 10 | T080-T083 | Utilities |
| Phase 11 | T084-T099 | Polish & verification |

**Total Tasks**: 99
**Parallel Opportunities**: ~60% of tasks can run in parallel

---

## Implementation Strategy

### MVP First (Database Migration Only)

1. Complete Phase 2: Foundational
2. **STOP and VALIDATE**: Verify tables renamed correctly
3. Regenerate types (T049) to confirm schema change

### Incremental Delivery

1. Database migration (Phase 2) → Schema ready
2. US3 + US2 + US1 (Phases 3-5) → Database complete
3. Types (Phase 7) → Foundation for code updates
4. Actions → Components → Utilities → Full application working
5. Polish → Production ready

### Rollback Plan

If issues occur at any phase:
- **Phase 2**: Reverse table renames (see quickstart.md)
- **Phase 3-6**: Reverse specific DB changes
- **Phase 7+**: Git revert code changes, regenerate types from current DB

---

## Notes

- [P] tasks = different files, no dependencies
- All SQL executed via Supabase SQL Editor or Dashboard
- Type regeneration uses: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae`
- Build verification: `npm run type-check && npm run lint && npm run build`
- Manual testing covers CRUD operations listed in spec.md CRUD Verification Checklist
