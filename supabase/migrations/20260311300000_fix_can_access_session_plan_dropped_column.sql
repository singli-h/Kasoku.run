-- Fix can_access_session_plan() to route through microcycles.athlete_group_id
-- instead of the dropped session_plans.athlete_group_id column.
-- See migration 20260311100000_drop_session_plans_athlete_group_id.sql

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
      sp.is_template = true OR
      (mc.athlete_group_id IS NOT NULL AND (
        coaches_group(mc.athlete_group_id) OR
        athlete_in_group(mc.athlete_group_id)
      ))
    )
  )
$function$;
