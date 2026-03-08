-- Rollback Migration: Restore integer primary keys from backup columns
-- Feature: 007-migrate-database-primary
-- USE CASE: Run if migration needs to be reverted before cleanup step
-- PREREQUISITE: Backup columns (old_*) must still exist

-- ============================================================================
-- CHECK PREREQUISITES
-- ============================================================================

-- Verify backup columns exist before proceeding (run manually)
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_name IN ('session_plans', 'session_plan_exercises', 'session_plan_sets',
--                      'workout_logs', 'workout_log_exercises', 'workout_log_sets')
-- AND column_name LIKE 'old_%'
-- ORDER BY table_name, column_name;

-- ============================================================================
-- DROP UUID FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plan_exercises DROP CONSTRAINT IF EXISTS session_plan_exercises_session_plan_id_fkey;
ALTER TABLE session_plan_sets DROP CONSTRAINT IF EXISTS session_plan_sets_session_plan_exercise_id_fkey;
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_workout_log_id_fkey;
ALTER TABLE workout_log_sets DROP CONSTRAINT IF EXISTS workout_log_sets_workout_log_exercise_id_fkey;
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_session_plan_id_fkey;
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_session_plan_exercise_id_fkey;

-- ============================================================================
-- DROP UUID PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plans DROP CONSTRAINT IF EXISTS session_plans_pkey;
ALTER TABLE session_plan_exercises DROP CONSTRAINT IF EXISTS session_plan_exercises_pkey;
ALTER TABLE session_plan_sets DROP CONSTRAINT IF EXISTS session_plan_sets_pkey;
ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_pkey;
ALTER TABLE workout_log_exercises DROP CONSTRAINT IF EXISTS workout_log_exercises_pkey;
ALTER TABLE workout_log_sets DROP CONSTRAINT IF EXISTS workout_log_sets_pkey;

-- ============================================================================
-- DROP UUID COLUMNS AND RESTORE BACKUP COLUMNS
-- ============================================================================

-- session_plans
ALTER TABLE session_plans DROP COLUMN IF EXISTS id;
ALTER TABLE session_plans RENAME COLUMN old_id TO id;

-- session_plan_exercises
ALTER TABLE session_plan_exercises DROP COLUMN IF EXISTS id;
ALTER TABLE session_plan_exercises DROP COLUMN IF EXISTS session_plan_id;
ALTER TABLE session_plan_exercises RENAME COLUMN old_id TO id;
ALTER TABLE session_plan_exercises RENAME COLUMN old_session_plan_id TO session_plan_id;

-- session_plan_sets
ALTER TABLE session_plan_sets DROP COLUMN IF EXISTS id;
ALTER TABLE session_plan_sets DROP COLUMN IF EXISTS session_plan_exercise_id;
ALTER TABLE session_plan_sets RENAME COLUMN old_id TO id;
ALTER TABLE session_plan_sets RENAME COLUMN old_session_plan_exercise_id TO session_plan_exercise_id;

-- workout_logs
ALTER TABLE workout_logs DROP COLUMN IF EXISTS id;
ALTER TABLE workout_logs DROP COLUMN IF EXISTS session_plan_id;
ALTER TABLE workout_logs RENAME COLUMN old_id TO id;
ALTER TABLE workout_logs RENAME COLUMN old_session_plan_id TO session_plan_id;

-- workout_log_exercises
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS id;
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS workout_log_id;
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS session_plan_exercise_id;
ALTER TABLE workout_log_exercises RENAME COLUMN old_id TO id;
ALTER TABLE workout_log_exercises RENAME COLUMN old_workout_log_id TO workout_log_id;
ALTER TABLE workout_log_exercises RENAME COLUMN old_session_plan_exercise_id TO session_plan_exercise_id;

-- workout_log_sets
ALTER TABLE workout_log_sets DROP COLUMN IF EXISTS id;
ALTER TABLE workout_log_sets DROP COLUMN IF EXISTS workout_log_exercise_id;
ALTER TABLE workout_log_sets RENAME COLUMN old_id TO id;
ALTER TABLE workout_log_sets RENAME COLUMN old_workout_log_exercise_id TO workout_log_exercise_id;

-- ============================================================================
-- RESTORE INTEGER PRIMARY KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plans ADD PRIMARY KEY (id);
ALTER TABLE session_plan_exercises ADD PRIMARY KEY (id);
ALTER TABLE session_plan_sets ADD PRIMARY KEY (id);
ALTER TABLE workout_logs ADD PRIMARY KEY (id);
ALTER TABLE workout_log_exercises ADD PRIMARY KEY (id);
ALTER TABLE workout_log_sets ADD PRIMARY KEY (id);

-- ============================================================================
-- RESTORE INTEGER FOREIGN KEY CONSTRAINTS
-- ============================================================================

ALTER TABLE session_plan_exercises
ADD CONSTRAINT session_plan_exercises_session_plan_id_fkey
FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE CASCADE;

ALTER TABLE session_plan_sets
ADD CONSTRAINT session_plan_sets_session_plan_exercise_id_fkey
FOREIGN KEY (session_plan_exercise_id) REFERENCES session_plan_exercises(id) ON DELETE CASCADE;

ALTER TABLE workout_log_exercises
ADD CONSTRAINT workout_log_exercises_workout_log_id_fkey
FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE;

ALTER TABLE workout_log_sets
ADD CONSTRAINT workout_log_sets_workout_log_exercise_id_fkey
FOREIGN KEY (workout_log_exercise_id) REFERENCES workout_log_exercises(id) ON DELETE CASCADE;

ALTER TABLE workout_logs
ADD CONSTRAINT workout_logs_session_plan_id_fkey
FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE SET NULL;

ALTER TABLE workout_log_exercises
ADD CONSTRAINT workout_log_exercises_session_plan_exercise_id_fkey
FOREIGN KEY (session_plan_exercise_id) REFERENCES session_plan_exercises(id) ON DELETE SET NULL;

-- ============================================================================
-- RESTORE SEQUENCE DEFAULTS
-- ============================================================================

-- Recreate sequences if they were dropped
CREATE SEQUENCE IF NOT EXISTS session_plans_id_seq;
CREATE SEQUENCE IF NOT EXISTS session_plan_exercises_id_seq;
CREATE SEQUENCE IF NOT EXISTS session_plan_sets_id_seq;
CREATE SEQUENCE IF NOT EXISTS workout_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS workout_log_exercises_id_seq;
CREATE SEQUENCE IF NOT EXISTS workout_log_sets_id_seq;

-- Set sequence values to max existing ID + 1
SELECT setval('session_plans_id_seq', COALESCE((SELECT MAX(id) FROM session_plans), 0) + 1);
SELECT setval('session_plan_exercises_id_seq', COALESCE((SELECT MAX(id) FROM session_plan_exercises), 0) + 1);
SELECT setval('session_plan_sets_id_seq', COALESCE((SELECT MAX(id) FROM session_plan_sets), 0) + 1);
SELECT setval('workout_logs_id_seq', COALESCE((SELECT MAX(id) FROM workout_logs), 0) + 1);
SELECT setval('workout_log_exercises_id_seq', COALESCE((SELECT MAX(id) FROM workout_log_exercises), 0) + 1);
SELECT setval('workout_log_sets_id_seq', COALESCE((SELECT MAX(id) FROM workout_log_sets), 0) + 1);

-- Restore default values
ALTER TABLE session_plans ALTER COLUMN id SET DEFAULT nextval('session_plans_id_seq');
ALTER TABLE session_plan_exercises ALTER COLUMN id SET DEFAULT nextval('session_plan_exercises_id_seq');
ALTER TABLE session_plan_sets ALTER COLUMN id SET DEFAULT nextval('session_plan_sets_id_seq');
ALTER TABLE workout_logs ALTER COLUMN id SET DEFAULT nextval('workout_logs_id_seq');
ALTER TABLE workout_log_exercises ALTER COLUMN id SET DEFAULT nextval('workout_log_exercises_id_seq');
ALTER TABLE workout_log_sets ALTER COLUMN id SET DEFAULT nextval('workout_log_sets_id_seq');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify integer IDs restored
-- SELECT id FROM session_plans LIMIT 5;
-- SELECT id, session_plan_id FROM session_plan_exercises LIMIT 5;
