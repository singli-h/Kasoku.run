/*
<ai_context>
Creates the push_subscriptions table for storing Web Push API subscription data.
Each user can have multiple subscriptions (one per device/browser).
Subscriptions are cleaned up when they become invalid (410/404 responses).
</ai_context>
*/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,        -- Public key for encryption
  auth TEXT NOT NULL,          -- Auth secret for encryption
  user_agent TEXT,             -- Browser/device info for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, endpoint)    -- One subscription per endpoint per user
);

-- Index for efficient lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- RLS policies
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions
  FOR SELECT USING (
    user_id = auth_user_id()
  );

-- Users can insert own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth_user_id()
  );

-- Users can delete own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
  FOR DELETE USING (
    user_id = auth_user_id()
  );

-- Service role can access all (for Edge Function)
CREATE POLICY "Service role full access" ON public.push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.push_subscriptions IS 'Stores Web Push API subscription data for PWA notifications';
