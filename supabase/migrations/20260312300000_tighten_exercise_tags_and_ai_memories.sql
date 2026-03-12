-- Tighten exercise_tags and ai_memories RLS policies

-- Fix 1: exercise_tags_modify was too permissive (any authenticated user could modify ANY tag)
DROP POLICY IF EXISTS "exercise_tags_modify" ON public.exercise_tags;

CREATE POLICY "exercise_tags_modify" ON public.exercise_tags
  FOR ALL
  USING (
    exercise_id IN (
      SELECT e.id FROM exercises e WHERE e.owner_user_id = auth_user_id()
    )
    OR exercise_id IN (
      SELECT e.id FROM exercises e WHERE e.visibility = 'global'
    )
  )
  WITH CHECK (
    exercise_id IN (
      SELECT e.id FROM exercises e WHERE e.owner_user_id = auth_user_id()
    )
    OR exercise_id IN (
      SELECT e.id FROM exercises e WHERE e.visibility = 'global'
    )
  );

-- Fix 2: ai_memories coach policies allowed cross-coach DELETE on shared athletes
-- Split into SELECT (can see shared athlete memories) and modify (own records only)
DROP POLICY IF EXISTS "ai_memories_coach_athlete" ON public.ai_memories;
DROP POLICY IF EXISTS "ai_memories_coach_group" ON public.ai_memories;

-- Coach can SELECT ai_memories for their athletes (even if created by another coach)
CREATE POLICY "ai_memories_coach_athlete_select" ON public.ai_memories
  FOR SELECT
  USING (
    (coach_id = auth_coach_id())
    OR ((athlete_id IS NOT NULL) AND coaches_athlete((athlete_id)::bigint))
  );

-- Coach can only INSERT/UPDATE/DELETE their OWN ai_memories
CREATE POLICY "ai_memories_coach_athlete_modify" ON public.ai_memories
  FOR ALL
  USING (coach_id = auth_coach_id())
  WITH CHECK (coach_id = auth_coach_id());

-- Coach can SELECT ai_memories for their groups
CREATE POLICY "ai_memories_coach_group_select" ON public.ai_memories
  FOR SELECT
  USING (
    (coach_id = auth_coach_id())
    OR ((group_id IS NOT NULL) AND coaches_group((group_id)::bigint))
  );
