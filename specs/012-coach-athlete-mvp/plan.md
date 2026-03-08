# Implementation Plan: Coach/Athlete MVP Production Readiness

**Branch**: `012-coach-athlete-mvp` | **Date**: 2026-02-17 | **Spec**: [spec.md](specs/012-coach-athlete-mvp/spec.md)
**Input**: Feature specification from `/specs/012-coach-athlete-mvp/spec.md`

## Summary

Fix all gaps in the coach/athlete flow for the first MVP production release. The audit identified **60+ issues** across 5 categories: broken invite flow (9 gaps), missing athlete plan view, disabled plan management UI, fake/hardcoded stats, and dead code. This plan covers 51 functional requirements across 15 user stories, prioritized into 5 implementation phases.

**Core approach**: Most backend infrastructure already exists (server actions, DB cascades, RPCs). The work is primarily UI wiring, query fixes, and one DB migration. No new tables needed. Two RPC modifications and two new server actions required.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14+
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, Clerk (auth), Supabase JS Client, shadcn/ui
**Storage**: Supabase PostgreSQL (hosted), RLS policies, SECURITY DEFINER RPCs
**Testing**: Manual + agent-browser CLI (E2E via accessibility tree snapshots)
**Target Platform**: Web (responsive, mobile-first)
**Project Type**: Turborepo monorepo (`apps/web/`, `packages/`, `supabase/`)
**Performance Goals**: Standard web app — no specific throughput targets for MVP
**Constraints**: Clerk HTTP-only cookies require headed browser for auth testing; Supabase RLS policies must be respected
**Scale/Scope**: Small user base (MVP launch), ~40 source files modified, 7 files deleted, 2 new pages, 1 new component, 2 DB migrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`.specify/memory/constitution.md`) is template-only — no project-specific gates defined. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/012-coach-athlete-mvp/
├── plan.md              # This file
├── spec.md              # Feature specification (51 FRs, 15 user stories)
├── research.md          # Phase 0 output — codebase audit findings
├── data-model.md        # Phase 1 output — schema changes (2 migrations)
├── quickstart.md        # Phase 1 output — implementer quick reference
├── contracts/
│   └── api-contracts.md # Phase 1 output — server action changes + new APIs
└── tasks.md             # Phase 2 output — dependency-ordered task list (pending)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── auth/session/page.tsx              # MODIFY: forward groupId query param
│   ├── (protected)/
│   │   ├── program/page.tsx               # NEW: athlete "My Program" page
│   │   ├── plans/
│   │   │   └── (PlansHomeClient.tsx)      # MODIFY: wire delete, remove disabled items
│   │   ├── athletes/[id]/page.tsx         # MODIFY: replace disabled buttons, add plan summary
│   │   ├── workout/                       # MODIFY: skeleton, history link, skip, date filter
│   │   └── dashboard/                     # MODIFY: fix coach active plans count
│   └── api/stripe/webhooks/route.ts       # MODIFY: disable or add TODO
├── actions/
│   ├── onboarding/onboarding-actions.ts   # MODIFY: add groupId param
│   ├── athletes/athlete-actions.ts        # MODIFY: fix invite paths A & B
│   ├── plans/plan-actions.ts              # MODIFY: add revalidatePath, new actions
│   ├── profile/profile-actions.ts         # MODIFY: replace fake stats
│   └── workout/workout-session-actions.ts # MODIFY: add date filter
├── components/
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── onboarding-wizard.tsx      # MODIFY: read groupId from searchParams
│   │   │   └── steps/role-selection-step.tsx # MODIFY: hide roles when invited
│   │   ├── plans/
│   │   │   ├── home/
│   │   │   │   ├── PlansHomeClient.tsx    # MODIFY: wire delete, remove disabled items
│   │   │   │   └── DeletePlanDialog.tsx   # NEW: confirmation dialog with assignment count
│   │   │   ├── components/
│   │   │   │   ├── mesowizard/PlanReview.tsx # MODIFY: fix snake_case → camelCase
│   │   │   │   └── templates-page.tsx     # MODIFY: remove View Details links
│   │   │   └── workspace/
│   │   │       ├── TrainingPlanWorkspace.tsx # MODIFY: persist events, sessions, title
│   │   │       └── components/            # DELETE: AssignmentPanel, ExercisePlanningPanel
│   │   ├── workout/
│   │   │   └── components/
│   │   │       ├── exercise/exercise-card.tsx # MODIFY: lbs → kg, remove rest timer
│   │   │       └── pages/
│   │   │           ├── workout-page-content.tsx # MODIFY: skeleton, history link, skip
│   │   │           └── workout-session-dashboard.tsx # DELETE: V1 dead code
│   │   ├── personal-bests/               # MODIFY: use exercise names, remove inert buttons
│   │   ├── performance/                  # MODIFY: hide broken analytics tabs
│   │   └── first-experience/             # DELETE: PlanReviewOptionC/D, MOCK_PROPOSED_PLAN
│   └── layout/sidebar/app-sidebar.tsx    # MODIFY: add "My Program" nav item
└── (7 files to DELETE — see Dead Code section)

supabase/
└── migrations/
    ├── 20260218000000_add_group_id_to_onboarding_rpc.sql  # NEW
    └── 20260218000001_add_lookup_user_for_invite_rpc.sql  # NEW
```

## Architecture Decisions

### AD-1: Thread `groupId` Through UI (Not Clerk Webhook)

**Decision**: Pass `groupId` as a query parameter through the session handler → onboarding wizard → complete_onboarding RPC chain.

**Why**: Clerk webhooks add deployment complexity (webhook URL config, retry handling, race conditions between webhook and user redirect). The UI threading approach is simpler, deterministic, and testable. The groupId is already in the Clerk invitation `redirectUrl`.

**Trade-off**: Requires modifying 4 files in the onboarding chain vs 1 webhook handler. Acceptable for MVP.

### AD-2: Hard Delete Plans (No Soft Delete)

**Decision**: Use existing `deleteMacrocycleAction` which does a hard DELETE. DB cascades handle children (mesocycles → microcycles → session_plans). `workout_logs.session_plan_id` is SET NULL, preserving completed workout data.

**Why**: Soft delete adds complexity (filtered queries everywhere, storage accumulation, UI for "archived" plans). For MVP, hard delete with the existing FK cascade behavior is correct and simple.

**Constraint**: Coach must remove active assignments before deleting. UI enforces this via `getAssignmentCountForMacrocycle` query.

### AD-3: New "My Program" Page (Not Existing Workspace)

**Decision**: Build a dedicated read-only `/program` page for athletes instead of granting athletes access to the existing plan workspace.

**Why**: The plan workspace (`TrainingPlanWorkspace.tsx`) is a complex coach-facing editor with drag-and-drop, inline editing, and assignment management. Making it read-only would require extensive conditional rendering. A simple dedicated page showing current + next week with session completion status is better UX for athletes.

### AD-4: Metric Units Only (kg)

**Decision**: Hardcode `kg` everywhere. No unit preference toggle for MVP.

**Why**: Adding a user preference requires: settings UI, DB column, propagation to all display components. For MVP, consistency matters more than flexibility. Change `exercise-card.tsx:44` from `lbs` to `kg`.

### AD-5: No Clerk Webhook for User Creation (GAP 8)

**Decision**: Accept the window between Clerk signup and onboarding completion where `getDbUserId()` may fail.

**Why**: This only affects brand-new users during their first session (a few seconds between signup redirect and onboarding wizard load). The onboarding flow itself creates the DB user via the `complete_onboarding` RPC. Adding a Clerk webhook for `user.created` would add deployment complexity for a tiny window of risk. If the session handler encounters this, it already redirects to onboarding.

### AD-6: Role Change Guard Rail

**Decision**: When an existing user is invited to a coach's group, only update their role from `individual` → `athlete`. Never change `coach` → `athlete`.

**Why**: A coach may also be an athlete in another coach's group. Downgrading their role would break their coach functionality.

## Key Research Findings

*Full details in [research.md](specs/012-coach-athlete-mvp/research.md)*

### Critical Findings

1. **FK cascades already correct**: `workout_logs.session_plan_id` has `ON DELETE SET NULL` — completed workout data survives plan deletion. No migration needed for FR-010c.

2. **PlanReview double bug**: Not just snake_case keys — the spread also puts `SessionPlanData` fields on `CreateSessionPlanForm` instead of wrapping sessions in an array. Fix requires: `{ microcycleId, athleteGroupId, sessions: [session] }`.

3. **Invite flow broken at every step**: 9 distinct gaps between coach invite and athlete attachment. The `groupId` param is created correctly in Clerk's `redirectUrl` but immediately dropped at step 3 (session handler).

4. **Backend is mostly ready**: `deleteMacrocycleAction`, `skipWorkoutSessionAction`, and most CRUD actions exist. The primary blocker is UI wiring, not backend logic.

### Infrastructure Already in Place

| Capability | Status | Location |
|-----------|--------|----------|
| Plan delete action | Complete | `plan-actions.ts:394-434` |
| Skip workout action | Complete | `workout-session-actions.ts:529` |
| AlertDialog pattern | 8+ instances | shadcn/ui, controlled state |
| Exercise name joins | In query | `getAthletePBsAction` has `exercise:exercises(id,name)` |
| Skeleton components | Available | `@/components/ui/skeleton` |
| `ActionState<T>` return type | Standard | All server actions |

### New Infrastructure Needed

| Capability | Details |
|-----------|---------|
| `getAssignmentCountForMacrocycle` | Query workout_logs through session_plans → microcycles → mesocycles → macrocycles |
| `bulkCancelAssignmentsForMacrocycle` | Update assigned workout_logs to cancelled |
| `getAthleteAssignedPlanAction` | Query macrocycles via athlete_group_id with session completion |
| `complete_onboarding` RPC update | Add `p_group_id` parameter |
| `lookup_user_for_invite` migration | Extract from Supabase dashboard to tracked migration |

## Implementation Phases

### Phase 1: Critical Bug Fixes (P0) — Immediate
**Scope**: Fix data corruption and fake data bugs that affect every user session.
**Files**: 5 files modified
**FRs**: FR-015, FR-017, FR-018, FR-030, FR-025

1. Fix `PlanReview.tsx` snake_case → camelCase + session array wrapping (FR-030)
2. Replace `Math.random()` completion rate with real workout_logs query (FR-015)
3. Fix PBs to use `pb.exercise?.name` instead of raw IDs (FR-017)
4. Remove inert "Add PB" buttons (FR-018)
5. Remove templates "View Details" 404 links (FR-025)

### Phase 2: Invite Flow Fix (P0) — Critical Path
**Scope**: End-to-end invite redemption. Coach invites → athlete signs up → attached to group.
**Files**: 7 files modified, 2 new migration files
**FRs**: FR-005, FR-005b, FR-005c, FR-006, FR-007, FR-008, FR-035, FR-036, FR-037

1. DB migration: add `p_group_id` to `complete_onboarding` RPC
2. DB migration: track `lookup_user_for_invite` RPC
3. Session handler: forward `groupId` to `/onboarding`
4. Onboarding wizard: read `groupId` from searchParams
5. Role selection: hide coach/individual when `groupId` present
6. Complete onboarding action: pass `groupId` to RPC
7. Fix invite action Path B: remove broken pending INSERT
8. Fix invite action Path A: add role update (individual → athlete only)

### Phase 3: Plan Management (P0/P1)
**Scope**: Enable plan deletion with assignment awareness. Fix workspace persistence.
**Files**: 4 files modified, 1 new component
**FRs**: FR-009, FR-010, FR-010b, FR-010c, FR-011, FR-031, FR-031b, FR-031c

1. New `DeletePlanDialog` component with assignment count warning
2. New `getAssignmentCountForMacrocycle` server action
3. New `bulkCancelAssignmentsForMacrocycle` server action
4. Wire delete in `PlansHomeClient.tsx`, remove disabled items
5. Add `revalidatePath` to `deleteMacrocycleAction`
6. Wire workspace event/race persistence to server actions
7. Wire workspace session edit/delete to server actions
8. Wire workspace title rename to `updateMacrocycleAction`

### Phase 4: New Features (P1)
**Scope**: Athlete "My Program" page, coach athlete profile improvements, workout UX.
**Files**: 3 new files, 6 files modified
**FRs**: FR-001 through FR-004, FR-012 through FR-014, FR-038 through FR-043c

1. New `/program` page with `getAthleteAssignedPlanAction`
2. Add "My Program" to athlete sidebar nav
3. Replace coach athlete profile disabled buttons with functional links
4. Workout skeleton loading + history link
5. Skip workout button + post-completion navigation
6. Date filter on assigned workouts (past 7 + next 7 days)
7. Fix weight unit to kg globally
8. Remove rest timer input from exercise card
9. Fix coach dashboard active plans count (FR-032)

### Phase 5: Cleanup (P1)
**Scope**: Dead code removal, placeholder cleanup, UI polish.
**Files**: 7 files deleted, ~15 files modified
**FRs**: FR-016, FR-019 through FR-029, FR-043, FR-044 through FR-049

1. Delete 7 dead code files + clean barrel exports
2. Hide broken performance analytics tabs
3. Remove all "coming soon" text instances
4. Replace native `confirm()` with AlertDialog (4 instances)
5. Replace `window.location.href` with `router.push()` (9 instances)
6. Remove fake landing page stats
7. Fix week completion to use real data
8. Disable Stripe webhook handler (add TODO comment)
9. Fix session duration display (calculate or hide)
10. Fix WeekSelectorSheet past week completion

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

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `complete_onboarding` RPC change breaks existing onboarding | High | `p_group_id DEFAULT NULL` — existing calls unaffected |
| Plan delete cascade removes data unexpectedly | Medium | FK analysis confirms only `session_plan_id` is SET NULL; require unassignment before delete |
| Athlete sidebar nav change breaks other roles | Low | `visibleTo: ['athlete']` filter isolates change |
| `window.location` → `router.push()` changes break deep links | Low | Both navigate to same URLs; SPA transition is strictly better |
| Dead code deletion breaks unused barrel exports | Low | Verified zero consumers via grep; clean up barrel files in same PR |

## Cross-Cutting Concerns

### Patterns to Follow

- **AlertDialog**: Use controlled state pattern (`useState<boolean>`) — reference `EditTrainingBlockDialog.tsx`
- **Server actions**: Return `ActionState<T>`. Call `revalidatePath` for cache invalidation.
- **Navigation**: Use `useRouter().push()` from `next/navigation`, never `window.location.href`
- **Loading states**: Use skeleton components from `@/components/ui/skeleton`
- **Confirmation**: Use `AlertDialog` from `@/components/ui/alert-dialog`, never native `confirm()`

### Testing Strategy

Each phase should be verified via agent-browser CLI:
1. **Phase 1**: Create plan via wizard → verify sessions linked to correct microcycle
2. **Phase 2**: Coach sends invite → new user signs up → verify appears in coach's group
3. **Phase 3**: Coach deletes plan with/without assignments → verify dialog behavior
4. **Phase 4**: Athlete logs in → navigates to "My Program" → sees plan + sessions
5. **Phase 5**: Full navigation audit — no 404s, no "coming soon", no dead buttons

## Progress Tracking

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | Complete | `research.md` |
| Phase 1: Design | Complete | `data-model.md`, `contracts/api-contracts.md`, `quickstart.md` |
| Phase 2: Task Generation | Pending | `tasks.md` (next step: run `/tasks`) |
| Implementation | Not Started | — |
