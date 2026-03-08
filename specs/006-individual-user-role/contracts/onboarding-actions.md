# API Contract: Onboarding Actions

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Define server action contracts for individual user onboarding

---

## Overview

This contract extends the existing `completeOnboardingAction` to support the 'individual' role.

---

## Action: completeOnboardingAction

**File**: `actions/onboarding/onboarding-actions.ts`
**Type**: Server Action
**Purpose**: Complete user onboarding with role-specific data

### Input Type (Extended)

```typescript
export interface OnboardingActionData {
  // Common fields (existing)
  clerkId: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: "athlete" | "coach" | "individual"  // ← Extended
  birthdate?: string
  timezone: string
  subscription: "free" | "paid"

  // Role-specific fields (existing)
  athleteData?: {
    height?: number | null
    weight?: number | null
    trainingGoals: string
    experience: string
    events: string[]
  }

  coachData?: {
    speciality: string
    experience: string
    philosophy: string
    sportFocus: string
  }

  // NEW: Individual-specific fields
  individualData?: {
    trainingGoals: string
    experienceLevel: "beginner" | "intermediate" | "advanced"
    availableEquipment?: string[]
  }
}
```

### Output Type

```typescript
// Unchanged - uses existing ActionState pattern
type Result = ActionState<{ userId: string }>

// Success case
{
  isSuccess: true,
  message: "Onboarding completed successfully",
  data: { userId: "uuid-string" }
}

// Error case
{
  isSuccess: false,
  message: "Failed to create user: [error details]"
}
```

### Behavior for Individual Role

When `role === "individual"`:

1. Create user record with `role: 'individual'`
2. Create athlete record silently (for workout_logs FK)
3. Store individual-specific data in athlete record:
   - `training_goals` ← from `individualData.trainingGoals`
   - `experience` ← from `individualData.experienceLevel`
   - Custom metadata for equipment

### Sequence Diagram

```
Client                    Server Action                    Supabase
   │                            │                              │
   │  completeOnboardingAction  │                              │
   │  (role: 'individual')      │                              │
   │──────────────────────────►│                              │
   │                            │                              │
   │                            │  UPSERT users                │
   │                            │  (clerk_id conflict)         │
   │                            │─────────────────────────────►│
   │                            │◄─────────────────────────────│
   │                            │  user_id returned            │
   │                            │                              │
   │                            │  CHECK athletes exists       │
   │                            │─────────────────────────────►│
   │                            │◄─────────────────────────────│
   │                            │  null (not exists)           │
   │                            │                              │
   │                            │  INSERT athletes             │
   │                            │  (silent athlete record)     │
   │                            │─────────────────────────────►│
   │                            │◄─────────────────────────────│
   │                            │                              │
   │  { isSuccess: true,        │                              │
   │    data: { userId } }      │                              │
   │◄──────────────────────────│                              │
```

### Error Handling

| Error Condition | Response |
|-----------------|----------|
| Missing clerkId | `{ isSuccess: false, message: "Not authenticated" }` |
| Invalid email | `{ isSuccess: false, message: "Invalid email format" }` |
| Database error | `{ isSuccess: false, message: "Failed to create user: [db error]" }` |
| Athlete creation fails | Log warning, continue (non-blocking) |

---

## Action: getUserRole (API Route)

**File**: `app/api/user/role/route.ts`
**Type**: Route Handler (GET)
**Purpose**: Fetch current user's role for client context

### Request

```
GET /api/user/role
Authorization: Clerk session cookie
```

### Response

```typescript
// Success (200)
{
  role: "athlete" | "coach" | "admin" | "individual"
}

// Not authenticated (401)
{
  error: "Not authenticated"
}

// User not found (404)
{
  error: "User not found"
}
```

### Implementation Notes

This endpoint already exists and needs no changes - it returns whatever role is in the database.

---

## Type Extensions

### UserRole (Context)

**File**: `contexts/user-role-context.tsx`

```typescript
// Before
export type UserRole = 'athlete' | 'coach' | 'admin'

// After
export type UserRole = 'athlete' | 'coach' | 'admin' | 'individual'
```

### UserRoleContextValue (Extended)

```typescript
interface UserRoleContextValue {
  role: UserRole | null
  isLoading: boolean
  isCoach: boolean
  isAthlete: boolean
  isAdmin: boolean
  isIndividual: boolean  // ← NEW
  hasRole: (role: UserRole | UserRole[]) => boolean
}
```

### OnboardingData (Wizard)

**File**: `components/features/onboarding/onboarding-wizard.tsx`

```typescript
// Before
export interface OnboardingData {
  // ...
  role: "athlete" | "coach" | ""
  // ...
}

// After
export interface OnboardingData {
  // ...
  role: "athlete" | "coach" | "individual" | ""
  // ...

  // NEW: Individual-specific fields
  trainingGoals: string      // Shared with athlete
  experienceLevel: string    // NEW for individual
  availableEquipment: string[] // NEW for individual
}
```

---

## Validation Schemas

### Individual Onboarding Schema (Zod)

```typescript
import { z } from 'zod'

export const individualOnboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  trainingGoals: z.string().min(1, "Please select a training goal"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select your experience level"
  }),
  availableEquipment: z.array(z.string()).optional().default([]),
})

export type IndividualOnboardingInput = z.infer<typeof individualOnboardingSchema>
```

---

*Contract defined: 2026-01-02*
