-- Coach-configurable event groups
-- Replaces hardcoded event group abbreviations with coach-defined groups
-- Each coach can define their own event groups (name + abbreviation)
-- The abbreviation links to athletes.event_group and session_plan_exercises.target_event_groups

CREATE TABLE public.event_groups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coach_id BIGINT NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,            -- e.g. "Short Sprints"
  abbreviation VARCHAR(3) NOT NULL,  -- e.g. "SS"
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, abbreviation)
);

-- RLS
ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;

-- Coach can CRUD their own event groups
CREATE POLICY "eg_coach_own" ON public.event_groups
  FOR ALL
  USING (coach_id = auth_coach_id())
  WITH CHECK (coach_id = auth_coach_id());

-- Athletes in coach's groups can read event groups (for display)
CREATE POLICY "eg_athlete_read" ON public.event_groups
  FOR SELECT
  USING (
    coach_id IN (
      SELECT ag.coach_id FROM public.athlete_groups ag
      WHERE athlete_in_group(ag.id::bigint)
    )
  );
