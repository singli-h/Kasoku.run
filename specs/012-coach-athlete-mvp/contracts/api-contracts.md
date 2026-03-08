# API Contracts: Coach/Athlete MVP

## Server Actions (Modified)

### 1. `completeOnboardingAction` — Add `groupId` param

**File**: `apps/web/actions/onboarding/onboarding-actions.ts`

```typescript
// BEFORE
export async function completeOnboardingAction(formData: OnboardingFormData): Promise<ActionState<...>>

// AFTER
export async function completeOnboardingAction(
  formData: OnboardingFormData,
  groupId?: number  // NEW: from invite link
): Promise<ActionState<...>>
```

When `groupId` is provided:
- Pass as `p_group_id` to `complete_onboarding` RPC
- Force `p_role = 'athlete'` regardless of form data

### 2. `inviteOrAttachAthleteAction` — Fix Path B

**File**: `apps/web/actions/athletes/athlete-actions.ts`

```typescript
// Path B (new user): REMOVE the broken pending athlete INSERT
// BEFORE: creates orphaned record with `as any` cast
// AFTER: only create Clerk invitation, no DB record until onboarding

// Path A (existing user): ADD role update
// BEFORE: only sets athlete_group_id
// AFTER: also updates users.role to 'athlete' IF current role is 'individual'
```

### 3. `deleteMacrocycleAction` — Add revalidatePath

**File**: `apps/web/actions/plans/plan-actions.ts`

```typescript
// AFTER delete:
revalidatePath('/plans', 'page')
```

### 4. `getAssignmentCountForMacrocycle` — NEW

**File**: `apps/web/actions/plans/plan-actions.ts`

```typescript
export async function getAssignmentCountForMacrocycle(
  macrocycleId: number
): Promise<ActionState<{ count: number; athleteNames: string[] }>>
```

Queries `workout_logs` joined through `session_plans → microcycles → mesocycles → macrocycles` where `macrocycles.id = macrocycleId` and `session_status IN ('assigned', 'ongoing')`. Returns distinct athlete count and names.

### 5. `bulkCancelAssignmentsForMacrocycle` — NEW

**File**: `apps/web/actions/plans/plan-actions.ts`

```typescript
export async function bulkCancelAssignmentsForMacrocycle(
  macrocycleId: number
): Promise<ActionState<{ cancelled: number }>>
```

Updates all `workout_logs` with `session_status = 'assigned'` (not ongoing/completed) linked to this macrocycle to `session_status = 'cancelled'`.

### 6. `getTodayAndOngoingSessionsAction` — Add date filter

**File**: `apps/web/actions/workout/workout-session-actions.ts`

```typescript
// BEFORE: .or('session_status.eq.ongoing,session_status.eq.assigned')
// AFTER:  Add date range filter: past 7 days + next 7 days
//         .gte('date_time', sevenDaysAgo.toISOString())
//         .lte('date_time', sevenDaysFromNow.toISOString())
//         Keep ongoing sessions regardless of date
```

### 7. `getAthleteProfileStats` — Fix fake stats

**File**: `apps/web/actions/profile/profile-actions.ts`

```typescript
// completionRate: replace Math.random() with:
const { count: completed } = await supabase.from('workout_logs')
  .select('*', { count: 'exact', head: true })
  .eq('athlete_id', athleteId).eq('session_status', 'completed')
const { count: total } = await supabase.from('workout_logs')
  .select('*', { count: 'exact', head: true })
  .eq('athlete_id', athleteId).in('session_status', ['completed', 'assigned', 'ongoing'])
const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

// weeklyStreak: hide for now (remove from UI) — proper implementation is P2
// yearsExperience: compute from user.created_at
```

## New Pages/Components

### 1. `/program` — Athlete "My Program" Page

**Route**: `apps/web/app/(protected)/program/page.tsx`
**Guard**: `allowedRoles: ['athlete']`
**Data**: New `getAthleteAssignedPlanAction()` server action that queries:
```
macrocycles (via athlete_group_id)
  → mesocycles → microcycles → session_plans
  + workout_logs (for completion status)
```
Returns current + next week with session completion status.

### 2. `DeletePlanDialog` Component

**File**: `apps/web/components/features/plans/home/DeletePlanDialog.tsx`
**Pattern**: Follow existing `EditTrainingBlockDialog` AlertDialog pattern
**Props**: `{ macrocycleId: number, planName: string, open: boolean, onOpenChange: (open: boolean) => void, onDeleted: () => void }`
**Behavior**: On open, fetches assignment count. Shows warning if assigned. Offers "Remove All Assignments" button. Delete button calls `deleteMacrocycleAction`.

## RPC Changes

### `complete_onboarding` — Add `p_group_id` parameter

```sql
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_clerk_id TEXT,
  -- ... existing params ...
  p_group_id INTEGER DEFAULT NULL  -- NEW
) RETURNS TABLE(success BOOLEAN, created_user_id INTEGER, message TEXT)
```
