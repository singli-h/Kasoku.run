# Quickstart: Individual User Role

**Feature Branch**: `006-individual-user-role`
**Date**: 2026-01-02
**Purpose**: Development setup and testing guide for implementing individual user role

---

## Prerequisites

- Node.js 20.9+ (required for Next.js 16)
- npm 10+
- Git
- Clerk account (for auth testing)
- Supabase project (existing: `pcteaouusthwbgzczoae`)

---

## Getting Started

### 1. Clone and Switch to Feature Branch

```bash
git fetch origin
git checkout 006-individual-user-role
cd apps/web
npm install
```

### 2. Environment Setup

Ensure `.env.local` has all required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pcteaouusthwbgzczoae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Implementation Order

Follow this order to implement the feature incrementally:

### Phase 1: Core Role Support (P1)

| Order | File | Change | Testing |
|-------|------|--------|---------|
| 1 | `contexts/user-role-context.tsx` | Add 'individual' to UserRole type | Unit test |
| 2 | `actions/onboarding/onboarding-actions.ts` | Handle individual role | Integration test |
| 3 | `components/features/onboarding/onboarding-wizard.tsx` | Add 'individual' to role type | N/A |
| 4 | `components/features/onboarding/steps/role-selection-step.tsx` | Add third card | Visual test |
| 5 | `components/features/onboarding/steps/individual-details-step.tsx` | NEW FILE | Unit test |
| 6 | `components/layout/sidebar/app-sidebar.tsx` | visibleTo pattern | Unit test |

### Phase 2: Terminology (P2)

| Order | File | Change | Testing |
|-------|------|--------|---------|
| 7 | `lib/terminology.ts` | NEW FILE | Unit test |
| 8 | Components using terminology | Update labels | Visual test |

---

## File-by-File Implementation Guide

### Step 1: Update UserRoleContext

**File**: `contexts/user-role-context.tsx`

```diff
- export type UserRole = 'athlete' | 'coach' | 'admin'
+ export type UserRole = 'athlete' | 'coach' | 'admin' | 'individual'

  const value: UserRoleContextValue = {
    role,
    isLoading,
    isCoach: role === 'coach',
    isAthlete: role === 'athlete',
    isAdmin: role === 'admin',
+   isIndividual: role === 'individual',
    hasRole: (requiredRole) => { ... }
  }
```

### Step 2: Update Onboarding Action

**File**: `actions/onboarding/onboarding-actions.ts`

Add individual handling after the coach handling block (~line 193):

```typescript
if (data.role === "individual" && data.individualData) {
  // Check if athlete record already exists
  const { data: existingAthlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existingAthlete) {
    console.log(`Creating athlete record for individual ${userId}`)
    const { error: athleteError } = await supabase
      .from('athletes')
      .insert({
        user_id: userId,
        training_goals: data.individualData.trainingGoals,
        experience: data.individualData.experienceLevel,
      })

    if (athleteError) {
      console.error('Error creating athlete profile for individual:', athleteError)
      // Don't fail - this is a silent record creation
    }
  }
}
```

### Step 3: Create Individual Details Step

**File**: `components/features/onboarding/steps/individual-details-step.tsx`

See [contracts/onboarding-actions.md](./contracts/onboarding-actions.md) for the full component template.

### Step 4: Update Role Selection Step

**File**: `components/features/onboarding/steps/role-selection-step.tsx`

Add third card for "Train Myself" option.

### Step 5: Update App Sidebar

**File**: `components/layout/sidebar/app-sidebar.tsx`

Replace `coachOnly` with `visibleTo` pattern. See [contracts/navigation.md](./contracts/navigation.md).

### Step 6: Create Terminology Utility

**File**: `lib/terminology.ts`

See [contracts/terminology.md](./contracts/terminology.md) for full implementation.

---

## Testing Guide

### Manual Testing Checklist

#### Onboarding Flow

- [ ] Navigate to `/onboarding` as new user
- [ ] Verify 3 role cards visible: Athlete, Train Myself, Coach
- [ ] Select "Train Myself" - verify individual details form shows
- [ ] Complete onboarding - verify redirect to dashboard
- [ ] Check database: user.role = 'individual', athletes record exists

#### Navigation

- [ ] Login as individual user
- [ ] Verify sidebar shows: Overview, Workout, My Training, Library, Performance, Settings
- [ ] Verify sidebar HIDES: Athletes, Sessions, Knowledge Base
- [ ] Navigate directly to `/athletes` - verify redirect to dashboard

#### Terminology

- [ ] Navigate to `/plans` as individual
- [ ] Verify "Training Block" instead of "Mesocycle"
- [ ] Create a block - verify "Week" instead of "Microcycle"
- [ ] Verify no "Macrocycle" visible anywhere

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- contexts/user-role-context.test.ts
npm test -- lib/terminology.test.ts

# Run with coverage
npm test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npx playwright test

# Run specific test
npx playwright test onboarding-individual.spec.ts
```

---

## Database Verification

### Check Individual User Created

```sql
SELECT id, clerk_id, role, email, onboarding_completed
FROM users
WHERE role = 'individual';
```

### Check Silent Athlete Record

```sql
SELECT a.id, a.user_id, u.role, a.training_goals
FROM athletes a
JOIN users u ON u.id = a.user_id
WHERE u.role = 'individual';
```

### Check Individual's Training Blocks

```sql
SELECT m.id, m.name, m.status, u.role
FROM mesocycles m
JOIN users u ON u.id = m.user_id
WHERE u.role = 'individual'
  AND m.athlete_group_id IS NULL;  -- No group for individuals
```

---

## Common Issues

### "Role not updating in context"

1. Check `/api/user/role` returns correct role
2. Verify `getUserRole` cache is not stale
3. Clear browser storage and re-login

### "Athlete record not created"

1. Check onboarding action logs for errors
2. Verify user_id exists before insert
3. Check for unique constraint violations

### "Navigation showing wrong items"

1. Verify `isIndividual` is true in context
2. Check `visibleTo` arrays include 'individual'
3. Ensure no caching of old navigation state

---

## Useful Commands

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build (production check)
npm run build

# Generate Supabase types
npx supabase gen types typescript --project-id pcteaouusthwbgzczoae > types/database.ts
```

---

*Quickstart created: 2026-01-02*
