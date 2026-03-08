-- Migration Step 3: Swap columns (rename old to backup, new to primary)
-- Feature: 007-migrate-database-primary
-- CAUTION: This step changes the schema. Application code must be updated first.

-- ============================================================================
-- PRE-FLIGHT CHECKS (run manually before executing)
-- ============================================================================

-- Verify all UUIDs are populated before proceeding
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM session_plans WHERE new_id IS NULL) THEN
--     RAISE EXCEPTION 'session_plans has NULL new_id values';
--   END IF;
--   IF EXISTS (SELECT 1 FROM session_plan_exercises WHERE new_id IS NULL OR new_session_plan_id IS NULL) THEN
--     RAISE EXCEPTION 'session_plan_exercises has NULL UUID values';
--   END IF;
--   -- Add more checks as needed
-- END $$;

-- ============================================================================
-- DROP EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Session plan hierarchy
ALTER TABLE session_plan_exercises DROP CONSTRAINT IF EXISTS session_plan_exercises_session_plan_id_fkey;
ALTER TABLE session_plan_sets DROP CONSTRAINT IF EXISTS session_plan_sets_session_plan_exercise_id_fkey;

-- Workout log hierarchy
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_workout_log_id_fkey;
ALTER TABLE workout_log_sets DROP CONSTRAINT IF EXISTS workout_log_sets_workout_log_exercise_id_fkey;

-- Cross-references
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_session_plan_id_fkey;
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_session_plan_exercise_id_fkey;

-- ============================================================================
-- DROP PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plans DROP CONSTRAINT IF EXISTS session_plans_pkey;
ALTER TABLE session_plan_exercises DROP CONSTRAINT IF EXISTS session_plan_exercises_pkey;
ALTER TABLE session_plan_sets DROP CONSTRAINT IF EXISTS session_plan_sets_pkey;
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_pkey;
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_pkey;
ALTER TABLE workout_log_sets DROP CONSTRAINT IF EXISTS workout_log_sets_pkey;

-- ============================================================================
-- RENAME COLUMNS: OLD TO BACKUP
-- ============================================================================

-- session_plans
ALTER TABLE session_plans RENAME COLUMN id TO old_id;
ALTER TABLE session_plans RENAME COLUMN new_id TO id;

-- session_plan_exercises
ALTER TABLE session_plan_exercises RENAME COLUMN id TO old_id;
ALTER TABLE session_plan_exercises RENAME COLUMN new_id TO id;
ALTER TABLE session_plan_exercises RENAME COLUMN session_plan_id TO old_session_plan_id;
ALTER TABLE session_plan_exercises RENAME COLUMN new_session_plan_id TO session_plan_id;

-- session_plan_sets
ALTER TABLE session_plan_sets RENAME COLUMN id TO old_id;
ALTER TABLE session_plan_sets RENAME COLUMN new_id TO id;
ALTER TABLE session_plan_sets RENAME COLUMN session_plan_exercise_id TO old_session_plan_exercise_id;
ALTER TABLE session_plan_sets RENAME COLUMN new_session_plan_exercise_id TO session_plan_exercise_id;

-- workout_logs
ALTER TABLE workout_logs RENAME COLUMN id TO old_id;
ALTER TABLE workout_logs RENAME COLUMN new_id TO id;
ALTER TABLE workout_logs RENAME COLUMN session_plan_id TO old_session_plan_id;
ALTER TABLE workout_logs RENAME COLUMN new_session_plan_id TO session_plan_id;

-- workout_log_exercises
ALTER TABLE workout_log_exercises RENAME COLUMN id TO old_id;
ALTER TABLE workout_log_exercises RENAME COLUMN new_id TO id;
ALTER TABLE workout_log_exercises RENAME COLUMN workout_log_id TO old_workout_log_id;
ALTER TABLE workout_log_exercises RENAME COLUMN new_workout_log_id TO workout_log_id;
ALTER TABLE workout_log_exercises RENAME COLUMN session_plan_exercise_id TO old_session_plan_exercise_id;
ALTER TABLE workout_log_exercises RENAME COLUMN new_session_plan_exercise_id TO session_plan_exercise_id;

-- workout_log_sets
ALTER TABLE workout_log_sets RENAME COLUMN id TO old_id;
ALTER TABLE workout_log_sets RENAME COLUMN new_id TO id;
ALTER TABLE workout_log_sets RENAME COLUMN workout_log_exercise_id TO old_workout_log_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN new_workout_log_exercise_id TO workout_log_exercise_id;

-- ============================================================================
-- ADD NEW PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plans ADD PRIMARY KEY (id);
ALTER TABLE session_plan_exercises ADD PRIMARY KEY (id);
ALTER TABLE session_plan_sets ADD PRIMARY KEY (id);
ALTER TABLE workout_logs ADD PRIMARY KEY (id);
ALTER TABLE workout_log_exercises ADD PRIMARY KEY (id);
ALTER TABLE workout_log_sets ADD PRIMARY KEY (id);

-- ============================================================================
-- ADD NEW FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Session plan hierarchy
ALTER TABLE session_plan_exercises
ADD CONSTRAINT session_plan_exercises_session_plan_id_fkey
FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE CASCADE;

ALTER TABLE session_plan_sets
ADD CONSTRAINT session_plan_sets_session_plan_exercise_id_fkey
FOREIGN KEY (session_plan_exercise_id) REFERENCES session_plan_exercises(id) ON DELETE CASCADE;

-- Workout log hierarchy
ALTER TABLE workout_log_exercises
ADD CONSTRAINT workout_log_exercises_workout_log_id_fkey
FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE;

ALTER TABLE workout_log_sets
ADD CONSTRAINT workout_log_sets_workout_log_exercise_id_fkey
FOREIGN KEY (workout_log_exercise_id) REFERENCES workout_log_exercises(id) ON DELETE CASCADE;

-- Cross-references (nullable - workout may not have session plan)
ALTER TABLE workout_logs
ADD CONSTRAINT workout_logs_session_plan_id_fkey
FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE SET NULL;

ALTER TABLE workout_log_exercises
ADD CONSTRAINT workout_log_exercises_session_plan_exercise_id_fkey
FOREIGN KEY (session_plan_exercise_id) REFERENCES session_plan_exercises(id) ON DELETE SET NULL;

-- ============================================================================
-- SET DEFAULT VALUES FOR NEW INSERTS
-- ============================================================================

ALTER TABLE session_plans ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE session_plan_exercises ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE session_plan_sets ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE workout_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE workout_log_exercises ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE workout_log_sets ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify new primary keys work (run manually)
-- SELECT id, old_id FROM session_plans LIMIT 5;
-- SELECT id, session_plan_id, old_id, old_session_plan_id FROM session_plan_exercises LIMIT 5;
