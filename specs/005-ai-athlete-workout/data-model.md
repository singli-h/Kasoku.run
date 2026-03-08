# Data Model: AI Athlete Workout Assistant

**Feature**: 005-ai-athlete-workout
**Date**: 2026-01-01

## Overview

This feature uses **existing database tables** - no new tables or migrations required. This document maps the feature entities to existing database structures.

## Existing Tables (Workout Domain)

### workout_logs

Primary table for athlete workout sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `athlete_id` | integer | FK to athletes |
| `session_plan_id` | integer | FK to session_plans (source template) |
| `date_time` | timestamp | When workout occurs |
| `session_status` | enum | 'assigned', 'ongoing', 'completed' |
| `notes` | text | Athlete session notes |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

**RLS**: Athletes can only access their own workout_logs.

---

### workout_log_exercises

Exercises within a workout session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `workout_log_id` | integer | FK to workout_logs |
| `exercise_id` | integer | FK to exercises library |
| `session_plan_exercise_id` | integer | FK to source template exercise |
| `exercise_order` | integer | Order in session |
| `superset_id` | uuid | Superset grouping |
| `notes` | text | Exercise-specific notes |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

**RLS**: Through parent workout_log ownership.

---

### workout_log_sets

Individual sets with prescribed and actual data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `workout_log_id` | integer | FK to workout_logs |
| `workout_log_exercise_id` | integer | FK to workout_log_exercises |
| `session_plan_exercise_id` | integer | FK to source template exercise |
| `set_index` | integer | Set number (1-based) |
| `reps` | integer | Actual reps performed (null = not logged) |
| `weight` | numeric | Actual weight used |
| `distance` | numeric | Distance (cardio) |
| `performing_time` | integer | Duration in seconds |
| `rest_time` | integer | Rest between sets |
| `rpe` | integer | Rate of Perceived Exertion (1-10) |
| `tempo` | text | Tempo string |
| `power` | numeric | Power output |
| `velocity` | numeric | Velocity |
| `height` | numeric | Jump height |
| `resistance` | numeric | Resistance level |
| `completed` | boolean | Whether set was completed |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

**RLS**: Through parent workout_log ownership.

---

## Entity Relationships

```
workout_logs (1) ──────< (N) workout_log_exercises
       │                          │
       │                          │
       └───────────────< (N) workout_log_sets
                                  │
                                  v
                         (reads prescribed from)
                                  │
                         session_plan_sets
```

## Tool → Entity Mapping

### Proposal Tools

| Tool | Entity | Operation | Table |
|------|--------|-----------|-------|
| `createTrainingSetChangeRequest` | TrainingSet | CREATE | workout_log_sets |
| `updateTrainingSetChangeRequest` | TrainingSet | UPDATE | workout_log_sets |
| `createTrainingExerciseChangeRequest` | TrainingExercise | CREATE | workout_log_exercises |
| `updateTrainingExerciseChangeRequest` | TrainingExercise | UPDATE | workout_log_exercises |
| `updateTrainingSessionChangeRequest` | TrainingSession | UPDATE | workout_logs |

### Field Mappings (camelCase → snake_case)

```typescript
// Tool input → Database column
{
  workoutLogId: 'workout_log_id',
  workoutLogExerciseId: 'workout_log_exercise_id',
  workoutLogSetId: 'id',  // For sets
  setIndex: 'set_index',
  reps: 'reps',
  weight: 'weight',
  distance: 'distance',
  performingTime: 'performing_time',
  restTime: 'rest_time',
  rpe: 'rpe',
  tempo: 'tempo',
  power: 'power',
  velocity: 'velocity',
  height: 'height',
  resistance: 'resistance',
  completed: 'completed',
  notes: 'notes',
  sessionStatus: 'session_status',
  exerciseId: 'exercise_id',
  exerciseOrder: 'exercise_order',
  supersetId: 'superset_id'
}
```

## ChangeRequest Entity Types

```typescript
// Defined in lib/changeset/types.ts (already exists)
export type WorkoutEntityType =
  | 'workout_log'
  | 'workout_log_exercise'
  | 'workout_log_set'
```

## State Transitions

### Workout Log Status

```
assigned → ongoing → completed
    ↑          │
    └──────────┘ (reopen if needed)
```

### Set Completion

```
null (not logged) → logged (reps > 0) → completed (completed=true)
                  → skipped (reps=0, completed=false)
```

## Validation Rules

### Set Data

| Field | Rule | Error Message |
|-------|------|---------------|
| `reps` | >= 0 | "Reps cannot be negative" |
| `weight` | >= 0 | "Weight cannot be negative" |
| `rpe` | 1-10 | "RPE must be between 1 and 10" |
| `set_index` | >= 1 | "Set index must be positive" |

### Session Status

| Transition | Allowed | Notes |
|------------|---------|-------|
| assigned → ongoing | Yes | First set logged |
| ongoing → completed | Yes | All sets logged |
| completed → ongoing | Yes | Reopen for edits |
| assigned → completed | No | Must go through ongoing |

## Indexes (Existing)

```sql
-- Primary keys
workout_logs_pkey ON workout_logs (id)
workout_log_exercises_pkey ON workout_log_exercises (id)
workout_log_sets_pkey ON workout_log_sets (id)

-- Foreign keys
workout_logs_athlete_id_fkey ON workout_logs (athlete_id)
workout_log_exercises_workout_log_id_fkey ON workout_log_exercises (workout_log_id)
workout_log_sets_workout_log_exercise_id_fkey ON workout_log_sets (workout_log_exercise_id)
```

## Query Patterns

### Get Workout Context

```sql
SELECT
  wl.id,
  wl.session_status,
  wl.date_time,
  wl.notes,
  sp.name as session_name,
  wle.id as exercise_id,
  wle.exercise_order,
  e.name as exercise_name,
  wls.set_index,
  wls.reps,
  wls.weight,
  wls.rpe,
  wls.completed,
  sps.reps as prescribed_reps,
  sps.weight as prescribed_weight,
  sps.rpe as prescribed_rpe
FROM workout_logs wl
JOIN session_plans sp ON wl.session_plan_id = sp.id
JOIN workout_log_exercises wle ON wle.workout_log_id = wl.id
JOIN exercises e ON wle.exercise_id = e.id
LEFT JOIN workout_log_sets wls ON wls.workout_log_exercise_id = wle.id
LEFT JOIN session_plan_sets sps ON sps.session_plan_exercise_id = wle.session_plan_exercise_id
  AND sps.set_index = wls.set_index
WHERE wl.id = $1
ORDER BY wle.exercise_order, wls.set_index
```

### Update Set Performance

```sql
UPDATE workout_log_sets
SET
  reps = $2,
  weight = $3,
  rpe = $4,
  completed = $5,
  updated_at = NOW()
WHERE id = $1
```

## No New Tables Required

This feature operates entirely on existing tables:
- `workout_logs` (session-level)
- `workout_log_exercises` (exercise-level)
- `workout_log_sets` (set-level)

All schema requirements are already met by the current database structure.
