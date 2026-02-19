-- Migration: Add lookup_user_for_invite RPC to tracked migrations
-- This function existed only in the Supabase dashboard; this migration ensures
-- it is reproducible across environments (supabase db reset, new deployments).

CREATE OR REPLACE FUNCTION lookup_user_for_invite(email_input TEXT)
RETURNS TABLE (user_id INTEGER, athlete_id INTEGER, current_group_id INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is a coach (prevent email enumeration by non-coaches)
  IF NOT EXISTS (
    SELECT 1 FROM coaches c
    JOIN users u ON u.id = c.user_id
    WHERE u.clerk_id = auth.uid()::text
  ) THEN
    RAISE EXCEPTION 'Only coaches can look up users for invitations';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    a.id AS athlete_id,
    a.athlete_group_id AS current_group_id
  FROM users u
  LEFT JOIN athletes a ON a.user_id = u.id
  WHERE u.email = email_input
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION lookup_user_for_invite IS
  'Secure email-based user lookup for invite flow. Only callable by coaches. Returns only user_id, athlete_id, and current_group_id — no PII exposed. SECURITY DEFINER allows cross-user lookup.';
