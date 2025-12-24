# Data Model: Database Schema Optimization

**Date**: 2025-12-24
**Feature**: 003-database-schema-optimization

## Entity Overview

This document defines the renamed entities and their relationships after the schema optimization.

---

## Domain 1: Coach Planning

Tables in this domain represent **prescriptions** - what the coach wants athletes to do.

### Entity: SessionPlan (was ExercisePresetGroup)

**Table**: `session_plans` (renamed from `exercise_preset_groups`)
**Purpose**: Training session templates created by coaches

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Primary key |
| `user_id` | integer | FK → users | Creator (coach) |
| `athlete_group_id` | integer | FK → athlete_groups | Target group |
| `microcycle_id` | integer | FK → microcycles | Parent microcycle |
| `name` | text | NOT NULL | Session name |
| `description` | text | | Session description |
| `session_type` | text | | Type of session |
| `day` | integer | | Day number in microcycle |
| `date` | date | | Scheduled date |
| `is_template` | boolean | DEFAULT false | Template flag |
| `deleted` | boolean | DEFAULT false | Soft delete |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update |

**Relationships**:
- `user_id` → `users(id)` ON DELETE CASCADE
- `athlete_group_id` → `athlete_groups(id)` ON DELETE SET NULL
- `microcycle_id` → `microcycles(id)` ON DELETE SET NULL
- One-to-many with `session_plan_exercises`

---

### Entity: SessionPlanExercise (was ExercisePreset)

**Table**: `session_plan_exercises` (renamed from `exercise_presets`)
**Purpose**: Individual exercises within a session plan

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Primary key |
| `session_plan_id` | integer | FK → session_plans | Parent session (RENAMED) |
| `exercise_id` | integer | FK → exercises | Exercise definition |
| `preset_order` | integer | | Order in session |
| `superset_id` | bigint | | Superset grouping |
| `notes` | text | | Exercise-specific notes |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp (NEW) |
| `updated_at` | timestamptz | DEFAULT now() | Last update (NEW) |

**Relationships**:
- `session_plan_id` → `session_plans(id)` ON DELETE CASCADE
- `exercise_id` → `exercises(id)` ON DELETE SET NULL
- One-to-many with `session_plan_sets`

---

### Entity: SessionPlanSet (was ExercisePresetDetail)

**Table**: `session_plan_sets` (renamed from `exercise_preset_details`)
**Purpose**: Prescribed set parameters for planned exercises

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Primary key |
| `session_plan_exercise_id` | integer | FK → session_plan_exercises | Parent exercise (RENAMED) |
| `resistance_unit_id` | integer | FK → units | Unit for resistance |
| `set_index` | integer | | Set number (1, 2, 3...) |
| `reps` | integer | | Prescribed repetitions |
| `weight` | real | | Prescribed weight (kg) |
| `distance` | real | | Prescribed distance (m) |
| `performing_time` | real | | Prescribed time (seconds) |
| `rest_time` | integer | | Rest between sets (seconds) |
| `rpe` | integer | | Target RPE (1-10) |
| `velocity` | real | | Target velocity (m/s) - VBT |
| `power` | real | | Target power (watts) - VBT |
| `height` | real | | Target height (cm) - Plyometrics |
| `effort` | real | | Target effort metric |
| `tempo` | text | | Prescribed tempo (e.g., "3-1-2-0") |
| `resistance` | real | | Accommodating resistance (kg) |
| `metadata` | jsonb | | Additional parameters |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update (NEW) |

**Relationships**:
- `session_plan_exercise_id` → `session_plan_exercises(id)` ON DELETE CASCADE
- `resistance_unit_id` → `units(id)` ON DELETE SET NULL

---

## Domain 2: Athlete Recording

Tables in this domain represent **actual performance** - what athletes actually did.

### Entity: WorkoutLog (was ExerciseTrainingSession)

**Table**: `workout_logs` (renamed from `exercise_training_sessions`)
**Purpose**: Actual workout sessions performed by athletes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Primary key |
| `athlete_id` | integer | FK → athletes | Athlete who performed |
| `athlete_group_id` | integer | FK → athlete_groups | Group context |
| `session_plan_id` | integer | FK → session_plans | Original plan (RENAMED) |
| `date_time` | timestamptz | | When performed |
| `session_mode` | text | | Session type/mode |
| `session_status` | session_status | NOT NULL | Status enum |
| `notes` | text | | Session notes |
| `description` | text | | Session description |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update |

**Session Status Values**: 'assigned', 'ongoing', 'completed', 'cancelled'

**Relationships**:
- `athlete_id` → `athletes(id)` ON DELETE CASCADE
- `athlete_group_id` → `athlete_groups(id)` ON DELETE SET NULL
- `session_plan_id` → `session_plans(id)` ON DELETE SET NULL
- One-to-many with `workout_log_sets`

---

### Entity: WorkoutLogSet (was ExerciseTrainingDetail)

**Table**: `workout_log_sets` (renamed from `exercise_training_details`)
**Purpose**: Actual set performance data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | integer | PK, AUTO | Primary key |
| `workout_log_id` | integer | FK → workout_logs | Parent workout (RENAMED) |
| `exercise_preset_id` | integer | FK → session_plan_exercises | Original prescription |
| `resistance_unit_id` | integer | FK → units | Unit for resistance |
| `set_index` | integer | | Set number performed |
| `completed` | boolean | | Was set completed? |
| `reps` | integer | | Actual repetitions |
| `weight` | real | | Actual weight (kg) |
| `distance` | real | | Actual distance (m) |
| `performing_time` | real | | Actual time (seconds) |
| `rest_time` | integer | | Actual rest (seconds) |
| `rpe` | integer | | Actual RPE (1-10) |
| `velocity` | real | | Actual velocity (m/s) - VBT |
| `power` | real | | Actual power (watts) - VBT |
| `height` | real | | Actual height (cm) - Plyometrics |
| `effort` | real | | Actual effort metric |
| `tempo` | text | | Actual tempo performed |
| `resistance` | real | | Actual accommodating resistance (kg) |
| `metadata` | jsonb | | Additional performance data |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update (NEW) |

**Relationships**:
- `workout_log_id` → `workout_logs(id)` ON DELETE CASCADE
- `exercise_preset_id` → `session_plan_exercises(id)` ON DELETE SET NULL
- `resistance_unit_id` → `units(id)` ON DELETE SET NULL

---

## TypeScript Types

### Generated Types (from Supabase CLI)

```typescript
// types/database.ts (after regeneration)
export type SessionPlan = Tables<"session_plans">
export type SessionPlanExercise = Tables<"session_plan_exercises">
export type SessionPlanSet = Tables<"session_plan_sets">
export type WorkoutLog = Tables<"workout_logs">
export type WorkoutLogSet = Tables<"workout_log_sets">
```

### Extended Types (manual)

```typescript
// types/training.ts
export interface SessionPlanWithDetails extends SessionPlan {
  session_plan_exercises: SessionPlanExerciseWithDetails[]
}

export interface SessionPlanExerciseWithDetails extends SessionPlanExercise {
  exercise: Exercise
  session_plan_sets: SessionPlanSet[]
}

export interface WorkoutLogWithDetails extends WorkoutLog {
  athlete: Athlete
  session_plan: SessionPlan | null
  workout_log_sets: WorkoutLogSet[]
}
```

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        COACH PLANNING DOMAIN                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────────────┐             │
│  │   microcycles   │───▶│     session_plans       │             │
│  └─────────────────┘    │  (exercise_preset_groups)│             │
│                         └───────────┬─────────────┘             │
│                                     │ 1:N                        │
│                                     ▼                            │
│                         ┌─────────────────────────┐             │
│                         │ session_plan_exercises  │             │
│                         │   (exercise_presets)    │             │
│                         └───────────┬─────────────┘             │
│                                     │ 1:N                        │
│                                     ▼                            │
│                         ┌─────────────────────────┐             │
│                         │   session_plan_sets     │             │
│                         │(exercise_preset_details)│             │
│                         └─────────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ FK: session_plan_id
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ATHLETE RECORDING DOMAIN                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────────────┐             │
│  │    athletes     │───▶│      workout_logs       │             │
│  └─────────────────┘    │(exercise_training_sess) │             │
│                         └───────────┬─────────────┘             │
│                                     │ 1:N                        │
│                                     ▼                            │
│                         ┌─────────────────────────┐             │
│                         │    workout_log_sets     │             │
│                         │(exercise_training_dtl)  │             │
│                         └─────────────────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### SessionPlan
- `name`: Required, max 200 characters
- `day`: 1-7 if specified
- `user_id`: Must be valid coach or athlete user

### SessionPlanSet
- `reps`: 0-100 if specified
- `weight`: 0-1000 kg if specified
- `rpe`: 1-10 if specified
- `set_index`: 1-20

### WorkoutLog
- `session_status`: Must be valid enum value
- `athlete_id`: Required

### WorkoutLogSet
- `completed`: Required for tracking
- Same numeric ranges as SessionPlanSet
