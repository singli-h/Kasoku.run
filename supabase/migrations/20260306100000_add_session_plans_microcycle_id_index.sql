-- Index on session_plans.microcycle_id for RLS policy performance
-- (sp_athlete_view_assigned walks microcycles → session_plans)
CREATE INDEX IF NOT EXISTS idx_session_plans_microcycle_id
  ON public.session_plans (microcycle_id);
