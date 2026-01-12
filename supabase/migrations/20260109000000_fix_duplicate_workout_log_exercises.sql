-- Fix duplicate workout_log_exercises created by the completion bug
-- This script:
-- 1. Identifies duplicates (same workout_log_id + exercise_id)
-- 2. Keeps the oldest entry per group
-- 3. Moves sets from duplicate entries to the kept entry
-- 4. Deletes the duplicate entries
-- 5. Adds NOT NULL constraint to prevent future orphaned sets

-- Run this in a transaction for safety
BEGIN;

-- =============================================================================
-- STEP 1: Preview duplicates (uncomment to check before running)
-- =============================================================================
/*
SELECT
  workout_log_id,
  exercise_id,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as exercise_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM workout_log_exercises
GROUP BY workout_log_id, exercise_id
HAVING COUNT(*) > 1;
*/

-- =============================================================================
-- STEP 2: Create temp table to map duplicates → keepers
-- =============================================================================
CREATE TEMP TABLE duplicate_exercise_mapping AS
WITH ranked AS (
  SELECT
    id,
    workout_log_id,
    exercise_id,
    ROW_NUMBER() OVER (PARTITION BY workout_log_id, exercise_id ORDER BY created_at ASC) as rn
  FROM workout_log_exercises
),
keepers AS (
  SELECT id as keeper_id, workout_log_id, exercise_id
  FROM ranked WHERE rn = 1
),
duplicates AS (
  SELECT r.id as duplicate_id, r.workout_log_id, r.exercise_id
  FROM ranked r WHERE r.rn > 1
)
SELECT
  d.duplicate_id,
  k.keeper_id,
  d.workout_log_id,
  d.exercise_id
FROM duplicates d
JOIN keepers k ON k.workout_log_id = d.workout_log_id AND k.exercise_id = d.exercise_id;

-- Show what will be affected
SELECT
  'Duplicates to merge' as action,
  COUNT(*) as count
FROM duplicate_exercise_mapping;

-- =============================================================================
-- STEP 3: Move sets from duplicates to keeper exercises
-- =============================================================================
UPDATE workout_log_sets
SET workout_log_exercise_id = m.keeper_id
FROM duplicate_exercise_mapping m
WHERE workout_log_sets.workout_log_exercise_id = m.duplicate_id;

-- =============================================================================
-- STEP 4: Delete duplicate exercises (sets already moved)
-- =============================================================================
DELETE FROM workout_log_exercises
WHERE id IN (SELECT duplicate_id FROM duplicate_exercise_mapping);

-- =============================================================================
-- STEP 5: Delete any orphaned sets (no parent exercise)
-- =============================================================================
DELETE FROM workout_log_sets
WHERE workout_log_exercise_id IS NULL;

-- Show how many orphans were deleted
-- (This should be 0 if everything was linked properly)

-- =============================================================================
-- STEP 6: Add NOT NULL constraint to prevent future orphaned sets
-- =============================================================================
ALTER TABLE workout_log_sets
ALTER COLUMN workout_log_exercise_id SET NOT NULL;

-- =============================================================================
-- STEP 7: Verify - no duplicates should remain
-- =============================================================================
SELECT
  workout_log_id,
  exercise_id,
  COUNT(*) as count
FROM workout_log_exercises
GROUP BY workout_log_id, exercise_id
HAVING COUNT(*) > 1;

-- Clean up temp table
DROP TABLE IF EXISTS duplicate_exercise_mapping;

-- If everything looks good:
COMMIT;

-- If something went wrong, use: ROLLBACK;
