# AI Session Assistant: Entity Model

**Purpose**: Define entities, database mappings, and relationships for the AI Session Assistant
**Feature**: 002-ai-session-assistant
**Spec Reference**: [spec.md](../spec.md)

---

## Two Distinct Domains

The AI Session Assistant operates in **two separate domains**, each with its own database tables and changeset context:

| Domain | User | Purpose | Database Prefix |
|--------|------|---------|-----------------|
| **Training Plans** | Coach | Create/modify session blueprints | `exercise_preset_*` |
| **Workout** | Athlete | Log performance, adjust actual workout | `exercise_training_*` |

**Key Insight**: These are separate changesets. A coach modifying a plan and an athlete logging a workout are independent operations with no shared state.

---

## Domain 1: Training Plans (Coach)

### Purpose

Coaches create and modify **template sessions** (blueprints) that can be assigned to athletes.

### Entity Hierarchy

```
Plan (Macrocycle)
└── Phase (Mesocycle)
    └── Week (Microcycle)
        └── Session (exercise_preset_groups)    ← ChangeSet operates here
            └── Exercise (exercise_presets)
                └── Set (exercise_preset_details)
```

### Database Tables

#### exercise_preset_groups (Session Template)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | INT | Owner (coach) - FK to users |
| `athlete_group_id` | INT | Associated athlete group (optional) |
| `microcycle_id` | INT | Parent week (optional) |
| `name` | TEXT | Session name |
| `description` | TEXT | Notes |
| `session_mode` | TEXT | Session mode identifier |
| `week` | INT | Week number |
| `day` | INT | Day number |
| `date` | DATE | Scheduled date |
| `is_template` | BOOLEAN | True for reusable templates |
| `deleted` | BOOLEAN | Soft delete flag |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### exercise_presets (Exercise in Template)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `exercise_preset_group_id` | INT | Parent session |
| `exercise_id` | INT | Reference to exercise library |
| `preset_order` | INT | Position in session |
| `superset_id` | TEXT | Grouping for supersets |
| `notes` | TEXT | Exercise-specific notes |

#### exercise_preset_details (Set Prescription)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `exercise_preset_id` | INT | Parent exercise |
| `set_index` | INT | Set number (1, 2, 3...) |
| `reps` | INT | Prescribed reps |
| `weight` | DECIMAL | Prescribed weight (kg) |
| `distance` | DECIMAL | Distance (meters) |
| `performing_time` | INT | Duration (seconds) |
| `rest_time` | INT | Rest in seconds |
| `tempo` | TEXT | Tempo string (e.g., "3-0-2-0") |
| `rpe` | INT | Target RPE (1-10) |
| `resistance_unit_id` | INT | Unit for resistance |
| `power` | DECIMAL | Power output (watts) |
| `velocity` | DECIMAL | Bar speed (m/s) |
| `effort` | DECIMAL | Effort metric |
| `height` | DECIMAL | Height (for jumps, etc.) |
| `resistance` | DECIMAL | Resistance value |

### Entity Types for ChangeSet

| entityType | Maps To | Operations | Notes |
|------------|---------|------------|-------|
| `preset_session` | `exercise_preset_groups` | create, update | Coach can create new session templates; no delete (too destructive for AI) |
| `preset_exercise` | `exercise_presets` | create, update, delete | Full CRUD for exercises within session |
| `preset_set` | `exercise_preset_details` | create, update, delete | Full CRUD for set prescriptions |

---

## Domain 2: Workout (Athlete)

### Purpose

Athletes execute assigned sessions, logging their **actual performance** (weights lifted, reps completed, RPE felt).

### Entity Hierarchy

```
Assigned Session (exercise_training_sessions)    ← ChangeSet operates here
└── Performance Record (exercise_training_details)
    └── Set-by-set actual data
```

### Database Tables

#### exercise_training_sessions (Assigned/Active Session)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `exercise_preset_group_id` | INT | Source template |
| `athlete_id` | INT | Who this is assigned to |
| `athlete_group_id` | INT | Associated athlete group (optional) |
| `session_status` | TEXT | 'assigned' / 'ongoing' / 'completed' |
| `session_mode` | TEXT | Session mode identifier |
| `date_time` | TIMESTAMP | Scheduled date/time |
| `description` | TEXT | Session description |
| `notes` | TEXT | Athlete notes |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### exercise_training_details (Performance Record)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `exercise_training_session_id` | INT | Parent session |
| `exercise_preset_id` | INT | Reference to preset exercise |
| `set_index` | INT | Set number |
| `reps` | INT | **Actual** reps performed |
| `weight` | DECIMAL | **Actual** weight used (kg) |
| `distance` | DECIMAL | For cardio (meters) |
| `performing_time` | INT | Duration (seconds) |
| `rest_time` | INT | Rest time (seconds) |
| `tempo` | TEXT | Tempo string |
| `power` | DECIMAL | Power output (watts) |
| `velocity` | DECIMAL | Bar speed (m/s) |
| `rpe` | INT | **Felt** RPE (1-10) |
| `effort` | DECIMAL | Effort metric |
| `height` | DECIMAL | Height (for jumps, etc.) |
| `resistance` | DECIMAL | Resistance value |
| `resistance_unit_id` | INT | Unit for resistance |
| `completed` | BOOLEAN | Set completed? |
| `created_at` | TIMESTAMP | |

### Entity Types for ChangeSet

| entityType | Maps To | Operations | Notes |
|------------|---------|------------|-------|
| `training_session` | `exercise_training_sessions` | update | Status, notes; no create (assigned by coach), no delete |
| `training_set` | `exercise_training_details` | create, update | No delete - skipped sets recorded as `reps: 0` |

**Skip Semantics**:
- **Skip entire session**: No data inserted (session stays in 'assigned' status)
- **Skip a set**: Log with `reps: 0` to track that it was prescribed but not performed

---

## Shared Reference: Exercise Library

Both domains reference the **exercise library** (read-only for changesets):

#### exercises (Library)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | TEXT | Exercise name |
| `description` | TEXT | How to perform |
| `video_url` | TEXT | Demo video |
| `exercise_type_id` | INT | FK to exercise types |
| `unit_id` | INT | Default unit for this exercise |
| `owner_user_id` | INT | User who created (for custom exercises) |
| `is_archived` | BOOLEAN | Whether exercise is archived |
| `visibility` | TEXT | Visibility level |
| `search_tsv` | TSVECTOR | Full-text search vector |
| `embedding` | VECTOR | For semantic search |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**ChangeSet Role**: Read-only. Used to validate `exercise_id` references and for AI search.

---

## ChangeRequest Examples

### Domain 1: Coach Adds Exercise to Template

```typescript
{
  operationType: 'create',
  entityType: 'preset_exercise',
  entityId: null,
  proposedData: {
    exercise_preset_group_id: 123,    // Session ID
    exercise_id: 456,                  // From library
    preset_order: 3,                   // Position
    superset_id: null,
    notes: null
  },
  aiReasoning: "Added Romanian Deadlifts as requested"
}
```

### Domain 1: Coach Updates Set Prescription

```typescript
{
  operationType: 'update',
  entityType: 'preset_set',
  entityId: 'set-789',
  currentData: {
    reps: 8,
    weight: 60
  },
  proposedData: {
    reps: 10,
    weight: 70
  },
  aiReasoning: "Increased volume as requested"
}
```

### Domain 2: Athlete Logs Performance

```typescript
{
  operationType: 'update',
  entityType: 'training_set',
  entityId: 'detail-101',
  currentData: {
    reps: null,
    weight: null,
    completed: false
  },
  proposedData: {
    reps: 8,
    weight: 100,
    rpe: 8,
    completed: true
  },
  aiReasoning: "Logged: 8 reps at 100kg, RPE 8"
}
```

### Domain 2: Athlete Adds Session Notes

```typescript
{
  operationType: 'update',
  entityType: 'training_session',
  entityId: 'session-202',
  currentData: {
    notes: null,
    updated_at: '2025-12-21T10:00:00Z'  // For optimistic concurrency
  },
  proposedData: {
    notes: "Felt strong today, increased weight on squats"
  },
  aiReasoning: "Added session notes as requested"
}
```

---

## Validation Rules

### Training Plans Domain

| Rule | Validation |
|------|------------|
| Exercise exists | `exercise_id` references valid row in `exercises` |
| Session belongs to user | `exercise_preset_groups.user_id` matches current user |
| Order is sequential | No gaps in `preset_order` values |
| Superset consistency | All exercises in superset have same `superset_id` |

### Workout Domain

| Rule | Validation |
|------|------------|
| Session assigned to athlete | `exercise_training_sessions.athlete_id` matches current user |
| Session not completed | Cannot modify if `session_status = 'completed'` |
| Valid set index | `set_index` within expected range |
| Positive values | `reps`, `weight` must be positive when provided |

### Optimistic Concurrency

Use existing `updated_at` timestamp for version checking:

```typescript
// Pre-execution check
const current = await db.from(entityType).select('updated_at').eq('id', entityId).single()

if (current.updated_at !== changeRequest.currentData.updated_at) {
  throw new StaleDataError({ entityId, expected: changeRequest.currentData.updated_at, actual: current.updated_at })
}
```

All tables already have `updated_at` columns - no schema changes needed.

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXERCISE LIBRARY (read-only)                     │
│                              exercises                                   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ exercise_id (FK)
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌───────────────────────────────┐   ┌───────────────────────────────────┐
│     TRAINING PLANS (Coach)     │   │        WORKOUT (Athlete)          │
│                               │   │                                   │
│  exercise_preset_groups       │   │  exercise_training_sessions       │
│         │                     │   │         │                         │
│         ▼                     │   │         ▼                         │
│  exercise_presets             │──►│  exercise_training_details        │
│         │                     │   │                                   │
│         ▼                     │   │  (copies prescription from        │
│  exercise_preset_details      │   │   presets, stores actuals)        │
│                               │   │                                   │
│  ChangeSet: preset_*          │   │  ChangeSet: training_*            │
└───────────────────────────────┘   └───────────────────────────────────┘
```

---

## Context Detection

When AI assistant is invoked, determine which domain based on:

```typescript
interface SessionContext {
  domain: 'training_plans' | 'workout'
  sessionId: number
  sessionType: 'preset_group' | 'training_session'
  userId: string
  userRole: 'coach' | 'athlete'
}

function detectContext(url: string, user: User): SessionContext {
  if (url.includes('/plans/') || url.includes('/session-planner/')) {
    return {
      domain: 'training_plans',
      sessionType: 'preset_group',
      userRole: 'coach',
      // ...
    }
  }

  if (url.includes('/workout/')) {
    return {
      domain: 'workout',
      sessionType: 'training_session',
      userRole: 'athlete',
      // ...
    }
  }
}
```

---

## References

- Architecture: `20251221-changeset-architecture.md`
- Tool Definitions: `20251221-session-tool-definitions.md`
- UI Integration: `20251221-session-ui-integration.md`
