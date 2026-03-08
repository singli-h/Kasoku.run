# Data Model: Coach/Athlete MVP Production Readiness

**Phase 1 output** | **Date**: 2026-02-17

## Schema Changes Required

### 1. Migration: Update `complete_onboarding` RPC

**File**: New migration `20260218000000_add_group_id_to_onboarding_rpc.sql`

Add `p_group_id INTEGER DEFAULT NULL` parameter to `complete_onboarding` function.

When `p_group_id` is provided AND `p_role = 'athlete'`:
- After athlete record INSERT, set `athlete_group_id = p_group_id`
- Create `athlete_group_histories` record for audit trail

```sql
-- In the athlete branch of the RPC:
IF p_role = 'athlete' THEN
  INSERT INTO public.athletes (user_id, athlete_group_id, ...)
  VALUES (v_user_id, p_group_id, ...)
  ON CONFLICT (user_id) DO UPDATE SET
    athlete_group_id = COALESCE(p_group_id, athletes.athlete_group_id);

  -- Audit trail if group was set
  IF p_group_id IS NOT NULL THEN
    INSERT INTO public.athlete_group_histories (athlete_id, group_id, created_by, notes)
    VALUES (v_athlete_id, p_group_id, v_user_id, 'Joined via invitation link');
  END IF;
END IF;
```

### 2. Migration: Add `lookup_user_for_invite` RPC to tracked migrations

**File**: New migration `20260218000001_add_lookup_user_for_invite_rpc.sql`

This RPC exists in Supabase dashboard but not in any migration. Extract and add it for deployment reproducibility.

### 3. No Schema Changes Needed For

| Requirement | Why No Change Needed |
|-------------|---------------------|
| FR-010c (preserve workout_logs on plan delete) | `workout_logs.session_plan_id` already has `ON DELETE SET NULL` |
| FR-043c (date filter on assigned workouts) | Query-level change only, no schema |
| FR-042 (kg globally) | No unit column in DB — display-only change |
| Dead code removal | File deletions only |

## Existing Schema (Relevant Subset)

### Core Tables

```
users
  id: int (PK)
  clerk_id: text (unique)
  role: text ('coach' | 'athlete' | 'individual')
  onboarding_completed: boolean
  first_name, last_name, email, username: text

coaches
  id: int (PK)
  user_id: int FK → users(id) ON DELETE CASCADE
  UNIQUE(user_id)

athletes
  id: int (PK)
  user_id: int FK → users(id) ON DELETE CASCADE
  athlete_group_id: int FK → athlete_groups(id) ON DELETE SET NULL
  training_goals: text
  UNIQUE(user_id)

athlete_groups
  id: int (PK)
  coach_id: int FK → coaches(id)
  group_name: text

athlete_group_histories
  id: int (PK)
  athlete_id: int FK → athletes(id)
  group_id: int FK → athlete_groups(id)
  created_by: int FK → users(id)
  notes: text
```

### Plan Hierarchy

```
macrocycles
  id: int (PK)
  user_id: int FK → users(id) ON DELETE CASCADE
  athlete_group_id: int FK → athlete_groups(id) ON DELETE SET NULL
  name, description, start_date, end_date: ...

mesocycles
  id: int (PK)
  macrocycle_id: int FK → macrocycles(id) ON DELETE CASCADE
  user_id: int FK → users(id)

microcycles
  id: int (PK)
  mesocycle_id: int FK → mesocycles(id) ON DELETE CASCADE
  user_id: int FK → users(id)

session_plans
  id: uuid (PK)
  microcycle_id: int FK → microcycles(id) ON DELETE CASCADE
  user_id: int FK → users(id)
  name, description, day, week, session_mode, is_template: ...

races
  id: int (PK)
  macrocycle_id: int FK → macrocycles(id) ON DELETE SET NULL
  user_id: int FK → users(id) ON DELETE CASCADE
  name, date, location, distance: ...
```

### Workout Tracking

```
workout_logs
  id: uuid (PK)
  athlete_id: int FK → athletes(id) ON DELETE CASCADE
  session_plan_id: uuid FK → session_plans(id) ON DELETE SET NULL
  session_status: enum ('assigned' | 'ongoing' | 'completed' | 'cancelled')
  date_time, notes, started_at, completed_at: ...

workout_log_exercises
  id: uuid (PK)
  workout_log_id: uuid FK → workout_logs(id) ON DELETE CASCADE

workout_log_sets
  id: uuid (PK)
  workout_log_exercise_id: uuid FK → workout_log_exercises(id) ON DELETE CASCADE
```

## Key FK Cascade Behaviors

| Parent Delete | Child Table | Behavior |
|--------------|-------------|----------|
| `macrocycle` deleted | `mesocycles` | CASCADE (delete) |
| `mesocycle` deleted | `microcycles` | CASCADE (delete) |
| `microcycle` deleted | `session_plans` | CASCADE (delete) |
| `session_plan` deleted | `workout_logs.session_plan_id` | **SET NULL** (log preserved) |
| `athlete` deleted | `workout_logs` | CASCADE (delete) |
| `athlete_group` deleted | `athletes.athlete_group_id` | SET NULL |
| `macrocycle` deleted | `races.macrocycle_id` | SET NULL |

This means deleting a macrocycle cascades through mesocycles → microcycles → session_plans, and workout_logs survive with `session_plan_id = NULL`.
