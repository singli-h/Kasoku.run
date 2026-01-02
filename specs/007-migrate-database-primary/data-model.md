# Data Model: UUID Migration

**Feature**: 007-migrate-database-primary
**Date**: 2026-01-02

## Schema Changes Overview

This migration changes primary keys and internal foreign keys from `integer` to `uuid` for 6 tables.

## Tables to Migrate

### 1. session_plans

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('session_plans_id_seq')
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**Columns affected**: `id` (PK)

---

### 2. session_plan_exercises

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('session_plan_exercises_id_seq')
session_plan_id integer REFERENCES session_plans(id)
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_plan_id uuid REFERENCES session_plans(id)
```

**Columns affected**: `id` (PK), `session_plan_id` (FK)

---

### 3. session_plan_sets

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('session_plan_sets_id_seq')
session_plan_exercise_id integer REFERENCES session_plan_exercises(id)
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_plan_exercise_id uuid REFERENCES session_plan_exercises(id)
```

**Columns affected**: `id` (PK), `session_plan_exercise_id` (FK)

---

### 4. workout_logs

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('workout_logs_id_seq')
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

**Columns affected**: `id` (PK)

---

### 5. workout_log_exercises

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('workout_log_exercises_id_seq')
workout_log_id integer REFERENCES workout_logs(id)
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
workout_log_id uuid REFERENCES workout_logs(id)
```

**Columns affected**: `id` (PK), `workout_log_id` (FK)

---

### 6. workout_log_sets

**Before**:
```sql
id integer PRIMARY KEY DEFAULT nextval('workout_log_sets_id_seq')
workout_log_exercise_id integer REFERENCES workout_log_exercises(id)
```

**After**:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
workout_log_exercise_id uuid REFERENCES workout_log_exercises(id)
```

**Columns affected**: `id` (PK), `workout_log_exercise_id` (FK)

---

## Columns NOT Changed

These foreign keys reference tables outside the migration scope and remain `integer`:

| Table | Column | References |
|-------|--------|------------|
| session_plans | user_id | users.id |
| session_plans | microcycle_id | microcycles.id |
| session_plans | athlete_group_id | athlete_groups.id |
| session_plan_exercises | exercise_id | exercises.id |
| workout_logs | athlete_id | athletes.id |
| workout_logs | session_plan_id | session_plans.id (will become uuid) |
| workout_log_exercises | exercise_id | exercises.id |
| workout_log_exercises | session_plan_exercise_id | session_plan_exercises.id (will become uuid) |

**Note**: `workout_logs.session_plan_id` and `workout_log_exercises.session_plan_exercise_id` will need to be updated to uuid since they reference migrated tables.

## TypeScript Type Changes

### Before (types/database.ts)

```typescript
interface SessionPlan {
  id: number
  // ...
}

interface SessionPlanExercise {
  id: number
  session_plan_id: number
  // ...
}
```

### After

```typescript
interface SessionPlan {
  id: string  // UUID
  // ...
}

interface SessionPlanExercise {
  id: string  // UUID
  session_plan_id: string  // UUID
  // ...
}
```

## Entity Relationship Diagram (Post-Migration)

```
session_plans (uuid PK)
    ↓
session_plan_exercises (uuid PK, uuid FK)
    ↓
session_plan_sets (uuid PK, uuid FK)

workout_logs (uuid PK)
    ↓
workout_log_exercises (uuid PK, uuid FK)
    ↓
workout_log_sets (uuid PK, uuid FK)

Cross-references (also uuid FK):
- workout_logs.session_plan_id → session_plans.id
- workout_log_exercises.session_plan_exercise_id → session_plan_exercises.id
```

## Validation Rules

1. **UUID format**: All UUIDs must match pattern `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. **Referential integrity**: All FKs must resolve to existing PKs
3. **No orphans**: Migration skips orphaned records (logged for review)
4. **Default values**: New inserts use `gen_random_uuid()` server-side
