-- Migration Step 2: Populate UUID columns and update foreign key references
-- Feature: 007-migrate-database-primary
-- Safe to run: Yes (updates only, original data preserved)

-- ============================================================================
-- POPULATE PRIMARY KEY UUIDs (for rows missing them)
-- ============================================================================

-- Ensure all rows have UUIDs in new_id columns
UPDATE session_plans SET new_id = gen_random_uuid() WHERE new_id IS NULL;
UPDATE session_plan_exercises SET new_id = gen_random_uuid() WHERE new_id IS NULL;
UPDATE session_plan_sets SET new_id = gen_random_uuid() WHERE new_id IS NULL;
UPDATE workout_logs SET new_id = gen_random_uuid() WHERE new_id IS NULL;
UPDATE workout_log_exercises SET new_id = gen_random_uuid() WHERE new_id IS NULL;
UPDATE workout_log_sets SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- ============================================================================
-- POPULATE FOREIGN KEY UUIDs (SESSION PLAN HIERARCHY)
-- ============================================================================

-- session_plan_exercises.new_session_plan_id → session_plans.new_id
UPDATE session_plan_exercises spe
SET new_session_plan_id = sp.new_id
FROM session_plans sp
WHERE spe.session_plan_id = sp.id
AND spe.new_session_plan_id IS NULL;

-- session_plan_sets.new_session_plan_exercise_id → session_plan_exercises.new_id
UPDATE session_plan_sets sps
SET new_session_plan_exercise_id = spe.new_id
FROM session_plan_exercises spe
WHERE sps.session_plan_exercise_id = spe.id
AND sps.new_session_plan_exercise_id IS NULL;

-- ============================================================================
-- POPULATE FOREIGN KEY UUIDs (WORKOUT LOG HIERARCHY)
-- ============================================================================

-- workout_log_exercises.new_workout_log_id → workout_logs.new_id
UPDATE workout_log_exercises wle
SET new_workout_log_id = wl.new_id
FROM workout_logs wl
WHERE wle.workout_log_id = wl.id
AND wle.new_workout_log_id IS NULL;

-- workout_log_sets.new_workout_log_exercise_id → workout_log_exercises.new_id
UPDATE workout_log_sets wls
SET new_workout_log_exercise_id = wle.new_id
FROM workout_log_exercises wle
WHERE wls.workout_log_exercise_id = wle.id
AND wls.new_workout_log_exercise_id IS NULL;

-- ============================================================================
-- POPULATE CROSS-REFERENCES (WORKOUT LOGS → SESSION PLANS)
-- ============================================================================

-- workout_logs.session_plan_id references session_plans.id
-- Note: workout_logs table needs new_session_plan_id column added first
ALTER TABLE workout_logs
ADD COLUMN IF NOT EXISTS new_session_plan_id uuid;

UPDATE workout_logs wl
SET new_session_plan_id = sp.new_id
FROM session_plans sp
WHERE wl.session_plan_id = sp.id
AND wl.new_session_plan_id IS NULL;

-- workout_log_exercises.session_plan_exercise_id references session_plan_exercises.id
UPDATE workout_log_exercises wle
SET new_session_plan_exercise_id = spe.new_id
FROM session_plan_exercises spe
WHERE wle.session_plan_exercise_id = spe.id
AND wle.new_session_plan_exercise_id IS NULL;

-- ============================================================================
-- LOG ORPHANED RECORDS (for manual review)
-- ============================================================================

-- Find orphaned session_plan_exercises (no matching session_plan)
-- SELECT spe.id, spe.session_plan_id
-- FROM session_plan_exercises spe
-- LEFT JOIN session_plans sp ON spe.session_plan_id = sp.id
-- WHERE sp.id IS NULL;

-- Find orphaned session_plan_sets (no matching session_plan_exercise)
-- SELECT sps.id, sps.session_plan_exercise_id
-- FROM session_plan_sets sps
-- LEFT JOIN session_plan_exercises spe ON sps.session_plan_exercise_id = spe.id
-- WHERE spe.id IS NULL;

-- Find orphaned workout_log_exercises (no matching workout_log)
-- SELECT wle.id, wle.workout_log_id
-- FROM workout_log_exercises wle
-- LEFT JOIN workout_logs wl ON wle.workout_log_id = wl.id
-- WHERE wl.id IS NULL;

-- Find orphaned workout_log_sets (no matching workout_log_exercise)
-- SELECT wls.id, wls.workout_log_exercise_id
-- FROM workout_log_sets wls
-- LEFT JOIN workout_log_exercises wle ON wls.workout_log_exercise_id = wle.id
-- WHERE wle.id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all UUIDs populated (run manually)
-- SELECT 'session_plans' as tbl, COUNT(*) as total, COUNT(new_id) as with_uuid FROM session_plans
-- UNION ALL SELECT 'session_plan_exercises', COUNT(*), COUNT(new_id) FROM session_plan_exercises
-- UNION ALL SELECT 'session_plan_sets', COUNT(*), COUNT(new_id) FROM session_plan_sets
-- UNION ALL SELECT 'workout_logs', COUNT(*), COUNT(new_id) FROM workout_logs
-- UNION ALL SELECT 'workout_log_exercises', COUNT(*), COUNT(new_id) FROM workout_log_exercises
-- UNION ALL SELECT 'workout_log_sets', COUNT(*), COUNT(new_id) FROM workout_log_sets;
