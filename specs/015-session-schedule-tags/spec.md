# Feature Specification: Session-Level Schedule Tags (Unified Event Groups)

**Feature Branch**: `015-session-schedule-tags`
**Created**: 2026-03-15
**Status**: Draft
**Input**: Support different training frequencies within the same group by extending event groups to session-level visibility
**Issues**: [#44](https://github.com/singli-h/Kasoku.run/issues/44)
**Extends**: [#23](https://github.com/singli-h/Kasoku.run/issues/23) (exercise-level subgroup filtering)
**Epic**: [#30](https://github.com/singli-h/Kasoku.run/issues/30) (Coach Flow V2)

---

## Problem Statement

Within a single coaching group (e.g., "Sprinters"), athletes train on different weekly schedules. Some do 2 days track + 3 days gym, others do 3 days track + 2 days gym. The coach considers them the same team, but their session count per week differs.

**Current system gaps:**
- **Groups** (`athlete_groups`) = who trains together. Cannot differentiate frequency within a group.
- **Event groups** (`target_event_groups` on exercises) = different exercises within same session. Only operates at exercise level, not session level.
- **No structured frequency data** — training schedule is freetext in `planning_context`.

**Coach workaround (TrainHeroic):** Assign athletes to a second group with a different gym plan. Athletes see both schedules. This breaks the "group = team" semantic and duplicates shared sessions.

**Design principle:** Extend the existing event group mechanism rather than introducing a new concept. Tags become a general-purpose visibility mechanism at both session and exercise levels.

---

## User Scenarios & Testing

### User Story 1 — Coach assigns multiple tags to an athlete (Priority: P1)

A coach manages a group where athletes have different sprint disciplines AND different training schedules. The coach assigns multiple tags per athlete (e.g., `SS` for discipline + `3T` for schedule).

**Why this priority**: Multi-tag assignment is the foundation — without it, athletes can only carry one label and schedule-based filtering is impossible.

**Independent Test**: Open athlete roster → click tags cell → multi-select popover opens → select `SS` and `3T` → save → verify `athletes.event_groups` contains `['SS', '3T']` in DB.

**Acceptance Scenarios**:

1. **Given** the athlete roster, **When** coach clicks the tags cell for an athlete, **Then** a multi-select popover opens showing all coach-defined event groups with checkboxes.
2. **Given** an athlete with tags `['SS', '3T']`, **When** displayed in the roster, **Then** badges show `[SS] [3T]` side by side.
3. **Given** an athlete with no tags assigned, **When** the coach has event groups defined, **Then** the roster shows a subtle "No tags" warning indicator.
4. **Given** the coach saves multiple tags, **When** the data is persisted, **Then** `athletes.event_groups` contains the correct text array.
5. **Given** an athlete previously had `event_group: 'SS'` (scalar), **When** the migration runs, **Then** it is converted to `event_groups: ['SS']` (single-element array).

---

### User Story 2 — Coach tags sessions with schedule visibility (Priority: P1)

A coach builds a weekly microcycle and tags specific sessions as visible only to athletes with matching schedule tags. Untagged sessions remain visible to all athletes.

**Why this priority**: This is the core feature — without session-level tags, there's no way to show different session counts to different athletes within the same group.

**Independent Test**: Open session planner → find "Visible to" tag selector → select `3T` → save → verify `session_plans.target_event_groups` contains `['3T']` in DB.

**Acceptance Scenarios**:

1. **Given** the session editor, **When** coach views a session, **Then** a "Visible to" tag selector appears (same component pattern as exercise-level tags).
2. **Given** a session with no tags (NULL), **When** displayed, **Then** no visibility restriction is shown (implies all athletes see it).
3. **Given** a session with `target_event_groups: []` (empty array), **When** displayed and queried, **Then** it behaves identically to NULL — visible to all athletes, no restriction shown.
4. **Given** a session tagged `['3T']`, **When** displayed in the session editor, **Then** chip shows `3T` with an `x` to remove.
5. **Given** the coach saves a session with tags, **When** the data is persisted, **Then** `session_plans.target_event_groups` contains the correct text array.
6. **Given** a session tagged `['3T']` with exercises tagged `['SS']`, **When** an athlete with `['SS', '3T']` views it, **Then** they see the session AND the SS exercises (two-level filtering composes correctly).

---

### User Story 3 — Coach previews microcycle as a specific schedule (Priority: P1)

A coach has built a week with 9 sessions (shared + schedule-specific variants). They want to preview what a specific schedule profile sees without switching athlete accounts.

**Why this priority**: Without this, the coach sees all 9 sessions in a flat view which is noisy. The preview filter makes the complex case manageable.

**Independent Test**: Open microcycle editor → click "Preview as" dropdown → select `2T` → only untagged sessions + sessions tagged `2T` are visible → select "All" to restore full view.

**Acceptance Scenarios**:

1. **Given** a microcycle with sessions tagged for different schedules, **When** the coach opens the editor, **Then** a "Preview as" dropdown appears next to the microcycle title.
2. **Given** the dropdown is open, **When** the coach selects `2T`, **Then** only untagged sessions and sessions with `2T` in their `target_event_groups` are visible.
3. **Given** the preview filter is set to `2T`, **When** a day has both a `[2T]` and a `[3T]` session, **Then** only the `[2T]` session shows in that day column.
4. **Given** the preview filter is set to "All", **When** viewing the grid, **Then** all sessions are visible (default behavior).
5. **Given** the dropdown options, **When** displayed, **Then** they include "All" plus every distinct tag found in `target_event_groups` across the microcycle's sessions. Tags not used on any session do not appear.
6. **Given** the preview filter is set to `2T`, **When** viewing exercises within a visible session, **Then** exercise-level tag filtering is NOT applied — the coach always sees all exercises regardless of discipline tags. The preview filter operates on session visibility only.

---

### User Story 4 — Athlete sees only their scheduled sessions (Priority: P1)

An athlete with tags `['MS', '2T']` opens their dashboard and sees only sessions that match their schedule. Sessions tagged for other schedules are hidden at the database level (RLS).

**Why this priority**: This is the athlete-facing outcome — the whole point of schedule tags is that athletes see only their sessions.

**Independent Test**: Athlete with `['MS', '2T']` opens workout dashboard → sees only untagged sessions + sessions tagged `2T`. Sessions tagged `['3T']` are not returned by the query (RLS-enforced).

**Acceptance Scenarios**:

1. **Given** an athlete with `event_groups: ['MS', '2T']`, **When** they query session_plans, **Then** RLS returns only sessions where `target_event_groups IS NULL` OR `target_event_groups = '{}'` OR `athlete.event_groups && session.target_event_groups`.
2. **Given** an athlete with `event_groups: NULL` (no tags), **When** they query sessions, **Then** RLS returns only sessions where `target_event_groups IS NULL OR target_event_groups = '{}'` (untagged/shared sessions only).
3. **Given** a session the athlete can see, **When** it contains exercises with `target_event_groups`, **Then** exercise-level filtering also applies (athlete sees only exercises matching their tags).
4. **Given** the workout session start action, **When** exercises are copied to the workout log, **Then** only exercises matching the athlete's tags are included (existing behavior, updated for array overlap).

---

### User Story 5 — Athlete with no tags sees only shared content (Priority: P2)

An athlete who has not been assigned any tags sees only untagged (shared) sessions and exercises. This prevents unconfigured athletes from seeing schedule-specific content.

**Why this priority**: Changed from the previous behavior where `event_group IS NULL` meant "see everything." With schedule tags, the old behavior would show an unconfigured athlete all 9 sessions, which is confusing.

**Independent Test**: Athlete with `event_groups: NULL` → queries sessions → sees only sessions where `target_event_groups IS NULL`. Sessions tagged `['3T']` are NOT returned.

**Acceptance Scenarios**:

1. **Given** an athlete with `event_groups: NULL`, **When** they view the dashboard, **Then** they see only untagged sessions and untagged exercises.
2. **Given** an athlete with `event_groups: []` (empty array), **When** they view the dashboard, **Then** same behavior as NULL — only shared content.
3. **Given** the athlete roster, **When** a coach has event groups defined but an athlete has no tags, **Then** a warning indicator appears on that athlete's row.

---

### User Story 6 — Data migration preserves existing event group assignments (Priority: P1)

Existing athletes with `event_group: 'SS'` (scalar text) are migrated to `event_groups: ['SS']` (single-element array) without data loss.

**Why this priority**: Breaking existing data during migration would silently hide exercises from athletes.

**Independent Test**: Run migration → query `athletes` → all rows with previous `event_group` values now have `event_groups` as single-element arrays. Rows with `event_group: NULL` have `event_groups: NULL`.

**Acceptance Scenarios**:

1. **Given** an athlete with `event_group: 'SS'`, **When** migration runs, **Then** `event_groups` is `['SS']`.
2. **Given** an athlete with `event_group: NULL`, **When** migration runs, **Then** `event_groups` is `NULL`.
3. **Given** the old `event_group` column, **When** migration completes, **Then** the column is dropped.
4. **Given** the `auth_athlete_event_group()` function, **When** migration runs, **Then** it is replaced by `auth_athlete_event_groups()` returning `TEXT[]`.
5. **Given** all RLS policies referencing `auth_athlete_event_group()`, **When** migration runs, **Then** they use `&&` (array overlap) with `auth_athlete_event_groups()`.
6. **Given** athletes with `event_group: NULL` who currently see all tagged exercises (old behavior), **When** the migration deploys, **Then** they will only see untagged/shared content (new behavior). This is an intentional breaking change — coaches must assign tags to affected athletes before or immediately after deployment.

**Migration execution order** (within single transaction):
1. Add `event_groups TEXT[]` column
2. Populate from existing `event_group` scalar values
3. Add `target_event_groups TEXT[]` to `session_plans`
4. Create new `auth_athlete_event_groups()` function returning `TEXT[]`
5. Update all RLS policies to use `&&` with new function
6. Create new RLS SELECT policy on `session_plans` for session-level filtering
7. Drop old `auth_athlete_event_group()` function
8. Drop old `event_group` column

---

## Visibility Rules (Complete Truth Table)

| Session `target_event_groups` | Exercise `target_event_groups` | Athlete `event_groups` | Session visible? | Exercise visible? |
|------------------------------|-------------------------------|----------------------|-----------------|-------------------|
| NULL | NULL | NULL | Yes | Yes |
| NULL | NULL | `['SS', '2T']` | Yes | Yes |
| NULL | `['SS']` | `['SS', '2T']` | Yes | Yes (overlap) |
| NULL | `['SS']` | `['MS', '2T']` | Yes | No (no overlap) |
| NULL | `['SS']` | NULL | Yes | No (athlete untagged) |
| `['3T']` | NULL | `['SS', '3T']` | Yes (overlap) | Yes |
| `['3T']` | `['SS']` | `['SS', '3T']` | Yes (overlap) | Yes (overlap) |
| `['3T']` | `['SS']` | `['MS', '3T']` | Yes (overlap) | No (no overlap) |
| `['3T']` | NULL | `['SS', '2T']` | No (no overlap) | N/A |
| `['3T']` | NULL | NULL | No (athlete untagged) | N/A |
| `[]` | NULL | any | Yes (empty = shared) | Yes |
| `[]` | `['SS']` | `['MS']` | Yes (empty = shared) | No (no overlap) |

---

## Lo-Fi Wireframes

### Athlete Roster — Multi-Tag Assignment

```
┌─────────────────────────────────────────────────────────┐
│ Athletes                                    [+ Invite]  │
├──────────┬──────────┬───────────────────────┬───────────┤
│ Name     │ Group    │ Tags                  │ Actions   │
├──────────┼──────────┼───────────────────────┼───────────┤
│ John D.  │ Sprints  │ [SS] [3T]             │ ...       │
│ Sarah K. │ Sprints  │ [MS] [2T]             │ ...       │
│ Mike R.  │ Sprints  │ [LS] [3T]             │ ...       │
│ Amy L.   │ Sprints  │ (!) No tags           │ ...       │
├──────────┼──────────┼───────────────────────┼───────────┤
                       click opens:
                      ┌───────────────────┐
                      │ [x] SS            │
                      │ [ ] MS            │
                      │ [ ] LS            │
                      │ ───────────────── │
                      │ [x] 3T  (3 track) │
                      │ [ ] 2T  (2 track) │
                      │       [Clear all] │
                      └───────────────────┘
```

### Microcycle Editor — Preview Filter + Session Tags

```
┌─────────────────────────────────────────────────────────────┐
│ Week 3 - Sprinters                                          │
│                                                             │
│ Preview as: [All v]  <- dropdown: All | 2T | 3T | SS | MS  │
├─────────┬─────────┬─────────┬─────────┬─────────┬────┬────┤
│   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │Sat │Sun │
├─────────┼─────────┼─────────┼─────────┼─────────┼────┼────┤
│┌───────┐│┌───────┐│┌───────┐│┌───────┐│┌───────┐│    │    │
││Track  ││││Gym    ││││Track  ││││Track  ││││Gym    ││    │    │
││       ││││  [2T] ││││  [3T] ││││       ││││  [2T] ││    │    │
││3 ex   ││││4 ex   ││││3 ex   ││││3 ex   ││││4 ex   ││    │    │
││SS-MS  │││└───────┘││└───────┘││SS-MS  │││└───────┘│    │    │
│└───────┘││┌───────┐││┌───────┐│└───────┘││┌───────┐│    │    │
│         │││Track  ││││Gym    ││         │││Gym    ││    │    │
│         │││  [3T] ││││  [3T] ││         │││  [3T] ││    │    │
│         │││3 ex   ││││4 ex   ││         │││4 ex   ││    │    │
│         ││└───────┘││└───────┘│         ││└───────┘│    │    │
└─────────┴─────────┴─────────┴─────────┴─────────┴────┴────┘
```

### Filtered to "2T" Preview

```
┌─────────────────────────────────────────────────────────────┐
│ Week 3 - Sprinters                                          │
│                                                             │
│ Preview as: [2T v]   <- shows only matching + untagged      │
├─────────┬─────────┬─────────┬─────────┬─────────┬────┬────┤
│   Mon   │   Tue   │   Wed   │   Thu   │   Fri   │Sat │Sun │
├─────────┼─────────┼─────────┼─────────┼─────────┼────┼────┤
│┌───────┐│┌───────┐│         │┌───────┐│┌───────┐│    │    │
││Track  ││││Gym    ││         ││Track  ││││Gym    ││    │    │
││       ││││  [2T] ││         ││       ││││  [2T] ││    │    │
││3 ex   ││││4 ex   ││         ││3 ex   ││││4 ex   ││    │    │
│└───────┘││└───────┘│         │└───────┘││└───────┘│    │    │
└─────────┴─────────┴─────────┴─────────┴─────────┴────┴────┘
  Coach sees clean 4-session week for 2T athletes
```

### Session Editor — Visibility Tag

```
┌──────────────────────────────────────┐
│ Session: Tuesday Gym                 │
│ Type: [Gym v]   Day: [Tue v]        │
│                                      │
│ Visible to: [2T x]  [+ add tag]     │
│             (empty = everyone sees)  │
│──────────────────────────────────────│
│ Exercises:                           │
│  1. Back Squat          [ALL]        │
│  2. RDL                 [ALL]        │
│  3. Nordic Curls        [SS]         │
│  4. Calf Raises         [LS]         │
└──────────────────────────────────────┘
```

---

## Scope Boundaries

### In Scope
- `athletes.event_group TEXT` → `athletes.event_groups TEXT[]` (schema + migration)
- `session_plans.target_event_groups TEXT[]` (new column + GIN index)
- RLS function update: `auth_athlete_event_group()` → `auth_athlete_event_groups()` returning `TEXT[]`
- RLS policy updates on `session_plan_exercises` and `session_plan_sets`: `= ANY()` → `&&` overlap
- **New RLS SELECT policy on `session_plans`** table filtering by `target_event_groups && auth_athlete_event_groups()`
- Multi-select tag editor on athlete roster (replaces single-select)
- Session-level tag selector in session editor
- "Preview as" filter dropdown in microcycle editor
- Untagged athlete warning indicator
- Update all server actions for array handling (see affected files below)
- Update all client-side filter logic for array overlap

### Affected Server Actions (array migration)
- `athlete-actions.ts`: `inviteOrAttachAthleteAction` (scalar → array write), `getEventGroupsForGroupAction` (flatMap + dedup)
- `event-group-actions.ts`: `deleteEventGroupAction` (`.eq()` → `.contains()`)
- `onboarding-actions.ts`: scalar write → array write, Clerk metadata type
- `generate-microcycle-action.ts`: `.map(a => a.event_group)` → `.flatMap(a => a.event_groups ?? [])`
- `workout-session-actions.ts`: exercise filter `.includes(scalar)` → array overlap
- `dashboard-actions.ts`: same filter change as workout-session-actions

Note: `session_plan_exercises.target_event_groups` already exists as `TEXT[]` and requires no migration.

### Out of Scope
- Event group categories/types (discipline vs schedule labeling)
- Auto-generation of sessions based on schedule profiles
- Schedule template system
- Multi-group membership for athletes
- Changes to the event_groups definition table
- Changes to the AI changeset system (exercise tool calls unchanged)
- Template divergence tracking (#27)

---

## Technical Constraints

1. **RLS is the source of truth**: Session-level filtering MUST be enforced via a new RLS policy on `session_plans`, not via application-level filtering. Application code does NOT filter sessions — Supabase queries return only visible sessions. Exercise-level filtering continues to be dual-layer (RLS + application) to support the workout log copy use case.
2. **Backwards compatible**: Coaches who never use schedule tags experience zero change. NULL/empty `target_event_groups` = visible to all.
3. **Single migration**: The column type change (`TEXT` → `TEXT[]`) and data migration must be atomic to avoid partial states. Execution order matters — see User Story 6 for the required step sequence.
4. **GIN index required**: `session_plans.target_event_groups` needs a GIN index for RLS query performance, matching the existing `idx_spe_target_event_groups` on `session_plan_exercises`.
5. **Type regeneration**: `database.ts` must be regenerated after migration to reflect the new column types.
6. **3-char abbreviation rule**: Preserved — all tags (discipline or schedule) follow the existing `VARCHAR(3)` constraint on `event_groups.abbreviation`.
7. **Behavioral change for untagged athletes**: Athletes with `event_groups IS NULL` will see only untagged content post-migration (previously saw everything). This is intentional but requires coach awareness.
