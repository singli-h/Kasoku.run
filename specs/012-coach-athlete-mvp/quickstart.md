# Quickstart: Coach/Athlete MVP Production Readiness

**Quick reference for implementers** | **Branch**: `012-coach-athlete-mvp`

## Implementation Phases

### Phase 1: Critical Bug Fixes (P0) — Do First
1. **PlanReview snake_case bug** → `PlanReview.tsx:83-89` — change `microcycle_id` to `microcycleId`, `athlete_group_id` to `athleteGroupId`, wrap session in array
2. **Math.random() completionRate** → `profile-actions.ts:515` — replace with real workout_logs query
3. **Templates 404** → `templates-page.tsx:385,430` — remove "View Details" links entirely
4. **Inert PB buttons** → `personal-bests-management.tsx:154,176` — remove or disable "Add PB" buttons
5. **Raw DB IDs in PBs** → `personal-bests-management.tsx:198-205` — use `pb.exercise?.name` from join

### Phase 2: Invite Flow Fix (P0)
1. **Session handler** → `session/page.tsx` — forward `groupId` query param to `/onboarding`
2. **Onboarding wizard** → `onboarding-wizard.tsx` — read `groupId` from `useSearchParams()`
3. **Role selection** → `role-selection-step.tsx` — hide coach/individual when `groupId` present
4. **Complete onboarding action** → `onboarding-actions.ts` — pass `groupId` to RPC
5. **DB migration** → new migration adding `p_group_id` to `complete_onboarding` RPC
6. **Invite action cleanup** → `athlete-actions.ts:1466-1474` — remove broken pending INSERT
7. **Existing-user role update** → `athlete-actions.ts:1381-1415` — add role update for individual→athlete

### Phase 3: Plan Management (P0/P1)
1. **Enable plan delete** → `PlansHomeClient.tsx:130-133` — wire `deleteMacrocycleAction` with AlertDialog
2. **New: Assignment count query** — `getAssignmentCountForMacrocycle` server action
3. **New: Bulk cancel assignments** — `bulkCancelAssignmentsForMacrocycle` server action
4. **Remove disabled items** → remove Duplicate/Export from dropdown
5. **Add `revalidatePath`** to `deleteMacrocycleAction`
6. **Workspace persistence** → wire `handleSaveEvent`/`handleDeleteEvent` to race server actions
7. **Workspace session persist** → wire session edit/delete to server actions
8. **Workspace title persist** → call `updateMacrocycleAction` on rename

### Phase 4: New Features (P1)
1. **My Program page** → new `/program` route for athletes
2. **Sidebar nav** → add "My Program" to athlete sidebar config
3. **Coach athlete profile** → replace disabled buttons, add plan summary + workout history link
4. **Workout UX** → skeleton loading, history link, skip button, post-completion nav, date filter
5. **Dashboard fix** → `getCoachDashboardDataAction` — filter to coach-assigned plans only

### Phase 5: Cleanup (P1)
1. **Dead code removal** — delete 7 files (see list below)
2. **Performance analytics** — hide broken tabs or show "No data" empty state
3. **Coming soon text** — remove all instances
4. **Native confirm()** → replace with AlertDialog (4 instances)
5. **window.location** → replace with `router.push()` (9 instances)
6. **Landing page stats** → remove fake stats
7. **Weight unit** → change `lbs` to `kg` in exercise-card.tsx line 44
8. **Rest timer** → remove rest_time input from exercise card (if present)
9. **Week completion** → fix `WeekSelectorSheet.tsx:84-85` to use real data
10. **Stripe webhook** → disable handler or add TODO comment making it explicit

## Files to Delete

```
apps/web/components/features/plans/workspace/components/AssignmentPanel.tsx
apps/web/components/features/plans/workspace/components/ExercisePlanningPanel.tsx
apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx
apps/web/app/(protected)/plans/[id]/edit/PlanEditClient.tsx
apps/web/components/features/first-experience/PlanReviewOptionC.tsx
apps/web/components/features/first-experience/PlanReviewOptionD.tsx
```

Also clean up barrel exports in:
- `apps/web/components/features/workout/components/pages/index.ts` (remove V1 export)
- `apps/web/components/features/first-experience/index.ts` (remove OptionC/D exports, optionally MOCK_PROPOSED_PLAN)

## Key Patterns to Follow

- **AlertDialog**: Use controlled state pattern (`useState<boolean>`) — see `EditTrainingBlockDialog.tsx` for reference
- **Server actions**: Return `ActionState<T>` type. Call `revalidatePath` for cache invalidation.
- **Navigation**: Use `useRouter().push()` from `next/navigation`, never `window.location.href`
- **Loading states**: Use skeleton components from `@/components/ui/skeleton`
- **Confirmation**: Use `AlertDialog` from `@/components/ui/alert-dialog`, never native `confirm()`

## Dev Commands

```bash
npm run dev:web     # Start dev server
npm run build:web   # Build web app (verify no TS errors)
npm run lint        # Lint all
```
