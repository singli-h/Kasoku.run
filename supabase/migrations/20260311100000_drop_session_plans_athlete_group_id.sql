-- Drop athlete_group_id from session_plans.
-- Group assignment lives on microcycles.athlete_group_id instead.
-- See issue #34 for full audit.

-- Step 1: Drop the old policy that references athlete_group_id
DROP POLICY IF EXISTS "session_plans_access" ON public.session_plans;

-- Step 2: Recreate policy routing coach/athlete access through microcycles
CREATE POLICY "session_plans_access" ON public.session_plans
  FOR ALL
  USING (
    owns_resource(user_id::bigint)
    OR is_template = true
    OR microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND (coaches_group(athlete_group_id) OR athlete_in_group(athlete_group_id::bigint))
    )
  )
  WITH CHECK (
    owns_resource(user_id::bigint)
  );

-- Step 3: Drop FK constraint and column
ALTER TABLE public.session_plans
  DROP CONSTRAINT IF EXISTS fk_session_plans_athlete_group;

ALTER TABLE public.session_plans
  DROP COLUMN IF EXISTS athlete_group_id;
