-- Migration: Track all base helper functions used by RLS policies
-- These functions existed in production but were not tracked in migration files.
-- Timestamp backdated to sort before other migrations that depend on them.
-- All functions use CREATE OR REPLACE for idempotency.

-- =============================================================================
-- 1. BASE AUTH FUNCTIONS
-- =============================================================================

-- Extract Clerk user ID from JWT
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (auth.jwt() ->> 'sub');
END;
$function$;

-- Resolve Clerk ID to internal user ID
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM users WHERE clerk_id = (auth.jwt() ->> 'sub')
$function$;

-- =============================================================================
-- 2. ROLE-SPECIFIC AUTH FUNCTIONS (depend on auth_user_id)
-- =============================================================================

-- Get current user's coach ID
CREATE OR REPLACE FUNCTION public.auth_coach_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.id FROM coaches c WHERE c.user_id = auth_user_id()
$function$;

-- Get current user's athlete ID
CREATE OR REPLACE FUNCTION public.auth_athlete_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.id FROM athletes a WHERE a.user_id = auth_user_id()
$function$;

-- Get current user's athlete group ID
CREATE OR REPLACE FUNCTION public.auth_athlete_group_id()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.athlete_group_id FROM athletes a
  WHERE a.user_id = auth_user_id() AND a.athlete_group_id IS NOT NULL
$function$;

-- Get all group IDs coached by the current user
CREATE OR REPLACE FUNCTION public.auth_coached_group_ids()
RETURNS SETOF bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ag.id FROM athlete_groups ag WHERE ag.coach_id = auth_coach_id()
$function$;

-- =============================================================================
-- 3. RESOURCE OWNERSHIP & GROUP ACCESS (depend on auth functions)
-- =============================================================================

-- Check if the current user owns a resource
CREATE OR REPLACE FUNCTION public.owns_resource(resource_user_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT resource_user_id = auth_user_id()
$function$;

-- Check if the current user coaches a group
CREATE OR REPLACE FUNCTION public.coaches_group(group_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT group_id IN (SELECT * FROM auth_coached_group_ids())
$function$;

-- Check if the current user coaches a specific athlete
CREATE OR REPLACE FUNCTION public.coaches_athlete(athlete_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_id
    AND a.athlete_group_id IN (SELECT * FROM auth_coached_group_ids())
  )
$function$;

-- Check if the current athlete is in a group
CREATE OR REPLACE FUNCTION public.athlete_in_group(group_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT group_id = auth_athlete_group_id()
$function$;

-- Check if the current user can access a group (coach or athlete member)
CREATE OR REPLACE FUNCTION public.can_access_group(group_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coaches_group(group_id) OR athlete_in_group(group_id)
$function$;

-- =============================================================================
-- 4. SESSION PLAN ACCESS (depend on owns_resource, can_access_group)
-- =============================================================================

-- Check if the current user owns a session plan
CREATE OR REPLACE FUNCTION public.owns_session_plan(sp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM session_plans sp
    WHERE sp.id = sp_id AND owns_resource(sp.user_id)
  )
$function$;

-- Check if the current user owns a session exercise
CREATE OR REPLACE FUNCTION public.owns_session_exercise(spe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM session_plan_exercises spe
    WHERE spe.id = spe_id AND owns_session_plan(spe.session_plan_id)
  )
$function$;

-- Check if the current user can access a session plan (owner, template, or group member)
CREATE OR REPLACE FUNCTION public.can_access_session_plan(sp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM session_plans sp
    WHERE sp.id = sp_id AND (
      owns_resource(sp.user_id) OR
      sp.is_template = true OR
      coaches_group(sp.athlete_group_id) OR
      athlete_in_group(sp.athlete_group_id)
    )
  )
$function$;

-- Check if the current user can access a session exercise
CREATE OR REPLACE FUNCTION public.can_access_session_exercise(spe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM session_plan_exercises spe
    WHERE spe.id = spe_id AND can_access_session_plan(spe.session_plan_id)
  )
$function$;

-- =============================================================================
-- 5. WORKOUT LOG ACCESS (depend on auth_athlete_id, coaches_group)
-- =============================================================================

-- Check if the current user owns a workout log
CREATE OR REPLACE FUNCTION public.owns_workout_log(wl_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = wl_id AND wl.athlete_id = auth_athlete_id()
  )
$function$;

-- Check if the current user can view a workout log (athlete or coach)
CREATE OR REPLACE FUNCTION public.can_view_workout_log(wl_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM workout_logs wl
    WHERE wl.id = wl_id AND (
      wl.athlete_id = auth_athlete_id() OR
      coaches_group(wl.athlete_group_id)
    )
  )
$function$;

-- =============================================================================
-- 6. BUSINESS LOGIC FUNCTIONS
-- =============================================================================

-- Get user role data by Clerk ID (used by middleware/auth)
CREATE OR REPLACE FUNCTION public.get_user_role_data(p_clerk_id text)
RETURNS TABLE(user_id integer, role text, athlete_id integer, coach_id integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.role, a.id, c.id
  FROM public.users u
  LEFT JOIN public.athletes a ON u.id = a.user_id
  LEFT JOIN public.coaches c ON u.id = c.user_id
  WHERE u.clerk_id = p_clerk_id;
END;
$function$;

-- Update user from Clerk webhook
CREATE OR REPLACE FUNCTION public.update_user_from_webhook(
  p_clerk_id text,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users
  SET email = p_email,
      first_name = p_first_name,
      last_name = p_last_name,
      avatar_url = p_avatar_url,
      updated_at = now()
  WHERE clerk_id = p_clerk_id;
END;
$function$;

-- Remove athlete from group (coach only)
CREATE OR REPLACE FUNCTION public.remove_athlete_from_group(athlete_id_param bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coach_id bigint;
  v_athlete_group_id bigint;
  v_group_coach_id bigint;
BEGIN
  v_coach_id := auth_coach_id();
  IF v_coach_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not a coach');
  END IF;

  SELECT athlete_group_id INTO v_athlete_group_id FROM athletes WHERE id = athlete_id_param;
  IF v_athlete_group_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Athlete is not in any group');
  END IF;

  SELECT coach_id INTO v_group_coach_id FROM athlete_groups WHERE id = v_athlete_group_id;
  IF v_group_coach_id != v_coach_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You do not have permission to manage this athlete');
  END IF;

  UPDATE athletes SET athlete_group_id = NULL WHERE id = athlete_id_param;

  RETURN jsonb_build_object('success', true, 'athlete_id', athlete_id_param, 'previous_group_id', v_athlete_group_id);
END;
$function$;

-- =============================================================================
-- 7. TRIGGER FUNCTIONS
-- =============================================================================

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Athlete personal bests updated_at trigger
CREATE OR REPLACE FUNCTION public.update_athlete_personal_bests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Generic set_updated_at trigger (SECURITY DEFINER variant)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Knowledge base category article count trigger
CREATE OR REPLACE FUNCTION public.update_category_article_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.knowledge_base_categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_base_categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
    UPDATE public.knowledge_base_categories SET article_count = article_count - 1 WHERE id = OLD.category_id;
    UPDATE public.knowledge_base_categories SET article_count = article_count + 1 WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Races updated_at trigger
CREATE OR REPLACE FUNCTION public.update_races_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;
