-- Migration: Update Freelap metadata to new field naming convention
-- Date: 2025-12-31
--
-- Changes:
--   Old field names -> New field names (aligned with official Freelap CSV export)
--   - stride_length_m -> stride_length
--   - frequency_hz -> frequency
--   - time_seconds -> time
--   - freelap_first_20m, freelap_second_20m -> splits[] array
--
-- This migration updates workout_log_sets.metadata JSON field

-- Step 1: Update single-distance sprint records (20m)
-- Rename stride_length_m to stride_length, etc.
UPDATE workout_log_sets
SET metadata = jsonb_build_object(
  'note', metadata->>'note',
  'time', (metadata->>'time_seconds')::numeric,
  'speed', (metadata->>'speed')::numeric,
  'frequency', COALESCE((metadata->>'frequency_hz')::numeric, (metadata->>'frequency')::numeric),
  'stride_length', COALESCE((metadata->>'stride_length_m')::numeric, (metadata->>'stride_length')::numeric),
  'steps', (metadata->>'steps')::numeric
) - 'time_seconds' - 'frequency_hz' - 'stride_length_m'
WHERE metadata IS NOT NULL
  AND metadata ? 'steps'
  AND NOT (metadata ? 'freelap_first_20m')
  AND NOT (metadata ? 'splits');

-- Step 2: Update multi-split sprint records (40m+)
-- Convert freelap_first_20m, freelap_second_20m to splits[] array
UPDATE workout_log_sets
SET metadata = jsonb_build_object(
  'note', metadata->>'note',
  'time', COALESCE((metadata->>'time_seconds')::numeric, (metadata->>'time')::numeric),
  'speed', (metadata->>'speed')::numeric,
  'frequency', COALESCE((metadata->>'frequency_hz')::numeric, (metadata->>'frequency')::numeric),
  'stride_length', COALESCE((metadata->>'stride_length_m')::numeric, (metadata->>'stride_length')::numeric),
  'steps', (metadata->>'steps')::numeric,
  'splits', jsonb_build_array(
    jsonb_build_object(
      'distance', 20,
      'time', COALESCE((metadata->'freelap_first_20m'->>'time_seconds')::numeric, (metadata->'freelap_first_20m'->>'time')::numeric),
      'speed', (metadata->'freelap_first_20m'->>'speed')::numeric,
      'frequency', COALESCE((metadata->'freelap_first_20m'->>'frequency_hz')::numeric, (metadata->'freelap_first_20m'->>'frequency')::numeric),
      'stride_length', COALESCE((metadata->'freelap_first_20m'->>'stride_length_m')::numeric, (metadata->'freelap_first_20m'->>'stride_length')::numeric),
      'steps', (metadata->'freelap_first_20m'->>'steps')::numeric
    ),
    jsonb_build_object(
      'distance', 20,
      'time', COALESCE((metadata->'freelap_second_20m'->>'time_seconds')::numeric, (metadata->'freelap_second_20m'->>'time')::numeric),
      'speed', (metadata->'freelap_second_20m'->>'speed')::numeric,
      'frequency', COALESCE((metadata->'freelap_second_20m'->>'frequency_hz')::numeric, (metadata->'freelap_second_20m'->>'frequency')::numeric),
      'stride_length', COALESCE((metadata->'freelap_second_20m'->>'stride_length_m')::numeric, (metadata->'freelap_second_20m'->>'stride_length')::numeric),
      'steps', (metadata->'freelap_second_20m'->>'steps')::numeric
    )
  )
) - 'time_seconds' - 'frequency_hz' - 'stride_length_m' - 'freelap_first_20m' - 'freelap_second_20m'
WHERE metadata IS NOT NULL
  AND metadata ? 'freelap_first_20m'
  AND metadata ? 'freelap_second_20m';

-- Verify the updates
SELECT id, set_index, metadata
FROM workout_log_sets
WHERE workout_log_id = 64
AND metadata IS NOT NULL
ORDER BY set_index;
