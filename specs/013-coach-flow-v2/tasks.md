# Tasks: Coach Flow V2

**Input**: Design documents from `/specs/013-coach-flow-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US9)

### User Story Mapping

| Story | Issue | Summary |
|-------|-------|---------|
| US1 | #22 | Workspace session cards show exercise content |
| US2 | #23 | Exercise-level subgroup filtering (coach UI) |
| US3 | #23 | Subgroup filtering (athlete side) |
| US4 | #23 | Subgroup filtering (AI integration) |
| US5 | #33 | Template system (page, save, insert) |
| US6 | #31 | Dashboard mini calendar |
| US7 | #25 | AI text-to-blocks parser |
| US-INFRA | Shared | Shared infrastructure (utilities) |
| US-DB | Shared | DB migration + RLS |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared utilities that multiple features depend on.

- [ ] T001 [US-INFRA] Create `apps/web/lib/training-utils.ts` with `computeSessionMetrics()` function
  - Input: `ExerciseWithSets` interface (exercise_type_id + sets array)
  - Output: `SessionMetrics` `{ volume, volumeUnit, duration, exerciseCount }`
  - Volume formula per exercise_type_id: 1-3 strength (reps×weight→kg), 4-5 sprint/endurance (distance→m), 6 timed (performing_time→s), default bodyweight (reps→reps)
  - Duration: Σ(performing_time + rest_time) across all sets
  - See `contracts/api-contracts.md` for full interface spec

- [ ] T002 [US-INFRA] Add `formatExerciseSummary()` to `apps/web/lib/training-utils.ts`
  - Returns one-line summary: strength "3×10 80kg", sprint "4×60m 7.2s", timed "3×30s", bodyweight "3×12"
  - Uses first set as representative for uniform sets; "N sets" fallback for varied sets
  - See `contracts/api-contracts.md` for spec

- [ ] T003 [US-INFRA] Add `abbreviateEventGroup()` + `formatSubgroupChip()` to `apps/web/lib/training-utils.ts`
  - `abbreviateEventGroup`: Maps full event_group strings to 3-char display codes (SS→SS, Hurdles→HRD, Multi-events→MUL, etc.)
  - `EVENT_GROUP_ABBREVIATIONS` constant map per `data-model.md` table
  - `formatSubgroupChip`: null/empty→null, single→"SS", multiple→"SS·MS"

- [ ] T004 [US-INFRA] Delete dead `formatShorthand` from `apps/web/components/features/training/types.ts`
  - Remove unused function (confirmed dead code in research.md)

**Checkpoint**: Shared utilities ready — all downstream phases can reference `@/lib/training-utils`

---

## Phase 2: Foundational (DB Migration + RLS)

**Purpose**: Add `target_event_groups` column and update RLS policies. BLOCKS subgroup filtering (US2, US3, US4) and any feature that reads the new column.

**CRITICAL**: US2, US3, US4 cannot begin until this phase is complete. US1 can begin in parallel.

- [ ] T005 [US-DB] Write Supabase migration file `supabase/migrations/20260311000000_add_target_event_groups.sql`
  - ADD COLUMN `target_event_groups TEXT[] DEFAULT NULL` on `session_plan_exercises`
  - CREATE GIN INDEX `idx_spe_target_event_groups`
  - CREATE FUNCTION `auth_athlete_event_group()` (STABLE SECURITY DEFINER)
  - DROP + RECREATE policy `spe_athlete_view_assigned` with 3-way subgroup condition
  - DROP + RECREATE policy `sps_athlete_view_assigned` on `session_plan_sets` with parent exercise filter
  - Full SQL in `data-model.md`

- [ ] T006 [US-DB] Apply migration to dev branch via Supabase MCP `apply_migration`
  - Run `mcp__supabase__apply_migration` with the SQL from T005
  - Verify column exists, index created, RLS policies active

- [ ] T007 [US-DB] Regenerate TypeScript types `apps/web/types/database.ts`
  - Run `mcp__supabase__generate_typescript_types`
  - **CRITICAL**: Restore ALL custom type aliases at bottom of file after regeneration (learned from prior incident — aliases get stripped)
  - Verify `target_event_groups: string[] | null` appears on `session_plan_exercises` Row/Insert/Update types

**Checkpoint**: Database schema ready — `target_event_groups` column exists, RLS policies active, TypeScript types updated

---

## Phase 3: Workspace Session Cards — US1 (#22)

**Goal**: Show exercise names, computed volume/duration on workspace session cards.
**Independent Test**: Open any training plan workspace → cards show exercise names and computed metrics instead of hardcoded zeros.

### Implementation

- [ ] T008 [US1] Extend `getMacrocycleByIdAction` select in `apps/web/actions/plans/plan-actions.ts`
  - At line ~290, change Supabase select to include `session_plan_sets(*)` and `exercise_type_id` on exercise join
  - Before: `session_plan_exercises(id, exercise_order, notes, exercise_id, superset_id, exercise:exercises(id, name, description, video_url))`
  - After: `session_plan_exercises(id, exercise_order, notes, exercise_id, superset_id, target_event_groups, exercise:exercises(id, name, description, video_url, exercise_type_id), session_plan_sets(*))`
  - See `contracts/api-contracts.md` for exact select string

- [ ] T009 [US1] Update `apps/web/app/(protected)/plans/[id]/page.tsx` to compute metrics
  - At lines ~183-185, replace hardcoded `duration: 60, volume: 0, intensity: 0`
  - Import `computeSessionMetrics` from `@/lib/training-utils`
  - Map exercises with sets data to compute actual volume + duration
  - Pass computed metrics to Session interface

- [ ] T010 [US1] Update `Session` interface in `apps/web/components/features/plans/workspace/TrainingPlanWorkspace.tsx`
  - At lines ~32-41, replace `exercises: any[]` with proper typing
  - Add `exerciseSummaries?: string[]` or pass exercises with details
  - Ensure interface matches what `page.tsx` passes down

- [ ] T011 [US1] Render exercise names on workspace session cards in `TrainingPlanWorkspace.tsx`
  - At lines ~1228-1306, add exercise name list to session card content
  - Show first 3-4 exercise names with "..." overflow
  - Display computed volume + duration metrics
  - Use `formatExerciseSummary` from training-utils for compact display

- [ ] T012 [US1] Add exercise summary to MicrocycleEditor cards in `apps/web/components/features/plans/workspace/components/MicrocycleEditor.tsx`
  - Add exercise count or first 2 exercise names below session name
  - Keep compact for the 7-day grid view

- [ ] T013 [US1] Add quick-add session sheet/drawer to workspace
  - Either in `TrainingPlanWorkspace.tsx` or as a new component
  - Coach can quickly add a new session to a day in the microcycle

**Checkpoint**: Workspace cards show real exercise data, volume, and duration. Coach can see session content at a glance.

---

## Phase 4: Subgroup Filtering — Coach UI — US2 (#23)

**Goal**: Coach can tag exercises with subgroups and preview what athletes see.
**Independent Test**: Open session planner → tap subgroup chip on exercise → select SS/MS → preview dropdown shows filtered view.
**Depends on**: Phase 2 (migration must be complete for `target_event_groups` column)

### Implementation

- [ ] T014 [US2] Add `getEventGroupsForGroupAction` in `apps/web/actions/athletes/athlete-actions.ts`
  - New server action: takes `groupId: number`, returns `ActionState<string[]>`
  - Query: `SELECT DISTINCT event_group FROM athletes WHERE athlete_group_id = $1 AND event_group IS NOT NULL ORDER BY event_group`
  - See `contracts/api-contracts.md` for full spec

- [ ] T015 [US2] Create `useEventGroupsForGroup` TanStack Query hook
  - File: `apps/web/components/features/training/hooks/use-session-planner-queries.ts` (or existing hook file)
  - Query key: `['event-groups', groupId]`
  - Stale time: 300_000 (5 min — rarely changes)
  - Calls `getEventGroupsForGroupAction`
  - Used by T017 (multi-select popover) and T018 (preview dropdown)

- [ ] T016 [US2] Add subgroup chip to ExerciseCard header in `apps/web/components/features/training/components/ExerciseCard.tsx`
  - At lines ~325-374, inside name block flex container after `<h3>` exercise name
  - Chip shows `formatSubgroupChip(target_event_groups)` — null means "ALL" (no chip shown)
  - Use `abbreviateEventGroup` for display
  - Small colored badge style, max 3-char per group code

- [ ] T017 [US2] Build multi-select popover for chip tap in ExerciseCard
  - On chip tap, show popover with available event groups (from `useEventGroupsForGroup` hook)
  - Multi-select checkboxes for SS, MS, LS, etc.
  - Apply changes via existing changeset pattern (no direct DB mutation from component)
  - Clear selection = set target_event_groups to NULL (all athletes)

- [ ] T018 [US2] Add preview dropdown to SessionPlannerV2 sub-header in `apps/web/components/features/training/views/SessionPlannerV2.tsx`
  - At lines ~518-576, add a new row in sub-header area
  - Dropdown: "All Athletes" (default) + each distinct event_group from the group
  - Uses `useEventGroupsForGroup` hook to populate options
  - Selected value stored in component state

- [ ] T019 [US2] Wire preview state to dim non-matching exercises in `apps/web/components/features/training/views/WorkoutView.tsx`
  - When preview dropdown selects a specific group (e.g., "SS"):
  - Exercises where `target_event_groups` is null → full opacity (visible to all)
  - Exercises where athlete's group matches → full opacity
  - Exercises where athlete's group doesn't match → opacity 30%
  - Pass preview filter state from SessionPlannerV2 through to ExerciseCard

- [ ] T020 [US2] Add subgroup indicator as small muted text line on workspace session cards in `TrainingPlanWorkspace.tsx`
  - Show "SS · MS · LS" text (dot-separated abbreviated group codes) when session has mixed targeting
  - No indicator shown if all exercises are untagged (NULL)
  - Uses `abbreviateEventGroup` for compact display

- [ ] T021 [US2] Add colored subgroup dots to MicrocycleEditor grid in `MicrocycleEditor.tsx`
  - Alongside existing colored type dots (line ~206)
  - Small dots showing which subgroups have exercises in that session

**Checkpoint**: Coach can tag exercises with subgroups, preview athlete views, and see subgroup indicators on workspace cards.

---

## Phase 5: Subgroup Filtering — Athlete Side — US3 (#23)

**Goal**: Athletes only see exercises targeted for their subgroup when starting a workout.
**Independent Test**: Athlete in "SS" group starts session → only sees exercises tagged NULL or SS, not MS-only exercises.
**Depends on**: Phase 2 (RLS policies) + Phase 4 (coach must have tagged exercises)

### Implementation

- [ ] T022 [US3] Filter `workout_log_exercises` creation by `target_event_groups` in `apps/web/actions/workout/workout-session-actions.ts`
  - In `startTrainingSessionAction`, when copying `session_plan_exercises` → `workout_log_exercises`:
  - Fetch athlete's `event_group` from athletes table
  - Filter: include exercise if `target_event_groups IS NULL` OR `athlete.event_group IS NULL` OR `athlete.event_group IN target_event_groups`
  - Defense in depth: RLS also filters, but copy step must filter too

- [ ] T023 [US3] Ensure exercise count in workout header reflects filtered count
  - Workout components showing exercise count must use the filtered list
  - Verify the count matches what the athlete actually sees

- [ ] T024 [US3] Verify RLS policy blocks direct API access
  - Manual test: athlete with event_group=SS should not see MS-only exercises via Supabase client
  - Verify `spe_athlete_view_assigned` policy works correctly
  - Verify `sps_athlete_view_assigned` policy filters sets of hidden exercises

**Checkpoint**: Athlete workout filtering works at both application and database level.

---

## Phase 6: Subgroup Filtering — AI Integration — US4 (#23)

**Goal**: AI assistant understands and respects subgroup targeting when creating/editing exercises.
**Independent Test**: Ask AI to "add 3x100m sprints for SS group" → exercise created with `target_event_groups: ['SS']`.
**Depends on**: Phase 2 (column exists)

### Implementation

- [ ] T025 [P] [US4] Add `targetEventGroups` to exercise tool schemas in `apps/web/lib/changeset/tools/proposal-tools.ts`
  - Add to `createSessionPlanExerciseChangeRequest` schema: `targetEventGroups: z.array(z.string()).optional()`
  - Add to `updateSessionPlanExerciseChangeRequest` schema: same field
  - Description: "Event groups this exercise targets. Omit or null for all athletes."

- [ ] T026 [P] [US4] Add `targetEventGroups` to `CAMEL_TO_SNAKE_MAP` in `apps/web/lib/changeset/entity-mappings.ts`
  - Add mapping: `targetEventGroups: 'target_event_groups'`
  - Required for changeset pattern to persist the field from AI tool output to DB column

- [ ] T027 [P] [US4] Add subgroup tags in AI context output in `apps/web/lib/changeset/prompts/plan-assistant.ts`
  - In exercise formatting section, add subgroup tag: `[SS]` or `[ALL]` after exercise name
  - E.g., `100m Sprints (ID: abc) [SS] — 3x100m`

- [ ] T028 [US4] Add subgroup targeting rules to AI system prompt in `plan-assistant.ts`
  - Add rules: "When coach mentions a specific group (SS, MS, LS, etc.), set targetEventGroups accordingly"
  - "If no group specified, leave targetEventGroups empty (all athletes)"
  - "Show current subgroup tags when listing exercises"

**Checkpoint**: AI correctly reads and writes subgroup targeting tags.

---

## Phase 7: Template System — US5 (#33)

**Goal**: Fix broken templates page, enable save/insert workflow.
**Independent Test**: Coach saves session as template → opens templates page → inserts template exercises into another session.
**Depends on**: Phase 2 (for `target_event_groups` preservation on insert)

### Implementation

- [ ] T029 [US5] Add Templates nav item to coach sidebar in `apps/web/components/layout/sidebar/app-sidebar.tsx`
  - Add "Templates" link pointing to `/templates`
  - Only visible for coach role

- [ ] T030 [US5] Add `serverProtectRoute` to templates page in `apps/web/app/(protected)/templates/page.tsx`
  - Add role guard (coach and individual roles)
  - Add server-side data fetch for templates

- [ ] T031 [US5] Rewrite templates page component `apps/web/components/features/plans/components/templates-page.tsx`
  - Remove phantom `TemplateWithStats` fields (usage_count, avg_rating — don't exist in DB)
  - Fix `avg_rating.toFixed(1)` crash
  - Proper TypeScript types matching actual DB schema
  - Search filters by BOTH name AND description (currently only description)
  - Remove "Use Template" button that creates dangling sessions
  - Template management only: view, search, delete — insertion happens from session planner (T035)

- [ ] T032 [US5] Fix `saveAsTemplateAction` to use `templateName` param in `apps/web/actions/plans/session-plan-actions.ts`
  - Currently ignores `templateName` and `templateDescription` params
  - Ensure the saved template uses the coach-provided name

- [ ] T033 [US5] Add `insertTemplateExercisesAction` in `apps/web/actions/plans/session-plan-actions.ts`
  - New server action: takes `templateId: string, targetSessionPlanId: string`
  - Copies exercises + sets from template into target session
  - Appends after current max `exercise_order`
  - Preserves `target_event_groups` from template
  - Returns newly inserted exercises
  - See `contracts/api-contracts.md` for full spec

- [ ] T034 [US5] Add "Save as Template" button + dialog to SessionPlannerV2 toolbar in `SessionPlannerV2.tsx`
  - At lines ~497-514 (toolbar right side)
  - Dialog: template name input + save button
  - Calls fixed `saveAsTemplateAction`

- [ ] T035 [US5] Add "Insert from Template" button + sheet to SessionPlannerV2 in `SessionPlannerV2.tsx`
  - Template browser sheet: list available templates with search
  - On select: call `insertTemplateExercisesAction` → exercises appended to current session
  - Refresh exercise list after insert

**Checkpoint**: Templates page works, coach can save and insert template exercise groups.

---

## Phase 8: Dashboard Mini Calendar — US6 (#31)

**Goal**: Weekly calendar strip with session preview for athletes.
**Independent Test**: Athlete dashboard shows current week → tap a day → see session exercises for that day.
**Depends on**: Phase 2 (subgroup filtering applied to exercise list via RLS)

### Implementation

- [ ] T036 [US6] Add `getWeekSessionsAction` in `apps/web/actions/dashboard/dashboard-actions.ts`
  - New server action: takes `weekStart: string` (ISO date, Monday)
  - Fetches sessions for 7-day window with exercise details
  - Applies subgroup filtering for athlete role (via RLS + application filter)
  - Returns `WeekCalendarSession[]` with exercise summaries
  - See `contracts/api-contracts.md` for full spec

- [ ] T037 [US6] Create `useWeekSessions` TanStack Query hook in `apps/web/components/features/dashboard/hooks/use-dashboard-queries.ts` (NEW file)
  - Query key: `['dashboard-week-sessions', weekStart]`
  - Stale time: 60s, GC time: 300s
  - Calls `getWeekSessionsAction`

- [ ] T038 [US6] Build `WeekCalendarStrip` component in `apps/web/components/features/dashboard/components/week-calendar-strip.tsx` (NEW file)
  - 7-day horizontal strip, Monday start
  - Current day highlighted
  - Days with sessions show dot indicator
  - Tap day → expand to show session preview card with exercise list
  - Week navigation arrows (prev/next week)
  - Uses `date-fns` with `weekStartsOn: 1`
  - Multiple sessions on same day: cards stack vertically, each with own "Start Workout" CTA
  - Empty day tapped: show "No training scheduled — Enjoy your rest day" message

- [ ] T039 [US6] Build session preview card within `week-calendar-strip.tsx`
  - Shows session title, exercise list with formatted summaries
  - Uses `formatExerciseSummary` from training-utils
  - Includes "Start Workout" CTA linking to workout page
  - Subgroup filtering already applied by server action + RLS

- [ ] T040 [US6] Add calendar section to `AthleteDashboardView` in `apps/web/components/features/dashboard/components/dashboard-layout.tsx`
  - Insert new `<section>` between `InlineStats` and `QuickActions`
  - Role gate: only show for individual + athlete roles
  - Server-side initial render with current week data
  - Client-side week navigation via `useWeekSessions`

**Checkpoint**: Athletes see weekly calendar with session previews on dashboard.

---

## Phase 9: AI Text-to-Blocks Parser — US7 (#25)

**Goal**: Coach pastes program text, gets structured exercises.
**Independent Test**: Coach opens paste dialog → pastes TrainHeroic export text → preview shows parsed exercises → inserts into session.
**Depends on**: None (can run in parallel with other phases after Phase 1)

### Implementation

- [ ] T041 [US7] Create `aiParseSessionAction` in `apps/web/actions/plans/ai-parse-session-action.ts` (NEW file)
  - Server action: takes raw text string
  - Calls Claude API with structured output schema
  - Returns array of parsed exercises with sets, reps, weights, distances, etc.
  - Handles TrainHeroic subgroup header format (e.g., "## SS" section headers)
  - Flags unparseable lines for manual review
  - See `spec.md` FR-060 through FR-066

- [ ] T042 [US7] Build paste dialog component in `apps/web/components/features/training/components/PasteProgramDialog.tsx` (NEW)
  - Textarea for pasting program text
  - "Parse" button → calls `aiParseSessionAction`
  - Loading state during AI processing

- [ ] T043 [US7] Build parsed exercise preview in `apps/web/components/features/training/components/PasteProgramPreview.tsx` (NEW)
  - Shows parsed exercises in editable list
  - Coach can fix names, adjust sets/reps, reorder, delete
  - Flags unparseable lines highlighted for manual review
  - "Insert All" button to add to current session

- [ ] T044 [US7] Wire "Insert" to changeset pattern
  - On "Insert All", create exercise change requests via existing changeset tools
  - Exercises inserted into current session plan
  - Preserve subgroup tags from parsed headers

- [ ] T045 [US7] Add "Paste Program" button to SessionPlannerV2 toolbar in `SessionPlannerV2.tsx`
  - At lines ~497-514 (toolbar right side, alongside template buttons)
  - Opens paste dialog on click

**Checkpoint**: Coach can paste program text and get structured exercises inserted into session.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and quality checks.

- [ ] T046 [P] Verify `npm run build:web` passes with zero TypeScript errors
- [ ] T047 [P] Verify all RLS policies work correctly with test data
- [ ] T048 Run manual E2E test: coach creates session with subgroup-tagged exercises → athlete sees filtered view
- [ ] T049 Run manual E2E test: coach saves template → inserts into different session
- [ ] T050 Verify mobile responsiveness of all new UI components
- [ ] T051 Run `git diff --stat` scope check — only expected files modified

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Shared Utils) ──→ All subsequent phases
Phase 2 (Migration)    ──→ Phase 4 (Coach UI), Phase 5 (Athlete), Phase 6 (AI subgroup)
                           Phase 7 (Templates), Phase 8 (Calendar)
Phase 1 ──→ Phase 3 (Workspace Cards) — can start in parallel with Phase 2
Phase 4 (Coach UI) ──→ Phase 5 (Athlete filtering)
Phase 1 ──→ Phase 9 (AI Parser) — independent, can start after shared utils
```

### Parallel Opportunities

After Phase 1 + Phase 2 complete:
- **Teammate A**: Phase 3 (Workspace Cards) + Phase 5 (Athlete Filtering)
- **Teammate B**: Phase 4 (Coach UI — subgroup chip, popover, preview)
- **Teammate C**: Phase 7 (Templates)

After A+B converge:
- **Teammate A**: Phase 8 (Dashboard Calendar)
- **Teammate B**: Phase 9 (AI Parser)
- **Teammate C**: Phase 6 (AI Integration)

### Within Each Phase

- Server actions before UI components
- TanStack Query hooks before components that consume them
- Type updates before components that consume them
- Parent components before child components

### Parallel Task Groups

```bash
# Phase 1: All utility functions (same file, sequential)
T001 → T002 → T003 → T004

# Phase 2: Sequential (migration → apply → types)
T005 → T006 → T007

# Phase 3: Server action first, then UI
T008 → T009 → T010 → T011, T012 (T011 + T012 parallel), T013

# Phase 4: Server action → hook → UI components (some parallel)
T014 → T015 → T016, T017 (sequential — same file)
T018, T019 (sequential — linked state)
T020, T021 (parallel — different files)

# Phase 6: Mostly parallel (different files)
T025, T026, T027 (all parallel — different files) → T028

# Phase 7: Sidebar and page parallel, then actions, then planner UI
T029, T030 (parallel) → T031 → T032, T033 (same file, sequential) → T034, T035 (same file, sequential)

# Phase 8: Action first, then hook, then components
T036 → T037 → T038, T039 (same file, sequential) → T040

# Phase 9: Action first, then UI
T041 → T042 → T043 → T044 → T045
```

---

## Implementation Strategy

### For `/build-with-team`

1. **Lead**: Execute Phase 1 (T001-T004) + Phase 2 (T005-T007) sequentially — shared infrastructure
2. **Spawn team** after Phase 1+2 complete:
   - Teammate A (parallel-implementer): Phase 3 (Workspace Cards #22)
   - Teammate B (parallel-implementer): Phase 4 (Subgroup Coach UI #23)
   - Teammate C (parallel-implementer): Phase 7 (Templates #33)
3. **After A+B converge**:
   - Teammate A: Phase 5 (Athlete Filtering #23) + Phase 8 (Calendar #31)
   - Teammate B: Phase 9 (AI Parser #25)
   - Teammate C: Phase 6 (AI Integration #23)
4. **Lead**: Phase 10 (Polish + verification)

### Total: 51 tasks across 10 phases
