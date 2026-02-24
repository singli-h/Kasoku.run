-- Migration: Add ai_memories RLS policy for individual users
-- Issue: Individual role users have NO write access to ai_memories.
-- All existing write policies gate on auth_coach_id() which returns NULL for individuals.
-- This policy allows individuals to manage their own AI memories with triple constraint:
--   1. coach_id IS NULL (no coach ownership)
--   2. athlete_id matches their own athlete record
--   3. created_by matches their own user ID

CREATE POLICY "ai_memories_individual_own" ON public.ai_memories
  FOR ALL
  USING (
    coach_id IS NULL
    AND athlete_id = auth_athlete_id()
    AND created_by = auth_user_id()
  )
  WITH CHECK (
    coach_id IS NULL
    AND athlete_id = auth_athlete_id()
    AND created_by = auth_user_id()
  );
