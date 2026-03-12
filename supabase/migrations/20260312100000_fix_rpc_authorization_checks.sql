-- Fix RPC authorization checks for security hardening
-- Applied to dev: pcteaouusthwbgzczoae

-- Fix 1: lookup_user_for_invite - was using auth.uid()::text which fails for Clerk IDs
DROP FUNCTION IF EXISTS lookup_user_for_invite(text);

CREATE FUNCTION lookup_user_for_invite(p_email TEXT)
RETURNS TABLE(user_id INTEGER, email TEXT, first_name TEXT, last_name TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM coaches c
    JOIN users u ON u.id = c.user_id
    WHERE u.clerk_id = clerk_user_id()
  ) THEN
    RAISE EXCEPTION 'Only coaches can look up users for invitations';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email, u.first_name, u.last_name, u.role
  FROM users u
  WHERE u.email = p_email
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION lookup_user_for_invite TO authenticated;
REVOKE EXECUTE ON FUNCTION lookup_user_for_invite FROM anon;

-- Fix 2: save_generated_plan - add caller authorization
CREATE OR REPLACE FUNCTION save_generated_plan(
  p_user_id INTEGER,
  p_athlete_id INTEGER,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_macrocycle_id INTEGER;
  v_mesocycle_id INTEGER;
  v_microcycle_id INTEGER;
  v_session_plan_id INTEGER;
  v_exercise_id INTEGER;
  v_spe_id INTEGER;
  v_meso JSONB;
  v_micro JSONB;
  v_session JSONB;
  v_exercise JSONB;
  v_set JSONB;
  v_meso_index INTEGER := 0;
  v_micro_index INTEGER := 0;
  v_session_index INTEGER := 0;
  v_exercise_index INTEGER := 0;
  v_set_index INTEGER := 0;
  v_result JSONB;
  v_caller_user_id INTEGER;
BEGIN
  -- SECURITY: Verify the caller is the user they claim to be
  SELECT u.id INTO v_caller_user_id
  FROM users u
  WHERE u.clerk_id = clerk_user_id();

  IF v_caller_user_id IS NULL OR v_caller_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller does not match p_user_id';
  END IF;

  INSERT INTO macrocycles (
    user_id, name, description, start_date, end_date, goal, sport, status
  ) VALUES (
    p_user_id,
    COALESCE(p_payload->>'name', 'Training Plan'),
    COALESCE(p_payload->>'description', ''),
    COALESCE((p_payload->>'startDate')::DATE, CURRENT_DATE),
    COALESCE((p_payload->>'endDate')::DATE, CURRENT_DATE + INTERVAL '12 weeks'),
    COALESCE(p_payload->>'goal', ''),
    COALESCE(p_payload->>'sport', 'sprints'),
    'active'
  ) RETURNING id INTO v_macrocycle_id;

  FOR v_meso IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'mesocycles', '[]'::jsonb))
  LOOP
    v_meso_index := v_meso_index + 1;

    INSERT INTO mesocycles (
      macrocycle_id, user_id, name, description, phase, mesocycle_order,
      start_date, end_date, status
    ) VALUES (
      v_macrocycle_id, p_user_id,
      COALESCE(v_meso->>'name', 'Block ' || v_meso_index),
      COALESCE(v_meso->>'description', ''),
      COALESCE(v_meso->>'phase', 'general_preparation'),
      v_meso_index,
      COALESCE((v_meso->>'startDate')::DATE, CURRENT_DATE),
      COALESCE((v_meso->>'endDate')::DATE, CURRENT_DATE + INTERVAL '4 weeks'),
      CASE WHEN v_meso_index = 1 THEN 'active' ELSE 'planned' END
    ) RETURNING id INTO v_mesocycle_id;

    v_micro_index := 0;
    FOR v_micro IN SELECT * FROM jsonb_array_elements(COALESCE(v_meso->'microcycles', '[]'::jsonb))
    LOOP
      v_micro_index := v_micro_index + 1;

      INSERT INTO microcycles (
        mesocycle_id, user_id, name, microcycle_order, start_date, end_date, status
      ) VALUES (
        v_mesocycle_id, p_user_id,
        COALESCE(v_micro->>'name', 'Week ' || v_micro_index),
        v_micro_index,
        COALESCE((v_micro->>'startDate')::DATE, CURRENT_DATE),
        COALESCE((v_micro->>'endDate')::DATE, CURRENT_DATE + INTERVAL '1 week'),
        CASE WHEN v_meso_index = 1 AND v_micro_index = 1 THEN 'active' ELSE 'planned' END
      ) RETURNING id INTO v_microcycle_id;

      v_session_index := 0;
      FOR v_session IN SELECT * FROM jsonb_array_elements(COALESCE(v_micro->'sessions', '[]'::jsonb))
      LOOP
        v_session_index := v_session_index + 1;

        INSERT INTO session_plans (
          microcycle_id, user_id, name, session_order,
          day_of_week, session_type, notes, focus
        ) VALUES (
          v_microcycle_id, p_user_id,
          COALESCE(v_session->>'name', 'Session ' || v_session_index),
          v_session_index,
          COALESCE((v_session->>'dayOfWeek')::INTEGER, v_session_index),
          COALESCE(v_session->>'sessionType', 'training'),
          COALESCE(v_session->>'notes', ''),
          COALESCE(v_session->>'focus', '')
        ) RETURNING id INTO v_session_plan_id;

        v_exercise_index := 0;
        FOR v_exercise IN SELECT * FROM jsonb_array_elements(COALESCE(v_session->'exercises', '[]'::jsonb))
        LOOP
          v_exercise_index := v_exercise_index + 1;

          SELECT e.id INTO v_exercise_id
          FROM exercises e
          WHERE LOWER(e.name) = LOWER(COALESCE(v_exercise->>'name', ''))
          LIMIT 1;

          IF v_exercise_id IS NOT NULL THEN
            INSERT INTO session_plan_exercises (
              session_plan_id, exercise_id, exercise_order, notes
            ) VALUES (
              v_session_plan_id, v_exercise_id, v_exercise_index,
              COALESCE(v_exercise->>'notes', '')
            ) RETURNING id INTO v_spe_id;

            v_set_index := 0;
            FOR v_set IN SELECT * FROM jsonb_array_elements(COALESCE(v_exercise->'sets', '[]'::jsonb))
            LOOP
              v_set_index := v_set_index + 1;

              INSERT INTO session_plan_sets (
                session_plan_exercise_id, set_order,
                reps, weight, distance, duration, rest_period,
                rpe, percentage, notes
              ) VALUES (
                v_spe_id, v_set_index,
                (v_set->>'reps')::INTEGER,
                (v_set->>'weight')::NUMERIC,
                (v_set->>'distance')::NUMERIC,
                (v_set->>'duration')::NUMERIC,
                (v_set->>'restPeriod')::INTEGER,
                (v_set->>'rpe')::NUMERIC,
                (v_set->>'percentage')::NUMERIC,
                COALESCE(v_set->>'notes', '')
              );
            END LOOP;
          END IF;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  v_result := jsonb_build_object('macrocycleId', v_macrocycle_id, 'success', true);
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION save_generated_plan TO service_role;
REVOKE EXECUTE ON FUNCTION save_generated_plan FROM public, anon, authenticated;

-- Fix 3: complete_onboarding - restrict to service_role only
-- The server action already validates clerkUser.id server-side via Clerk.
-- Revoking public/authenticated access prevents direct RPC exploitation.
REVOKE EXECUTE ON FUNCTION complete_onboarding FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding TO service_role;
