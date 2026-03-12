-- Allow coaches to INSERT workout_logs for athletes in their groups
-- This was missing, causing plan assignment to fail silently via RLS
CREATE POLICY "wl_coach_insert" ON public.workout_logs
  FOR INSERT
  WITH CHECK (
    coaches_group(athlete_group_id::bigint)
  );
