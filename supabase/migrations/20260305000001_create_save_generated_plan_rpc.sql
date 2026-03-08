-- Migration: Create save_generated_plan RPC
-- Replaces ~89 sequential DB round-trips with 1 atomic call.
-- Inserts mesocycle, microcycles, session_plans, exercises, sets, and workout_logs
-- in a single transaction with automatic rollback on failure.

CREATE OR REPLACE FUNCTION save_generated_plan(
  p_user_id INTEGER,
  p_athlete_id INTEGER,
  p_payload JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  mesocycle_id INTEGER,
  first_session_id UUID,
  first_workout_log_id UUID,
  message TEXT,
  warning TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mesocycle_id INTEGER;
  v_start_date DATE;
  v_end_date DATE;
  v_duration_weeks INTEGER;
  v_total_weeks INTEGER;
  v_first_session_id UUID;
  v_first_workout_log_id UUID;
  v_warning TEXT;
  -- Loop variables
  mc JSONB;
  sp JSONB;
  ex JSONB;
  v_microcycle_id INTEGER;
  v_session_plan_id UUID;
  v_exercise_id UUID;
  v_week_number INTEGER;
  v_is_deload BOOLEAN;
  v_volume INTEGER;
  v_intensity INTEGER;
  v_week_start DATE;
  v_week_end DATE;
  v_day_number INTEGER;
  v_scheduled_date DATE;
  v_day_offset INTEGER;
  v_week_offset INTEGER;
  v_ex_exercise_id INTEGER;
BEGIN
  -- ========================================
  -- Validate inputs
  -- ========================================
  IF p_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::UUID, NULL::UUID,
      'p_user_id is required'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF p_athlete_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::UUID, NULL::UUID,
      'p_athlete_id is required'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF p_payload IS NULL OR p_payload->'mesocycle' IS NULL OR p_payload->'microcycles' IS NULL THEN
    RETURN QUERY SELECT false, NULL::INTEGER, NULL::UUID, NULL::UUID,
      'p_payload must contain mesocycle and microcycles'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- ========================================
  -- Parse mesocycle data
  -- ========================================
  v_start_date := (p_payload->'mesocycle'->>'startDate')::DATE;
  v_duration_weeks := (p_payload->'mesocycle'->>'durationWeeks')::INTEGER;
  v_end_date := v_start_date + (v_duration_weeks * 7 - 1);
  v_total_weeks := jsonb_array_length(p_payload->'microcycles');

  -- ========================================
  -- Insert mesocycle
  -- ========================================
  INSERT INTO mesocycles (
    name, description, start_date, end_date, macrocycle_id, user_id, metadata
  )
  VALUES (
    p_payload->'mesocycle'->>'name',
    COALESCE(
      p_payload->'mesocycle'->>'description',
      (p_payload->'mesocycle'->>'focus') || ' focused training block'
    ),
    v_start_date,
    v_end_date,
    NULL,
    p_user_id,
    jsonb_build_object(
      'focus', p_payload->'mesocycle'->>'focus',
      'equipment', p_payload->'mesocycle'->>'equipment',
      'createdVia', 'init-pipeline'
    )
  )
  RETURNING id INTO v_mesocycle_id;

  -- ========================================
  -- Iterate microcycles
  -- ========================================
  FOR mc IN SELECT * FROM jsonb_array_elements(p_payload->'microcycles')
  LOOP
    v_week_number := (mc->>'weekNumber')::INTEGER;
    v_is_deload := COALESCE((mc->>'isDeload')::BOOLEAN, false);

    -- Calculate week start/end dates
    v_week_start := v_start_date + ((v_week_number - 1) * 7);
    v_week_end := v_week_start + 6;

    -- Progressive volume/intensity ramp (matches TS logic)
    IF v_is_deload OR v_week_number = v_total_weeks THEN
      v_volume := 3;
      v_intensity := 4;
    ELSE
      v_volume := LEAST(5 + v_week_number - 1, 8);
      v_intensity := LEAST(5 + v_week_number - 1, 8);
    END IF;

    INSERT INTO microcycles (
      mesocycle_id, name, user_id, start_date, end_date, volume, intensity
    )
    VALUES (
      v_mesocycle_id,
      mc->>'name',
      p_user_id,
      v_week_start,
      v_week_end,
      v_volume,
      v_intensity
    )
    RETURNING id INTO v_microcycle_id;

    -- ========================================
    -- Iterate session plans within this microcycle
    -- ========================================
    FOR sp IN SELECT * FROM jsonb_array_elements(mc->'sessionPlans')
    LOOP
      v_day_number := (sp->>'day')::INTEGER;

      INSERT INTO session_plans (
        microcycle_id, user_id, name, day, description
      )
      VALUES (
        v_microcycle_id,
        p_user_id,
        sp->>'name',
        v_day_number,
        sp->>'description'
      )
      RETURNING id INTO v_session_plan_id;

      -- Track first session plan (from week 1)
      IF v_first_session_id IS NULL AND v_week_number = 1 THEN
        v_first_session_id := v_session_plan_id;
      END IF;

      -- ========================================
      -- Iterate exercises within this session
      -- ========================================
      FOR ex IN SELECT * FROM jsonb_array_elements(sp->'exercises')
      LOOP
        -- Parse exercise_id (null for 'custom')
        v_ex_exercise_id := NULL;
        IF ex->>'exerciseId' IS NOT NULL AND ex->>'exerciseId' != 'custom' THEN
          v_ex_exercise_id := (ex->>'exerciseId')::INTEGER;
        END IF;

        INSERT INTO session_plan_exercises (
          session_plan_id, exercise_id, exercise_order, notes
        )
        VALUES (
          v_session_plan_id,
          v_ex_exercise_id,
          (ex->>'exerciseOrder')::INTEGER,
          ex->>'notes'
        )
        RETURNING id INTO v_exercise_id;

        -- Batch insert all sets for this exercise
        INSERT INTO session_plan_sets (
          session_plan_exercise_id, set_index, reps, weight, rpe, rest_time, tempo
        )
        SELECT
          v_exercise_id,
          (s->>'setIndex')::INTEGER,
          (s->>'reps')::INTEGER,
          (s->>'weight')::NUMERIC,
          (s->>'rpe')::INTEGER,
          (s->>'restTime')::INTEGER,
          s->>'tempo'
        FROM jsonb_array_elements(ex->'sets') s;

      END LOOP; -- exercises

      -- ========================================
      -- Create workout_log for this session
      -- ========================================
      v_week_offset := (v_week_number - 1) * 7;
      -- dayOfWeek: 0=Sun, 1=Mon, 2=Tue, etc.
      -- Monday (1) = offset 0, Sunday (0) = offset 6
      IF v_day_number = 0 THEN
        v_day_offset := 6;
      ELSE
        v_day_offset := v_day_number - 1;
      END IF;

      v_scheduled_date := v_start_date + v_week_offset + v_day_offset;

      INSERT INTO workout_logs (
        session_plan_id, athlete_id, date_time, session_status
      )
      VALUES (
        v_session_plan_id,
        p_athlete_id,
        v_scheduled_date::TIMESTAMPTZ,
        'assigned'
      );

      -- Track first workout log (by earliest date)
      IF v_first_workout_log_id IS NULL THEN
        SELECT id INTO v_first_workout_log_id
        FROM workout_logs
        WHERE session_plan_id = v_session_plan_id AND athlete_id = p_athlete_id
        LIMIT 1;
      END IF;

    END LOOP; -- session plans
  END LOOP; -- microcycles

  -- ========================================
  -- Find the actual first workout log by date
  -- ========================================
  SELECT wl.id INTO v_first_workout_log_id
  FROM workout_logs wl
  INNER JOIN session_plans sp2 ON sp2.id = wl.session_plan_id
  INNER JOIN microcycles mc2 ON mc2.id = sp2.microcycle_id
  WHERE mc2.mesocycle_id = v_mesocycle_id
    AND wl.athlete_id = p_athlete_id
  ORDER BY wl.date_time ASC
  LIMIT 1;

  -- ========================================
  -- Return success
  -- ========================================
  RETURN QUERY SELECT
    true,
    v_mesocycle_id,
    v_first_session_id,
    v_first_workout_log_id,
    'Plan saved successfully'::TEXT,
    v_warning;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    false,
    NULL::INTEGER,
    NULL::UUID,
    NULL::UUID,
    SQLERRM::TEXT,
    NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION save_generated_plan IS
  'Atomic function that saves an AI-generated training plan. Creates mesocycle, microcycles, session_plans, exercises, sets, and workout_logs in a single transaction.';

GRANT EXECUTE ON FUNCTION save_generated_plan(INTEGER, INTEGER, JSONB) TO service_role;
