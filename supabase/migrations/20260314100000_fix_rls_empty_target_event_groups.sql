-- Fix RLS policies to handle empty array target_event_groups consistently (#23)
-- Previously: only checked IS NULL, but empty array '{}' fell through to ANY() which returned false
-- Now: empty array treated same as NULL (visible to all athletes)

-- Fix session_plan_exercises policy
DROP POLICY IF EXISTS "spe_athlete_view_assigned" ON public.session_plan_exercises;

CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT
  USING (
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
    AND (
      target_event_groups IS NULL                      -- NULL = all athletes
      OR target_event_groups = '{}'::text[]            -- Empty array = all athletes
      OR auth_athlete_event_group() IS NULL            -- No event_group = see everything
      OR auth_athlete_event_group() = ANY(target_event_groups)
    )
  );

-- Fix session_plan_sets policy (filters via parent exercise)
DROP POLICY IF EXISTS "sps_athlete_view_assigned" ON public.session_plan_sets;

CREATE POLICY "sps_athlete_view_assigned" ON public.session_plan_sets
  FOR SELECT
  USING (
    session_plan_exercise_id IN (
      SELECT spe.id FROM public.session_plan_exercises spe
      WHERE spe.session_plan_id IN (
        SELECT sp.id FROM public.session_plans sp
        WHERE sp.microcycle_id IN (
          SELECT id FROM public.microcycles
          WHERE athlete_group_id IS NOT NULL
            AND athlete_in_group(athlete_group_id::bigint)
        )
      )
      AND (
        spe.target_event_groups IS NULL
        OR spe.target_event_groups = '{}'::text[]
        OR auth_athlete_event_group() IS NULL
        OR auth_athlete_event_group() = ANY(spe.target_event_groups)
      )
    )
  );
