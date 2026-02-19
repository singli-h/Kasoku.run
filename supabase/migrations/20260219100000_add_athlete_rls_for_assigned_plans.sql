-- Migration: Add athlete RLS SELECT policies for assigned training plans
-- Issue: Athletes cannot view session plans, exercises, or sets assigned to them
-- via a coach's macrocycle. The existing RLS only grants access to plan creators
-- (user_id match) and group members via athlete_group_id on session_plans directly.
-- However, session_plans.athlete_group_id is not set during plan assignment —
-- group assignment is tracked on macrocycles.athlete_group_id instead.
--
-- This migration adds SELECT policies through the macrocycle chain so athletes
-- can view the full training plan hierarchy assigned to their group.
--
-- Tables affected: mesocycles, microcycles, session_plans,
--                  session_plan_exercises, session_plan_sets

-- ============================================================================
-- 1. MESOCYCLES: Athletes can view mesocycles in macrocycles assigned to their group
-- ============================================================================
CREATE POLICY "ms_athlete_view_assigned" ON public.mesocycles
  FOR SELECT
  USING (
    macrocycle_id IN (
      SELECT m.id FROM macrocycles m
      WHERE m.athlete_group_id IS NOT NULL
      AND athlete_in_group(m.athlete_group_id::bigint)
    )
  );

-- ============================================================================
-- 2. MICROCYCLES: Athletes can view microcycles in assigned mesocycles
-- ============================================================================
CREATE POLICY "mc_athlete_view_assigned" ON public.microcycles
  FOR SELECT
  USING (
    mesocycle_id IN (
      SELECT ms.id FROM mesocycles ms
      WHERE ms.macrocycle_id IN (
        SELECT m.id FROM macrocycles m
        WHERE m.athlete_group_id IS NOT NULL
        AND athlete_in_group(m.athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- 3. SESSION_PLANS: Athletes can view session plans in assigned microcycles
-- ============================================================================
CREATE POLICY "sp_athlete_view_assigned" ON public.session_plans
  FOR SELECT
  USING (
    microcycle_id IN (
      SELECT mc.id FROM microcycles mc
      JOIN mesocycles ms ON mc.mesocycle_id = ms.id
      WHERE ms.macrocycle_id IN (
        SELECT m.id FROM macrocycles m
        WHERE m.athlete_group_id IS NOT NULL
        AND athlete_in_group(m.athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- 4. SESSION_PLAN_EXERCISES: Athletes can view exercises in assigned session plans
-- ============================================================================
CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT
  USING (
    session_plan_id IN (
      SELECT sp.id FROM session_plans sp
      JOIN microcycles mc ON sp.microcycle_id = mc.id
      JOIN mesocycles ms ON mc.mesocycle_id = ms.id
      WHERE ms.macrocycle_id IN (
        SELECT m.id FROM macrocycles m
        WHERE m.athlete_group_id IS NOT NULL
        AND athlete_in_group(m.athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- 5. SESSION_PLAN_SETS: Athletes can view sets in assigned exercises
-- ============================================================================
CREATE POLICY "sps_athlete_view_assigned" ON public.session_plan_sets
  FOR SELECT
  USING (
    session_plan_exercise_id IN (
      SELECT spe.id FROM session_plan_exercises spe
      JOIN session_plans sp ON spe.session_plan_id = sp.id
      JOIN microcycles mc ON sp.microcycle_id = mc.id
      JOIN mesocycles ms ON mc.mesocycle_id = ms.id
      WHERE ms.macrocycle_id IN (
        SELECT m.id FROM macrocycles m
        WHERE m.athlete_group_id IS NOT NULL
        AND athlete_in_group(m.athlete_group_id::bigint)
      )
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After applying, verify as athlete (kim.sing.canada@gmail.com, athlete_group_id=14):
-- 1. /program page shows assigned plan sessions
-- 2. /workout page shows session cards with names (not "Untitled Session")
-- 3. /workout/[id] loads session detail (not 404)
-- 4. Workout session shows exercises and sets
