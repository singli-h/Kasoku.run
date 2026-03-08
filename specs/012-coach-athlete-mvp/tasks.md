# Tasks: Coach/Athlete MVP Production Readiness

**Input**: Design documents from `/specs/012-coach-athlete-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1–US14)
- Exact file paths included in each task description

---

## Phase 1: DB Migrations (Foundational)

**Purpose**: Database changes that block the invite flow. Must be applied before Phase 3.

**⚠️ CRITICAL**: Phase 3 (Invite Flow) cannot begin until both migrations are applied. Phases 2, 4, and 5 have NO dependency on these migrations and can start immediately.

- [x] T001 [P] [US2] Create migration `supabase/migrations/20260218000000_add_group_id_to_onboarding_rpc.sql` — Add `p_group_id INTEGER DEFAULT NULL` parameter to `complete_onboarding` RPC. When `p_group_id` is provided AND `p_role = 'athlete'`: set `athlete_group_id = p_group_id` on athlete INSERT/UPSERT, and create `athlete_group_histories` record with notes `'Joined via invitation link'`. Reference existing RPC at `supabase/migrations/20260111130000_create_complete_onboarding_rpc.sql:88-111` for current function signature. Use `CREATE OR REPLACE FUNCTION` so the migration is idempotent.

- [x] T002 [P] [US2] Create migration `supabase/migrations/20260218000001_add_lookup_user_for_invite_rpc.sql` — Extract the `lookup_user_for_invite` RPC that currently exists only in the Supabase dashboard (not in any migration file) and add it as a tracked migration. This RPC is referenced at `apps/web/actions/athletes/athlete-actions.ts:1365-1375`. Use `CREATE OR REPLACE FUNCTION` with the same signature and body as the dashboard version.

**Checkpoint**: Migrations ready. Apply to Supabase before testing invite flow. Phases 2, 4, 5 can proceed immediately without waiting.

---

## Phase 2: P0 Bug Fixes (US5, US8, US5b — No Dependencies)

**Goal**: Fix data corruption bugs and fake stats that affect every user session right now.

**Independent Test**: Create a plan via the wizard → verify sessions are linked to correct microcycle. View any athlete profile → verify completion rate is stable (not random). View PBs → verify exercise names shown (not IDs). Visit templates page → verify no 404 links.

- [x] T003 [P] [US8] Fix PlanReview snake_case bug in `apps/web/components/features/plans/components/mesowizard/PlanReview.tsx:83-89` — Change the `saveSessionPlanAction` call from spreading session data with snake_case keys to the correct `CreateSessionPlanForm` shape: `{ microcycleId: microcycleId, athleteGroupId: planData.athleteGroupId, sessions: [session] }`. Currently passes `microcycle_id` (snake_case, silently ignored → null) and spreads `SessionPlanData` fields directly instead of wrapping in a `sessions` array. Read `apps/web/actions/plans/session-plan-actions.ts` to verify the expected `CreateSessionPlanForm` interface shape. **FR-030**

- [x] T004 [P] [US5] Fix fake completionRate in `apps/web/actions/profile/profile-actions.ts:515` — Replace `Math.min(95, 70 + Math.floor(Math.random() * 25))` with real workout_logs query. Query: count `workout_logs` where `athlete_id = athleteId` AND `session_status = 'completed'` (numerator), count where `session_status IN ('completed', 'assigned', 'ongoing')` (denominator). Formula: `total > 0 ? Math.round((completed / total) * 100) : 0`. Also at line 511, hide `weeklyStreak` (remove from returned object or set to null — UI should conditionally render). At line 572, compute `yearsExperience` from `user.created_at` using `new Date().getFullYear() - new Date(user.created_at).getFullYear()` or hide if < 1 year. **FR-015, FR-016**

- [x] T005 [P] [US5] Fix PB display in `apps/web/components/features/personal-bests/components/personal-bests-management.tsx` — At lines 198-205, replace raw ID displays (`Exercise ID: ${pb.exercise_id}`, `Event ID: ${pb.event_id}`, `(unit: ${pb.unit_id})`) with joined names. The `getAthletePBsAction` already joins `exercise:exercises(id, name)` — use `pb.exercise?.name ?? 'Unknown Exercise'`. Also remove inert "Add PB" and "Add Manual PB" buttons at lines 154 and 176 (they have no onClick handler). Remove "Edit" button toast at lines 228-234 ("Edit functionality coming in next update"). **FR-017, FR-018**

- [x] T006 [P] [US5b] Remove templates "View Details" 404 links in `apps/web/components/features/plans/components/templates-page.tsx:385,430` — The links navigate to `/templates/${id}` which doesn't exist as a route. Remove the "View Details" buttons/links entirely. Do NOT create the route — templates are P2. **FR-025**

**Checkpoint**: All P0 bugs fixed. Plan wizard saves correctly, stats are real, PBs show names, no 404 links.

---

## Phase 3: Invite Flow Fix (US2 — Depends on Phase 1 Migrations)

**Goal**: End-to-end invite redemption: coach invites email → new user signs up → automatically attached to coach's group with athlete role.

**Independent Test**: Coach sends invite → new user signs up via Clerk link → lands on onboarding with role pre-selected as "athlete" → completes onboarding → appears in coach's group on dashboard.

### Onboarding Chain (Sequential — each step feeds the next)

- [x] T007 [US2] Forward groupId in session handler at `apps/web/app/auth/session/page.tsx` — Find the `router.replace('/onboarding')` call (around line 27-34) and change to `router.replace('/onboarding' + (groupId ? '?groupId=' + groupId : ''))`. Read `groupId` from `searchParams` (this is a Server Component, so use the `searchParams` page prop). **FR-005**

- [x] T008 [US2] Read groupId in onboarding wizard at `apps/web/components/features/onboarding/onboarding-wizard.tsx` — Add `useSearchParams()` from `next/navigation` to read `groupId` query param. Pass `groupId` through the wizard steps as prop or context. Thread it to the final `completeOnboardingAction` call. Since this is a `"use client"` component, `useSearchParams()` works directly. **FR-005b**

- [x] T009 [US2] Hide roles for invited athletes in `apps/web/components/features/onboarding/steps/role-selection-step.tsx` — Accept `groupId` as prop. When `groupId` is present: hide coach and individual role options, pre-select and lock "athlete" role (show it as the only option or show it selected with a message like "You've been invited as an athlete"). The step currently renders all 3 roles equally at lines 36-114. **FR-005c**

- [x] T010 [US2] Pass groupId in completeOnboardingAction at `apps/web/actions/onboarding/onboarding-actions.ts` — Add `groupId?: number` as second parameter to `completeOnboardingAction`. When `groupId` is provided: force `p_role = 'athlete'` in the RPC call regardless of form data, pass `p_group_id: groupId` to the `complete_onboarding` RPC call. See contract: `api-contracts.md` section 1. **FR-007**

### Invite Action Fixes (Sequential — same file)

- [x] T011 [US2] Fix invite Path B in `apps/web/actions/athletes/athlete-actions.ts:1466-1474` — Remove the broken pending athlete INSERT that attempts to create an athlete record with no `user_id` (uses `as any` cast to bypass NOT NULL constraint). After removal, Path B should ONLY create the Clerk invitation via `clerkClient.invitations.createInvitation()` with `redirectUrl` containing `groupId`. The DB record will be created when the athlete completes onboarding (via the RPC updated in T001). **FR-006, FR-035**

- [x] T012 [US2] Fix invite Path A in `apps/web/actions/athletes/athlete-actions.ts:1381-1415` — Add role update for existing users: after setting `athlete_group_id`, also update `users.role` to `'athlete'` IF the current role is `'individual'`. Do NOT update if role is `'coach'` (guard rail — coaches can also be athletes in other groups). Use: `await supabase.from('users').update({ role: 'athlete' }).eq('id', userId).eq('role', 'individual')`. **FR-008, FR-036**

**Checkpoint**: Invite flow works end-to-end. Coach invites → athlete signs up → attached to group with correct role.

---

## Phase 4: Plan Management (US3, US9 — No Dependencies on Phase 1-3)

**Goal**: Enable plan deletion with assignment awareness. Fix workspace data persistence.

**Independent Test**: Coach creates plan, assigns to athlete, attempts delete → sees warning with athlete count. Removes assignments → deletes plan. Also: rename a plan in workspace → refresh → name persists.

### Server Actions (Sequential — same file: `plan-actions.ts`)

- [x] T013 [US3] Add `revalidatePath` to `deleteMacrocycleAction` in `apps/web/actions/plans/plan-actions.ts:394-434` — After the successful delete, add `revalidatePath('/plans', 'page')`. This matches the pattern used by `deleteMesocycleAction` in the same file. **FR-009**

- [x] T014 [US3] Create `getAssignmentCountForMacrocycle` server action in `apps/web/actions/plans/plan-actions.ts` — New exported async function that takes `macrocycleId: number` and returns `ActionState<{ count: number; athleteNames: string[] }>`. Query: join `workout_logs` → `session_plans` → `microcycles` → `mesocycles` → `macrocycles` where `macrocycles.id = macrocycleId` AND `workout_logs.session_status IN ('assigned', 'ongoing')`. Return distinct athlete count and names (join through `athletes` → `users` for `first_name`/`last_name`). See contract: `api-contracts.md` section 4. **FR-010**

- [x] T015 [US3] Create `bulkCancelAssignmentsForMacrocycle` server action in `apps/web/actions/plans/plan-actions.ts` — New exported async function that takes `macrocycleId: number` and returns `ActionState<{ cancelled: number }>`. Update all `workout_logs` with `session_status = 'assigned'` (NOT ongoing or completed) linked to this macrocycle to `session_status = 'cancelled'`. Join through the same chain as T014. See contract: `api-contracts.md` section 5. **FR-010b**

### UI Components (Can start after T013-T015)

- [x] T016 [US3] Create `DeletePlanDialog` component at `apps/web/components/features/plans/home/DeletePlanDialog.tsx` — Follow the `EditTrainingBlockDialog` AlertDialog pattern (controlled state: `open`, `onOpenChange` props). Props: `{ macrocycleId: number, planName: string, open: boolean, onOpenChange: (open: boolean) => void, onDeleted: () => void }`. On open, call `getAssignmentCountForMacrocycle`. If assignments exist: show "This plan is currently assigned to X athlete(s). Remove assignments before deleting." with a "Remove All Assignments" button that calls `bulkCancelAssignmentsForMacrocycle`. Delete button disabled while assignments exist. When no assignments: show "This action is permanent and cannot be undone. Delete this plan?" with enabled Delete button that calls `deleteMacrocycleAction`. Show loading states during async operations. **FR-009, FR-010, FR-010b**

- [x] T017 [US3] Wire delete and clean up `PlansHomeClient.tsx` at `apps/web/components/features/plans/home/PlansHomeClient.tsx` — (1) Import and render `DeletePlanDialog`. Add `useState` for `deleteDialogOpen` and `selectedPlanId`. (2) At lines 130-133, replace the disabled Delete dropdown item with an enabled one that opens the dialog. (3) Remove the disabled Duplicate item entirely. (4) Remove the disabled Export item entirely. (5) Wire `onDeleted` callback to refresh the plan list (router.refresh or state update). **FR-009, FR-011**

### Workspace Persistence (Sequential — same file: `TrainingPlanWorkspace.tsx`)

- [x] T018 [US9] Wire workspace event/race persistence in `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx:480-497` — `handleSaveEvent` currently only updates local React state. Wire it to call the appropriate race server action (create/update race in `races` table). `handleDeleteEvent` same issue — wire to delete race server action. Check if race CRUD actions exist in `apps/web/actions/` — if not, create them. The `races` table has columns: `id, macrocycle_id, user_id, name, date, location, distance`. **FR-031**

- [x] T019 [US9] Wire workspace session edit/delete persistence in `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx:499-537` — Session edit/delete from `EditSessionDialog` currently only updates local state. Wire session delete to call `deleteSessionPlanAction`. Wire session edit/update to call `updateSessionPlanAction` (or appropriate action from `apps/web/actions/plans/session-plan-actions.ts`). Verify these actions exist and return `ActionState<T>`. **FR-031b**

- [x] T020 [US9] Wire workspace plan title rename in `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx:658-665` — Title rename currently only updates local state. Wire to call `updateMacrocycleAction` from `apps/web/actions/plans/plan-actions.ts` with the new name. Add debounce or save-on-blur to avoid excessive API calls. **FR-031c**

**Checkpoint**: Plan delete works with assignment warnings. Workspace changes persist to DB.

---

## Phase 5: New Features (US1, US4, US10, US12, US13 — No Dependencies on Phase 1-4)

**Goal**: Athlete "My Program" page, coach athlete profile improvements, workout UX fixes, dashboard fix.

**Independent Test**: Athlete logs in → sees "My Program" in sidebar → navigates → sees current week + sessions. Coach views athlete profile → sees plan summary + workout history link. Athlete views workout page → sees skeleton loading, history link, skip button.

### Athlete "My Program" Page (US1)

- [x] T021 [US1] Create `getAthleteAssignedPlanAction` server action — Add to `apps/web/actions/plans/plan-actions.ts` (or a new file if plan-actions.ts is getting too large). This action takes no arguments (uses current authenticated user's athlete_group_id). Queries: `macrocycles` where `athlete_group_id` matches the athlete's group → `mesocycles` → `microcycles` → `session_plans`. Also joins `workout_logs` for the current athlete to get completion status per session. Returns current + next week's sessions with completion status. Determine "current week" by comparing `microcycle` dates with today. Return type: `ActionState<{ planName: string, currentWeek: number, totalWeeks: number, sessions: Array<{ id: string, name: string, day: number, week: number, status: 'completed' | 'assigned' | 'ongoing' | 'upcoming' }> }>`. **FR-001, FR-003**

- [x] T022 [US1] Create `/program` page at `apps/web/app/(protected)/program/page.tsx` — Server Component with `allowedRoles: ['athlete']` guard (follow existing pattern from other protected pages). Call `getAthleteAssignedPlanAction`. Render: plan name as heading, current phase/week indicator, session list for current + next week with completion indicators (checkmark for completed, clock for ongoing, circle for upcoming). Empty state when no plan assigned: "No training plan assigned yet. Your coach will assign one when ready." Use skeleton loading pattern from `@/components/ui/skeleton`. **FR-001, FR-002, FR-003, FR-004**

- [x] T023 [US1] Add "My Program" to athlete sidebar at `apps/web/components/layout/sidebar/app-sidebar.tsx` — Add a new entry to `allNavItems` with: `key: 'program'`, `label: 'My Program'`, `icon: <appropriate icon>`, `href: '/program'`, `visibleTo: ['athlete']`. Add `'program'` to the athlete nav config array (currently at lines 134-144) in the "Training" group, positioned before "workout". **FR-002**

### Coach Athlete Profile (US4)

- [x] T024 [P] [US4] Update coach athlete profile at `apps/web/app/(protected)/athletes/[id]/page.tsx` — (1) Remove "These features are coming soon" text at lines 209-224. (2) Remove disabled "Send Message" button entirely (messaging not MVP). (3) Replace disabled "View Schedule" with "View Plan" that links to the athlete's assigned plan (query macrocycle by athlete's group). (4) Replace "View Group" with actual link to the group page. (5) Add plan summary section: plan name, current week, completion rate (use the real completion formula from T004). (6) Add "View Workout History" link that navigates to `/workout/history?athleteId=<id>`. **FR-012, FR-013, FR-014**

### Workout UX Fixes (US12 — Different files, some parallel)

- [x] T025 [P] [US12] Add skeleton loading to workout page at `apps/web/components/features/workout/components/pages/workout-page-content.tsx:87-90` — Replace "Loading workouts..." plain text with proper skeleton components matching the workout card layout. Use `Skeleton` from `@/components/ui/skeleton`. Also add a visible "View History" link/button that navigates to `/workout/history`. **FR-038, FR-039**

- [x] T026 [P] [US12] Add date filter to workout sessions action at `apps/web/actions/workout/workout-session-actions.ts` — In `getTodayAndOngoingSessionsAction`, add date range filter: `.gte('date_time', sevenDaysAgo.toISOString()).lte('date_time', sevenDaysFromNow.toISOString())`. Keep ongoing sessions regardless of date (use `.or()` to include `session_status.eq.ongoing` without date filter). Calculate `sevenDaysAgo` and `sevenDaysFromNow` relative to current date. See contract: `api-contracts.md` section 6. **FR-043c**

- [x] T027 [P] [US12] Add skip workout button in workout UI — Find the workout session card component (likely in `apps/web/components/features/workout/components/pages/workout-page-content.tsx` or a sub-component). Add a "Skip" button that calls `skipWorkoutSessionAction(sessionId)` from `apps/web/actions/workout/workout-session-actions.ts:529`. This action already exists and works — sets status to `cancelled` with "Skipped by athlete" note. Show confirmation via AlertDialog before skipping. **FR-040**

- [x] T028 [US12] Add post-completion navigation — After workout completion modal/flow closes, navigate athlete back to `/workout` using `router.push('/workout')`. Find the completion handler (likely in the workout session detail/execution page). Currently athlete stays on read-only session page with no next step. **FR-041**

### Weight + Rest Timer Fixes (US12, US13)

- [x] T029 [P] [US13] Fix weight unit at `apps/web/components/features/workout/components/exercise/exercise-card.tsx:44` — Change `unit: 'lbs'` to `unit: 'kg'` in the `EXERCISE_FIELDS` static array. Verify all other weight display locations also show `kg` (check `SessionDetailsDialog.tsx` and `SetRow.tsx` — these may already use `kg`). **FR-042**

- [x] T030 [P] [US12] Remove rest timer input from exercise card — In `apps/web/components/features/workout/components/exercise/exercise-card.tsx`, find and remove the `rest_time` input field from the UI. Keep the DB field for future use — this is a display-only removal. **FR-043b**

### Coach Dashboard Fix (US10)

- [x] T031 [P] [US10] Fix coach dashboard active plans count — In `apps/web/actions/dashboard/dashboard-actions.ts`, find `getCoachDashboardDataAction`. The "Active Plans" count currently queries `mesocycles WHERE user_id IN (athleteUserIds)` which includes athletes' personal mesocycles. Fix to only count plans created by the coach (where `macrocycles.user_id = coachUserId`) that are assigned to a group (`macrocycles.athlete_group_id IS NOT NULL`). **FR-032**

**Checkpoint**: Athlete has "My Program" page. Coach sees athlete progress. Workout UX improved. Dashboard counts are correct.

---

## Phase 6: Cleanup (US5b, US6, US7, US14 — Run After All Feature Work)

**Goal**: Remove dead code, placeholder text, broken features, and UI anti-patterns.

**Independent Test**: Navigate every page as each role. Zero "coming soon" text, zero 404s from in-app links, zero inert buttons, no native confirm() dialogs, all navigations use SPA transitions.

### Dead Code Removal (US6 — All parallel, different files)

- [x] T032 [P] [US6] Delete `apps/web/components/features/plans/workspace/components/AssignmentPanel.tsx` — Zero imports, dead stub with hardcoded empty groups and TODO logic. Replaced by `AssignmentView.tsx`. **FR-045**

- [x] T033 [P] [US6] Delete `apps/web/components/features/plans/workspace/components/ExercisePlanningPanel.tsx` — Zero imports, empty exercise library, 5+ TODO stubs. **FR-046**

- [x] T034 [P] [US6] Delete `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx` — V1 dead code with stale data bug (reads `workout_log_sets` at wrong nesting level). Also remove its export from `apps/web/components/features/workout/components/pages/index.ts`. **FR-044**

- [x] T035 [P] [US6] Delete `apps/web/app/(protected)/plans/[id]/edit/PlanEditClient.tsx` — 300+ lines of commented-out code, returns null. **FR-047**

- [x] T036 [P] [US6] Delete `apps/web/components/features/first-experience/PlanReviewOptionC.tsx` and `PlanReviewOptionD.tsx` — Prototype variants, exported from barrel but zero external consumers. Also remove their exports from `apps/web/components/features/first-experience/index.ts`. Optionally remove `MOCK_PROPOSED_PLAN` from `types.ts` (260 lines of prototype data). **FR-048**

### Performance Analytics (US7)

- [x] T037 [P] [US7] Hide broken performance analytics tabs — In `apps/web/components/features/performance/components/comparative-performance-analytics.tsx:104` and `apps/web/components/features/performance/components/individual-performance-analytics.tsx:105-106`, the result is hardcoded to `{ isSuccess: false }`. Either: (a) hide these tabs entirely from the Performance page tab bar, or (b) replace the error state with a "No data available" empty state. Check if Sprint/Gym tabs actually work — if they do, keep those visible. **FR-021**

### "Coming Soon" and Placeholder Removal (US5b — All parallel, different files)

- [x] T038 [P] [US5b] Remove "coming soon" from athlete profile at `apps/web/app/(protected)/athletes/[id]/page.tsx:222` — Remove "These features are coming soon" text. (Note: T024 should have already addressed the disabled buttons — if T024 is complete, verify this text is also removed.) **FR-020**

- [x] T039 [P] [US5b] Remove "Chart visualization coming soon" from `apps/web/components/features/plans/workspace/components/MesocycleEditor.tsx:175` — Remove the placeholder text. Also remove the inert "Duplicate" button (line 55) and "Add Week" button (line 95) that have no onClick handlers. **FR-020, FR-026**

- [x] T040 [P] [US5b] Remove "Add Session" stub in `apps/web/components/features/plans/workspace/components/MicrocycleEditor.tsx:156-159` — The button is a `console.log` stub. Either wire to a real action or remove. **FR-026**

- [x] T041 [P] [US5b] Fix RaceDayManager delete in `apps/web/components/features/plans/workspace/components/RaceDayManager.tsx:121-124` — Delete button is a `console.log` stub. Wire to the race delete server action (should exist after T018). If T018 created race CRUD actions, use them here. **FR-024**

- [x] T042 [P] [US5b] Remove hardcoded plan state "Active" in `apps/web/components/features/plans/home/PlansHome.tsx:115` — State is hardcoded, filter is a no-op. Either remove the state display and filter entirely, or compute state from dates (active = current date between start_date and end_date). Removing is simpler for MVP. **FR-023**

### Native confirm() → AlertDialog (US5b)

- [x] T043 [P] [US5b] Replace `confirm()` in `apps/web/components/features/personal-bests/components/personal-bests-management.tsx` — Replace native `confirm()` with `AlertDialog` from `@/components/ui/alert-dialog`. Follow the controlled state pattern (`useState<boolean>`) from `EditTrainingBlockDialog.tsx`. **FR-028**

- [x] T044 [P] [US5b] Replace `confirm()` in `apps/web/components/features/plans/components/templates-page.tsx` — Same pattern as T043. **FR-028**

- [x] T045 [P] [US5b] Replace `confirm()` in `apps/web/components/features/knowledge-base/components/category-manager.tsx` — Same pattern as T043. **FR-028**

- [x] T046 [P] [US5b] Replace `confirm()` in `apps/web/components/features/knowledge-base/components/article-editor-page.tsx` — Same pattern as T043. **FR-028**

### window.location → router.push (US5b)

- [x] T047 [P] [US5b] Replace `window.location` in `apps/web/components/features/plans/components/templates-page.tsx` (5 instances) — Replace all `window.location.href = '...'` with `router.push('...')` using `useRouter()` from `next/navigation`. If `useRouter` isn't already imported, add it. **FR-029**

- [x] T048 [P] [US5b] Replace `window.location` in `apps/web/components/features/plans/home/PlansHomeClient.tsx` (1 instance) — Same pattern as T047. **FR-029**

- [x] T049 [P] [US5b] Replace `window.location` in `apps/web/components/layout/page-layout.tsx` (1 instance) — Same pattern as T047. **FR-029**

- [x] T050 [P] [US5b] Replace `window.location` in `apps/web/components/features/plans/individual/IndividualPlanPageWithAI.tsx` (1 instance) — Same pattern as T047. **FR-029**

- [x] T051 [P] [US5b] Replace `window.location` in `apps/web/components/features/knowledge-base/components/knowledge-base-page.tsx` (1 instance) — Same pattern as T047. **FR-029**

### Remaining Fixes

- [x] T052 [P] [US5b] Remove fake landing page stats at `apps/web/components/features/landing/about.tsx:16-33` — Remove or replace "95% Success Rate", "4.9/5 User Rating", "Coming Soon" as stat values. Either remove the stats section entirely or replace with non-numerical messaging. **FR-027**

- [x] T053 [P] [US5] Fix WeekSelectorSheet past week completion at `apps/web/components/features/plans/individual/WeekSelectorSheet.tsx:84-86` — Past weeks are faked as 100% complete. Replace with real completion data from `workout_logs` — count completed sessions vs total sessions for each past week. **FR-019**

- [x] T054 [P] [US14] Fix session duration display in `apps/web/components/features/workout/components/pages/SessionDetailsDialog.tsx:135` — `sessionData.duration` is always 0 because `workout_logs` has no `duration` column. Calculate from `completed_at - started_at` if both exist, otherwise hide the duration field. **FR-043**

- [x] T055 [P] [US5b] Disable Stripe webhook handler at `apps/web/app/api/stripe/webhooks/route.ts:41-52` — The handler silently discards `checkout.session.completed` events with no DB persistence. Add a clear `// TODO: Implement subscription persistence when payments are MVP` comment and either return early with a 200, or keep the handler but make the no-op explicit. **FR-049**

**Checkpoint**: Zero dead code, zero placeholders, zero broken navigation. All UI interactions are wired.

---

## Phase 7: Verification

**Purpose**: Build validation and final quality check.

- [x] T056 Run `npm run build:web` — Verify zero TypeScript compilation errors across all changes. Fix any type errors introduced by the modifications.

- [x] T057 Run `npm run lint` — Verify zero linting errors. Fix any that appear.

- [x] T058 Full navigation audit — Use `agent-browser` CLI to walk through every major flow as each role (coach, athlete, individual): (1) Coach: create plan → assign → view athlete profile → delete plan. (2) Athlete: sign up via invite → onboarding → view "My Program" → workout → skip workout. (3) Individual: verify no regressions. Check for: no 404s, no "coming soon" text, no inert buttons, no fake stats, SPA transitions on all navigation.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Migrations) ──────────────────→ Phase 3 (Invite Flow)
                                              │
Phase 2 (P0 Bugs) ─── No dependencies ───────┤
                                              │
Phase 4 (Plan Mgmt) ── No dependencies ──────┤
                                              │
Phase 5 (New Features) No dependencies ──────┤
                                              │
                                              ▼
                                     Phase 6 (Cleanup)
                                              │
                                              ▼
                                     Phase 7 (Verification)
```

- **Phase 1** (Migrations): Start immediately, blocks only Phase 3
- **Phase 2** (P0 Bugs): Start immediately, no dependencies
- **Phase 3** (Invite Flow): Depends on Phase 1 migrations being applied
- **Phase 4** (Plan Management): Start immediately, no dependencies
- **Phase 5** (New Features): Start immediately, no dependencies
- **Phase 6** (Cleanup): Best done after Phases 2-5 to avoid conflicts on shared files
- **Phase 7** (Verification): After all implementation

### Within-Phase Dependencies

| Phase | Sequential Constraint | Reason |
|-------|----------------------|--------|
| Phase 3 | T007 → T008 → T009 → T010 (then T011 → T012) | Onboarding chain; T011/T012 same file |
| Phase 4 | T013 → T014 → T015 (same file), then T016 → T017 | Server actions before UI; T018 → T019 → T020 same file |
| Phase 5 | T021 → T022 → T023 (My Program chain) | Action → page → sidebar |
| Phase 6 | All [P] tasks are independent | Different files |

### Parallel Opportunities

**Maximum parallelism** (all can run simultaneously):

```
Batch 1 (Start immediately — 4 parallel streams):
├── Stream A: Phase 1 (T001, T002) — migrations
├── Stream B: Phase 2 (T003, T004, T005, T006) — all [P], different files
├── Stream C: Phase 4 (T013→T014→T015, then T016→T017, then T018→T019→T020)
└── Stream D: Phase 5 partial (T024, T025, T026, T027, T029, T030, T031) — all [P]

Batch 2 (After Phase 1 migrations applied):
└── Stream E: Phase 3 (T007→T008→T009→T010, T011→T012)

Batch 3 (After Phase 5 action T021 complete):
└── T022 → T023 (My Program page + sidebar)

Batch 4 (After Phases 2-5 complete):
└── Phase 6: All [P] tasks (T032-T055) — maximum parallelism, ~24 independent tasks

Batch 5 (After everything):
└── Phase 7: T056 → T057 → T058
```

---

## Parallel Execution Examples

### Example 1: Launch all Phase 2 bug fixes simultaneously

```
Task (parallel-implementer): "Fix PlanReview snake_case bug — T003 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Fix fake completionRate — T004 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Fix PB display and remove inert buttons — T005 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Remove templates View Details 404 links — T006 from specs/012-coach-athlete-mvp/tasks.md"
```

### Example 2: Launch Phase 5 independent tasks

```
Task (parallel-implementer): "Update coach athlete profile — T024 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Add workout skeleton loading and history link — T025 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Add date filter to workout sessions — T026 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Fix weight unit to kg — T029 from specs/012-coach-athlete-mvp/tasks.md"
Task (parallel-implementer): "Fix coach dashboard active plans count — T031 from specs/012-coach-athlete-mvp/tasks.md"
```

### Example 3: Launch Phase 6 cleanup batch

```
Task (parallel-implementer): "Delete AssignmentPanel dead code — T032"
Task (parallel-implementer): "Delete ExercisePlanningPanel dead code — T033"
Task (parallel-implementer): "Delete workout-session-dashboard V1 — T034"
Task (parallel-implementer): "Delete PlanEditClient dead code — T035"
Task (parallel-implementer): "Delete PlanReviewOptionC/D — T036"
Task (parallel-implementer): "Hide broken performance analytics — T037"
Task (parallel-implementer): "Remove coming soon from MesocycleEditor — T039"
Task (parallel-implementer): "Replace confirm() in PBs — T043"
Task (parallel-implementer): "Replace window.location in templates — T047"
Task (parallel-implementer): "Remove fake landing stats — T052"
```

---

## Notes

- [P] tasks = different files, no dependencies — safe for parallel execution
- [Story] label maps task to user story for traceability
- Each phase has a checkpoint to validate independently
- T003-T006 (Phase 2) are the highest-impact, lowest-risk fixes — start here
- T032-T036 (dead code) are pure deletions with verified zero consumers — safe to parallelize
- T043-T046 (confirm→AlertDialog) all follow the same pattern — parallelize with different implementers
- T047-T051 (window.location→router.push) all follow the same pattern — parallelize
- Total: 58 tasks across 7 phases
