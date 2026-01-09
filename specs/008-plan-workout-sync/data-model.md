# Data Model: Plan Page Improvements

**Feature**: 008-plan-workout-sync
**Date**: 2026-01-08

---

## Overview

This document defines the data model changes and entity relationships for the Plan Page Improvements feature.

---

## 1. Schema Changes

### 1.1 New Columns: `workout_logs`

```sql
-- Migration: Add sync tracking columns
ALTER TABLE workout_logs
ADD COLUMN synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_plan_update_at TIMESTAMPTZ;

-- Index for sync queries
CREATE INDEX idx_workout_logs_sync ON workout_logs(session_plan_id, session_status, synced_at);

COMMENT ON COLUMN workout_logs.synced_at IS 'Timestamp of last sync from session_plan';
COMMENT ON COLUMN workout_logs.last_plan_update_at IS 'Timestamp of session_plan when last synced';
```

### 1.2 Type Definitions Update

```typescript
// types/database.ts - Addition to workout_logs type
interface WorkoutLog {
  // ... existing fields
  synced_at: string | null       // NEW: ISO timestamp
  last_plan_update_at: string | null  // NEW: ISO timestamp
}
```

---

## 2. Entity Relationships

### 2.1 Core Hierarchy (Existing)

```
┌──────────────────────────────────────────────────────────────────┐
│  COACH CREATES (Templates)                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  macrocycles (Season)                                            │
│       │                                                          │
│       └──▶ mesocycles (Phase/Block)                              │
│                 │                                                │
│                 └──▶ microcycles (Week)                          │
│                           │                                      │
│                           └──▶ session_plans (Session)           │
│                                     │                            │
│                                     ├──▶ session_plan_exercises  │
│                                     │                            │
│                                     └──▶ session_plan_sets       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Assignment (via assignPlanToAthletesAction)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ATHLETE EXECUTES (Instances)                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  workout_logs (Workout Instance)                                 │
│       │                                                          │
│       ├──▶ workout_log_exercises                                 │
│       │                                                          │
│       └──▶ workout_log_sets                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Foreign Keys

| Table | Column | References | Purpose |
|-------|--------|------------|---------|
| `workout_logs` | `session_plan_id` | `session_plans.id` | Links instance to template |
| `workout_logs` | `athlete_id` | `athletes.id` | Owner of workout instance |
| `workout_log_exercises` | `workout_log_id` | `workout_logs.id` | Exercise belongs to workout |
| `workout_log_exercises` | `session_plan_exercise_id` | `session_plan_exercises.id` | Links to template exercise |
| `workout_log_sets` | `workout_log_exercise_id` | `workout_log_exercises.id` | Set belongs to exercise |

### 2.3 Sync Relationship

```
session_plans (Coach Template)
     │
     │  session_plan_id FK
     ▼
workout_logs (Athlete Instance)
     │
     ├── session_status: 'assigned' │ 'ongoing' │ 'completed' │ 'cancelled'
     ├── synced_at: timestamp (NEW)
     └── last_plan_update_at: timestamp (NEW)

Sync Logic:
- IF session_status = 'assigned' AND session_plans.updated_at > synced_at
  → Auto-sync on coach save
- IF session_status = 'ongoing' AND session_plans.updated_at > synced_at
  → Show "Updates available" badge, manual sync option
- IF session_status = 'completed'
  → Never sync (historical data)
```

---

## 3. Entity Details

### 3.1 workout_logs (Modified)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| athlete_id | integer | YES | - | FK to athletes |
| session_plan_id | uuid | YES | - | FK to session_plans (template) |
| athlete_group_id | integer | YES | - | Denormalized for queries |
| date_time | timestamptz | YES | - | Scheduled date/time |
| session_status | text | YES | 'assigned' | Status enum |
| session_mode | text | YES | - | 'individual', 'group' |
| description | text | YES | - | From session_plan |
| notes | text | YES | - | Athlete's notes |
| **synced_at** | timestamptz | YES | NOW() | **NEW**: Last sync timestamp |
| **last_plan_update_at** | timestamptz | YES | - | **NEW**: Plan version synced |
| created_at | timestamptz | YES | NOW() | Creation timestamp |
| updated_at | timestamptz | YES | NOW() | Last update |

### 3.2 session_status Enum

| Value | Description | Sync Behavior |
|-------|-------------|---------------|
| `assigned` | Created by assignment, not started | Auto-sync allowed |
| `ongoing` | Athlete has started | Manual sync only |
| `completed` | Athlete finished | No sync |
| `cancelled` | Skipped/cancelled | No sync |

---

## 4. Data Flow: Sync Operation

### 4.1 Auto-Sync (Coach Saves → Assigned Workouts)

```
1. Coach saves session_plan
   ↓
2. saveSessionWithExercisesAction() completes
   ↓
3. Trigger syncPlanToAssignedWorkoutsAction(sessionPlanId)
   ↓
4. Query: workout_logs WHERE session_plan_id = X AND session_status = 'assigned'
   ↓
5. For each workout_log:
   a. Delete existing workout_log_exercises and workout_log_sets
   b. Copy session_plan_exercises → workout_log_exercises
   c. Copy session_plan_sets → workout_log_sets
   d. Update synced_at = NOW()
   e. Update last_plan_update_at = session_plans.updated_at
   ↓
6. Transaction commit
```

### 4.2 Manual Sync (Athlete Pulls Updates)

```
1. Athlete clicks "Sync from Coach Plan"
   ↓
2. Confirmation dialog shown
   ↓
3. athletePullSyncAction(workoutLogId)
   ↓
4. Merge logic:
   - Add new exercises from plan
   - Update uncompleted sets
   - PRESERVE completed sets (athlete data)
   - PRESERVE exercises with logged data
   ↓
5. Update synced_at = NOW()
   ↓
6. Return sync result
```

---

## 5. Validation Rules

### 5.1 Edit Block (Mesocycle)

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, 1-100 chars | "Name is required" |
| start_date | Valid date | "Invalid start date" |
| end_date | After start_date | "End date must be after start date" |
| focus | Optional, enum | - |

### 5.2 Add Workout (Session Plan)

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Optional, 1-100 chars | "Name too long" |
| day | Required, 0-6 | "Day is required" |
| microcycle_id | Required, exists | "Week not found" |

### 5.3 Sync Validation

| Condition | Action |
|-----------|--------|
| `session_status = 'completed'` | Reject sync |
| `session_plan_id IS NULL` | Reject sync (not assigned workout) |
| No changes detected | Return "Already up to date" |

---

## 6. State Transitions

### 6.1 Session Status Flow

```
                    ┌─────────────┐
    Assignment      │  assigned   │
    ─────────────►  │             │
                    └──────┬──────┘
                           │
                           │ Athlete starts
                           ▼
                    ┌─────────────┐
                    │   ongoing   │
                    │             │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  completed  │ │  cancelled  │ │   ongoing   │
    │             │ │   (skip)    │ │ (continue)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 6.2 Sync Allowed States

| From Status | To | Allowed | Notes |
|-------------|-----|---------|-------|
| assigned | synced | YES | Auto-sync |
| ongoing | synced | YES | Manual only |
| completed | synced | NO | Never modify |
| cancelled | synced | NO | No need |

---

## 7. Indexes

### 7.1 New Indexes for Sync

```sql
-- Optimize sync queries
CREATE INDEX idx_workout_logs_sync
ON workout_logs(session_plan_id, session_status, synced_at)
WHERE session_status IN ('assigned', 'ongoing');

-- Optimize "updates available" check
CREATE INDEX idx_workout_logs_sync_check
ON workout_logs(athlete_id, session_status)
WHERE session_plan_id IS NOT NULL;
```

### 7.2 Existing Indexes (Reference)

| Table | Index | Purpose |
|-------|-------|---------|
| workout_logs | idx_workout_logs_athlete | Filter by athlete |
| workout_logs | idx_workout_logs_date | Filter by date |
| session_plans | idx_session_plans_microcycle | Filter by week |

---

## 8. RLS Policies

### 8.1 Existing Policies (No Changes)

| Table | Policy | Effect |
|-------|--------|--------|
| workout_logs | athlete_access | Athletes see own workouts |
| workout_logs | coach_access | Coaches see assigned workouts |
| session_plans | user_access | Users see own plans |

### 8.2 Sync Operation (Service Role)

Sync operations use service role (bypasses RLS) because:
- Coach's action triggers update on athlete's workout_logs
- RLS would block cross-user writes

**Security**: Authentication checked in server action before sync.

---

## 9. Migration Plan

### 9.1 Migration Script

```sql
-- Migration: 20260108_add_sync_columns.sql

BEGIN;

-- Add new columns
ALTER TABLE workout_logs
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_plan_update_at TIMESTAMPTZ;

-- Backfill: Set synced_at for existing assigned workouts
UPDATE workout_logs
SET synced_at = created_at
WHERE synced_at IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_workout_logs_sync
ON workout_logs(session_plan_id, session_status, synced_at)
WHERE session_status IN ('assigned', 'ongoing');

COMMIT;
```

### 9.2 Rollback Script

```sql
-- Rollback: 20260108_add_sync_columns.sql

BEGIN;

DROP INDEX IF EXISTS idx_workout_logs_sync;

ALTER TABLE workout_logs
DROP COLUMN IF EXISTS synced_at,
DROP COLUMN IF EXISTS last_plan_update_at;

COMMIT;
```

---

## 10. Type Definitions

### 10.1 New Types

```typescript
// types/sync.ts

export interface SyncResult {
  workoutsUpdated: number
  exercisesAdded: number
  exercisesRemoved: number
  setsUpdated: number
  errors: string[]
}

export interface SyncStatus {
  isOutOfSync: boolean
  planUpdatedAt: string | null
  lastSyncedAt: string | null
}

export type SyncableStatus = 'assigned' | 'ongoing'
```

### 10.2 Updated Types

```typescript
// types/database.ts - WorkoutLog extension

interface WorkoutLog {
  // ... existing
  synced_at: string | null
  last_plan_update_at: string | null
}
```
