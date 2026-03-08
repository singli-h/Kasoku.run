-- Migration: Fix RLS policies for coach workout management and ai_memories
-- Issues addressed:
-- 1. Coach can't UPDATE/DELETE workout_logs (only SELECT) - blocks workout cleanup on athlete removal
-- 2. ai_memories has RLS enabled but NO policies - all access blocked

-- ============================================================================
-- FIX 1: Allow coaches to UPDATE/DELETE workout_logs for their groups
-- ============================================================================

-- Coach can UPDATE workout_logs for athletes in their groups
-- Use case: Cancel workouts when athlete removed from group, update notes, etc.
CREATE POLICY "wl_coach_update" ON public.workout_logs
  FOR UPDATE
  USING (coaches_group(athlete_group_id::bigint))
  WITH CHECK (coaches_group(athlete_group_id::bigint));

-- Coach can DELETE workout_logs for athletes in their groups
-- Use case: Delete future workouts when athlete removed (avoid bloat)
CREATE POLICY "wl_coach_delete" ON public.workout_logs
  FOR DELETE
  USING (coaches_group(athlete_group_id::bigint));

-- ============================================================================
-- FIX 2: Add RLS policies for ai_memories table
-- ============================================================================

-- Coach can manage AI memories they created
CREATE POLICY "ai_memories_coach_own" ON public.ai_memories
  FOR ALL
  USING (coach_id = auth_coach_id())
  WITH CHECK (coach_id = auth_coach_id());

-- Athlete can view AI memories related to them
CREATE POLICY "ai_memories_athlete_view" ON public.ai_memories
  FOR SELECT
  USING (athlete_id = auth_athlete_id());

-- Coach can manage AI memories for athletes in their groups
CREATE POLICY "ai_memories_coach_athlete" ON public.ai_memories
  FOR ALL
  USING (
    coach_id = auth_coach_id()
    OR (athlete_id IS NOT NULL AND coaches_athlete(athlete_id::bigint))
  )
  WITH CHECK (
    coach_id = auth_coach_id()
    OR (athlete_id IS NOT NULL AND coaches_athlete(athlete_id::bigint))
  );

-- Coach can manage AI memories for their groups
CREATE POLICY "ai_memories_coach_group" ON public.ai_memories
  FOR ALL
  USING (
    coach_id = auth_coach_id()
    OR (group_id IS NOT NULL AND coaches_group(group_id::bigint))
  )
  WITH CHECK (
    coach_id = auth_coach_id()
    OR (group_id IS NOT NULL AND coaches_group(group_id::bigint))
  );

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================
-- After applying this migration, verify:
-- 1. Coach can cancel/delete workout_logs for athletes in their groups
-- 2. Coach can create/read/update/delete ai_memories
-- 3. Athlete can view ai_memories related to them
