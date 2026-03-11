# Feature Specification: Coach Flow V2

**Feature Branch**: `013-coach-flow-v2`
**Created**: 2026-03-11
**Status**: Draft
**Input**: Unified spec covering #22, #23, #25, #31, #33 — workspace enhancement, subgroup filtering, AI text parser, dashboard calendar, template system
**Issues**: [#22](https://github.com/singli-h/Kasoku.run/issues/22), [#23](https://github.com/singli-h/Kasoku.run/issues/23), [#25](https://github.com/singli-h/Kasoku.run/issues/25), [#31](https://github.com/singli-h/Kasoku.run/issues/31), [#33](https://github.com/singli-h/Kasoku.run/issues/33)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Coach sees exercise content in workspace session cards (Priority: P1)

A coach opens the training plan workspace and immediately sees what exercises are in each session without clicking into the full session planner. Session cards show top exercise names, computed duration, and computed volume instead of hardcoded placeholders.

**Why this priority**: The workspace is the primary coach planning surface. Without exercise visibility, coaches must click into every session to understand what's planned. This is the foundation that all other features build on.

**Independent Test**: Open plan workspace → session cards show exercise names ("Bench Press · Pull-ups · ..."), computed duration from actual set data, and computed volume. No hardcoded `60min` or `volume: 0`.

**Acceptance Scenarios**:

1. **Given** a session with 5 exercises and sets with weight/reps data, **When** coach views the workspace, **Then** the session card shows top 2-3 exercise names truncated with "...", computed duration from `sum(performing_time + rest_time)`, and computed volume (Strength: `Σ(sets × reps × weight)` in kg).
2. **Given** a session with mixed exercise types (strength + sprint + timed), **When** volume is computed, **Then** each type uses its formula: Sprint = `Σ(sets × distance)` m, Timed = `Σ(performing_time)` s, Bodyweight = `Σ(sets × reps)`.
3. **Given** a session with no exercises yet, **When** coach views the card, **Then** it shows "No exercises" and duration/volume show "—".
4. **Given** the workspace `Session` interface, **When** TypeScript compilation runs, **Then** `exercises` is properly typed (not `any[]`).

---

### User Story 2 — Coach tags exercises with subgroup targets (Priority: P1)

A coach builds a session with exercises targeting different sprint subgroups (SS, MS, LS, etc.). Each exercise can be tagged with one or more event groups so athletes only see exercises relevant to their subgroup.

**Why this priority**: This is the #1 pain point from the beta coach — athletes currently see ALL exercises regardless of subgroup. This eliminates the TrainHeroic "hack" of using exercise names as subgroup headers.

**Independent Test**: Open session planner → add exercises → tap empty chip to open multi-select popover → tag exercise as `[SS]` → save → verify `target_event_groups` is persisted in DB.

**Acceptance Scenarios**:

1. **Given** a session planner with exercises, **When** coach taps the subgroup chip on an exercise, **Then** a multi-select popover opens showing event_groups from athletes in the current athlete group.
2. **Given** an exercise with no tag (NULL), **When** displayed in the session planner, **Then** no chip is shown (implies ALL athletes).
3. **Given** an exercise tagged `['SS', 'MS']`, **When** displayed, **Then** chip shows `SS·MS` (dot-separated, 3-char max abbreviations).
4. **Given** the coach saves a session with tagged exercises, **When** the data is persisted, **Then** `session_plan_exercises.target_event_groups` contains the correct text array.

---

### User Story 3 — Coach previews session as a specific subgroup (Priority: P1)

A coach wants to see what an SS athlete would see in a session. The sub-header has a dropdown that filters the exercise list to show only exercises matching a specific subgroup, without hiding them — non-matching exercises are dimmed.

**Why this priority**: Without preview, the coach has no way to verify that the subgroup tagging is correct before athletes see it. Critical for QA of the tagging workflow.

**Independent Test**: Open session planner → set dropdown to "SS" → exercises not tagged SS are dimmed (opacity 30%) → exercise count updates to filtered count → set back to "ALL" → all exercises fully visible.

**Acceptance Scenarios**:

1. **Given** a session with 8 exercises (3 tagged SS, 2 tagged MS, 3 ALL), **When** coach selects "SS" from the preview dropdown, **Then** the 3 SS exercises + 3 ALL exercises are fully visible, 2 MS exercises are dimmed to opacity 30%, and the exercise count shows "6 exercises".
2. **Given** the preview dropdown, **When** no subgroups exist in the current group's athletes, **Then** the dropdown shows only "ALL" and is disabled.
3. **Given** the session is in preview mode ("SS"), **When** coach edits a dimmed exercise, **Then** editing is still allowed (preview is visual only, not a lock).

---

### User Story 4 — Athlete sees only their subgroup's exercises (Priority: P1)

An athlete opens their workout and sees only exercises tagged for their event_group (or tagged for ALL). Exercise count, progress tracking, and completion reflect the filtered set.

**Why this priority**: The whole point of subgroup tagging. Athletes must never be confused by exercises meant for other subgroups.

**Independent Test**: Log in as SS athlete → open workout → only see exercises where `target_event_groups IS NULL` or contains "SS" → exercise count matches filtered set → complete all visible exercises → session shows 100% done.

**Acceptance Scenarios**:

1. **Given** a session with 8 exercises (3 SS, 2 MS, 3 ALL) and an SS athlete, **When** athlete opens workout, **Then** they see 6 exercises (3 SS + 3 ALL), not 8.
2. **Given** an athlete with no `event_group` set (NULL), **When** they open workout, **Then** they see ALL exercises (safe default — no filtering).
3. **Given** the filtered exercise list, **When** athlete completes all visible exercises, **Then** session shows 100% complete (not 6/8).
4. **Given** a coach modifies subgroup tags on a session, **When** an athlete refreshes, **Then** they see the updated filtered list.

---

### User Story 5 — Coach uses templates as exercise group insertion (Priority: P2)

A coach is building a session and wants to insert a saved block of exercises (e.g., "Sprint Warmup" — 5 exercises). They open a template picker from the session planner, select a template, and the exercises are appended to the current session.

**Why this priority**: Templates eliminate repetitive exercise entry. The coach reuses standard warmup/cooldown blocks across many sessions. This is NOT session creation — it's exercise group insertion into an existing session.

**Independent Test**: Open session planner → click "Insert from Template" → select template → exercises appended to current session → save → exercises persisted.

**Acceptance Scenarios**:

1. **Given** a session with 3 exercises and a template with 5 exercises, **When** coach inserts the template, **Then** the session now has 8 exercises with the template's 5 appended after the existing 3, with correct `exercise_order` values.
2. **Given** the template picker, **When** coach searches, **Then** results filter by template name AND description.
3. **Given** a coach in the session planner, **When** they click "Save as Template", **Then** all current exercises are saved as a new template with the session name pre-filled.
4. **Given** the `/templates` page, **When** coach visits, **Then** they see a list of templates with exercise count, creation date, and delete action — no runtime crash, no broken types.

---

### User Story 6 — Athlete sees weekly mini calendar with session previews (Priority: P2)

An athlete/individual opens the dashboard and sees a horizontal weekly calendar strip with dots on days with sessions. Tapping a day shows a full exercise list preview with one-line summaries and a "Start Workout" CTA.

**Why this priority**: Replaces the current single "Today's Workout" card with a week-at-a-glance view. Athletes can see upcoming sessions and plan ahead.

**Independent Test**: Open dashboard → see weekly calendar with today highlighted → tap a day with a dot → see session card with exercise list (e.g., "1. Bench Press  3×10 80kg") → tap "Start" → navigate to workout.

**Acceptance Scenarios**:

1. **Given** an athlete with 3 sessions this week (Mon, Wed, Fri), **When** they open the dashboard, **Then** they see date numbers with dots under Mon/Wed/Fri, today highlighted.
2. **Given** the mini calendar showing today, **When** athlete taps Wednesday, **Then** Wednesday's session preview loads below with full exercise list and "Start Workout" CTA.
3. **Given** multiple sessions on one day, **When** athlete taps that day, **Then** session cards stack vertically.
4. **Given** a day with no session, **When** athlete taps it, **Then** they see "No training scheduled — Enjoy your rest day".
5. **Given** the mini calendar, **When** athlete swipes left/right (mobile) or taps arrows, **Then** the calendar shifts to the adjacent week and fetches that week's sessions.

---

### User Story 7 — Coach pastes program text and gets structured exercises (Priority: P2)

A coach migrating from TrainHeroic pastes a block of free-form text describing a session (copy-pasted from a print view or spreadsheet). The AI parses it into structured exercises with sets, and the coach reviews/edits before inserting into the session.

**Why this priority**: Eliminates manual data entry for migration. The coach has dozens of sessions to move. Even imperfect parsing saves hours.

**Independent Test**: Open session planner → click "Paste Program" → paste text block → AI returns structured exercises → coach previews and edits → inserts into session.

**Acceptance Scenarios**:

1. **Given** text like `"Bench Press 3x10 @ 80kg\nPull-ups 3x8\n60m sprints 4x 7.5s"`, **When** coach pastes and submits, **Then** AI returns 3 structured exercises with correct sets/reps/weight/distance/time.
2. **Given** the AI cannot parse a line (e.g., ambiguous text), **When** results are shown, **Then** that line is flagged for manual review with the original text displayed.
3. **Given** the parsed exercise preview, **When** coach edits a field (changes reps from 10 to 12), **Then** the edit is reflected before insertion.
4. **Given** confirmed exercises, **When** coach clicks "Insert", **Then** exercises are added to the current session via the changeset pattern.
5. **Given** text with TrainHeroic "hack" format (`"SS - Minihurdle Drills\n4x30m\nMS - Tempo Runs\n3x150m"`), **When** parsed, **Then** AI infers subgroup headers and tags exercises with `target_event_groups` accordingly.

---

### User Story 8 — Workspace session cards show subgroup indicators (Priority: P1)

When a session has exercises targeting different subgroups, the workspace session card shows a small muted text line listing which subgroups are present (e.g., "SS · MS · LS"). The MicrocycleEditor 7-day grid shows colored dots indicating subgroups per day.

**Why this priority**: Coaches need at-a-glance visibility of which subgroups are covered per session without opening the session planner.

**Independent Test**: Open workspace → session card with mixed targeting shows "SS · MS · LS" text line → session with all-ALL exercises shows no subgroup line.

**Acceptance Scenarios**:

1. **Given** a session with exercises tagged SS, MS, and ALL, **When** displayed in the workspace card, **Then** a small muted text line shows "SS · MS" (ALL is not listed, only specific tags).
2. **Given** a session where ALL exercises are untagged (NULL), **When** displayed, **Then** no subgroup indicator line is shown.
3. **Given** the MicrocycleEditor 7-day grid, **When** a day has sessions with SS and LS exercises, **Then** colored dots appear below the session card indicating those subgroups.

---

### User Story 9 — Templates page works (Priority: P2)

The `/templates` page loads without crashing, shows actual template data, has proper role guards, and follows the current design system. Coach-only access.

**Why this priority**: The page is currently broken (runtime crash). Must work before template insertion workflow is useful.

**Independent Test**: Navigate to `/templates` → page loads with template list → search works → delete works → no crash.

**Acceptance Scenarios**:

1. **Given** a coach with 5 saved templates, **When** they visit `/templates`, **Then** the page loads with 5 template cards showing name, description, exercise count, and creation date.
2. **Given** an athlete user, **When** they try to visit `/templates`, **Then** they are redirected (role guard: coach and individual only).
3. **Given** the template list, **When** coach searches "warmup", **Then** results filter by both name and description.
4. **Given** a template card, **When** coach clicks delete, **Then** the template is soft-deleted and removed from the list.

---

### Edge Cases

- **Empty event_groups**: If a group has no athletes with event_groups set → subgroup chip popover shows empty state, preview dropdown disabled.
- **Athlete changes event_group**: Coach reassigns athlete from SS to MS → athlete's next workout load shows MS-filtered exercises.
- **Template with subgroup tags**: Template exercises preserve their `target_event_groups` when inserted. Coach can modify after insertion.
- **Session with 0 exercises**: Workspace card shows "No exercises" — volume/duration show "—".
- **AI parser gets garbage text**: Lines that can't be parsed are flagged, not silently dropped. Coach can edit and re-parse.
- **Multiple sessions per day in calendar**: Cards stack vertically, each with own CTA.
- **Subgroup preview + edit**: Editing an exercise while previewing as "SS" still works — preview is visual only.
- **RLS enforcement**: Subgroup filtering is enforced at Postgres level, not just frontend. An athlete cannot access exercises outside their event_group via direct API call.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Shared Infrastructure
- **FR-001**: System MUST provide a shared `computeSessionMetrics(sets, exerciseType?)` utility that computes volume and duration from set data. Formula per type: Strength = `Σ(sets × reps × weight)` kg, Sprint = `Σ(sets × distance)` m, Timed = `Σ(performing_time)` s, Bodyweight = `Σ(sets × reps)`.
- **FR-002**: System MUST provide a shared `formatExerciseSummary(exercise)` utility that produces one-line summaries: "3×10 80kg" (strength), "4×60m 7.2s" (sprint), "3×30s" (timed), "3×12" (bodyweight). Replaces the dead `formatShorthand` in `training/types.ts`.
- **FR-003**: Both utilities MUST be importable from a single shared location (e.g., `@/lib/training-utils`).

#### Workspace Enhancement (#22)
- **FR-010**: Workspace session cards MUST show top 2-3 exercise names from `session_plan_exercises` in a muted text line, truncated with "..." if more exist.
- **FR-011**: Session card duration MUST be computed from actual set data, not the manual `duration` field.
- **FR-012**: Session card volume MUST be computed from actual set data using FR-001 formulas, not the manual `volume` field.
- **FR-013**: Workspace `Session` interface `exercises` field MUST be properly typed (replace `any[]`).
- **FR-014**: Quick-add session from workspace MUST use a sheet/drawer, not full-page navigation.

#### Subgroup Filtering (#23)
- **FR-020**: `session_plan_exercises` table MUST have a `target_event_groups TEXT[]` column (NULL = all athletes).
- **FR-021**: Session planner ExerciseCard MUST show a subgroup chip between exercise name and action buttons. 3-char max abbreviations (SS, MS, LS, HRD, JMP, THR, DST, MUL).
- **FR-022**: Tapping the chip MUST open a multi-select popover populated with event_groups from athletes in the current athlete group.
- **FR-023**: Session planner sub-header MUST have a preview dropdown (not segmented toggle) that dims non-matching exercises to 30% opacity without hiding them.
- **FR-024**: Athlete workout view MUST filter exercises: show only where `target_event_groups IS NULL` or `athlete.event_group = ANY(target_event_groups)`.
- **FR-025**: If athlete has no event_group set → show ALL exercises (safe default).
- **FR-026**: Exercise count in workout header MUST reflect filtered count, not total count.
- **FR-027**: Subgroup filtering MUST be enforced at Postgres RLS level for athlete reads.
- **FR-028**: AI session planner tools MUST support `targetEventGroups` parameter on `createSessionPlanExerciseChangeRequest`.
- **FR-029**: AI system prompt MUST include subgroup targeting rules and show `[SS]`/`[ALL]` tags in exercise context output.
- **FR-030**: Workspace session cards MUST show subgroup indicator line ("SS · MS · LS") when session has mixed targeting.
- **FR-031**: MicrocycleEditor 7-day grid MUST show colored dots for subgroups per session.

#### Template System (#33)
- **FR-040**: `/templates` page MUST be rebuilt with `serverProtectRoute`, `PageLayout`, server component data fetch, proper types.
- **FR-041**: Template cards MUST show: name, description (truncated), exercise count (from join), creation date, delete action.
- **FR-042**: Session planner toolbar MUST have "Save as Template" button → dialog with pre-filled name → calls `saveAsTemplateAction`.
- **FR-043**: Session planner MUST have "Insert from Template" action → opens sheet with searchable template browser → selecting a template appends its exercises to the current session.
- **FR-044**: Template insertion MUST preserve exercise order, sets, and `target_event_groups` from the template.
- **FR-045**: Search MUST filter by both name AND description.

#### Dashboard Mini Calendar (#31)
- **FR-050**: Dashboard MUST show a horizontal weekly calendar strip with date numbers, today highlighted, dots under days with sessions.
- **FR-051**: Tapping a date MUST show that day's session previews below with full exercise list using FR-002 formatter.
- **FR-052**: Swipe (mobile) or arrow tap MUST navigate to adjacent weeks with client-side fetch.
- **FR-053**: Initial render MUST be server-side for fast first paint; subsequent weeks use TanStack Query.
- **FR-054**: Exercise list MUST respect athlete's subgroup filtering (FR-024).
- **FR-055**: Mini calendar MUST only appear for individual and athlete roles, not coach.

#### AI Text Parser (#25)
- **FR-060**: Session planner MUST have a "Paste Program" action that opens a text input area.
- **FR-061**: AI MUST parse free-form text into structured exercises matching `session_plan_exercises` + `session_plan_sets` schema using Claude structured output (tool_use, not streaming).
- **FR-062**: Parsed output MUST include: exerciseName, sets (reps, weight, distance, performing_time, rest_time, rpe), targetEventGroups, notes.
- **FR-063**: Unparseable lines MUST be flagged for manual review, not silently dropped.
- **FR-064**: Coach MUST be able to edit/reorder/delete parsed exercises before confirming insertion.
- **FR-065**: Confirmed exercises MUST be inserted via the existing changeset pattern.
- **FR-066**: Parser MUST handle TrainHeroic "hack" format (exercise names as subgroup headers).

### Key Entities

- **session_plan_exercises.target_event_groups** (NEW): `TEXT[]`, nullable. Array of event group codes. NULL = visible to all athletes. Drives subgroup filtering at both UI and RLS level.
- **SessionMetrics** (NEW utility type): `{ volume: number, volumeUnit: string, duration: number, exerciseCount: number }` — computed from sets.
- **ExerciseSummary** (NEW utility): One-line formatted string per exercise, type-aware.
- **Template** (existing): A `session_plan` row with `is_template = true`. Contains `session_plan_exercises` and `session_plan_sets` as children.
- **WeekCalendarData** (NEW): `{ dates: Date[], sessions: Map<string, SessionPreview[]> }` — powers the mini calendar.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Coach can see exercise names in workspace session cards without entering session planner (0 clicks vs current 2 clicks).
- **SC-002**: Session card volume/duration reflect actual exercise data — no hardcoded values in workspace.
- **SC-003**: Coach can tag exercises with subgroup targets in under 3 taps per exercise (chip → popover → select → close).
- **SC-004**: Athlete sees only their subgroup's exercises with correct filtered count (verified at RLS level — direct API cannot bypass).
- **SC-005**: Coach can insert a 5-exercise template into a session in under 10 seconds (toolbar → picker → select → done).
- **SC-006**: `/templates` page loads without crash and matches current design system.
- **SC-007**: Athlete dashboard shows weekly calendar with session previews — can browse adjacent weeks.
- **SC-008**: Coach can paste 10 lines of program text and get structured exercises in under 15 seconds (paste → AI parse → preview → insert).
- **SC-009**: All new components follow existing lean utility minimalism design patterns (no heavy card patterns, consistent with dashboard-layout.tsx style).
- **SC-010**: Build passes (`npm run build:web`) with zero TypeScript errors after implementation.

---

## Shared Infrastructure (Cross-Feature)

These shared utilities are extracted because multiple features need them:

| Utility | Used By | Location |
|---------|---------|----------|
| `computeSessionMetrics()` | #22 workspace cards, #31 calendar preview, `SessionDetailsDialog` | `@/lib/training-utils` |
| `formatExerciseSummary()` | #31 calendar exercise list, #22 workspace exercise names, #33 template cards | `@/lib/training-utils` |
| `getEventGroupsForGroup(groupId)` | #23 chip popover, #23 preview dropdown, #25 AI parser subgroup inference | server action in athlete-actions |
| Subgroup filtering logic | #23 athlete workout, #31 calendar preview, #23 RLS policy | Postgres function + JS utility |

### Existing Infrastructure to Reuse (NOT rebuild)

| What | Where | Reuse For |
|------|-------|-----------|
| `copySessionAction` + `CopySessionDialog` | `session-plan-actions.ts` | Already built — no copy session work needed |
| `saveAsTemplateAction` | `session-plan-actions.ts` | #33 save template |
| `getTemplatesAction` | `session-plan-actions.ts` | #33 template list |
| `createPlanFromTemplateAction` | `session-plan-actions.ts` | #33 template insertion (adapt for exercise-group insertion) |
| Changeset pattern + proposal tools | `lib/changeset/tools/proposal-tools.ts` | #25 AI parser insertion, #23 AI subgroup tagging |
| TanStack Query hooks | `use-workout-queries.ts`, `use-session-queries.ts` | #31 week navigation, all client-side data fetching |
| `EXERCISE_FIELDS` config | `exercise-card.tsx:45-54` | Reference for field detection in formatters |
| `getActiveColumns()` pattern | `SessionDetailsDialog.tsx:44-48` | Reference for dynamic column detection |

### Data Flow Dependencies

```
#22 (workspace cards) ← shared utils (FR-001, FR-002)
     ↓
#23 (subgroup filtering) ← extends workspace cards with subgroup indicators
     ↓                    ← adds schema column + RLS + AI integration
#33 (templates) ← uses session planner surface modified by #23
     ↓          ← preserves target_event_groups on insertion
#31 (calendar) ← uses shared utils + subgroup filtering
#25 (AI parser) ← uses changeset pattern + optional subgroup inference
```

Recommended implementation order: **FR-001/002 shared utils → #22 → #23 → #33 → #31 → #25**
