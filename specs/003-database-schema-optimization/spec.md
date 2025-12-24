# Feature Specification: Database Schema Optimization

**Feature Branch**: `005-database-schema-optimization`
**Created**: 2025-12-24
**Status**: In Progress
**Target Project**: Sprint (Dev) (`pcteaouusthwbgzczoae`)

## User Scenarios & Testing

### User Story 1 - Data Security at Database Level (Priority: P1)

As a platform user, I want my training data protected at the database level so that even application bugs cannot expose my data to other users.

**Why this priority**: Security is foundational. Current RLS on `exercises` exposes private custom exercises to all users (`SELECT true`). `ai_memories` has RLS enabled but no policies (blocking access unless service role).

**Independent Test**: Attempt to query another user's private exercise with valid auth token - should return empty results (currently returns record).

**Acceptance Scenarios**:

1. **Given** authenticated user A, **When** querying macrocycles, **Then** only returns macrocycles where user_id = A OR athlete is in coach A's group.
2. **Given** authenticated user A, **When** querying exercises, **Then** returns global exercises + user A's private exercises only.
3. **Given** coach querying athlete data, **When** athlete in coach's group, **Then** returns athlete's training data.

---

### User Story 2 - Data Integrity on Deletion (Priority: P1)

As an admin, I want user deletions to cascade properly so that no orphaned data remains in the system.

**Why this priority**: Orphaned data wastes storage and causes query errors. Found missing `ON DELETE CASCADE` on critical tables (`exercise_training_details`, `macrocycles`).

**Independent Test**: Delete test user, query all related tables - should return zero rows.

**Acceptance Scenarios**:

1. **Given** user with macrocycles, **When** user deleted, **Then** all user's macrocycles deleted.
2. **Given** training session, **When** session deleted, **Then** all session details deleted (currently orphans details).
3. **Given** athlete with training sessions, **When** athlete deleted, **Then** all sessions and details deleted.

---

### User Story 3 - Schema Clarity & Performance (Priority: P2)

As a developer, I want clear table naming and appropriate data types so that the schema is intuitive and queryable.

**Why this priority**: Current table names (`exercise_preset_groups`, `exercise_training_sessions`) don't clearly convey coach-created plans vs athlete-recorded workouts. `VARCHAR` is used where `TEXT` is preferred in Postgres.

**Independent Test**: Developer can immediately understand table purpose from name alone.

**Acceptance Scenarios**:

1. **Given** coach creates a session template, **When** querying tables, **Then** table name clearly indicates it's a plan.
2. **Given** athlete records workout, **When** querying tables, **Then** table name clearly indicates it's a log/record.
3. **Given** text columns (notes, descriptions), **When** inspected, **Then** use `TEXT` type instead of `VARCHAR`.

### User Story 4 - Analytics-Ready Columns (Priority: P2)

As a coach, I want training metrics (height, tempo, resistance) as explicit columns so that I can easily query and analyze athlete performance trends.

**Why this priority**: Moving columns to JSONB makes analytics queries complex and prevents efficient indexing. Sparse columns are handled efficiently by PostgreSQL's TOAST compression.

**Independent Test**: Coach can run `AVG(height)` query directly without JSONB extraction.

**Acceptance Scenarios**:

1. **Given** plyometric training data, **When** coach queries jump heights, **Then** can use `SELECT AVG(height)` directly.
2. **Given** strength training with bands, **When** coach tracks accommodating resistance, **Then** can filter by `resistance > X`.
3. **Given** hypertrophy program, **When** coach analyzes tempo compliance, **Then** tempo is directly queryable.

---

## Requirements

### Functional Requirements

#### RLS Policy Requirements

- **FR-001**: `exercises` policy MUST be updated to: `visibility = 'global' OR owner_user_id = auth.uid()` (Fixes "Public read access").
- **FR-002**: `macrocycles` policy MUST include coach access via `athlete_group_id` join.
- **FR-003**: `ai_memories` MUST have explicit policies if RLS is enabled, or RLS disabled if strictly service-role managed.
- **FR-004**: `exercise_training_sessions` policy MUST allow coaches to view/manage sessions for their athlete groups (Verify existing policies cover this).

#### Cascade Delete Requirements

- **FR-005**: `exercise_training_details.exercise_training_session_id` MUST be `ON DELETE CASCADE`.
- **FR-006**: `exercise_training_sessions.athlete_id` MUST be `ON DELETE CASCADE`.
- **FR-007**: `macrocycles.user_id` MUST be `ON DELETE CASCADE`.
- **FR-008**: `athlete_cycles` foreign keys MUST be `ON DELETE CASCADE`.

#### Schema Optimization Requirements

- **FR-009**: **KEEP Explicit Columns**: `height`, `effort`, `tempo`, `resistance` as explicit columns for direct SQL analytics queries (e.g., `AVG(height)`, `WHERE resistance > X`). PostgreSQL TOAST handles sparse data efficiently.
- **FR-010**: **KEEP VBT Columns**: `velocity` and `power` (Critical for VBT/Sprint analytics), plus core metrics (`reps`, `weight`, `distance`, `performing_time`, `rest_time`, `rpe`).
- **FR-011**: Convert all `character varying` columns to `text` (e.g., `exercises.name`, `notes`, `description`).

#### Table Naming Requirements

- **FR-016**: Rename `exercise_preset_groups` → `session_plans` (Coach-created session templates).
- **FR-017**: Rename `exercise_presets` → `session_plan_exercises` (Exercises within a session plan).
- **FR-018**: Rename `exercise_preset_details` → `session_plan_sets` (Set prescriptions for planned exercises).
- **FR-019**: Rename `exercise_training_sessions` → `workout_logs` (Athlete-recorded workout sessions).
- **FR-020**: Rename `exercise_training_details` → `workout_log_sets` (Actual sets performed by athlete).

#### Timestamp Requirements

- **FR-012**: Add `created_at` and `updated_at` to `athletes`, `coaches`, `exercises`, `exercise_presets` tables (P1).
- **FR-013**: Add `updated_at` to `athlete_groups`, `exercise_preset_details`, `exercise_training_details`, `macrocycles`, `mesocycles`, `microcycles` tables (P2).
- **FR-014**: Add `DEFAULT now()` to all nullable `created_at`/`updated_at` columns without defaults.
- **FR-015**: Fix `exercise_training_sessions.updated_at` type from `timestamp` to `timestamptz`.

### Key Entities

- **Sparse Columns**: Columns that are NULL for >80% of rows (candidates for JSONB).
- **RLS Leak**: Policy `true` on sensitive tables.
- **Orphaned Rows**: Child records left behind when parent is deleted.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `exercises` table properly hides private exercises from other users.
- **SC-002**: Deleting a `training_session` removes all `training_details`.
- **SC-003**: All training metric columns (`height`, `tempo`, `resistance`, `effort`) remain explicit for direct SQL analytics.
- **SC-004**: Zero `character varying` columns in schema (use `text`).
- **SC-005**: All user-modifiable tables have `created_at` and `updated_at` with proper defaults.
- **SC-006**: All timestamp columns use `timestamptz` (not `timestamp`).
- **SC-007**: Tables renamed per naming convention (see Table Name Mapping below).
- **SC-008**: Foreign key columns renamed for consistency.

## Current State Analysis (Verified 2025-12-24)

### Table Name Mapping (New Naming Convention)

The current naming (`exercise_preset_*`, `exercise_training_*`) is confusing because it doesn't clearly distinguish between **coach-created plans** and **athlete-recorded workouts**. The new naming creates two clear domains:

| Domain | Old Name | New Name | Purpose |
|--------|----------|----------|---------|
| **Coach Planning** | `exercise_preset_groups` | `session_plans` | Training session templates |
| **Coach Planning** | `exercise_presets` | `session_plan_exercises` | Exercises within a plan |
| **Coach Planning** | `exercise_preset_details` | `session_plan_sets` | Set prescriptions |
| **Athlete Recording** | `exercise_training_sessions` | `workout_logs` | Actual workout sessions |
| **Athlete Recording** | `exercise_training_details` | `workout_log_sets` | Actual sets performed |

**Foreign Key Column Renames**:
| Old Column Name | New Column Name |
|-----------------|-----------------|
| `exercise_preset_group_id` | `session_plan_id` |
| `exercise_preset_id` (in sets) | `session_plan_exercise_id` |
| `exercise_training_session_id` | `workout_log_id` |

### RLS Gaps
- `exercises`: Policy is `true` (Public). Needs `visibility` check.
- `ai_memories`: RLS enabled, NO policies. Effectively "Deny All" for clients.
- `macrocycles`: Policy restricts to `user_id` ownership, missing coach access.

### Missing Cascade Deletes
| Table | Column | Current Rule | Required |
|-------|--------|--------------|----------|
| `exercise_training_details` | `exercise_training_session_id` | `NO ACTION` | `CASCADE` |
| `exercise_training_sessions` | `athlete_id` | `NO ACTION` | `CASCADE` |
| `macrocycles` | `user_id` | `NO ACTION` | `CASCADE` |
| `athlete_cycles` | `athlete_id` | `NO ACTION` | `CASCADE` |
| `athlete_cycles` | `macrocycle_id` | `NO ACTION` | `CASCADE` |

### Column Status Summary

All training metric columns are **KEPT as explicit columns** for direct SQL analytics. PostgreSQL efficiently handles NULL values via the null bitmap, requiring only 1 bit per NULL column. This enables:
- Direct aggregation: `SELECT AVG(height) FROM workout_log_sets WHERE height IS NOT NULL`
- Efficient filtering: `WHERE resistance > 50`
- Partial indexes: `CREATE INDEX ON workout_log_sets (height) WHERE height IS NOT NULL`

#### `session_plan_sets` Table (formerly `exercise_preset_details`)

| Status | Column Name | Data Type | Notes |
|--------|-------------|-----------|-------|
| ✅ **KEEP** | `id` | integer | Primary key |
| ✅ **KEEP** | `exercise_preset_id` | integer | FK → `session_plan_exercises` |
| ✅ **KEEP** | `resistance_unit_id` | integer | Foreign key |
| ✅ **KEEP** | `reps` | integer | Core metric |
| ✅ **KEEP** | `weight` | real | Core metric (kg) |
| ✅ **KEEP** | `power` | real | **VBT metric** (watts) |
| ✅ **KEEP** | `velocity` | real | **VBT metric** (m/s) |
| ✅ **KEEP** | `distance` | real | Core metric (meters) |
| ✅ **KEEP** | `performing_time` | real | Core metric (seconds) |
| ✅ **KEEP** | `rest_time` | integer | Core metric (seconds) |
| ✅ **KEEP** | `rpe` | integer | Core metric (1-10) |
| ✅ **KEEP** | `set_index` | integer | Set ordering |
| ✅ **KEEP** | `metadata` | jsonb | Extensible attributes |
| ✅ **KEEP** | `created_at` | timestamptz | Timestamp |
| ✅ **KEEP** | `height` | real | Plyometrics (sparse, but analytics-ready) |
| ✅ **KEEP** | `effort` | real | Effort metric (sparse, complements RPE) |
| ✅ **KEEP** | `tempo` | text | Tempo prescription (e.g., "3-1-2-0") |
| ✅ **KEEP** | `resistance` | real | Accommodating resistance (bands/chains) |

**Total**: 18 columns (no changes - all columns serve analytics needs)

#### `workout_log_sets` Table (formerly `exercise_training_details`)

| Status | Column Name | Data Type | Notes |
|--------|-------------|-----------|-------|
| ✅ **KEEP** | `id` | integer | Primary key |
| ✅ **KEEP** | `exercise_training_session_id` | integer | FK → `workout_logs` |
| ✅ **KEEP** | `exercise_preset_id` | integer | FK → `session_plan_exercises` |
| ✅ **KEEP** | `resistance_unit_id` | integer | Foreign key |
| ✅ **KEEP** | `reps` | integer | Core metric (actual reps) |
| ✅ **KEEP** | `weight` | real | Core metric (actual kg) |
| ✅ **KEEP** | `power` | real | **VBT metric** (actual watts) |
| ✅ **KEEP** | `velocity` | real | **VBT metric** (actual m/s) |
| ✅ **KEEP** | `distance` | real | Core metric (actual meters) |
| ✅ **KEEP** | `performing_time` | real | Core metric (actual seconds) |
| ✅ **KEEP** | `rest_time` | integer | Core metric (actual seconds) |
| ✅ **KEEP** | `rpe` | integer | Core metric (actual 1-10) |
| ✅ **KEEP** | `completed` | boolean | Set completion status |
| ✅ **KEEP** | `set_index` | integer | Set ordering |
| ✅ **KEEP** | `metadata` | jsonb | Extensible attributes |
| ✅ **KEEP** | `created_at` | timestamptz | Timestamp |
| ✅ **KEEP** | `height` | real | Actual jump height (plyometrics) |
| ✅ **KEEP** | `effort` | real | Actual effort metric |
| ✅ **KEEP** | `tempo` | text | Actual tempo performed |
| ✅ **KEEP** | `resistance` | real | Actual accommodating resistance |

**Total**: 20 columns (no changes - all columns serve analytics needs)

### Timestamp Columns Audit

#### Tables Missing `created_at` and/or `updated_at`

| Table | Missing | Priority | Reason |
|-------|---------|----------|--------|
| `athletes` | Both | **P1** | Core user data, needs audit trail |
| `coaches` | Both | **P1** | Core user data, needs audit trail |
| `exercises` | Both | **P1** | User-created content, needs version tracking |
| `exercise_presets` | Both | **P2** | Template modifications need tracking |
| `athlete_groups` | `updated_at` | **P2** | Group changes should be tracked |
| `exercise_preset_details` | `updated_at` | **P2** | Set modifications need tracking |
| `exercise_training_details` | `updated_at` | **P2** | Performance data updates need tracking |
| `macrocycles` | `updated_at` | **P2** | Plan modifications need tracking |
| `mesocycles` | `updated_at` | **P2** | Plan modifications need tracking |
| `microcycles` | `updated_at` | **P2** | Plan modifications need tracking |
| `athlete_cycles` | `updated_at` | **P3** | Junction table, less critical |
| `events` | Defaults | **P3** | Has columns but no defaults |

#### Tables with Inconsistent Timestamp Types

| Table | Issue | Fix |
|-------|-------|-----|
| `exercise_training_sessions.updated_at` | `timestamp without time zone` | Change to `timestamptz` |
| `athlete_cycles.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `exercise_preset_details.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `exercise_training_details.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `exercise_training_sessions.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `macrocycles.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `mesocycles.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `microcycles.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `events.created_at` | Nullable, no default | Add `DEFAULT now()` |
| `events.updated_at` | Nullable, no default | Add `DEFAULT now()` |

#### Tables with Proper Timestamps (No Changes Needed)

- `users` - Both with defaults ✅
- `ai_memories` - Both NOT NULL with defaults ✅
- `knowledge_base_categories` - Both NOT NULL with defaults ✅
- `knowledge_base_articles` - Both NOT NULL with defaults ✅
- `races` - Both with defaults ✅
- `athlete_personal_bests` - Both with defaults ✅
- `athlete_group_histories` - `created_at` with default ✅
- `exercise_preset_groups` - Both with defaults ✅

#### Reference Data Tables (No Timestamps Needed)

- `exercise_types` - Static reference data
- `tags` - Static reference data
- `units` - Static reference data
- `exercise_tags` - Junction table
- `events` - Reference data (but has timestamps, which is fine)

### Data Types
- Found 12+ `VARCHAR` columns (e.g., `exercises.name`, `tags.name`). Postgres best practice is `TEXT`.

## Implementation Plan

### Phase 1: Table Renaming & Data Types (Days 1-2)

```sql
-- 1. Rename tables for clarity (Coach Planning vs Athlete Recording)
-- Session Plans (Coach-created templates)
ALTER TABLE exercise_preset_groups RENAME TO session_plans;
ALTER TABLE exercise_presets RENAME TO session_plan_exercises;
ALTER TABLE exercise_preset_details RENAME TO session_plan_sets;

-- Workout Logs (Athlete-recorded sessions)
ALTER TABLE exercise_training_sessions RENAME TO workout_logs;
ALTER TABLE exercise_training_details RENAME TO workout_log_sets;

-- 2. Update foreign key column names for consistency
ALTER TABLE session_plan_exercises RENAME COLUMN exercise_preset_group_id TO session_plan_id;
ALTER TABLE session_plan_sets RENAME COLUMN exercise_preset_id TO session_plan_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN exercise_training_session_id TO workout_log_id;

-- 3. Convert VARCHAR to TEXT (PostgreSQL best practice)
ALTER TABLE exercises ALTER COLUMN name TYPE text;
ALTER TABLE exercises ALTER COLUMN description TYPE text;
ALTER TABLE workout_logs ALTER COLUMN notes TYPE text;
ALTER TABLE tags ALTER COLUMN name TYPE text;
ALTER TABLE units ALTER COLUMN name TYPE text;
ALTER TABLE units ALTER COLUMN abbreviation TYPE text;
-- ... repeat for all remaining VARCHARs
```

**Note**: All training metric columns (height, effort, tempo, resistance) are KEPT as explicit columns for direct SQL analytics. No column migration needed.

### Phase 2: Foreign Key Constraints (Day 2)

```sql
-- Recreate constraints with CASCADE (using new table names)
ALTER TABLE workout_log_sets
  DROP CONSTRAINT IF EXISTS fk_etd_session,
  ADD CONSTRAINT fk_workout_log_sets_workout_log
    FOREIGN KEY (workout_log_id)
    REFERENCES workout_logs(id)
    ON DELETE CASCADE;

ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS fk_ets_athlete,
  ADD CONSTRAINT fk_workout_logs_athlete
    FOREIGN KEY (athlete_id)
    REFERENCES athletes(id)
    ON DELETE CASCADE;

ALTER TABLE macrocycles
  DROP CONSTRAINT IF EXISTS fk_macrocycles_user,
  ADD CONSTRAINT fk_macrocycles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE athlete_cycles
  DROP CONSTRAINT IF EXISTS fk_athlete_cycles_athlete,
  ADD CONSTRAINT fk_athlete_cycles_athlete
    FOREIGN KEY (athlete_id)
    REFERENCES athletes(id)
    ON DELETE CASCADE;

ALTER TABLE athlete_cycles
  DROP CONSTRAINT IF EXISTS fk_athlete_cycles_macrocycle,
  ADD CONSTRAINT fk_athlete_cycles_macrocycle
    FOREIGN KEY (macrocycle_id)
    REFERENCES macrocycles(id)
    ON DELETE CASCADE;
```

### Phase 3: Timestamp Columns (Day 3)

```sql
-- P1: Add timestamps to core user tables
-- Note: For existing rows, created_at will use DEFAULT now().
-- If historical data exists, backfill with appropriate dates before adding NOT NULL constraint.

ALTER TABLE athletes
  ADD COLUMN created_at timestamptz DEFAULT now(),
  ADD COLUMN updated_at timestamptz DEFAULT now();

-- Backfill existing data if needed (adjust date logic as appropriate)
-- UPDATE athletes SET created_at = COALESCE(created_at, now()) WHERE created_at IS NULL;
-- UPDATE athletes SET updated_at = COALESCE(updated_at, now()) WHERE updated_at IS NULL;

-- Then make NOT NULL
ALTER TABLE athletes
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE coaches
  ADD COLUMN created_at timestamptz DEFAULT now(),
  ADD COLUMN updated_at timestamptz DEFAULT now();
-- Backfill and set NOT NULL (same pattern as athletes)

ALTER TABLE exercises
  ADD COLUMN created_at timestamptz DEFAULT now(),
  ADD COLUMN updated_at timestamptz DEFAULT now();
-- Backfill and set NOT NULL (same pattern as athletes)

ALTER TABLE exercise_presets
  ADD COLUMN created_at timestamptz DEFAULT now(),
  ADD COLUMN updated_at timestamptz DEFAULT now();
-- Backfill and set NOT NULL (same pattern as athletes)

-- P2: Add updated_at to tables that already have created_at
ALTER TABLE athlete_groups
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE exercise_preset_details
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE exercise_training_details
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE macrocycles
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE mesocycles
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE microcycles
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Fix nullable created_at columns (add defaults)
ALTER TABLE athlete_cycles
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE exercise_preset_details
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE exercise_training_details
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE exercise_training_sessions
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE macrocycles
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE mesocycles
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE microcycles
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE events
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Fix timestamp type inconsistency
ALTER TABLE exercise_training_sessions
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- Create triggers for updated_at (auto-update on row change)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_presets_updated_at BEFORE UPDATE ON exercise_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_groups_updated_at BEFORE UPDATE ON athlete_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_preset_details_updated_at BEFORE UPDATE ON exercise_preset_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_training_details_updated_at BEFORE UPDATE ON exercise_training_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_macrocycles_updated_at BEFORE UPDATE ON macrocycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mesocycles_updated_at BEFORE UPDATE ON mesocycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_microcycles_updated_at BEFORE UPDATE ON microcycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_training_sessions_updated_at BEFORE UPDATE ON exercise_training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Phase 4: RLS Security Fixes (Day 4)

```sql
-- Exercises: Protect private data
DROP POLICY "Public read access" ON exercises;
CREATE POLICY "Public global or Private owned" ON exercises
  FOR SELECT USING (
    visibility = 'global' OR owner_user_id = (
      SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
    )
  );

-- Macrocycles: Add coach access
DROP POLICY "Users can manage own macrocycles" ON macrocycles;
CREATE POLICY "Users and Coaches view macrocycles" ON macrocycles
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub')
    OR
    athlete_group_id IN (
      SELECT id FROM athlete_groups WHERE coach_id IN (
        SELECT id FROM coaches WHERE user_id = (
          SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
        )
      )
    )
  );
```

### Verification

1. Verify no private exercises visible to other users.
2. Verify deleting a `workout_log` deletes all `workout_log_sets`.
3. Verify tables renamed correctly (`session_plans`, `workout_logs`, etc.).
4. Verify all user-modifiable tables have `created_at` and `updated_at`.
5. Verify `updated_at` triggers fire on row updates.
6. Verify all timestamps use `timestamptz` type.
7. Verify analytics queries work: `SELECT AVG(height) FROM workout_log_sets WHERE height IS NOT NULL`.
8. Verify all `character varying` columns converted to `text`.

---

## Code Impact Analysis (Table Rename)

> **Audit Date**: 2025-12-24
> **Total Files Affected**: ~45 files

### Phase 1: Database Layer

#### 1.1 Supabase Schema Changes
```sql
-- Table Renames
ALTER TABLE exercise_preset_groups RENAME TO session_plans;
ALTER TABLE exercise_presets RENAME TO session_plan_exercises;
ALTER TABLE exercise_preset_details RENAME TO session_plan_sets;
ALTER TABLE exercise_training_sessions RENAME TO workout_logs;
ALTER TABLE exercise_training_details RENAME TO workout_log_sets;

-- Foreign Key Column Renames
ALTER TABLE session_plan_exercises RENAME COLUMN exercise_preset_group_id TO session_plan_id;
ALTER TABLE session_plan_sets RENAME COLUMN exercise_preset_id TO session_plan_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN exercise_training_session_id TO workout_log_id;

-- Update RLS Policies (on renamed tables)
-- Policies will automatically apply to renamed tables, but trigger names may need updating
```

#### 1.2 RLS Policies to Verify/Update
After table rename, verify policies still work:
- `exercise_preset_groups` policies → `session_plans`
- `exercise_training_sessions` policies → `workout_logs`

#### 1.3 Triggers to Rename
```sql
-- Rename triggers for consistency
ALTER TRIGGER update_exercise_training_sessions_updated_at ON workout_logs
  RENAME TO update_workout_logs_updated_at;
```

---

### Phase 2: TypeScript Types (Regenerate)

#### 2.1 Auto-Generated Types (Regenerate via CLI)
**File**: `types/database.ts` - Run: `npx supabase gen types typescript --project-id pcteaouusthwbgzczoae`

This will update:
- Line 475: `exercise_preset_groups` → `session_plans`
- Line 548: `exercise_presets` → `session_plan_exercises`
- Line 395: `exercise_preset_details` → `session_plan_sets`
- Line 714: `exercise_training_sessions` → `workout_logs`
- Line 623: `exercise_training_details` → `workout_log_sets`

#### 2.2 Type Exports to Rename
**File**: `types/database.ts` (lines 1547-1569)
```typescript
// OLD → NEW
export type ExercisePresetGroup = Tables<"exercise_preset_groups">
  → export type SessionPlan = Tables<"session_plans">
export type ExercisePreset = Tables<"exercise_presets">
  → export type SessionPlanExercise = Tables<"session_plan_exercises">
export type ExercisePresetDetail = Tables<"exercise_preset_details">
  → export type SessionPlanSet = Tables<"session_plan_sets">
export type ExerciseTrainingSession = Tables<"exercise_training_sessions">
  → export type WorkoutLog = Tables<"workout_logs">
export type ExerciseTrainingDetail = Tables<"exercise_training_details">
  → export type WorkoutLogSet = Tables<"workout_log_sets">
```

#### 2.3 Extended Types
**File**: `types/training.ts` (lines 61-87)
- `ExercisePresetGroupWithDetails` → `SessionPlanWithDetails`
- `ExercisePresetWithDetails` → `SessionPlanExerciseWithDetails`
- `ExerciseTrainingSessionWithDetails` → `WorkoutLogWithDetails`
- Field rename: `exercise_preset_groups` → `session_plans`
- Field rename: `exercise_presets` → `session_plan_exercises`
- Field rename: `exercise_preset_details` → `session_plan_sets`
- Field rename: `exercise_training_details` → `workout_log_sets`

**File**: `types/index.ts` (lines 90-108)
- Re-export all renamed types

---

### Phase 3: Server Actions

#### 3.1 Plan Actions
**File**: `actions/plans/plan-actions.ts` (12 references)
- Lines 109, 164, 388, 448, 760, 818, 927, 1011, 1120-1121, 1138: Update table/field names

**File**: `actions/plans/session-plan-actions.ts` (25+ references)
- Lines 4-5, 18-23: Update type imports
- Lines 131, 291, 394, 443, 498, 531, 631, 702, 791, 878, 940, 974, 1068: Update `.from()` calls
- All `exercise_preset_group_id` → `session_plan_id`

**File**: `actions/plans/session-planner-actions.ts` (10 references)
- Lines 27-30: Update type imports
- Lines 60, 89, 104, 155, 174, 248, 297: Update `.from()` calls

**File**: `actions/plans/plan-assignment-actions.ts` (5 references)
- Lines 119, 143, 155-158, 183, 202: Update table/field names

#### 3.2 Session Actions
**File**: `actions/sessions/training-session-actions.ts` (40+ references)
- Lines 34, 70, 79, 149, 222, 283-284, 298, 332, 348, 406, 412, 615, 742, 903, 905, 1031, 1157, 1288, 1326, 1337: Update `.from('exercise_training_sessions')` → `.from('workout_logs')`
- Lines 491, 538, 620, 736, 1124, 1375, 1385, 1402: Update `.from('exercise_training_details')` → `.from('workout_log_sets')`
- All `exercise_training_session_id` → `workout_log_id`
- All `exercise_preset_group_id` → `session_plan_id`

#### 3.3 Workout Actions
**File**: `actions/workout/workout-session-actions.ts` (15 references)
- Lines 68, 194, 261, 313, 326, 356, 369, 399, 412: Update `.from('exercise_training_sessions')` → `.from('workout_logs')`
- Lines 76-95, 202-238: Update join syntax
- Type returns: Update session types

#### 3.4 Library Actions
**File**: `actions/library/exercise-actions.ts` (30+ references)
- Lines 806, 853, 914, 1040, 1087, 1428, 1462, 1593: `.from('exercise_preset_groups')` → `.from('session_plans')`
- Lines 992, 1487: `.from('exercise_presets')` → `.from('session_plan_exercises')`
- Lines 1158, 1204, 1251, 1304, 1351, 1542: `.from('exercise_preset_details')` → `.from('session_plan_sets')`
- Function names: `createExercisePresetGroupAction` → `createSessionPlanAction`, etc.

#### 3.5 Dashboard Actions
**File**: `actions/dashboard/dashboard-actions.ts` (3 references)
- Lines 48, 54, 72: Update table names in queries

---

### Phase 4: Components

#### 4.1 Workout Components
**File**: `components/features/workout/context/exercise-context.tsx` (10 references)
- Line 18, 154-155, 160, 184, 189, 197, 200: `exercise_training_details` → `workout_log_sets`

**File**: `components/features/workout/components/exercise/exercise-card.tsx` (10 references)
- Lines 59, 75, 79, 89, 93, 129, 135, 150, 157: Update field names

**File**: `components/features/workout/components/pages/workout-session-dashboard.tsx` (5 references)
- Lines 92, 105, 113, 124, 127, 176: Update field names

**File**: `components/features/workout/hooks/use-workout-session.ts` (12 references)
- Lines 13-14, 27, 36-37, 41, 53, 55, 76, 113, 227, 239, 256: Update types and field names

**File**: `components/features/workout/hooks/use-workout-api.ts` (6 references)
- Lines 22-23, 70, 113, 140, 246: Update types

**File**: `components/features/workout/hooks/use-workout-queries.ts` (2 references)
- Lines 26, 100: Update types

#### 4.2 Plans Components
**File**: `components/features/plans/session-planner/types.ts` (8 references)
- Lines 9, 10, 12, 47, 52, 67, 99: Update type names and table references

**File**: `app/(protected)/plans/[id]/page.tsx` (5 references)
- Lines 22, 29, 107-108, 118: Update field names

**File**: `app/(protected)/plans/[id]/session/[sessionId]/page.tsx` (3 references)
- Lines 39, 41, 53: Update field names

#### 4.3 Composed Components
**File**: `components/composed/workout-session-exercise-count.tsx` (4 references)
- Lines 83, 87, 92, 102: Update field names

**File**: `components/composed/workout-session-duration-display.tsx` (6 references)
- Lines 74, 79, 85, 102, 106, 111: Update field names

#### 4.4 Session Components
**File**: `components/features/sessions/hooks/use-session-data.ts` (2 references)
- Lines 171-172: Update commented subscription code

---

### Phase 5: Utilities & Validation

#### 5.1 Changeset/Entity Mappings
**File**: `lib/changeset/entity-mappings.ts` (6 references)
- Lines 20-22, 29-31, 39, 60: Update table and field mappings

**File**: `lib/changeset/tool-implementations/read-impl.ts` (5 references)
- Lines 68, 79, 91, 102, 115: Update table names

#### 5.2 Validation Schemas
**File**: `lib/validation/training-schemas.ts` (4 references)
- Lines 159, 163, 180, 348, 360: Update schema names

---

### Phase 6: Documentation Updates

#### Files to Update (Already tracked in docs):
- `docs/database-schema.md` - ✅ Already has planned rename notes
- `docs/security/row-level-security-analysis.md` - ✅ Already has planned rename notes
- `docs/integrations/supabase-integration.md` - Update query examples
- `docs/development/api-architecture.md` - Update API references
- `docs/architecture/ai-tool-analysis.md` - Update table references
- `docs/design/design-system-overview.md` - Update data model
- `docs/workflow/USER_WORKFLOW_ANALYSIS.md` - Update workflow steps
- `docs/features/feature-overview.md` - Update feature descriptions
- `docs/features/sessions/sessions-sprint-management.md` - Update table references
- `docs/features/sessions/sessions-implementation-summary.md` - Update implementation details
- `components/features/plans/plans-prd.md` - Update PRD references

---

### Phase 7: Tests (If Any Exist)

Search for test files referencing old table names:
```bash
grep -r "exercise_preset_groups\|exercise_training_sessions" __tests__/
```

---

### Implementation Order

1. **Database Migration** (Phase 1)
   - Create migration file with table renames
   - Run in dev environment first
   - Verify RLS policies still work

2. **Regenerate Types** (Phase 2.1)
   - Run `npx supabase gen types typescript`
   - Commit regenerated `types/database.ts`

3. **Update Type Aliases** (Phase 2.2, 2.3)
   - Update `types/database.ts` exports
   - Update `types/training.ts` extended types
   - Update `types/index.ts` re-exports

4. **Update Server Actions** (Phase 3)
   - Start with leaf actions (no dependencies)
   - Work up to parent actions
   - Run type-check after each file

5. **Update Components** (Phase 4)
   - Start with context/hooks
   - Then update UI components
   - Run type-check after each file

6. **Update Utilities** (Phase 5)
   - Changeset mappings
   - Validation schemas

7. **Update Documentation** (Phase 6)
   - Remove "Planned Rename" notes
   - Update all table references

8. **Final Verification**
   - Full type-check: `npm run type-check`
   - Full lint: `npm run lint`
   - Full build: `npm run build`
   - Manual CRUD testing

---

### CRUD Operation Verification Checklist

After renaming, verify these operations work:

#### Session Plans (Coach Planning)
- [ ] Create session plan (`session_plans` INSERT)
- [ ] Read session plans by microcycle
- [ ] Update session plan (name, description, date)
- [ ] Delete session plan (CASCADE to exercises/sets)
- [ ] Add exercise to session (`session_plan_exercises` INSERT)
- [ ] Reorder exercises in session
- [ ] Add sets to exercise (`session_plan_sets` INSERT)
- [ ] Update set parameters (reps, weight, etc.)
- [ ] Delete exercise from session (CASCADE to sets)

#### Workout Logs (Athlete Recording)
- [ ] Create workout log (`workout_logs` INSERT)
- [ ] Read workout logs by athlete
- [ ] Read workout logs by date range
- [ ] Update workout log status (ongoing, completed)
- [ ] Delete workout log (CASCADE to sets)
- [ ] Add performance data (`workout_log_sets` INSERT)
- [ ] Update set completion status
- [ ] Update actual performance (reps, weight, etc.)

#### Coach-Athlete Flows
- [ ] Coach assigns plan to athlete group
- [ ] Athlete sees assigned sessions
- [ ] Athlete starts workout → creates workout_log
- [ ] Athlete logs sets → creates workout_log_sets
- [ ] Coach views athlete's workout history
