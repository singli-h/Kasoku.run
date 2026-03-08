# Research: Coach/Athlete MVP Production Readiness

**Phase 0 output** | **Date**: 2026-02-17

## Key Architecture Findings

### 1. Database FK Cascade Behavior

From migration `20260112100000_add_cascade_delete_user_relations.sql`:

| FK | ON DELETE |
|----|----------|
| `workout_logs.session_plan_id → session_plans(id)` | **SET NULL** — logs survive plan deletion |
| `workout_logs.athlete_id → athletes(id)` | CASCADE — athlete deletion cascades to logs |
| `races.macrocycle_id → macrocycles(id)` | SET NULL — races survive plan deletion |
| `races.user_id → users(id)` | CASCADE |

**Implication**: FR-010c (preserve completed workout_logs after plan delete) is already satisfied by existing DB constraints. No migration needed for this.

### 2. Onboarding Flow Architecture

- `/auth/session` (Server Component) → checks onboarding status → `router.replace('/onboarding')` — **drops all query params**
- `/onboarding` page is a Server Component that renders `<OnboardingWizard />` — zero query param awareness
- `OnboardingWizard` is a `"use client"` component with 6 steps, managed by internal state
- `role-selection-step.tsx` renders all 3 roles equally, no conditional hiding
- `complete_onboarding` RPC: `SECURITY DEFINER`, atomic UPSERT on `users.clerk_id`, creates role-specific records
- RPC params: `p_clerk_id, p_username, p_email, p_first_name, p_last_name, p_role, p_birthdate, p_timezone, p_subscription` + role-specific. **No `p_group_id` param**.
- `lookup_user_for_invite` RPC: referenced in `athlete-actions.ts` but **zero migration files** — exists only in Supabase dashboard
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/auth/session` in env (NOT `/onboarding`)

### 3. Plan Delete Infrastructure

- `deleteMacrocycleAction(id: number)`: exists at `plan-actions.ts:394-434`. Single Supabase DELETE with `user_id` check. **No `revalidatePath` call** — unlike `deleteMesocycleAction` which calls `revalidatePath('/plans', 'page')`.
- `PlansHomeClient.tsx`: Delete dropdown item exists but has `disabled` prop, no `onClick`, no state, no dialog. Completely unwired.
- AlertDialog pattern is well-established — 8+ existing consumers use the controlled state pattern (`useState<boolean>` + `<AlertDialog open={...}>`).
- No function in `plan-actions.ts` queries `workout_logs` for assignment counting. This needs a new query.

### 4. PlanReview Bug Details

`PlanReview.tsx:83-89` calls `saveSessionPlanAction` with:
```typescript
saveSessionPlanAction({
  ...session,                                    // SessionPlanData shape
  microcycle_id: microcycleId,                   // WRONG: snake_case
  athlete_group_id: planData.athleteGroupId,      // WRONG: snake_case
})
```

`CreateSessionPlanForm` expects `microcycleId` (camelCase) and `athleteGroupId` (camelCase). The action reads `planData.microcycleId` internally (line 132), so the snake_case keys are silently ignored → `microcycle_id` is set to `null`.

**Double bug**: The spread also puts `SessionPlanData` fields on `CreateSessionPlanForm` — the `sessions` array is never populated correctly. Fix requires wrapping: `{ microcycleId, athleteGroupId, sessions: [session] }`.

### 5. Workout Session Actions

- `getTodayAndOngoingSessionsAction(athleteId?)`: fetches ALL assigned/ongoing workout_logs. No date filter. Deep join through `session_plans → exercises → types/units/sets`.
- `skipWorkoutSessionAction(sessionId, reason?)`: exists and works — sets status to `cancelled`, adds "Skipped by athlete" note. Zero UI surface.
- `exercise-card.tsx` line 44: `unit: 'lbs'` is in the static `EXERCISE_FIELDS` array. The exercise data from DB includes `unit:units(id, name)` but it's never consumed in the field definition.

### 6. Profile Stats

- `completionRate`: `Math.min(95, 70 + Math.floor(Math.random() * 25))` — line 515
- `weeklyStreak`: hardcoded `0` — line 511
- `yearsExperience`: hardcoded `0` — line 572
- PB management: `getAthletePBsAction` joins `exercise:exercises(id, name)` but the component uses raw `PersonalBest` type and shows `Exercise ID: ${pb.exercise_id}` instead of `pb.exercise?.name`

### 7. Dead Code Inventory (Verified)

| File | Status | Safe to Delete |
|------|--------|---------------|
| `AssignmentPanel.tsx` | Zero imports | Yes |
| `ExercisePlanningPanel.tsx` | Zero imports | Yes |
| `workout-session-dashboard.tsx` (V1) | Exported from barrel, zero consumers | Yes (also remove barrel export) |
| `PlanEditClient.tsx` | Returns null, all code commented, deprecated header | Yes |
| `MOCK_PROPOSED_PLAN` in `types.ts` | Prototype data | Yes |
| `PlanReviewOptionC.tsx` | Exported from barrel, zero external consumers | Yes |
| `PlanReviewOptionD.tsx` | Same | Yes |

### 8. UI Pattern Inventory

**`window.location` instances** (9 total): `templates-page.tsx` (5), `PlansHomeClient.tsx` (1), `page-layout.tsx` (1), `IndividualPlanPageWithAI.tsx` (1), `knowledge-base-page.tsx` (1)

**`confirm()` instances** (4 total): `personal-bests-management.tsx`, `templates-page.tsx`, `category-manager.tsx`, `article-editor-page.tsx`

**AlertDialog** already in: `EditTrainingBlockDialog`, `EditMesocycleDialog`, `EditSessionDialog`, `EditRaceDialog`, `EditEventDialog`, `RaceResultsTable`, `SessionPlannerV2`, `workout-session-dashboard`

### 9. Sidebar Architecture

Athlete nav at `app-sidebar.tsx:134-144`:
```typescript
athlete: [
  { label: "Training", items: ["workout", "performance"] },
  { label: "Resources", items: ["exerciseLibrary", "settings"] },
]
```

Nav items defined in `allNavItems` with `visibleTo` arrays. Adding "My Program" requires a new nav item entry with `visibleTo: ['athlete']` and a new URL.
