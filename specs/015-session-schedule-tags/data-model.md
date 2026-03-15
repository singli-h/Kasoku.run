# Data Model: Session-Level Schedule Tags

## Schema Changes

### Table: `athletes`

| Column | Before | After | Notes |
|--------|--------|-------|-------|
| `event_group` | `TEXT` | **DROPPED** | Replaced by `event_groups` |
| `event_groups` | N/A | `TEXT[]` | New array column; migrated from scalar |

### Table: `session_plans`

| Column | Before | After | Notes |
|--------|--------|-------|-------|
| `target_event_groups` | N/A | `TEXT[]` | New column; NULL = visible to all; GIN-indexed |

### Table: `session_plan_exercises` (unchanged)

| Column | Type | Notes |
|--------|------|-------|
| `target_event_groups` | `TEXT[]` | Already exists; no migration needed |

### Table: `event_groups` (unchanged)

| Column | Type | Notes |
|--------|------|-------|
| `abbreviation` | `VARCHAR(3)` | Lookup table; no changes |

## Functions

### `auth_athlete_event_groups()` (replaces `auth_athlete_event_group()`)

```sql
CREATE OR REPLACE FUNCTION public.auth_athlete_event_groups()
RETURNS TEXT[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT event_groups FROM public.athletes WHERE user_id = auth_user_id()
$$;
```

## RLS Policies

### New: `sp_athlete_view_by_tags` on `session_plans`

```sql
CREATE POLICY "sp_athlete_view_by_tags" ON public.session_plans
  FOR SELECT USING (
    -- Coach/owner sees all (existing policy handles this)
    -- Athlete visibility based on tags:
    target_event_groups IS NULL
    OR target_event_groups = '{}'::text[]
    OR (
      auth_athlete_event_groups() IS NOT NULL
      AND auth_athlete_event_groups() != '{}'::text[]
      AND auth_athlete_event_groups() && target_event_groups
    )
  );
```

### Updated: `spe_athlete_view_assigned` on `session_plan_exercises`

```sql
-- Before:
OR auth_athlete_event_group() IS NULL
OR auth_athlete_event_group() = ANY(target_event_groups)

-- After:
OR (
  target_event_groups IS NULL
  OR target_event_groups = '{}'::text[]
  OR (
    auth_athlete_event_groups() IS NOT NULL
    AND auth_athlete_event_groups() != '{}'::text[]
    AND auth_athlete_event_groups() && target_event_groups
  )
)
```

### Updated: `sps_athlete_view_assigned` on `session_plan_sets`

Same pattern as exercises above.

## Indexes

```sql
CREATE INDEX idx_sp_target_event_groups ON session_plans USING GIN (target_event_groups);
-- Existing: idx_spe_target_event_groups on session_plan_exercises (unchanged)
```

## Data Migration

```sql
-- Step 1: Add new column
ALTER TABLE athletes ADD COLUMN event_groups TEXT[];

-- Step 2: Migrate data (scalar → single-element array)
UPDATE athletes SET event_groups = ARRAY[event_group] WHERE event_group IS NOT NULL;

-- Step 3: Add session_plans column
ALTER TABLE session_plans ADD COLUMN target_event_groups TEXT[];

-- Steps 4-8: Functions, policies, drop old column (see plan.md)
```
