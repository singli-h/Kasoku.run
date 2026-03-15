-- Migration: Session-level schedule tags (event_groups)
-- Moves from scalar event_group → array event_groups on athletes,
-- adds target_event_groups to session_plans for session-level filtering,
-- and updates all RLS policies to use array overlap logic.
--
-- VISIBILITY CHANGE: Athletes with NULL/empty event_groups now see ONLY
-- untagged content (previously they saw everything). This is intentional.

BEGIN;

-- ============================================================================
-- STEP 1: Add event_groups TEXT[] column to athletes
-- ============================================================================
-- New array column that will replace the scalar event_group column.
ALTER TABLE public.athletes
  ADD COLUMN event_groups TEXT[];

COMMENT ON COLUMN public.athletes.event_groups IS
  'Array of event group codes (SS, MS, LS, etc.) the athlete belongs to. NULL/empty = untagged athlete.';

-- ============================================================================
-- STEP 2: Populate event_groups from existing scalar event_group
-- ============================================================================
-- Convert existing scalar values into single-element arrays.
UPDATE public.athletes
  SET event_groups = ARRAY[event_group]
  WHERE event_group IS NOT NULL;

-- ============================================================================
-- STEP 3: Add target_event_groups to session_plans + GIN index
-- ============================================================================
-- Enables session-level subgroup filtering (same pattern as session_plan_exercises).
-- NULL or empty array = visible to all athletes in the group.
ALTER TABLE public.session_plans
  ADD COLUMN target_event_groups TEXT[];

COMMENT ON COLUMN public.session_plans.target_event_groups IS
  'Array of event group codes. NULL or empty = visible to all athletes. Non-empty = only athletes with overlapping event_groups see this session.';

CREATE INDEX idx_sp_target_event_groups
  ON public.session_plans USING GIN (target_event_groups);

-- ============================================================================
-- STEP 4: Create auth_athlete_event_groups() function (plural, returns TEXT[])
-- ============================================================================
-- Replaces auth_athlete_event_group() (singular, returned TEXT).
CREATE OR REPLACE FUNCTION public.auth_athlete_event_groups()
RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_groups FROM public.athletes WHERE user_id = auth_user_id()
$$;

-- ============================================================================
-- STEP 5: Update RLS policies on session_plan_exercises and session_plan_sets
-- ============================================================================
-- Change from scalar auth_athlete_event_group() to array auth_athlete_event_groups()
-- with overlap operator (&&).
--
-- NEW VISIBILITY RULES:
--   - Exercise has NULL/empty target_event_groups → visible to ALL athletes
--   - Exercise has tags AND athlete has tags → visible if ANY tag overlaps
--   - Athlete has NULL/empty tags → sees ONLY untagged exercises (no fallback to "see all")

-- 5a: session_plan_exercises
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
    -- Subgroup filtering: array overlap logic
    AND (
      target_event_groups IS NULL                          -- NULL = all athletes
      OR target_event_groups = '{}'::text[]                -- Empty array = all athletes
      OR (
        auth_athlete_event_groups() IS NOT NULL             -- Athlete has tags
        AND auth_athlete_event_groups() != '{}'::text[]     -- ... and they're non-empty
        AND auth_athlete_event_groups() && target_event_groups  -- ... and they overlap
      )
    )
  );

-- 5b: session_plan_sets
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
        OR (
          auth_athlete_event_groups() IS NOT NULL
          AND auth_athlete_event_groups() != '{}'::text[]
          AND auth_athlete_event_groups() && spe.target_event_groups
        )
      )
    )
  );

-- ============================================================================
-- STEP 6: Add session-level tag filtering to session_plans athlete access
-- ============================================================================
-- Current state: Two policies grant athlete SELECT on session_plans:
--   1. "session_plans_access" (FOR ALL) — covers owner, coach, AND athlete via athlete_in_group
--   2. "sp_athlete_view_assigned" (FOR SELECT) — from 20260305100000, also grants athlete access
--
-- Strategy: Replace the broad "session_plans_access" with a coach/owner-only policy,
-- and drop+recreate "sp_athlete_view_assigned" with session-level tag filtering.
-- This way the athlete path goes through a single policy with the tag condition.

-- 6a: Drop and recreate session_plans_access as COACH/OWNER ONLY
-- (Remove athlete_in_group from this policy — athletes will use sp_athlete_view_assigned)
DROP POLICY IF EXISTS "session_plans_access" ON public.session_plans;

CREATE POLICY "session_plans_access" ON public.session_plans
  FOR ALL
  USING (
    owns_resource(user_id::bigint)
    OR microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND coaches_group(athlete_group_id)
    )
  )
  WITH CHECK (
    owns_resource(user_id::bigint)
  );

-- 6b: Drop and recreate sp_athlete_view_assigned WITH tag filtering
DROP POLICY IF EXISTS "sp_athlete_view_assigned" ON public.session_plans;

CREATE POLICY "sp_athlete_view_assigned" ON public.session_plans
  FOR SELECT
  USING (
    -- Athlete must be in the group that owns the microcycle
    microcycle_id IN (
      SELECT id FROM public.microcycles
      WHERE athlete_group_id IS NOT NULL
        AND athlete_in_group(athlete_group_id::bigint)
    )
    -- Session-level tag filtering (same rules as exercise-level)
    AND (
      target_event_groups IS NULL                          -- NULL = all athletes
      OR target_event_groups = '{}'::text[]                -- Empty array = all athletes
      OR (
        auth_athlete_event_groups() IS NOT NULL             -- Athlete has tags
        AND auth_athlete_event_groups() != '{}'::text[]     -- ... and they're non-empty
        AND auth_athlete_event_groups() && target_event_groups  -- ... and they overlap
      )
    )
  );

-- ============================================================================
-- STEP 7: Drop old auth_athlete_event_group() function (singular)
-- ============================================================================
-- Replaced by auth_athlete_event_groups() (plural) created in Step 4.
DROP FUNCTION IF EXISTS public.auth_athlete_event_group();

-- ============================================================================
-- STEP 8: Drop old event_group scalar column from athletes
-- ============================================================================
-- Replaced by event_groups array column added in Step 1.
ALTER TABLE public.athletes
  DROP COLUMN event_group;

COMMIT;
