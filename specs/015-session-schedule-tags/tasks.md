# Tasks: Session-Level Schedule Tags

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Data Model**: [data-model.md](data-model.md)

## Task List

### Phase 1: Database Migration

- [ ] **T1: Create Supabase migration** — Single migration file with all schema changes
  - Add `event_groups TEXT[]` to `athletes`, populate from `event_group` scalar
  - Add `target_event_groups TEXT[]` to `session_plans` with GIN index
  - Create `auth_athlete_event_groups()` function returning `TEXT[]`
  - Update RLS policies on `session_plan_exercises` and `session_plan_sets` (array overlap `&&`)
  - Create new RLS SELECT policy on `session_plans` for session-level filtering
  - Drop old `auth_athlete_event_group()` function
  - Drop old `event_group` column
  - **Files**: `supabase/migrations/YYYYMMDD_session_schedule_tags.sql`
  - **Verify**: Migration applies cleanly; existing data preserved as arrays

- [ ] **T2: Regenerate TypeScript types** — Run `supabase gen types` and verify
  - `athletes.event_groups: string[] | null` (was `event_group: string | null`)
  - `session_plans.target_event_groups: string[] | null` (new field)
  - `auth_athlete_event_groups` function returns `string[]`
  - **Files**: `apps/web/types/database.ts`

### Phase 2: Server Actions (array migration) [P]

- [ ] **T3: Update athlete actions** — Array writes/reads in athlete-actions.ts
  - `inviteOrAttachAthleteAction`: `eventGroup?: string` → `eventGroups?: string[]`, array write
  - `getEventGroupsForGroupAction`: `.map(row => row.event_group)` → `.flatMap()` + dedup
  - `updateAthleteProfileAction`: type follows from regenerated `database.ts`
  - **Files**: `apps/web/actions/athletes/athlete-actions.ts`

- [ ] **T4: Update event-group-actions** — `.eq()` → `.contains()`
  - `deleteEventGroupAction`: `.eq('event_group', abbreviation)` → `.contains('event_groups', [abbreviation])`
  - **Files**: `apps/web/actions/athletes/event-group-actions.ts`

- [ ] **T5: Update onboarding actions** — Scalar → array writes
  - Clerk metadata type: `eventGroup?: string` → `eventGroups?: string[]`
  - DB write: `{ event_group: invitedEventGroup }` → `{ event_groups: [invitedEventGroup] }`
  - **Files**: `apps/web/actions/onboarding/onboarding-actions.ts`

- [ ] **T6: Update generate-microcycle-action** — flatMap dedup
  - `.select('event_group')` → `.select('event_groups')`
  - `.map(a => a.event_group)` → `.flatMap(a => a.event_groups ?? [])` + `[...new Set()]`
  - **Files**: `apps/web/actions/plans/generate-microcycle-action.ts`

- [ ] **T7: Update workout-session-actions** — Array overlap filter
  - `.select('event_group')` → `.select('event_groups')`
  - Scalar extract → array extract
  - Exercise filter: `.includes(scalar)` → `spe.target_event_groups.some(g => athleteEventGroups.includes(g))`
  - **Files**: `apps/web/actions/workout/workout-session-actions.ts`

- [ ] **T8: Update dashboard-actions** — Array overlap filter (same pattern as T7)
  - **Files**: `apps/web/actions/dashboard/dashboard-actions.ts`

### Phase 3: UI Components

- [ ] **T9: Update athlete types** — `event_group?: string | null` → `event_groups?: string[] | null`
  - **Files**: `apps/web/components/features/athletes/types.ts`

- [ ] **T10: Multi-select tag editor on athlete roster** — Replace single-select badge
  - `athlete-card.tsx`: Multi-select popover with checkboxes, array write
  - `athlete-roster-section.tsx`: `EventGroupEditor` → multi-select, `currentValue` → `currentValues: string[]`
  - Untagged athlete warning indicator when coach has event groups defined
  - **Files**: `apps/web/components/features/athletes/components/athlete-card.tsx`, `apps/web/components/features/athletes/components/athlete-roster-section.tsx`

- [ ] **T11: Update group-directory-section** — Array flatten for breakdown counts
  - `a.event_group` → `(a.event_groups ?? []).forEach(...)` for count aggregation
  - **Files**: `apps/web/components/features/athletes/components/group-directory-section.tsx`

- [ ] **T12: Session-level tag selector** — Add "Visible to" tag chips on session cards
  - Add `target_event_groups` handling in session planner save/load
  - Tag selector component on session card header (same pattern as exercise-level)
  - **Files**: `apps/web/actions/plans/session-planner-actions.ts`, session planner component

- [ ] **T13: "Preview as" filter in MicrocycleEditor** — Dropdown to filter sessions by tag
  - Collect distinct tags from session `target_event_groups` across microcycle
  - Filter `daySessions` by selected tag (show untagged + matching)
  - Dropdown next to microcycle title: "All" + distinct tags
  - **Files**: `apps/web/components/features/plans/workspace/components/MicrocycleEditor.tsx`

- [ ] **T14: Update workout views** — Array prop and overlap filter
  - `WorkoutView.tsx`: `athleteEventGroup?: string` → `athleteEventGroups?: string[]`, overlap filter
  - `WorkoutSessionDashboardV2.tsx`: same prop change
  - `workout/[id]/page.tsx`: array extract and pass-through
  - **Files**: `apps/web/components/features/training/views/WorkoutView.tsx`, `apps/web/components/features/training/views/WorkoutSessionDashboardV2.tsx`, `apps/web/app/(protected)/workout/[id]/page.tsx`

- [ ] **T15: Update session-plan-actions for copy/duplicate** — Include session-level tags
  - `copySessionAction`: copy `target_event_groups` from source session
  - `duplicateMicrocycleSessionsAction`: copy `target_event_groups`
  - **Files**: `apps/web/actions/plans/session-plan-actions.ts`

### Phase 4: Verification

- [ ] **T16: TypeScript compilation check** — `npx tsc --noEmit` passes
- [ ] **T17: E2E test — full flow** — Coach creates tags, assigns to athletes, tags sessions, athlete sees correct sessions
