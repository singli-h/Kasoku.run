# Feature Specification: Coach/Athlete MVP Production Readiness

**Feature Branch**: `012-coach-athlete-mvp`
**Created**: 2026-02-17
**Status**: Decisions Resolved — Ready for Planning
**Input**: Comprehensive E2E audit of coach/athlete flow gaps, broken features, placeholder UI, and dead code

## Scope & Exclusions

**In scope**: All fixes needed to make the coach/athlete flow production-ready for MVP
**Excluded**: Knowledgebase, memory features, messaging system, individual role (already complete)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Athlete Views Assigned Training Plan (Priority: P0)

As an athlete with an assigned training plan, I need to see my overall program — what phase I'm in, what week, upcoming sessions — not just isolated workouts with no context.

**Why this priority**: This is the core value prop of coach-athlete. Without plan context, athletes are just logging random workouts. They have zero visibility into periodization, progression, or where they are in their block.

**Current state**: Athletes are completely blocked from `/plans` (`allowedRoles: ['coach', 'individual']` at `apps/web/app/(protected)/plans/page.tsx:13`). Athlete sidebar has no "My Program" link (`apps/web/components/layout/sidebar/app-sidebar.tsx:134-144`). The only path to workouts is `/workout` which shows sessions with no plan hierarchy.

**Independent Test**: Can be tested by logging in as an athlete with an assigned plan and verifying plan details, current week, and session list are visible.

**Acceptance Scenarios**:

1. **Given** an athlete has a plan assigned by their coach, **When** they navigate to "My Program" in the sidebar, **Then** they see their current training block name, phase, current week number, and total weeks
2. **Given** an athlete is on their program page, **When** they view the current week, **Then** they see all sessions for that week with exercise counts and completion status
3. **Given** an athlete has completed some sessions, **When** they view their program, **Then** completed sessions show a checkmark/completion indicator
4. **Given** an athlete has no assigned plan, **When** they navigate to "My Program", **Then** they see an empty state: "No training plan assigned yet. Your coach will assign one when ready."

**Decision (resolved)**:
- [x] **New simplified "My Program" page** — athletes do NOT get access to the existing plan workspace. Build a dedicated read-only page showing: current block name, phase, current week, session list with completion status. Athletes see current + next week only (not full plan timeline).
- [x] Show current week + next week. No access to full plan workspace.

---

### User Story 2 - Coach-to-Athlete Invite Redemption (Priority: P0)

As a coach, when I invite an athlete via email, the athlete should sign up and automatically be connected to my group — without manual intervention.

**Why this priority**: This is the coach/athlete onboarding funnel. If invite redemption is broken, coaches can't get athletes onto the platform. Currently the entire flow is broken end-to-end.

**Current state — 9 gaps identified in deep-dive audit**:

The invite flow is broken at **every single step** for new users:

| Step | What Happens | Gap |
|------|-------------|-----|
| 1. Coach invites | Clerk invitation created with `redirectUrl: /auth/session?groupId=${groupId}` | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/auth/session`, NOT `/onboarding` |
| 2. Athlete clicks link | Clerk authenticates → redirects to `/auth/session?groupId=42` | — |
| 3. Session handler | Checks onboarding status → new user has none → redirects to `/onboarding` | **GAP 1**: `groupId` query param is DROPPED. `router.replace('/onboarding')` has no query forwarding |
| 4. Onboarding wizard | Shows 6-step wizard with role selection | **GAP 2**: Never calls `useSearchParams()`, zero `groupId` references in entire wizard |
| 5. Role selection | Shows all 3 roles equally, no pre-selection | **GAP 6**: Invited athlete could accidentally pick "individual" — no role forcing |
| 6. Complete onboarding | Calls `complete_onboarding` RPC | **GAP 3**: RPC has no `p_group_id` parameter, athletes table INSERT has no `athlete_group_id` |
| 7. Pending record | Created at invite time with `as any` cast | **GAP 4**: `athletes.user_id` is NOT NULL — insert silently fails. No record of intended group |
| 8. Post-onboarding | Athlete lands on `/dashboard` | **GAP 7**: Athlete unattached to any coach group |

Additional gaps:
- **GAP 5**: `lookup_user_for_invite` RPC not in any migration file — deployment reproducibility risk
- **GAP 7b**: Existing-user path assigns group but **doesn't update `users.role`** from "individual" to "athlete"
- **GAP 8**: No Clerk webhook handler for `user.created` — between Clerk signup and onboarding completion, `getDbUserId()` throws on every call
- **GAP 9**: Role cache not invalidated after onboarding (low risk for new users)

**Source files**: `athlete-actions.ts:1306-1503`, `session/page.tsx`, `onboarding-wizard.tsx`, `onboarding-actions.ts:116-216`, `20260111130000_create_complete_onboarding_rpc.sql:88-111`

**Independent Test**: Coach invites email → new user signs up → verify they appear in coach's group and have athlete role.

**Acceptance Scenarios**:

1. **Given** a coach invites a new email address, **When** that person signs up via the Clerk invitation link, **Then** they are automatically assigned the "athlete" role and attached to the coach's group
2. **Given** a coach invites an existing user, **When** that user is already on the platform, **Then** they are attached to the coach's group without re-onboarding AND their role is updated to "athlete" if needed
3. **Given** an athlete completes onboarding via invite, **When** they reach the session handler, **Then** they are redirected to `/dashboard` (not `/plans` like individual)
4. **Given** a pending invitation exists, **When** the invited user signs up, **Then** they are properly linked to their coach's group (no orphaned records, no corrupt `training_goals` data)
5. **Given** an invited user is on the role selection step, **When** they were invited as an athlete, **Then** their role is pre-selected as "athlete" and they cannot change it

**Decision (resolved)**:
- [x] **Invited athletes go through onboarding** — they still need account setup, basic profile, preferences. But the experience is streamlined:
  - Role selection step: **hide coach/individual options entirely** for invited athletes. Athlete role is forced/pre-selected and locked. They cannot accidentally pick another role.
  - Skip subscription/tour steps (not relevant for invited athletes).
  - After onboarding completes, athlete is automatically attached to coach's group.
- [x] **Thread `groupId` through the UI flow** (lean approach, no webhook needed):
  - Session handler forwards `groupId` query param to `/onboarding?groupId=X`
  - Onboarding wizard reads `groupId` from `useSearchParams()`
  - `completeOnboardingAction` passes `groupId` to `complete_onboarding` RPC
  - RPC creates athlete record with `athlete_group_id` set
- [x] No Clerk webhook — keep it simple, thread through UI.

---

### User Story 3 - Coach Deletes a Training Plan (Priority: P0)

As a coach, I need to delete training plans I no longer need. Currently there is no way to remove plans.

**Why this priority**: Without delete, coaches accumulate dead plans and can't manage their workspace. This is basic CRUD.

**Current state**: Delete dropdown item exists but is `disabled` at `PlansHomeClient.tsx:130-133`. Duplicate and Export also disabled.

**Backend status (from plan management audit)**:
- `deleteMacrocycleAction` **EXISTS and is complete** (`plan-actions.ts:394-434`) — deletes the macrocycle row, relies on DB cascades
- `deleteMesocycleAction` **EXISTS with manual cascade** (`plan-actions.ts:757-877`) — manually deletes sets → exercises → sessions → microcycles → mesocycle
- `deleteMicrocycleAction` **EXISTS** (`plan-actions.ts:1262-1326`) — blocks deletion if sessions exist
- **The only blocker is the disabled UI button** — the backend is ready

**Independent Test**: Coach creates a plan, then deletes it from the plans list.

**Acceptance Scenarios**:

1. **Given** a coach has a plan with no active assignments, **When** they click Delete from the plan dropdown, **Then** a confirmation dialog appears showing plan name and warning "This action is permanent and cannot be undone. Delete this plan?"
2. **Given** a coach has a plan with active assignments, **When** they click Delete, **Then** the dialog shows: "This plan is currently assigned to X athlete(s). Remove assignments before deleting." with the Delete button disabled until assignments are removed.
3. **Given** a coach confirms deletion on an unassigned plan, **When** they click the final "Delete" button, **Then** the macrocycle and all children are hard-deleted via `deleteMacrocycleAction`
4. **Given** a plan is deleted, **When** the coach returns to the plans list, **Then** the plan is no longer visible and a success toast confirms deletion

**Decision (resolved)**:
- [x] **Hard delete** via existing `deleteMacrocycleAction` (DB cascades handle children). No soft-delete/archive for MVP.
- [x] **Require removing assignments first** — if plan has active assignments, show warning: "This plan is assigned to X athletes. Remove assignments first." Coach must unassign before deleting.
- [x] **Do NOT enable Duplicate** — not needed for MVP. Remove the disabled dropdown item entirely (along with Export).

---

### User Story 4 - Coach Views Athlete Progress & Workout History (Priority: P1)

As a coach, when I view an athlete's profile, I need to see their training progress — completed workouts, missed sessions, performance trends.

**Why this priority**: Core coaching value. Without progress visibility, coaches are blind to whether athletes are actually following the plan.

**Current state**: Athlete profile page (`athletes/[id]/page.tsx`) shows basic stats card but "Send Message", "View Schedule", "View Group" buttons are all `disabled` with visible **"These features are coming soon"** text (lines 209-224). No link to athlete's plan or workout history anywhere.

**Independent Test**: Coach navigates to athlete profile and sees workout completion data.

**Acceptance Scenarios**:

1. **Given** a coach views an athlete's profile, **When** the athlete has an assigned plan, **Then** the coach sees the plan name, current week, and session completion rate (e.g., "8/12 sessions completed")
2. **Given** a coach views an athlete's profile, **When** the athlete has workout history, **Then** the coach sees a list of recent workouts with dates and completion status
3. **Given** a coach views an athlete's profile, **When** the athlete has logged workout data (sets/reps/weights), **Then** the coach can drill into individual sessions to see detailed logs
4. **Given** a coach views an athlete with no assigned plan, **When** they view the profile, **Then** they see "No plan assigned" with a quick action to assign one

**Decision (resolved)**:
- [x] **Summary on athlete profile page** — show plan name, current week, completion rate (completed/total sessions) directly on the existing athlete profile. No separate progress page for MVP.
- [x] **Reuse workout history components** — "View workout history" links to the existing `/workout/history` page filtered by athlete ID. Coach sees the same history view athletes see.
- [x] **Completion rate formula**: `completed / (completed + assigned + ongoing)`. Cancelled/skipped sessions excluded from denominator.
- [x] Replace disabled "View Schedule" button with "View Plan" linking to athlete's assigned plan. Replace "View Group" with actual group link. Remove "Send Message" button entirely (messaging not MVP).

---

### User Story 5 - Fix Fake/Broken Stats and Data Display (Priority: P0)

Multiple stats shown to users are either calculated with `Math.random()`, hardcoded to 0, or display raw database IDs.

**Why this priority**: This is **P0, not P1**. Fake data in production destroys user trust instantly. A completion rate that changes every page load is worse than no stat at all.

**Current state**:
- `profile-actions.ts:515` — **completionRate = 70 + Math.random() * 25** — changes every page load, completely fake
- `profile-actions.ts:511,572` — `weeklyStreak` hardcoded to `0`, `yearsExperience` hardcoded to `0` — every profile shows "0"
- `training-session-actions.ts:1074` — `streak_days: 0` — same
- `personal-bests-management.tsx:198-205` — Shows raw DB IDs to users: "Exercise ID: 3", "Event ID: 7", "(unit: 2)"
- `personal-bests-management.tsx:228-234` — Edit button shows toast: "Edit functionality coming in next update"
- `personal-bests-management.tsx:154,176` — "Add PB" / "Add Manual PB" buttons have **no onClick handler at all**
- `WeekSelectorSheet.tsx:84-86` — Past weeks faked as 100% complete regardless of actual completion

**Acceptance Scenarios**:

1. **Given** an athlete profile is viewed, **When** completion rate is displayed, **Then** it is calculated from actual `workout_logs` (completed/total), not `Math.random()`
2. **Given** personal bests are displayed, **When** viewing the list, **Then** exercise names and event names are shown (not raw IDs)
3. **Given** a user views personal bests, **When** "Add PB" is not functional, **Then** the button is removed (not shown as clickable but inert)
4. **Given** week completion is shown, **When** past weeks are displayed, **Then** completion is based on actual session completion data

---

### User Story 5b - Remove "Coming Soon", Placeholder UI, and Guaranteed 404s (Priority: P1)

As a user (any role), I should never see "coming soon", placeholder text, broken features, or hit 404 pages from in-app navigation.

**Why this priority**: Placeholders in production signal an unfinished product. 404s from in-app links are unacceptable.

**Current state (comprehensive list from UI audit)**:

**User-visible "coming soon" / disabled text:**
- `athletes/[id]/page.tsx:222` — "These features are coming soon" text
- `MesocycleEditor.tsx:175` — "Chart visualization coming soon"
- `personal-bests-management.tsx:228` — Edit button title: "coming soon"
- `article-editor-page.tsx:154-160` — KB preview: "will be implemented next"

**Hardcoded failures:**
- `comparative-performance-analytics.tsx:104` — Permanently returns error
- `individual-performance-analytics.tsx:105-106` — Same
- `PlansHome.tsx:115` — State hardcoded as "Active" (filter is a no-op)

**Guaranteed 404s:**
- `templates-page.tsx:385,430` — "View Details" navigates to `/templates/${id}` which doesn't exist

**Buttons that do nothing (no onClick handler):**
- `MesocycleEditor.tsx:55,95` — "Duplicate" and "Add Week" buttons
- `MicrocycleEditor.tsx:156-159` — "Add Session" button (console.log stub)
- `RaceDayManager.tsx:121-124` — "Delete" button (console.log stub)

**Other:**
- `PlansHomeClient.tsx:121-131` — Disabled dropdown items with no visual indication
- `templates-page.tsx:223` — "Loading templates..." bare text
- `landing/about.tsx:16-33` — Fake social proof: "95% Success Rate", "4.9/5 User Rating", "Coming Soon" as stat values
- Multiple files — Native `confirm()` dialogs instead of custom modals
- Multiple files — `window.location.href` instead of Next.js router (causes full page reload)

**Acceptance Scenarios**:

1. **Given** any user navigates any page, **When** they interact with the UI, **Then** no "coming soon" or placeholder text is visible
2. **Given** a button is visible, **When** clicked, **Then** it either does something or is removed from the UI
3. **Given** the templates page is shown, **When** "View Details" is clicked, **Then** it does NOT 404
4. **Given** the landing page is public, **When** stats are shown, **Then** they are either real or removed
5. **Given** a destructive action needs confirmation, **When** the dialog shows, **Then** it uses a styled modal (not native `confirm()`)

---

### User Story 6 - Remove Dead Stub Components and Dead Code (Priority: P1)

Dead code that renders empty states, stubs, or has stale bugs should be removed.

**Why this priority**: These components either render confusing empty UIs, have latent bugs, or could be accidentally used.

**Current state**:
- `AssignmentPanel.tsx:17-82` — Hardcoded empty groups array, TODO logic — dead code (replaced by `AssignmentView.tsx`)
- `ExercisePlanningPanel.tsx:45-209` — Empty exercise library, 5+ TODO stubs, never imported anywhere
- `RaceDayManager.tsx:122` — Delete event is a TODO (can add but can't remove race events)
- `workout-session-dashboard.tsx` (V1) — Dead code, replaced by `WorkoutSessionDashboardV2.tsx`. Has a stale data bug: reads `workout_log_sets` at top level but data nests under `workout_log_exercises`

**Acceptance Scenarios**:

1. **Given** AssignmentPanel is dead code, **When** it is removed, **Then** no imports break and plan workspace renders correctly
2. **Given** ExercisePlanningPanel is never imported, **When** it is removed, **Then** nothing changes
3. **Given** V1 WorkoutSessionDashboard is unreachable via routing, **When** it is removed, **Then** no imports break
4. **Given** RaceDayManager has no delete, **When** a coach adds a race event, **Then** they can also delete it (or add is disabled until delete is implemented)

---

### User Story 7 - Fix Performance Analytics or Hide Gracefully (Priority: P1)

As any user, the Performance page should either work or gracefully hide unavailable features — not show error states.

**Why this priority**: The Performance page currently shows errors to ALL roles because data fetching is hardcoded to fail. This affects individual users too.

**Current state**:
- `comparative-performance-analytics.tsx:104` — `const result = { isSuccess: false, message: "Performance analytics temporarily disabled" }`
- `individual-performance-analytics.tsx:105-106` — Same pattern
- Sprint and Gym analytics tabs may or may not work (need to verify if their data actions are functional)

**Independent Test**: Navigate to /performance as any role, verify no error states for available data.

**Acceptance Scenarios**:

1. **Given** Sprint/Gym analytics are functional, **When** users visit Performance, **Then** those tabs show real data
2. **Given** Compare tab analytics is not ready, **When** users would see the Compare tab, **Then** the tab is hidden entirely from the UI
3. **Given** Individual analytics is not ready, **When** it would be displayed, **Then** it is hidden or shows "No data available" (not an error)

---

### User Story 8 - Fix Plan Creation Wizard Session Linking Bug (Priority: P0)

Sessions created via the MesoWizard review step are NOT linked to their microcycle due to a field name mismatch.

**Why this priority**: This silently corrupts data. Coaches create plans via the wizard, sessions appear to save, but they're orphaned in the DB with no microcycle association.

**Current state**: `PlanReview.tsx:84-90` passes `microcycle_id` (snake_case) but `saveSessionPlanAction` expects `microcycleId` (camelCase). Same issue with `athlete_group_id` vs `athleteGroupId`. Sessions are created but unlinked.

**Acceptance Scenarios**:

1. **Given** a coach completes the plan wizard with sessions, **When** the plan is saved, **Then** all sessions are correctly linked to their microcycle in the DB
2. **Given** a session is linked to a microcycle, **When** viewing the plan workspace, **Then** sessions appear under their correct week

---

### User Story 9 - Fix Workspace Event/Race Persistence (Priority: P1)

Race events created/edited/deleted in the plan workspace are not persisted to the database.

**Why this priority**: Coaches can add race events visually, but they disappear on page refresh. Silent data loss.

**Current state**: `TrainingPlanWorkspace.tsx:480-497` — `handleSaveEvent` and `handleDeleteEvent` only update React local state. No server action is called. The `races` table exists in the DB but workspace CRUD doesn't use it.

**Acceptance Scenarios**:

1. **Given** a coach adds a race event in the workspace, **When** they refresh the page, **Then** the event persists
2. **Given** a coach deletes a race event, **When** they refresh the page, **Then** the event is gone

---

### User Story 10 - Fix Coach Dashboard Active Plans Count (Priority: P1)

The coach dashboard "Active Plans" count is wrong — it counts ALL mesocycles by athlete user IDs, including personal ones.

**Why this priority**: Misleading data on the primary dashboard view. A coach with 5 athletes who each have personal plans would see inflated counts.

**Current state**: `getCoachDashboardDataAction` queries `mesocycles WHERE user_id IN (athleteUserIds)` — this includes mesocycles the athletes created themselves, not just ones assigned by the coach.

**Acceptance Scenarios**:

1. **Given** a coach views their dashboard, **When** "Active Plans" is displayed, **Then** it only counts plans the coach created and assigned, not athletes' personal plans

---

### User Story 11 - Fix Template System Data Model Mismatch (Priority: P2)

The templates page UI expects fields that don't exist in the database.

**Why this priority**: The template system renders but filters don't work and stats are always empty. Low priority because templates are a secondary feature.

**Current state**: `TemplateWithStats` interface expects `usage_count`, `avg_rating`, `creator_name`, `difficulty_level`, `category` — none of these exist in `session_plans` table. Template search uses `template.description` instead of `template.name`. Route `/templates/${id}` doesn't exist. `handleUseTemplate` redirects to `/plans?template=${id}` but plans page ignores the query param.

**Acceptance Scenarios**:

1. **Given** the templates page renders, **When** users search or filter, **Then** it works against real data (or filters are removed)
2. **Given** a user clicks "Use Template", **When** redirected, **Then** the template is actually applied

---

### User Story 12 - Athlete Workout UX Fixes (Priority: P1)

Several workout execution UX issues identified in deep-dive audit.

**Why this priority**: The workout page is the primary athlete interaction. These issues affect daily use.

**Current state**:
- `/workout` loading state is bare "Loading workouts..." text (no skeleton) — `workout-page-content.tsx:87-90`
- No nav link to `/workout/history` — history page exists but is only reachable from empty state or manual URL
- No "Skip workout" button — `skipWorkoutSessionAction()` exists at `workout-session-actions.ts:529` but has zero UI surface
- No post-completion flow — after finishing, athlete stays on `/workout/[id]` in read-only mode with no next step
- No date filter on assigned workouts query — athletes see ALL ever-assigned workouts, not just current week

**Acceptance Scenarios**:

1. **Given** `/workout` is loading, **When** data fetches, **Then** a skeleton matching the card layout is shown (not plain text)
2. **Given** an athlete has completed workouts, **When** viewing the workout list, **Then** there is a visible link to "View History"
3. **Given** an athlete doesn't want to do a workout, **When** they view the session card, **Then** they can skip it (marks as cancelled)
4. **Given** an athlete finishes a session, **When** completion modal closes, **Then** they are navigated back to `/workout` or shown their next session

**Decision (resolved)**:
- [x] **No rest timer** — remove the rest timer input entirely. Not MVP scope. (Remove `rest_time` input from exercise card UI, keep DB field for future use.)
- [x] **Filter by date range** — show recent (past 7 days) + coming (next 7 days). This gives athletes a focused view of current + upcoming workouts without drowning in old assignments.

---

### User Story 13 - Fix Weight Unit Inconsistency (Priority: P1)

Weight units are inconsistent across the app — `lbs` in one view, `kg` in others.

**Why this priority**: Data integrity issue. Athletes input weight in one unit and see it displayed in another.

**Current state**:
- `exercise-card.tsx:44` — hardcoded `unit: 'lbs'`
- `SessionDetailsDialog` and `SetRow.tsx` — display `kg`
- Database stores raw numbers with no unit column

**Acceptance Scenarios**:

1. **Given** an athlete enters weight data, **When** they view it in history, **Then** the same unit is shown consistently
2. **Given** the app uses a default unit, **When** displaying weight anywhere, **Then** the unit is consistent across all views

**Decision (resolved)**:
- [x] **kg globally** — hardcode metric (kg) everywhere. No user preference toggle for MVP. Fix `exercise-card.tsx:44` from `lbs` to `kg`.

---

### User Story 14 - Fix Duration Display in History (Priority: P2)

Session duration always shows 0 in the workout history detail dialog.

**Why this priority**: Minor but visible data display issue.

**Current state**: `SessionDetailsDialog.tsx:135` reads `sessionData.duration` but `workout_logs` table has no `duration` column — always returns `null`/0.

**Acceptance Scenarios**:

1. **Given** an athlete completed a workout, **When** viewing history details, **Then** duration is calculated from start to completion time (or the field is hidden if unavailable)

---

### Edge Cases

- What happens if a coach deletes a plan that's currently assigned and an athlete is mid-workout?
- What happens if an athlete is in multiple groups (transferred between coaches)?
- What happens if an athlete signs up organically (no invite) and a coach later wants to add them?
- What happens if a Clerk invitation expires before the athlete signs up?
- What happens if the same email is invited to multiple groups by different coaches?
- What happens if an athlete's only plan is deleted — what does their "My Program" show?
- What happens if an athlete is removed from a group mid-plan? (Currently: past workouts → cancelled, future → deleted)
- What happens if a coach renames a plan in the workspace? (Currently: local state only, not persisted)
- What happens if an athlete has 100+ unstarted workouts from old assignments? (No date filter currently)

---

## Requirements *(mandatory)*

### Functional Requirements

**Athlete Plan View**
- **FR-001**: System MUST provide athletes a read-only view of their assigned training plan with block name, phase, week, and session list
- **FR-002**: System MUST add a "My Program" or equivalent navigation item to the athlete sidebar
- **FR-003**: System MUST show session completion status (completed/upcoming/missed) in the athlete's plan view
- **FR-004**: System MUST show an appropriate empty state when no plan is assigned

**Invite Redemption (thread `groupId` through UI, no webhook)**
- **FR-005**: Session handler (`/auth/session`) MUST forward `groupId` query param to `/onboarding?groupId=X`
- **FR-005b**: Onboarding wizard MUST read `groupId` from `useSearchParams()` and pass to `completeOnboardingAction`
- **FR-005c**: When `groupId` is present, role selection MUST hide coach/individual options — only show "athlete" (pre-selected, locked)
- **FR-006**: System MUST NOT create orphaned athlete records with corrupt data in `training_goals`
- **FR-007**: `complete_onboarding` RPC MUST accept `p_group_id` and set `athlete_group_id` when provided
- **FR-008**: System MUST handle both new user invitations and existing user attachments correctly

**Plan Management**
- **FR-009**: System MUST allow coaches to delete plans (with confirmation dialog showing plan name + permanent warning)
- **FR-010**: Delete dialog MUST query and display active assignment count. If assignments exist, Delete button is disabled with message: "Assigned to X athlete(s). Remove assignments first."
- **FR-010b**: Delete dialog MUST provide a "Remove All Assignments" action that bulk-unassigns athletes from the plan (sets `workout_logs.session_status` to `cancelled` for unstarted sessions)
- **FR-010c**: Completed `workout_logs` (status `completed`) MUST be preserved even after plan deletion — FK `ON DELETE SET NULL` or equivalent to keep historical workout data intact
- **FR-011**: System MUST remove Duplicate and Export dropdown items entirely (not MVP)

**Coach Athlete Visibility**
- **FR-012**: Coach MUST be able to view an athlete's assigned plan from the athlete profile
- **FR-013**: Coach MUST be able to view an athlete's workout completion history
- **FR-014**: System MUST remove "coming soon" text from athlete profile quick actions

**Fake/Broken Stats (P0)**
- **FR-015**: Completion rate MUST be calculated from actual `workout_logs` data, NOT `Math.random()` (`profile-actions.ts:515`)
- **FR-016**: `weeklyStreak` and `yearsExperience` MUST be either calculated from real data or hidden (not show 0)
- **FR-017**: Personal bests MUST display exercise/event names, NOT raw database IDs
- **FR-018**: "Add PB" buttons MUST either have functional onClick handlers or be removed
- **FR-019**: Week completion MUST use actual session completion data, NOT assume past = 100%

**UI Cleanup**
- **FR-020**: System MUST remove all user-visible "coming soon" and placeholder text
- **FR-021**: System MUST remove or hide broken performance analytics tabs
- **FR-022**: System MUST remove dead stub components (AssignmentPanel, ExercisePlanningPanel)
- **FR-023**: System MUST remove hardcoded plan state "Active" — either implement state or remove filter
- **FR-024**: RaceDayManager MUST support event deletion, or add UI must be disabled
- **FR-025**: Templates "View Details" MUST NOT navigate to non-existent `/templates/[id]` route — **remove the link for MVP** (P0 fix even though broader template work is P2 per US11)
- **FR-026**: All clickable buttons MUST have onClick handlers or be removed (MesocycleEditor Duplicate/Add Week, MicrocycleEditor Add Session)
- **FR-027**: Landing page MUST remove fake social proof stats ("95% Success Rate", "4.9/5 rating") or use real data
- **FR-028**: Native `confirm()` dialogs MUST be replaced with styled modals
- **FR-029**: `window.location.href` navigations MUST use Next.js router for SPA transitions

**Bug Fixes (from deep-dive audits)**
- **FR-030**: `PlanReview.tsx` MUST use correct camelCase field names (`microcycleId`, `athleteGroupId`) when calling `saveSessionPlanAction`
- **FR-031**: Workspace event/race CRUD MUST persist to DB via server actions (not just local state)
- **FR-031b**: Workspace session edit/delete MUST persist to DB via server actions (not just local state) — `TrainingPlanWorkspace.tsx:499-537`
- **FR-031c**: Workspace plan title rename MUST call `updateMacrocycleAction` (not just local state) — `TrainingPlanWorkspace.tsx:658-665`
- **FR-032**: Coach dashboard "Active Plans" count MUST only include coach-assigned plans, not athletes' personal mesocycles
- ~~FR-033~~: *(consolidated into FR-005/FR-005b/FR-005c — groupId threading)*
- ~~FR-034~~: *(consolidated into FR-007 — RPC p_group_id)*
- **FR-035**: Invite action MUST NOT create orphaned athlete records with `as any` cast — remove the broken pending-athlete INSERT
- **FR-036**: Existing-user invite path MUST update `users.role` to "athlete" ONLY if user is currently "individual". If user is "coach", attach to group without role change.
- **FR-037**: `lookup_user_for_invite` RPC MUST be added to tracked migrations

**Workout Execution Fixes**
- **FR-038**: `/workout` page MUST show skeleton loading state, not plain text
- **FR-039**: `/workout` page MUST include a visible link to `/workout/history`
- **FR-040**: Athlete MUST be able to skip/cancel an assigned workout via UI (using existing `skipWorkoutSessionAction`)
- **FR-041**: After workout completion, athlete MUST be navigated back to workout list or shown next session
- **FR-042**: Weight unit MUST be `kg` globally across all views (exercise card, history dialog, set rows) — no user preference toggle for MVP
- **FR-043**: Session duration in history MUST be calculated or hidden (not show 0)
- **FR-043b**: Rest timer input MUST be removed from exercise card UI (not MVP, keep DB field for future)
- **FR-043c**: Assigned workouts query MUST filter to past 7 days + next 7 days (not all-time)

**Dead Code Removal**
- **FR-044**: V1 `workout-session-dashboard.tsx` MUST be removed (dead code, stale data bug)
- **FR-045**: `AssignmentPanel.tsx` MUST be removed (dead code, replaced by `AssignmentView.tsx`)
- **FR-046**: `ExercisePlanningPanel.tsx` MUST be removed (dead code, never imported)
- **FR-047**: `PlanEditClient.tsx` MUST be removed (300+ lines of commented-out code, returns null)
- **FR-048**: `MOCK_PROPOSED_PLAN` in `first-experience/types.ts` MUST be removed (260 lines of prototype data)

**Stripe/Payments**
- **FR-049**: Stripe webhook handler MUST persist subscription state to DB, or be disabled if payments are not MVP (currently silently no-ops on `checkout.session.completed`)

**Templates (P2 — post-MVP acceptable)**
- **FR-050**: Template page filters MUST either query real data fields or be removed
- **FR-051**: Template search MUST use `template.name`, not `template.description`

### Key Entities

**Data model hierarchy (from DB schema audit)**:
```
users (clerk_id, role: 'coach'|'athlete'|'individual')
  ├── coaches (user_id → users.id) [1:1]
  │     └── athlete_groups (coach_id → coaches.id) [1:N]
  │           └── athletes.athlete_group_id → athlete_groups.id [N:1, SET NULL on delete]
  │
  └── athletes (user_id → users.id) [1:1]

macrocycles (user_id, athlete_group_id?)
  └── mesocycles (macrocycle_id, user_id)
        └── microcycles (mesocycle_id, user_id)
              └── session_plans (microcycle_id, user_id) [UUID PK]
                    └── session_plan_exercises (session_plan_id) [UUID PK]
                          └── session_plan_sets (session_plan_exercise_id) [UUID PK]

workout_logs (athlete_id, session_plan_id, session_status: 'assigned'|'ongoing'|'completed'|'cancelled') [UUID PK]
  └── workout_log_exercises (workout_log_id) [UUID PK]
        └── workout_log_sets (workout_log_exercise_id) [UUID PK]
```

**Key notes**:
- No `status`/`state` column on macrocycles or mesocycles — "active" is date-derived
- `athlete_cycles` table exists but is entirely unused (dead weight)
- Coaches get BOTH a `coaches` record AND a minimal `athletes` record (so they can train themselves)
- Athletes can only belong to ONE group at a time (single FK, nullable)
- `macrocycles.athlete_group_id` only supports one group (MVP limitation)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An athlete invited by a coach can sign up and see their assigned plan within 5 minutes of invite acceptance
- **SC-002**: A coach can create a plan, assign it to athletes, and view their completion progress — full loop works end-to-end
- **SC-003**: Zero instances of "coming soon", "temporarily disabled", or placeholder text visible in production UI
- **SC-004**: All CRUD operations on plans are functional (create, read, update, delete)
- **SC-005**: No dead stub components render empty/broken states in any view
- **SC-006**: Performance page shows either real data or graceful empty states — no error banners
- **SC-007**: All displayed stats (completion rate, streak, experience) are based on real data — no `Math.random()` or hardcoded zeros
- **SC-008**: No in-app navigation leads to a 404 page
- **SC-009**: No clickable button produces zero response (no missing onClick handlers)

---

## Appendix A: Complete Issue Registry

### P0 — MVP Blockers

| # | File | Line(s) | Issue | Category |
|---|------|---------|-------|----------|
| 1 | `apps/web/app/(protected)/plans/page.tsx` | 13 | Athlete role blocked from plans entirely | Athlete plan view |
| 2 | `apps/web/components/layout/sidebar/app-sidebar.tsx` | 134-144 | No "My Program" nav for athlete role | Athlete plan view |
| 3 | `apps/web/app/auth/session/page.tsx` | 27-34 | Drops `groupId` query param on redirect to `/onboarding` | Invite flow |
| 4 | `apps/web/components/features/onboarding/onboarding-wizard.tsx` | (entire file) | Never calls `useSearchParams()`, zero `groupId` references | Invite flow |
| 5 | `apps/web/components/features/onboarding/steps/role-selection-step.tsx` | 36-114 | No role pre-selection for invited athletes | Invite flow |
| 6 | `apps/web/actions/onboarding/onboarding-actions.ts` | 116-216 | `completeOnboardingAction` has no `groupId` param | Invite flow |
| 7 | `supabase/migrations/20260111130000_create_complete_onboarding_rpc.sql` | 88-111 | RPC has no `p_group_id` parameter | Invite flow |
| 8 | `apps/web/actions/athletes/athlete-actions.ts` | 1466-1474 | Pending athlete insert fails (missing `user_id` NOT NULL), `as any` cast | Invite flow |
| 9 | `apps/web/actions/athletes/athlete-actions.ts` | 1381-1415 | Existing-user invite doesn't update `users.role` | Invite flow |
| 10 | `apps/web/components/features/plans/home/PlansHomeClient.tsx` | 130-133 | Delete button disabled — backend action exists but no UI trigger | Plan delete |
| 11 | `apps/web/components/features/plans/components/mesowizard/PlanReview.tsx` | 84-90 | `microcycle_id` (snake) vs `microcycleId` (camel) — sessions unlinked | Wizard bug |
| 12 | `apps/web/actions/profile/profile-actions.ts` | 515 | **completionRate = Math.random()** — fake stat shown to users | Fake data |
| 13 | `apps/web/components/features/personal-bests/components/personal-bests-management.tsx` | 154,176 | "Add PB" / "Add Manual PB" buttons have NO onClick handler | Dead button |
| 14 | `apps/web/components/features/personal-bests/components/personal-bests-management.tsx` | 198-205 | Shows raw DB IDs: "Exercise ID: 3", "Event ID: 7", "(unit: 2)" | Raw IDs |
| 15 | `apps/web/components/features/plans/components/templates-page.tsx` | 385,430 | "View Details" navigates to `/templates/${id}` — route doesn't exist, guaranteed 404 | 404 |
| 16 | `apps/web/app/api/stripe/webhooks/route.ts` | 41-52 | Stripe subscription events silently discarded — no DB persistence | Payments broken |

### P1 — Should Fix for MVP

| # | File | Line(s) | Issue | Category |
|---|------|---------|-------|----------|
| 17 | `apps/web/app/(protected)/athletes/[id]/page.tsx` | 209-224 | "These features are coming soon" visible text + 3 disabled buttons | Placeholder |
| 18 | `apps/web/components/features/plans/workspace/components/MesocycleEditor.tsx` | 55,95,175 | "Chart visualization coming soon" + Duplicate/Add Week buttons have NO onClick | Placeholder + dead buttons |
| 19 | `apps/web/components/features/plans/home/PlansHome.tsx` | 115 | State hardcoded as "Active" — state filter is a no-op | Placeholder |
| 20 | `apps/web/components/features/performance/components/comparative-performance-analytics.tsx` | 104-105 | Hardcoded failure: `"Performance analytics temporarily disabled"` | Broken feature |
| 21 | `apps/web/components/features/performance/components/individual-performance-analytics.tsx` | 105-106 | Same hardcoded failure | Broken feature |
| 22 | `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` | 480-497 | Race/event create/edit/delete only updates local state — no server persistence | Data loss |
| 23 | `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` | 499-537 | Session edit/delete from EditSessionDialog — local state only | Data loss |
| 24 | `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx` | 658-665 | Plan title rename — local state only, doesn't call `updateMacrocycleAction` | Data loss |
| 25 | `apps/web/actions/dashboard/dashboard-actions.ts` | — | Coach "Active Plans" counts all athlete mesocycles, not just assigned ones | Logic bug |
| 26 | `apps/web/components/features/plans/workspace/components/AssignmentPanel.tsx` | 17-82 | Dead stub: hardcoded empty groups, TODO assignment logic, never rendered | Dead code |
| 27 | `apps/web/components/features/plans/workspace/components/ExercisePlanningPanel.tsx` | 45-209 | Dead stub: empty exercise library, 5+ TODO stubs, never imported | Dead code |
| 28 | `apps/web/components/features/plans/workspace/components/RaceDayManager.tsx` | 121-124 | Delete button is console.log stub — races can be added but not removed | Missing CRUD |
| 29 | `apps/web/components/features/plans/workspace/components/MicrocycleEditor.tsx` | 156-159 | "Add Session" button is console.log stub | Dead button |
| 30 | `apps/web/components/features/plans/home/PlansHomeClient.tsx` | 121-128 | Duplicate/Export disabled with no visual indication | Disabled UI |
| 31 | `apps/web/components/features/plans/workspace/AssignmentView.tsx` | 308 | "Peak on competition date" label but backend uses `macrocycle.start_date` | Mislabeled |
| 32 | `apps/web/components/features/templates-page.tsx` | 223 | "Loading templates..." bare text, no skeleton | Bad UX |
| 33 | `apps/web/components/features/workout/components/exercise/exercise-card.tsx` | 44 | Weight unit hardcoded as `lbs` — rest of app uses `kg` | Unit mismatch |
| 34 | `apps/web/components/features/workout/components/pages/workout-page-content.tsx` | 87-90 | "Loading workouts..." plain text, no skeleton | Bad UX |
| 35 | `apps/web/components/features/workout/components/pages/workout-page-content.tsx` | — | No visible nav link to `/workout/history` | Missing nav |
| 36 | `apps/web/actions/workout/workout-session-actions.ts` | 77-162 | No date filter on assigned workouts — shows ALL ever-assigned | UX issue |
| 37 | `apps/web/components/features/workout/components/pages/workout-session-dashboard.tsx` | (entire file) | V1 dead code — stale data bug reads `workout_log_sets` at wrong level | Dead code |
| 38 | — | — | No "skip workout" UI — `skipWorkoutSessionAction` exists but zero UI surface | Missing UI |
| 39 | — | — | No post-completion navigation — athlete stays on read-only session page | Missing UX |
| 40 | `apps/web/actions/profile/profile-actions.ts` | 511,572 | `weeklyStreak` hardcoded 0, `yearsExperience` hardcoded 0 | Fake data |
| 41 | `apps/web/components/features/plans/individual/WeekSelectorSheet.tsx` | 84-86 | Past weeks faked as 100% complete — not real completion data | Fake data |
| 42 | `apps/web/components/features/personal-bests/components/personal-bests-management.tsx` | 228-234 | Edit PB button shows toast "coming in next update" | Placeholder |
| 43 | `apps/web/components/features/landing/about.tsx` | 16-33 | Fake social proof: "95% Success Rate", "4.9/5 rating", "Coming Soon" as stats | Fake data |
| 44 | Multiple files | — | Native `confirm()` dialogs instead of styled modals (templates, KB, PBs, KB editor) | Bad UX |
| 45 | Multiple files | — | `window.location.href` instead of Next.js router (templates-page, page-layout) | Bad UX |
| 46 | `apps/web/components/features/sessions/hooks/use-session-data.ts` | 162-183 | Real-time session subscription permanently disabled (commented out) | Disabled feature |

### P2 — Post-MVP / Nice to Have

| # | File | Line(s) | Issue | Category |
|---|------|---------|-------|----------|
| 47 | `apps/web/components/features/plans/components/templates-page.tsx` | 65-158 | Template UI expects `usage_count`, `avg_rating`, `category` — fields don't exist in DB | Data mismatch |
| 48 | `apps/web/actions/athletes/athlete-actions.ts` | 1365-1375 | `lookup_user_for_invite` RPC not in tracked migrations | Deployment risk |
| 49 | DB schema | — | `athlete_cycles` table has FKs but zero application code uses it | Dead schema |
| 50 | DB schema | — | `macrocycles.athlete_group_id` only supports one group (MVP limitation) | Schema limitation |
| 51 | `apps/web/components/features/plans/home/PlansHomeClient.tsx` | 261 | `window.location.reload()` after assignment instead of revalidation | Tech debt |
| 52 | `apps/web/components/features/workout/components/pages/SessionDetailsDialog.tsx` | 135 | `duration` always 0 — `workout_logs` has no duration column | Data bug |
| 53 | — | — | ~~No rest timer~~ **DECISION: Remove rest timer input entirely from UI** (not MVP) | Scope removed |
| 54 | `apps/web/app/(protected)/plans/[id]/edit/PlanEditClient.tsx` | (entire file) | 300+ lines of commented-out dead code, returns null | Dead code |
| 55 | `apps/web/components/features/first-experience/types.ts` | 46-312 | `MOCK_PROPOSED_PLAN` — 260 lines of prototype mock data | Dead code |
| 56 | `apps/web/components/features/first-experience/PlanReviewOptionC.tsx` + `D.tsx` | — | Prototype variants, not imported | Dead code |
| 57 | Multiple workout files | — | 50+ `as any` type casts indicating type contract mismatches | Type safety |
| 58 | `apps/web/components/error-boundary/*.tsx` | 49,98 | Error tracking TODO — no Sentry/PostHog integration | Observability |
| 59 | `apps/web/components/features/knowledge-base/constants/index.ts` | 214-220 | Feature flags defined but never imported/consumed anywhere | Dead code |
| 60 | `apps/web/app/layout.tsx` | 163-170 | Profile creation with Supabase commented out with TODO | Tech debt |

---

## Appendix B: Invite Flow Trace (Step-by-Step)

```
Coach clicks "Invite Athlete" → enters email + selects group
  │
  ▼
inviteOrAttachAthleteAction(email, groupId)
  ├── Path A: User exists in Supabase
  │     ├── Has athlete profile → update athlete_group_id ✅
  │     └── No athlete profile → create one with athlete_group_id ✅
  │     └── ⚠️ Does NOT update users.role (individual stays individual)
  │
  └── Path B: User doesn't exist
        ├── Creates Clerk invitation with redirectUrl: /auth/session?groupId=42
        ├── ❌ Attempts athlete insert with no user_id → silently fails
        └── Athlete receives email → clicks link
              │
              ▼
        Clerk authenticates → redirects to /auth/session?groupId=42
              │
              ▼
        Session handler checks onboarding_status → not completed
              │
              ▼
        ❌ router.replace('/onboarding') — groupId DROPPED
              │
              ▼
        Onboarding wizard (6 steps) — no groupId awareness
              │
              ▼
        Athlete manually picks role (could pick wrong one)
              │
              ▼
        completeOnboardingAction → complete_onboarding RPC
              │
              ▼
        ❌ Athlete created with NO athlete_group_id
              │
              ▼
        Athlete lands on /dashboard — unattached to any coach
```

---

## Appendix C: Database Schema Summary

### Tables relevant to coach/athlete flow

| Table | PK | Key Columns | Status |
|-------|-----|-------------|--------|
| `users` | int | `clerk_id`, `role`, `onboarding_completed` | Active |
| `coaches` | int | `user_id` FK → users | Active |
| `athletes` | int | `user_id` FK → users, `athlete_group_id` FK → athlete_groups | Active |
| `athlete_groups` | int | `coach_id` FK → coaches, `group_name` | Active |
| `athlete_group_histories` | int | `athlete_id`, `group_id`, `created_by`, `notes` | Active |
| `athlete_cycles` | int | `athlete_id`, `macrocycle_id`, `mesocycle_id` | **UNUSED** |
| `macrocycles` | int | `user_id`, `athlete_group_id`, `start_date`, `end_date` | Active — no `state` field |
| `mesocycles` | int | `macrocycle_id`, `user_id`, `metadata` (JSONB) | Active — no `state` field |
| `microcycles` | int | `mesocycle_id`, `user_id`, `intensity`, `volume` | Active |
| `session_plans` | UUID | `microcycle_id`, `user_id`, `is_template`, `deleted` | Active |
| `workout_logs` | UUID | `athlete_id`, `session_plan_id`, `session_status` enum | Active |
| `races` | int | `macrocycle_id`, `user_id`, `date` | Active |

### RLS policies (tracked in migrations)

| Table | Policy | Rule |
|-------|--------|------|
| `workout_logs` | `wl_coach_update` | Coach can UPDATE logs for athletes in their groups |
| `workout_logs` | `wl_coach_delete` | Coach can DELETE logs for their groups |

**Note**: Core RLS policies for `athletes`, `coaches`, `macrocycles`, `mesocycles`, `session_plans` etc. are NOT in tracked migrations — they exist only in the Supabase dashboard. This is a deployment reproducibility risk.

### Helper functions (defined in Supabase, not in migrations)

`auth_user_id()`, `auth_athlete_id()`, `auth_coach_id()`, `auth_coached_group_ids()`, `coaches_group(group_id)`, `coaches_athlete(athlete_id)`, `can_access_session_plan(sp_id)`, `can_view_workout_log(wl_id)`, `owns_resource(user_id)`

---

## Appendix D: What's Working

### Fully Working (No Fix Needed)

| Feature | Notes |
|---------|-------|
| Plan workspace (3-panel) | Desktop + mobile layouts |
| Mesocycle/microcycle CRUD | Create, edit, delete in workspace |
| Plan assignment | Idempotent, creates workout_logs per athlete × session |
| Sprint sessions | Coach data entry via spreadsheet |
| Athlete workout execution | Start session, log sets/reps/weights, auto-save, PB detection |
| Athlete dashboard | Today's workout, completion stats |
| Session copy | Copy dialog in workspace |
| Role-based sidebar nav | Correct for all 3 roles |

### Working with Known P0 Bugs

| Feature | Bug |
|---------|-----|
| Coach dashboard | Active plans count includes athletes' personal mesocycles (Issue #25) |
| Plan creation wizard | Session linking bug — snake_case vs camelCase (Issue #11) |
| Athlete management (roster) | Invite flow broken end-to-end for new users (Issues #3-#9) |

### Partially Working

| Feature | Gap |
|---------|-----|
| Existing-user invite (Path A) | Group assigned, but role not updated (Issue #9) |
| Athlete workout history page | Works but unreachable via sidebar navigation (Issue #35) |
| Workspace event/race CRUD | UI works but changes not persisted to DB (Issues #22-#24) |
