-- Migration Step 4: Cleanup (drop backup columns after verification)
-- Feature: 007-migrate-database-primary
-- WARNING: Only run after application is verified working with UUID IDs

-- ============================================================================
-- PRE-CLEANUP VERIFICATION (run all before proceeding)
-- ============================================================================

-- 1. Verify row counts match pre-migration counts
-- SELECT 'session_plans' as tbl, COUNT(*) FROM session_plans
-- UNION ALL SELECT 'session_plan_exercises', COUNT(*) FROM session_plan_exercises
-- UNION ALL SELECT 'session_plan_sets', COUNT(*) FROM session_plan_sets
-- UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
-- UNION ALL SELECT 'workout_log_exercises', COUNT(*) FROM workout_log_exercises
-- UNION ALL SELECT 'workout_log_sets', COUNT(*) FROM workout_log_sets;

-- 2. Verify foreign key integrity
-- SELECT 'orphan_spe' as check_name, COUNT(*) as count
-- FROM session_plan_exercises spe
-- LEFT JOIN session_plans sp ON spe.session_plan_id = sp.id
-- WHERE sp.id IS NULL
-- UNION ALL
-- SELECT 'orphan_sps', COUNT(*)
-- FROM session_plan_sets sps
-- LEFT JOIN session_plan_exercises spe ON sps.session_plan_exercise_id = spe.id
-- WHERE spe.id IS NULL
-- UNION ALL
-- SELECT 'orphan_wle', COUNT(*)
-- FROM workout_log_exercises wle
-- LEFT JOIN workout_logs wl ON wle.workout_log_id = wl.id
-- WHERE wl.id IS NULL
-- UNION ALL
-- SELECT 'orphan_wls', COUNT(*)
-- FROM workout_log_sets wls
-- LEFT JOIN workout_log_exercises wle ON wls.workout_log_exercise_id = wle.id
-- WHERE wle.id IS NULL;

-- 3. Verify application CRUD operations work (manual testing)

-- ============================================================================
-- DROP BACKUP COLUMNS
-- ============================================================================

-- session_plans
ALTER TABLE session_plans DROP COLUMN IF EXISTS old_id;

-- session_plan_exercises
ALTER TABLE session_plan_exercises DROP COLUMN IF EXISTS old_id;
ALTER TABLE session_plan_exercises DROP COLUMN IF EXISTS old_session_plan_id;

-- session_plan_sets
ALTER TABLE session_plan_sets DROP COLUMN IF EXISTS old_id;
ALTER TABLE session_plan_sets DROP COLUMN IF EXISTS old_session_plan_exercise_id;

-- workout_logs
ALTER TABLE workout_logs DROP COLUMN IF EXISTS old_id;
ALTER TABLE workout_logs DROP COLUMN IF EXISTS old_session_plan_id;

-- workout_log_exercises
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS old_id;
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS old_workout_log_id;
ALTER TABLE workout_log_exercises DROP COLUMN IF EXISTS old_session_plan_exercise_id;

-- workout_log_sets
ALTER TABLE workout_log_sets DROP COLUMN IF EXISTS old_id;
ALTER TABLE workout_log_sets DROP COLUMN IF EXISTS old_workout_log_exercise_id;

-- ============================================================================
-- DROP OLD SEQUENCES (no longer needed)
-- ============================================================================

DROP SEQUENCE IF EXISTS session_plans_id_seq CASCADE;
DROP SEQUENCE IF EXISTS session_plan_exercises_id_seq CASCADE;
DROP SEQUENCE IF EXISTS session_plan_sets_id_seq CASCADE;
DROP SEQUENCE IF EXISTS workout_logs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS workout_log_exercises_id_seq CASCADE;
DROP SEQUENCE IF EXISTS workout_log_sets_id_seq CASCADE;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify no backup columns remain
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_name IN ('session_plans', 'session_plan_exercises', 'session_plan_sets',
--                      'workout_logs', 'workout_log_exercises', 'workout_log_sets')
-- AND column_name LIKE 'old_%'
-- ORDER BY table_name, column_name;

-- Verify UUID columns are primary keys
-- SELECT tc.table_name, kcu.column_name, c.data_type
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.columns c ON kcu.table_name = c.table_name AND kcu.column_name = c.column_name
-- WHERE tc.constraint_type = 'PRIMARY KEY'
-- AND tc.table_name IN ('session_plans', 'session_plan_exercises', 'session_plan_sets',
--                       'workout_logs', 'workout_log_exercises', 'workout_log_sets')
-- ORDER BY tc.table_name;
