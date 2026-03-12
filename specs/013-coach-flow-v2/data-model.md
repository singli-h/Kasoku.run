# Data Model: Coach Flow V2

**Branch**: `013-coach-flow-v2` | **Date**: 2026-03-11

---

## Schema Changes

### New Column: `session_plan_exercises.target_event_groups`

```sql
ALTER TABLE public.session_plan_exercises
  ADD COLUMN target_event_groups TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.session_plan_exercises.target_event_groups IS
  'Array of event group codes (SS, MS, LS, etc.). NULL = visible to all athletes.';
```

- **Type**: `TEXT[]` (Postgres text array)
- **Default**: `NULL` (all athletes see this exercise)
- **Values**: Any of `SS`, `MS`, `LS`, `HRD`, `JMP`, `THR`, `DST`, `MUL` (matching `athletes.event_group`)
- **Constraint**: No CHECK constraint — values are validated at application level against the group's actual event_groups
- **Index**: `GIN` index for `ANY()` queries in RLS

```sql
CREATE INDEX idx_spe_target_event_groups ON public.session_plan_exercises
  USING GIN (target_event_groups);
```

### New RLS Helper Function

```sql
CREATE OR REPLACE FUNCTION public.auth_athlete_event_group()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_group FROM public.athletes WHERE user_id = auth_user_id()
$$;
```

### Updated RLS Policy: `spe_athlete_view_assigned`

Replace the existing policy on `session_plan_exercises`:

```sql
DROP POLICY IF EXISTS "spe_athlete_view_assigned" ON public.session_plan_exercises;

CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT
  USING (
    -- Existing: athlete must be in the group that owns the microcycle
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
    -- New: subgroup filtering
    AND (
      target_event_groups IS NULL                      -- NULL = all athletes
      OR auth_athlete_event_group() IS NULL            -- No event_group = see everything (safe default)
      OR auth_athlete_event_group() = ANY(target_event_groups)  -- Match specific groups
    )
  );
```

### Updated RLS Policy: `sps_athlete_view_assigned`

The `session_plan_sets` policy must also respect subgroup filtering via the parent exercise:

```sql
DROP POLICY IF EXISTS "sps_athlete_view_assigned" ON public.session_plan_sets;

CREATE POLICY "sps_athlete_view_assigned" ON public.session_plan_sets
  FOR SELECT
  USING (
    session_plan_exercise_id IN (
      SELECT spe.id FROM public.session_plan_exercises spe
      WHERE spe.session_plan_id IN (
        SELECT sp.id FROM public.session_plans sp
        WHERE sp.microcycle_id IN (
          SELECT id FROM public.microcycles
          WHERE athlete_group_id IS NOT NULL
            AND athlete_in_group(athlete_group_id::bigint)
        )
      )
      AND (
        spe.target_event_groups IS NULL
        OR auth_athlete_event_group() IS NULL
        OR auth_athlete_event_group() = ANY(spe.target_event_groups)
      )
    )
  );
```

---

## Existing Tables Referenced (No Changes)

### `athletes`
| Column | Type | Relevance |
|---|---|---|
| `event_group` | `TEXT NULL` | Athlete's sprint event group (SS, MS, LS, etc.). Drives subgroup filtering. |
| `athlete_group_id` | `INTEGER NULL` | FK to athlete_groups. Drives group membership. |

### `session_plan_exercises` (Current)
| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `session_plan_id` | `UUID NULL` | FK → session_plans |
| `exercise_id` | `INTEGER NULL` | FK → exercises |
| `exercise_order` | `INTEGER NULL` | Display order |
| `superset_id` | `INTEGER NULL` | Superset grouping |
| `notes` | `TEXT NULL` | Exercise notes |
| `target_event_groups` | `TEXT[] NULL` | **NEW** — subgroup targeting |

### `session_plans`
| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `is_template` | `BOOLEAN NULL` | `true` for templates |
| `microcycle_id` | `INTEGER NULL` | FK → microcycles |
| `user_id` | `INTEGER NULL` | Owner |
| `deleted` | `BOOLEAN NULL` | Soft delete |

### `workout_log_exercises`
| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `workout_log_id` | `UUID NULL` | FK → workout_logs |
| `session_plan_exercise_id` | `UUID NULL` | Links back to planned exercise |
| `exercise_id` | `INTEGER NULL` | FK → exercises |

**Critical**: When a workout starts, exercises are copied from `session_plan_exercises` → `workout_log_exercises`. This copy step must filter by `target_event_groups` matching the athlete's `event_group`.

---

## New TypeScript Types

### `SessionMetrics` (utility type)
```ts
interface SessionMetrics {
  volume: number        // Computed volume in appropriate unit
  volumeUnit: string    // 'kg' | 'm' | 's' | 'reps'
  duration: number      // Estimated duration in seconds
  exerciseCount: number // Number of exercises
}
```

### `SessionPlanExerciseWithDetails` (updated)
```ts
// Existing interface extended with new field
interface SessionPlanExerciseWithDetails extends SessionPlanExercise {
  exercise?: ExerciseWithDetails | null
  session_plan?: SessionPlan | null
  session_plan_sets?: SessionPlanSet[]
  // target_event_groups comes from SessionPlanExercise base type (auto from DB types)
}
```

### `WeekCalendarSession` (new)
```ts
interface WeekCalendarSession {
  id: string
  title: string
  date: string                    // ISO date string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  exercises: WeekCalendarExercise[]
}

interface WeekCalendarExercise {
  name: string
  summary: string                 // Formatted: "3×10 80kg"
  target_event_groups: string[] | null
}
```

---

## Event Group Abbreviation Map

For display in 3-char chips:

| Code | Display | Full Name |
|---|---|---|
| `SS` | `SS` | Short Sprints |
| `MS` | `MS` | Mid Sprints |
| `LS` | `LS` | Long Sprints |
| `Hurdles` | `HRD` | Hurdles |
| `Jumps` | `JMP` | Jumps |
| `Throws` | `THR` | Throws |
| `Distance` | `DST` | Distance |
| `Multi-events` | `MUL` | Multi-events |

Map stored as a constant in the shared training-utils module.
