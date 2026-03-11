-- Add target_event_groups column to session_plan_exercises
-- Enables exercise-level subgroup filtering (#23)
-- NULL = visible to all athletes

ALTER TABLE public.session_plan_exercises
  ADD COLUMN target_event_groups TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.session_plan_exercises.target_event_groups IS
  'Array of event group codes (SS, MS, LS, etc.). NULL = visible to all athletes.';

-- GIN index for ANY() queries in RLS
CREATE INDEX idx_spe_target_event_groups ON public.session_plan_exercises
  USING GIN (target_event_groups);

-- Helper function: get current athlete's event_group
CREATE OR REPLACE FUNCTION public.auth_athlete_event_group()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_group FROM public.athletes WHERE user_id = auth_user_id()
$$;

-- Update RLS policy on session_plan_exercises: add subgroup filtering
DROP POLICY IF EXISTS "spe_athlete_view_assigned" ON public.session_plan_exercises;

CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT
  USING (
    -- Existing: athlete must be in the group that owns the microcycle
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
    -- New: subgroup filtering
    AND (
      target_event_groups IS NULL                      -- NULL = all athletes
      OR auth_athlete_event_group() IS NULL            -- No event_group = see everything
      OR auth_athlete_event_group() = ANY(target_event_groups)  -- Match specific groups
    )
  );

-- Update RLS policy on session_plan_sets: filter via parent exercise
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
        OR auth_athlete_event_group() IS NULL
        OR auth_athlete_event_group() = ANY(spe.target_event_groups)
      )
    )
  );
