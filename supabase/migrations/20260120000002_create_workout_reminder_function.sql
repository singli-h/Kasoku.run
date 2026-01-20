/*
<ai_context>
Creates the database function to get users who need workout reminders.
This function is timezone-aware and checks:
1. User has push subscriptions
2. User has workout reminders enabled
3. User has scheduled training for today (in their timezone)
4. Current time matches user's preferred reminder time (within same minute)
</ai_context>
*/

-- Function to get users who need workout reminders at their local time
-- Updated to include duplicate prevention via last_reminder_sent check
CREATE OR REPLACE FUNCTION get_users_for_workout_reminder(current_utc TIMESTAMPTZ)
RETURNS TABLE (
  user_id INTEGER,
  timezone TEXT,
  preferred_time TIME,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  session_name TEXT,
  exercise_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ps.endpoint)
    u.id AS user_id,
    u.timezone,
    rp.preferred_time,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    COALESCE(sp.name, 'Workout Session')::TEXT AS session_name,
    COALESCE(exercise_counts.cnt, 0)::BIGINT AS exercise_count
  FROM users u
  INNER JOIN reminder_preferences rp ON rp.user_id = u.id
  INNER JOIN push_subscriptions ps ON ps.user_id = u.id
  INNER JOIN athletes a ON a.user_id = u.id
  INNER JOIN workout_logs wl ON wl.athlete_id = a.id
  LEFT JOIN session_plans sp ON sp.id = wl.session_plan_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT AS cnt
    FROM session_plan_exercises spe
    WHERE spe.session_plan_id = sp.id
  ) exercise_counts ON true
  WHERE
    rp.workout_reminders_enabled = true
    AND wl.session_status = 'assigned'
    -- Session date must be today in user's timezone
    AND (wl.date_time AT TIME ZONE COALESCE(u.timezone, 'UTC'))::DATE = (current_utc AT TIME ZONE COALESCE(u.timezone, 'UTC'))::DATE
    -- Haven't sent a reminder today yet
    AND (rp.last_reminder_sent IS NULL OR rp.last_reminder_sent < (current_utc AT TIME ZONE COALESCE(u.timezone, 'UTC'))::DATE)
    -- Current time must be at or after preferred time
    AND (current_utc AT TIME ZONE COALESCE(u.timezone, 'UTC'))::TIME >= rp.preferred_time;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION get_users_for_workout_reminder(TIMESTAMPTZ) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_users_for_workout_reminder IS 'Returns users who should receive workout reminders at the current time, respecting their timezone and preferred reminder time';

-- Function to mark reminder as sent for a user (prevents duplicate notifications)
CREATE OR REPLACE FUNCTION mark_reminder_sent(p_user_id INTEGER, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reminder_preferences
  SET last_reminder_sent = p_date
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION mark_reminder_sent(INTEGER, DATE) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION mark_reminder_sent IS 'Marks a workout reminder as sent for a user on a given date to prevent duplicate notifications';
