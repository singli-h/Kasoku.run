-- Migration: Move athlete_group_id from macrocycles → microcycles
-- Adds: planning_context (macrocycles + mesocycles), weekly_insights + coach_notes (microcycles), event_group (athletes)
-- Fixes: RLS on macrocycles (replaces macro_own/macro_coach_select/macro_athlete_select),
--        full microcycles RLS policy matrix, replaces 5 broken athlete plan-view policies
-- Adds: data integrity partial unique indexes on microcycles
--
-- SAFETY NOTE: This migration drops macrocycles.athlete_group_id in the same transaction.
-- Safe to apply as a single migration ONLY if there are no live production users on the old schema.
-- Current status: staging branch, no live users → single-phase acceptable.

-- ============================================================================
-- STEP 1: Add athlete_group_id to microcycles
-- ============================================================================
ALTER TABLE public.microcycles
  ADD COLUMN athlete_group_id INTEGER REFERENCES public.athlete_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Backfill from existing macrocycle.athlete_group_id chain
-- ============================================================================
UPDATE public.microcycles mc
SET athlete_group_id = mac.athlete_group_id
FROM public.mesocycles meso
JOIN public.macrocycles mac ON meso.macrocycle_id = mac.id
WHERE mc.mesocycle_id = meso.id
  AND mac.athlete_group_id IS NOT NULL;

-- ============================================================================
-- STEP 3: New columns
-- ============================================================================
ALTER TABLE public.macrocycles ADD COLUMN planning_context JSONB;
ALTER TABLE public.mesocycles ADD COLUMN planning_context JSONB;
ALTER TABLE public.microcycles ADD COLUMN weekly_insights JSONB;
ALTER TABLE public.microcycles ADD COLUMN coach_notes TEXT;
ALTER TABLE public.athletes ADD COLUMN event_group TEXT;

-- ============================================================================
-- STEP 4: Drop ALL existing policies that reference macrocycles.athlete_group_id
-- (3 on macrocycles: macro_coach_select, macro_athlete_select, macro_own)
-- (5 downstream from 20260219100000: ms/mc/sp/spe/sps_athlete_view_assigned)
-- ============================================================================
DROP POLICY IF EXISTS "macro_coach_select" ON public.macrocycles;
DROP POLICY IF EXISTS "macro_athlete_select" ON public.macrocycles;
DROP POLICY IF EXISTS "macro_own" ON public.macrocycles;
DROP POLICY IF EXISTS "ms_athlete_view_assigned" ON public.mesocycles;
DROP POLICY IF EXISTS "mc_athlete_view_assigned" ON public.microcycles;
DROP POLICY IF EXISTS "sp_athlete_view_assigned" ON public.session_plans;
DROP POLICY IF EXISTS "spe_athlete_view_assigned" ON public.session_plan_exercises;
DROP POLICY IF EXISTS "sps_athlete_view_assigned" ON public.session_plan_sets;

-- ============================================================================
-- STEP 5: Now safe to drop the column
-- ============================================================================
ALTER TABLE public.macrocycles DROP COLUMN athlete_group_id;

-- ============================================================================
-- STEP 6: Macrocycles RLS (using helper functions: owns_resource, athlete_in_group)
-- Replaces macro_own + macro_coach_select with single mac_coach_own (ALL)
-- ============================================================================
CREATE POLICY "mac_coach_own" ON public.macrocycles
  FOR ALL
  USING (owns_resource(user_id::bigint))
  WITH CHECK (owns_resource(user_id::bigint));

CREATE POLICY "mac_athlete_view_assigned" ON public.macrocycles
  FOR SELECT
  USING (
    id IN (
      SELECT meso.macrocycle_id FROM public.mesocycles meso
      WHERE meso.id IN (
        SELECT mesocycle_id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- STEP 7: New athlete RLS policies (walk from microcycles.athlete_group_id upward)
-- ============================================================================
CREATE POLICY "mc_athlete_view_assigned" ON public.microcycles
  FOR SELECT
  USING (
    athlete_group_id IS NOT NULL
    AND athlete_in_group(athlete_group_id::bigint)
  );

CREATE POLICY "ms_athlete_view_assigned" ON public.mesocycles
  FOR SELECT
  USING (
    id IN (
      SELECT mesocycle_id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
  );

CREATE POLICY "sp_athlete_view_assigned" ON public.session_plans
  FOR SELECT
  USING (
    microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
  );

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
  );

CREATE POLICY "sps_athlete_view_assigned" ON public.session_plan_sets
  FOR SELECT
  USING (
    session_plan_exercise_id IN (
      SELECT spe.id FROM public.session_plan_exercises spe
      JOIN public.session_plans sp ON spe.session_plan_id = sp.id
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- STEP 8: Microcycles owner policies
-- ============================================================================
CREATE POLICY "mc_coach_own" ON public.microcycles
  FOR ALL
  USING (owns_resource(user_id::bigint))
  WITH CHECK (owns_resource(user_id::bigint));

CREATE POLICY "mc_individual_own" ON public.microcycles
  FOR ALL
  USING (
    athlete_group_id IS NULL
    AND owns_resource(user_id::bigint)
  )
  WITH CHECK (
    athlete_group_id IS NULL
    AND owns_resource(user_id::bigint)
  );

-- ============================================================================
-- STEP 9: Performance index + data integrity
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_microcycles_athlete_group_id
  ON public.microcycles(athlete_group_id)
  WHERE athlete_group_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_microcycles_meso_startdate_individual
  ON public.microcycles(mesocycle_id, start_date)
  WHERE athlete_group_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_microcycles_meso_group_startdate
  ON public.microcycles(mesocycle_id, athlete_group_id, start_date)
  WHERE athlete_group_id IS NOT NULL;
