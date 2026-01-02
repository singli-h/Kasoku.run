# Data Model: Individual User Role

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Document entity relationships, validation rules, and state transitions

---

## Entity Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATA MODEL                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐          ┌──────────┐          ┌─────────────────┐  │
│  │  User   │ 1────1   │ Athlete  │ 1────*   │  Workout Log    │  │
│  │(role)   │──────────│ (silent) │──────────│                 │  │
│  └────┬────┘          └──────────┘          └─────────────────┘  │
│       │                                                          │
│       │ 1                                                        │
│       │                                                          │
│       ▼ *                                                        │
│  ┌─────────────────┐                                             │
│  │ Mesocycle       │──── UI: "Training Block" (for individuals) │
│  │ (Training Block)│                                             │
│  └────────┬────────┘                                             │
│           │ 1                                                    │
│           │                                                      │
│           ▼ *                                                    │
│  ┌─────────────────┐                                             │
│  │ Microcycle      │──── UI: "Week" (for individuals)           │
│  │ (Week)          │                                             │
│  └────────┬────────┘                                             │
│           │ 1                                                    │
│           │                                                      │
│           ▼ *                                                    │
│  ┌─────────────────┐                                             │
│  │ Session Plan    │──── UI: "Workout" (for individuals)        │
│  │ (Workout)       │                                             │
│  └─────────────────┘                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Entities

### 1. User (Extended)

**Table**: `users`
**Change**: Add `'individual'` to role enum

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | UUID | Primary key | Auto-generated |
| clerk_id | string | Clerk auth ID | Unique, required |
| role | enum | User role | `'athlete' \| 'coach' \| 'admin' \| 'individual'` |
| email | string | User email | Valid email format |
| first_name | string | First name | Required |
| last_name | string | Last name | Required |
| onboarding_completed | boolean | Onboarding status | Default: false |
| metadata | jsonb | Additional data | Contains `{ role: string }` |

**Individual-Specific Behavior**:
- Role set to `'individual'` during onboarding
- No `athlete_group_id` association
- Plans link directly via `user_id`

### 2. Athlete (Silent Record for Individual)

**Table**: `athletes`
**Change**: None (existing structure sufficient)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | UUID | Primary key | Auto-generated |
| user_id | UUID | FK to users | Required, unique |
| height | number | Height (cm) | Optional, nullable |
| weight | number | Weight (kg) | Optional, nullable |
| training_goals | string | Goals | Optional for individuals |
| experience | string | Experience level | Optional for individuals |
| events | string[] | Tracked events | Optional for individuals |

**Individual-Specific Behavior**:
- Created silently during onboarding (for workout_logs FK)
- User never sees "athlete" terminology
- Enables upgrade path to Coach or Athlete role

### 3. Mesocycle (Training Block)

**Table**: `mesocycles`
**Change**: None (existing structure sufficient)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | UUID | Primary key | Auto-generated |
| user_id | UUID | FK to users | Required for individuals |
| athlete_group_id | UUID | FK to groups | **NULL for individuals** |
| macrocycle_id | UUID | FK to macrocycle | **NULL for individuals** |
| name | string | Block name | Required |
| duration_weeks | number | Duration | 1-12 weeks |
| status | enum | Block status | `'active' \| 'completed' \| 'archived'` |

**Individual-Specific Behavior**:
- `athlete_group_id` = NULL (no group assignment)
- `macrocycle_id` = NULL (macrocycle hidden)
- UI label: "Training Block"
- **Constraint**: Only ONE active block at a time per user

### 4. Microcycle (Week)

**Table**: `microcycles`
**Change**: None (existing structure sufficient)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | UUID | Primary key | Auto-generated |
| mesocycle_id | UUID | FK to mesocycle | Required |
| week_number | number | Week number | 1-12 |
| name | string | Week name | Optional |
| start_date | date | Week start | Optional |
| end_date | date | Week end | Optional |

**Individual-Specific Behavior**:
- UI label: "Week" (e.g., "Week 1", "Week 2")
- No terminology changes needed in database

### 5. Session Plan (Workout)

**Table**: `session_plans`
**Change**: None (existing structure sufficient)

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | UUID | Primary key | Auto-generated |
| user_id | UUID | FK to users | Required for individuals |
| athlete_group_id | UUID | FK to groups | **NULL for individuals** |
| microcycle_id | UUID | FK to microcycle | Optional |
| session_mode | enum | Session mode | `'individual' \| 'group'` |
| name | string | Workout name | Required |
| scheduled_date | date | Scheduled | Optional |

**Individual-Specific Behavior**:
- `athlete_group_id` = NULL
- `session_mode` = 'individual'
- UI label: "Workout"

---

## State Transitions

### User Role Transition States

```
                    ┌─────────────────┐
                    │   New User      │
                    │  (no role)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌───────────┐  ┌───────────┐  ┌───────────┐
      │  Athlete  │  │ Individual│  │   Coach   │
      └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
            │              │              │
            │              │              │
            │    ┌─────────┴─────────┐    │
            │    │                   │    │
            ▼    ▼                   ▼    ▼
      ┌───────────┐           ┌───────────┐
      │  Athlete  │◄──────────│   Coach   │
      │(with coach)│           │           │
      └───────────┘           └───────────┘
```

### Role Transition Rules

| From | To | Allowed | Data Impact |
|------|-----|---------|-------------|
| Individual | Coach | ✅ Yes | Create coaches record, keep athlete record |
| Individual | Athlete | ✅ Yes | Link athlete record to coach's group |
| Coach | Individual | ❌ No | Not supported (downgrade) |
| Athlete | Individual | ❌ No | Not supported (would orphan from coach) |

### Training Block State Machine

```
┌─────────┐    create    ┌─────────┐   complete   ┌───────────┐
│  (none) │ ─────────► │ active  │ ──────────► │ completed │
└─────────┘             └────┬────┘              └───────────┘
                             │
                             │ archive
                             ▼
                        ┌──────────┐
                        │ archived │
                        └──────────┘
```

**Individual Constraint**: Only ONE block can be `active` at a time.

---

## Validation Rules

### Onboarding Validation (Individual)

```typescript
const individualOnboardingSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  trainingGoals: z.string().min(1, "Training goal required"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  availableEquipment: z.array(z.string()).optional(),
})
```

### Active Block Constraint

```sql
-- Pseudo-constraint: Only one active block per user
-- Enforced at application level in server action
SELECT COUNT(*) FROM mesocycles
WHERE user_id = $1 AND status = 'active';
-- Must return 0 before creating new active block
```

---

## Terminology Mapping

| Database Entity | Coach/Admin UI | Individual UI |
|-----------------|----------------|---------------|
| `mesocycles` | Mesocycle | Training Block |
| `microcycles` | Microcycle | Week |
| `session_plans` | Session Plan | Workout |
| `macrocycles` | Macrocycle | (hidden) |

---

## Navigation Visibility Matrix

**Note**: Individual = Athlete + self-planning. Individuals share athlete navigation plus "My Training".

| Nav Item | URL | Athlete | Individual | Coach | Notes |
|----------|-----|---------|------------|-------|-------|
| Overview | /dashboard | ✅ | ✅ | ✅ | All roles |
| Workout | /workout | ✅ | ✅ | ✅ | Coaches also have athlete record |
| My Training | /plans | ❌ | ✅ | ✅ | Individual + Coach can create plans |
| Exercise Library | /library | ✅ | ✅ | ✅ | All roles |
| Knowledge Base | /knowledge-base | ✅ | ✅ | ✅ | All roles (updated) |
| Performance | /performance | ✅ | ✅ | ✅ | All roles |
| Athletes | /athletes | ❌ | ❌ | ✅ | Coach-only |
| Sessions | /sessions | ❌ | ❌ | ✅ | Coach-only |
| Settings | /settings | ✅ | ✅ | ✅ | All roles |

---

*Data model completed: 2026-01-02*
