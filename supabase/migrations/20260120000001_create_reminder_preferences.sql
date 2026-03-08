/*
<ai_context>
Creates the reminder_preferences table for storing user notification preferences.
Each user has one record with their workout reminder settings.
Default time is 09:00:00 (9 AM local time).
</ai_context>
*/

-- Create reminder_preferences table
CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  workout_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  preferred_time TIME NOT NULL DEFAULT '09:00:00',  -- Local time
  last_reminder_sent DATE,  -- Tracks last sent date to prevent duplicates
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_reminder_preferences_user_id ON public.reminder_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_preferences_enabled ON public.reminder_preferences(workout_reminders_enabled)
  WHERE workout_reminders_enabled = true;

-- RLS policies
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage own preferences
CREATE POLICY "Users can manage own preferences" ON public.reminder_preferences
  FOR ALL USING (
    user_id = auth_user_id()
  );

-- Service role can access all (for Edge Function)
CREATE POLICY "Service role full access on reminder_preferences" ON public.reminder_preferences
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON public.reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.reminder_preferences IS 'Stores user preferences for workout reminder notifications';
