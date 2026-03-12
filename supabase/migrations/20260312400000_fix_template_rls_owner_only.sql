-- Restrict session_plans templates to owner-only access.
-- Previously, is_template = true made templates readable by ANY authenticated user.
-- Now templates are only visible to the user who created them.

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "session_plans_access" ON public.session_plans;

-- Step 2: Recreate without the is_template = true bypass
CREATE POLICY "session_plans_access" ON public.session_plans
  FOR ALL
  USING (
    owns_resource(user_id::bigint)
    OR microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND (coaches_group(athlete_group_id) OR athlete_in_group(athlete_group_id::bigint))
    )
  )
  WITH CHECK (
    owns_resource(user_id::bigint)
  );

-- Step 3: Fix can_access_session_plan() to also remove is_template bypass
CREATE OR REPLACE FUNCTION public.can_access_session_plan(sp_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM session_plans sp
    LEFT JOIN microcycles mc ON mc.id = sp.microcycle_id
    WHERE sp.id = sp_id AND (
      owns_resource(sp.user_id) OR
      (mc.athlete_group_id IS NOT NULL AND (
        coaches_group(mc.athlete_group_id) OR
        athlete_in_group(mc.athlete_group_id)
      ))
    )
  )
$function$;
