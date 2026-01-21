-- Add indexes for unified exercise search performance
-- These indexes optimize the two-phase equipment tag filtering approach
-- and text search patterns used by all search consumers.

-- ============================================================================
-- EXERCISE TAGS INDEXES (High Priority)
-- ============================================================================

-- Index for equipment tag filtering - Phase 1: Get exercise IDs by tag
-- Used by: searchExercises() when filtering by equipmentTagIds or equipmentTags
CREATE INDEX IF NOT EXISTS idx_exercise_tags_tag_id
ON exercise_tags(tag_id);

-- Index for equipment tag filtering - Phase 2: Filter exercises by pre-computed IDs
-- Used by: searchExercises() .in('id', exerciseIds) query
CREATE INDEX IF NOT EXISTS idx_exercise_tags_exercise_id
ON exercise_tags(exercise_id);

-- ============================================================================
-- TAGS INDEXES (Medium Priority)
-- ============================================================================

-- Index for equipment tag lookup by category and name
-- Used by: getEquipmentTags(), resolveEquipmentTagNames()
CREATE INDEX IF NOT EXISTS idx_tags_category_name
ON tags(category, name);

-- ============================================================================
-- EXERCISES INDEXES (Medium Priority)
-- ============================================================================

-- Index for visibility filtering (global + user private exercises)
-- Used by: searchExercises() .or(`visibility.eq.global,and(visibility.eq.private,owner_user_id.eq....)`)
-- Partial index only includes active (non-archived) exercises
CREATE INDEX IF NOT EXISTS idx_exercises_visibility_owner
ON exercises(visibility, owner_user_id)
WHERE is_archived = false;

-- Index for exercise name sorting (used in ORDER BY)
-- Partial index only includes active exercises
CREATE INDEX IF NOT EXISTS idx_exercises_name_active
ON exercises(name)
WHERE is_archived = false;

-- Index for exercise type filtering
-- Used by: searchExercises() .eq('exercise_type_id', ...)
CREATE INDEX IF NOT EXISTS idx_exercises_type_active
ON exercises(exercise_type_id)
WHERE is_archived = false;

-- ============================================================================
-- FUTURE: Full-Text Search (Low Priority, Add When Needed)
-- ============================================================================
--
-- When ilike becomes a bottleneck (likely at 10k+ exercises), consider:
--
-- 1. Enable pg_trgm extension (already enabled in most Supabase projects):
--    CREATE EXTENSION IF NOT EXISTS pg_trgm;
--
-- 2. Add trigram index for fuzzy text search:
--    CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
--    ON exercises USING gin(name gin_trgm_ops);
--
-- 3. Or add a generated tsvector column for full-text search:
--    ALTER TABLE exercises ADD COLUMN search_tsv tsvector
--    GENERATED ALWAYS AS (
--      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
--      setweight(to_tsvector('english', coalesce(description, '')), 'B')
--    ) STORED;
--    CREATE INDEX idx_exercises_search_tsv ON exercises USING gin(search_tsv);
