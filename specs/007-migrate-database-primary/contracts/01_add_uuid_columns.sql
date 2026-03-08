-- Migration Step 1: Add UUID columns alongside existing integer columns
-- Feature: 007-migrate-database-primary
-- Safe to run: Yes (additive only, no data loss risk)

-- ============================================================================
-- SESSION PLAN TABLES
-- ============================================================================

-- 1. session_plans: Add new_id UUID column
ALTER TABLE session_plans
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid();

-- 2. session_plan_exercises: Add new_id and new_session_plan_id columns
ALTER TABLE session_plan_exercises
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS new_session_plan_id uuid;

-- 3. session_plan_sets: Add new_id and new_session_plan_exercise_id columns
ALTER TABLE session_plan_sets
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS new_session_plan_exercise_id uuid;

-- ============================================================================
-- WORKOUT LOG TABLES
-- ============================================================================

-- 4. workout_logs: Add new_id column
ALTER TABLE workout_logs
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid();

-- 5. workout_log_exercises: Add new_id, new_workout_log_id, new_session_plan_exercise_id columns
ALTER TABLE workout_log_exercises
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS new_workout_log_id uuid,
ADD COLUMN IF NOT EXISTS new_session_plan_exercise_id uuid;

-- 6. workout_log_sets: Add new_id and new_workout_log_exercise_id columns
ALTER TABLE workout_log_sets
ADD COLUMN IF NOT EXISTS new_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS new_workout_log_exercise_id uuid;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added (run manually after migration)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('session_plans', 'session_plan_exercises', 'session_plan_sets',
--                      'workout_logs', 'workout_log_exercises', 'workout_log_sets')
-- AND column_name LIKE 'new_%'
-- ORDER BY table_name, column_name;
