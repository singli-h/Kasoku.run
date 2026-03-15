-- Rename all "event_group(s)" references to "subgroup(s)" across the schema.
--
-- Rationale: "event group" was a domain-specific term from track & field that
-- doesn't generalise well. "subgroup" is clearer and sport-agnostic.
--
-- Changes:
--   1. Rename table:  event_groups → subgroups
--   2. Rename columns:
--      - athletes.event_groups → athletes.subgroups
--      - session_plans.target_event_groups → session_plans.target_subgroups
--      - session_plan_exercises.target_event_groups → session_plan_exercises.target_subgroups
--   3. Rename function:  auth_athlete_event_groups() → auth_athlete_subgroups()
--   4. Drop & recreate all RLS policies referencing old names
--   5. Drop & recreate GIN indexes with new column names

BEGIN;

-- ============================================================================
-- STEP 1: Rename table event_groups → subgroups
-- ============================================================================
ALTER TABLE public.event_groups RENAME TO subgroups;

-- ============================================================================
-- STEP 2: Rename columns
-- ============================================================================
ALTER TABLE public.athletes
  RENAME COLUMN event_groups TO subgroups;

ALTER TABLE public.session_plans
  RENAME COLUMN target_event_groups TO target_subgroups;

ALTER TABLE public.session_plan_exercises
  RENAME COLUMN target_event_groups TO target_subgroups;

-- ============================================================================
-- STEP 3: Create new auth_athlete_subgroups() function, drop old one
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auth_athlete_subgroups()
RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subgroups FROM public.athletes WHERE user_id = auth_user_id()
$$;

DROP FUNCTION IF EXISTS public.auth_athlete_event_groups();

-- ============================================================================
-- STEP 4: Recreate RLS policies on subgroups table (formerly event_groups)
-- ============================================================================
-- The policies still exist after the table rename, but we recreate them with
-- updated names and references for clarity.

-- 4a: Coach CRUD policy
DROP POLICY IF EXISTS "eg_coach_own" ON public.subgroups;

CREATE POLICY "sg_coach_own" ON public.subgroups
  FOR ALL
  USING (coach_id = auth_coach_id())
  WITH CHECK (coach_id = auth_coach_id());

-- 4b: Athlete read policy
DROP POLICY IF EXISTS "eg_athlete_read" ON public.subgroups;

CREATE POLICY "sg_athlete_read" ON public.subgroups
  FOR SELECT
  USING (
    coach_id IN (
      SELECT ag.coach_id FROM public.athlete_groups ag
      WHERE athlete_in_group(ag.id::bigint)
    )
  );

-- ============================================================================
-- STEP 5: Recreate RLS policies on session_plan_exercises
-- ============================================================================
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
      target_subgroups IS NULL
      OR target_subgroups = '{}'::text[]
      OR (
        auth_athlete_subgroups() IS NOT NULL
        AND auth_athlete_subgroups() != '{}'::text[]
        AND auth_athlete_subgroups() && target_subgroups
      )
    )
  );

-- ============================================================================
-- STEP 6: Recreate RLS policies on session_plan_sets
-- ============================================================================
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
        spe.target_subgroups IS NULL
        OR spe.target_subgroups = '{}'::text[]
        OR (
          auth_athlete_subgroups() IS NOT NULL
          AND auth_athlete_subgroups() != '{}'::text[]
          AND auth_athlete_subgroups() && spe.target_subgroups
        )
      )
    )
  );

-- ============================================================================
-- STEP 7: Recreate RLS policies on session_plans
-- ============================================================================
-- sp_athlete_view_assigned references target_event_groups (now target_subgroups)
DROP POLICY IF EXISTS "sp_athlete_view_assigned" ON public.session_plans;

CREATE POLICY "sp_athlete_view_assigned" ON public.session_plans
  FOR SELECT
  USING (
    microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
    AND (
      target_subgroups IS NULL
      OR target_subgroups = '{}'::text[]
      OR (
        auth_athlete_subgroups() IS NOT NULL
        AND auth_athlete_subgroups() != '{}'::text[]
        AND auth_athlete_subgroups() && target_subgroups
      )
    )
  );

-- ============================================================================
-- STEP 8: Recreate GIN indexes with new column names
-- ============================================================================
DROP INDEX IF EXISTS idx_spe_target_event_groups;
CREATE INDEX idx_spe_target_subgroups
  ON public.session_plan_exercises USING GIN (target_subgroups);

DROP INDEX IF EXISTS idx_sp_target_event_groups;
CREATE INDEX idx_sp_target_subgroups
  ON public.session_plans USING GIN (target_subgroups);

-- ============================================================================
-- STEP 9: Update column comments
-- ============================================================================
COMMENT ON COLUMN public.athletes.subgroups IS
  'Array of subgroup codes (SS, MS, LS, etc.) the athlete belongs to. NULL/empty = untagged athlete.';

COMMENT ON COLUMN public.session_plans.target_subgroups IS
  'Array of subgroup codes. NULL or empty = visible to all athletes. Non-empty = only athletes with overlapping subgroups see this session.';

COMMENT ON COLUMN public.session_plan_exercises.target_subgroups IS
  'Array of subgroup codes (SS, MS, LS, etc.). NULL = visible to all athletes.';

COMMIT;
