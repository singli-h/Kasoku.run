-- Migration: Create atomic onboarding RPC function
-- This ensures all onboarding operations succeed or fail together

CREATE OR REPLACE FUNCTION complete_onboarding(
  p_clerk_id TEXT,
  p_username TEXT,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_birthdate DATE DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC',
  p_subscription TEXT DEFAULT 'free',
  -- Athlete/Individual fields
  p_height NUMERIC DEFAULT NULL,
  p_weight NUMERIC DEFAULT NULL,
  p_training_goals TEXT DEFAULT '',
  p_experience TEXT DEFAULT '',
  p_events JSONB DEFAULT '[]'::jsonb,
  p_available_equipment JSONB DEFAULT '[]'::jsonb,
  -- Coach fields
  p_speciality TEXT DEFAULT '',
  p_philosophy TEXT DEFAULT '',
  p_sport_focus TEXT DEFAULT ''
)
RETURNS TABLE (success BOOLEAN, user_id INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id INTEGER;
  v_role role;
BEGIN
  -- Validate role
  IF p_role NOT IN ('athlete', 'coach', 'individual') THEN
    RETURN QUERY SELECT false, NULL::INTEGER, 'Invalid role: must be athlete, coach, or individual'::TEXT;
    RETURN;
  END IF;

  -- Cast role to enum
  v_role := p_role::role;

  -- Upsert user record
  INSERT INTO users (
    clerk_id,
    username,
    email,
    first_name,
    last_name,
    birthdate,
    subscription_status,
    timezone,
    onboarding_completed,
    role,
    metadata
  )
  VALUES (
    p_clerk_id,
    p_username,
    p_email,
    p_first_name,
    p_last_name,
    p_birthdate,
    p_subscription,
    p_timezone,
    true,
    v_role,
    jsonb_build_object('role', p_role)
  )
  ON CONFLICT (clerk_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    birthdate = EXCLUDED.birthdate,
    subscription_status = EXCLUDED.subscription_status,
    timezone = EXCLUDED.timezone,
    onboarding_completed = true,
    role = EXCLUDED.role,
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_user_id;

  -- Create role-specific profile
  IF p_role = 'athlete' THEN
    -- Create athlete profile
    INSERT INTO athletes (
      user_id,
      height,
      weight,
      training_goals,
      experience,
      events
    )
    VALUES (
      v_user_id,
      p_height,
      p_weight,
      p_training_goals,
      p_experience,
      p_events
    )
    ON CONFLICT (user_id) DO UPDATE SET
      height = EXCLUDED.height,
      weight = EXCLUDED.weight,
      training_goals = EXCLUDED.training_goals,
      experience = EXCLUDED.experience,
      events = EXCLUDED.events,
      updated_at = now();

  ELSIF p_role = 'coach' THEN
    -- Create coach profile
    INSERT INTO coaches (
      user_id,
      speciality,
      experience,
      philosophy,
      sport_focus
    )
    VALUES (
      v_user_id,
      p_speciality,
      p_experience,
      p_philosophy,
      p_sport_focus
    )
    ON CONFLICT (user_id) DO UPDATE SET
      speciality = EXCLUDED.speciality,
      experience = EXCLUDED.experience,
      philosophy = EXCLUDED.philosophy,
      sport_focus = EXCLUDED.sport_focus,
      updated_at = now();

    -- Also create a minimal athlete record for coaches (self-training)
    INSERT INTO athletes (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF p_role = 'individual' THEN
    -- Create athlete profile for individual users with equipment
    INSERT INTO athletes (
      user_id,
      training_goals,
      experience,
      available_equipment,
      height,
      weight
    )
    VALUES (
      v_user_id,
      p_training_goals,
      p_experience,
      p_available_equipment,
      p_height,
      p_weight
    )
    ON CONFLICT (user_id) DO UPDATE SET
      training_goals = EXCLUDED.training_goals,
      experience = EXCLUDED.experience,
      available_equipment = EXCLUDED.available_equipment,
      height = EXCLUDED.height,
      weight = EXCLUDED.weight,
      updated_at = now();
  END IF;

  RETURN QUERY SELECT true, v_user_id, 'Onboarding completed successfully'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, NULL::INTEGER, SQLERRM::TEXT;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION complete_onboarding IS
  'Atomic onboarding function that creates/updates user and role-specific profile in a single transaction. Used by the onboarding flow to ensure data consistency.';
