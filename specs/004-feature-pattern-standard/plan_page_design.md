# Plans Page Design Analysis & Improvement Plan

> **Last Updated**: 2025-12-28
> **Status**: ✅ Research Complete, Decisions Made, Ready for Implementation
> **Related Pages**: `/plans`, `/plans/[id]`, `/plans/[id]/session/[sessionId]`

---

## Decisions Summary

| Decision | Choice | Status |
|----------|--------|--------|
| Date change behavior | Restrict to microcycle dates only | ✅ Decided |
| Exercise picker format | Half-sheet (70% height) | ✅ Decided |
| Superset ID storage | Sequential integers (1, 2, 3) with reindexing | ✅ Decided |
| Add exercise to section | Section [+ Add] buttons (desktop) + FAB (mobile) | ✅ Decided |
| Superset creation | Checkbox selection + "Link" button | ✅ Decided |
| Superset removal | Unlink button on header + drag-out to unlink single | ✅ Decided |
| **Navigation design** | **Keep 3-panel with calendar-focused UX improvements** | ✅ Decided |
| **Phase card design** | **Borderless, minimal, colored header/stripe** | ✅ Decided |
| **Group sprint timing** | **Excel-like grid view (Athletes × Distances)** | ✅ Decided |
| **Draft/Active state** | **Add status column + is_published + cascade logic** | ✅ Decided |
| **Assign button** | **Move to kebab menu (⋮)** | ✅ Decided |

---

## Table of Contents
1. [Research & Analysis](#research--analysis)
2. [Newly Identified Issues (2025-12-28)](#newly-identified-issues-2025-12-28)
3. [Technical Design: Draft/Publish System](#technical-design-draftpublish-system)
4. [Current State Analysis](#current-state-analysis)
5. [Identified Issues](#identified-issues)
6. [UI/UX Improvement Proposals](#uiux-improvement-proposals)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Research & Analysis

### Q1: Navigation Design Analysis

**Research Sources:**
- [CoachRx Periodization Tools](https://www.coachrx.app/articles/planning-amp-periodization-tools-to-design-better-programs)
- [TrainerRoad Periodization](https://www.trainerroad.com/blog/training-periodization-macro-meso-microcycles-of-training/)
- [Zfort Fitness App UX](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)
- [Eastern Peak App Design](https://easternpeak.com/blog/fitness-app-design-best-practices/)
- [Stormotion Fitness UX](https://stormotion.io/blog/fitness-app-ux/)

**Industry Findings:**

| Platform | Navigation Approach |
|----------|---------------------|
| **CoachRx** | Calendar-based primary view with sidebar for periodization planning. "Zoom in/out" paradigm to navigate from macro → meso → micro → daily |
| **TrainerRoad** | Calendar view with training blocks shown as visual segments. Click week to expand sessions |
| **TeamBuildr** | Dashboard + calendar hybrid. Team/athlete selector, then calendar view of workouts |
| **TrainHeroic** | Calendar-first with team/athlete context switcher |

**Best Practice Consensus:**
1. **Calendar as primary interface** - Coaches think in dates, not hierarchies
2. **Avoid deep menu structures** - "If there are more than three buttons on a tab bar, it's too complicated"
3. **One action per screen** - Single decision focus
4. **Minimize steps** - "Goal → Plan → Start workout ideally in under 60 seconds"
5. **Persistent bottom navigation** - Home, Workouts, Profile always accessible

**Analysis of Current 3-Panel Design:**

| Aspect | Strength | Weakness |
|--------|----------|----------|
| Visibility | Can see all levels at once | Cramped on mobile |
| Navigation | Clear drill-down path | Requires multiple selections |
| Context | Always see hierarchy | Loses focus on current task |
| Mobile | Swipe panels work | No calendar mental model |

**Recommendation: Keep 3-Panel with Enhancements**

The current 3-panel design works well for the **planning workflow** (coach designing the season structure). However, once a season is active, coaches primarily need a **calendar view** for daily/weekly operations.

**Proposed Hybrid Approach:**
1. **Keep 3-panel** for `/plans/[id]` (macrocycle structure editing)
2. **Add "Calendar View" toggle** to show calendar-based week view
3. **Default to current week** when opening a plan
4. **Add "This Week" quick-access** in header

**User Story:**
> As a coach, when I open an active training plan, I want to see the current week's sessions immediately so I can quickly prepare for today's training without navigating through mesocycles.

---

### Q2: Phase Card Design

**Decision: Borderless, Minimal Design with Colored Header**

Based on your feedback for "minimal lean design", the phase cards should:

```
BEFORE (Current):
┌─────────────────────────────────┐
│▌GPP Phase 1                     │  ← Left border color
│  8 weeks · 24 sessions          │
│  Vol: 6/10  Int: 5/10           │
└─────────────────────────────────┘

AFTER (Proposed):
┌─────────────────────────────────┐
│ GPP Phase 1              [Edit] │  ← Colored background header
├─────────────────────────────────┤
│ 8 weeks · 24 sessions           │
│ ████████░░ Vol  █████░░░░░ Int  │  ← Visual bars instead of text
└─────────────────────────────────┘

OR (Even More Minimal - Full Width Row):

GPP Phase 1          8w · 24s  ████░░ Vol ███░░ Int  [>]
─────────────────────────────────────────────────────────
SPP Phase 2          4w · 12s  ██████ Vol █████ Int  [>]
```

**Changes:**
- Remove outer card border
- Use colored header strip or subtle background
- Compact volume/intensity as visual bars
- Full-width clickable rows
- Edit button on hover/tap

---

### Q3: Individual/Group Mode - Group Sprint Timing Feature

**Use Case Clarified:**
Sprint coaches need to record times for multiple athletes during group training sessions where athletes run one after another. The coach uses an external timer/stopwatch and needs an efficient way to enter results into the system.

**Required Feature: Excel-Like Grid View for Group Sprint Sessions**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Group Sprint Session: Monday Speed Work                    [Save] [Export] │
│ Group: Sprinters A  |  Date: Dec 28, 2025                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                    │  30m    │  60m    │  100m   │  150m   │  Notes        │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼───────────────┤
│ John Smith         │  4.12   │  7.45   │  11.82  │    -    │               │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼───────────────┤
│ Jane Doe           │  4.08   │  7.31   │  11.65  │    -    │ PB!           │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼───────────────┤
│ Mike Johnson       │  4.25   │  7.62   │    -    │    -    │ Pulled out    │
├────────────────────┼─────────┼─────────┼─────────┼─────────┼───────────────┤
│ [+ Add Athlete]    │         │         │         │         │               │
└─────────────────────────────────────────────────────────────────────────────┘

[+ Add Distance Column]                              Total: 3 athletes, 7 times
```

**Key Features:**
1. **Grid Layout**: Rows = Athletes, Columns = Distances/Reps
2. **Inline Editing**: Click cell to enter time (no modal dialogs)
3. **Tab Navigation**: Tab between cells like Excel
4. **Auto-Save**: Debounced save on cell blur
5. **Dynamic Columns**: Coach can add distance columns (30m, 60m, 100m, etc.)
6. **Notes Column**: Per-athlete notes for the session

**User Story:**
> As a sprint coach, I run a group session where athletes do 3x30m, 2x60m, 1x100m. As each athlete finishes a rep, I enter their time directly into the grid. I use an external stopwatch - the app is just for data entry.

**Future Enhancements (Not MVP):**
- AI input via screenshot (coach takes photo of handwritten times)
- Integration with Freelap/timing gates
- Lap timing mode with tap-to-record
- Split time tracking (0-30m, 30-60m breakdown)

---

### Group Sprint Session - Technical Design

**When to Show Grid View:**
- Session has `session_mode = 'group'`
- Session exercise type is sprint/speed-related
- OR coach toggles "Grid View" mode manually

**Data Model:**

The grid maps to existing tables but with a different UI:

```
session_plans (the session)
    │
    └── workout_logs (one per athlete in group)
            │
            └── workout_log_sets (one per distance/rep)
                    ├── distance: 30 (meters)
                    ├── performing_time: 4.12 (seconds)
                    └── set_index: 1 (rep number)
```

**Database Query Pattern:**
```sql
-- Fetch all athlete times for a group session
SELECT
  a.id as athlete_id,
  u.first_name || ' ' || u.last_name as athlete_name,
  wls.distance,
  wls.performing_time,
  wls.set_index,
  wls.notes
FROM workout_logs wl
JOIN athletes a ON wl.athlete_id = a.id
JOIN users u ON a.user_id = u.id
LEFT JOIN workout_log_sets wls ON wls.workout_log_id = wl.id
WHERE wl.session_plan_id = :session_id
ORDER BY athlete_name, wls.distance, wls.set_index;
```

**UI Component Structure:**
```
SprintGridView.tsx
├── Header (session name, date, group info)
├── DistanceColumnManager (add/remove columns)
├── AthleteGrid
│   ├── AthleteRow[]
│   │   ├── AthleteNameCell
│   │   ├── TimeCell[] (editable, one per distance)
│   │   └── NotesCell
│   └── AddAthleteRow
└── Footer (totals, save status, export)

---

### Q4: Draft/Active State - Technical Design

**Requirements Confirmed:**
1. Athletes should NOT see draft plans
2. Per-session publish control (not all-or-nothing)
3. No "Archived" state needed now (coaches can delete)
4. Deletion should cascade properly

---

## Technical Design: Draft/Publish System

### Database Schema Changes

```sql
-- 1. Add status to macrocycles
ALTER TABLE macrocycles
ADD COLUMN status text NOT NULL DEFAULT 'draft'
CONSTRAINT macrocycles_status_check CHECK (status IN ('draft', 'active'));

-- 2. Add is_published to session_plans
ALTER TABLE session_plans
ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- 3. Add is_published to microcycles (optional, for week-level control)
-- ALTER TABLE microcycles
-- ADD COLUMN is_published boolean NOT NULL DEFAULT false;
```

### Cascade Delete Analysis

When a coach deletes a macrocycle, the following should happen:

```
macrocycles (DELETE)
    │
    ├── mesocycles (CASCADE) ────────────────────────────────────┐
    │       │                                                     │
    │       └── microcycles (CASCADE)                             │
    │               │                                             │
    │               └── session_plans (CASCADE) ──────────────────┤
    │                       │                                     │
    │                       ├── session_plan_exercises (CASCADE)  │
    │                       │       │                             │
    │                       │       └── session_plan_sets (CASCADE)
    │                       │                                     │
    │                       └── workout_logs (SET NULL) ──────────┤
    │                               │                             │
    │                               ├── workout_log_exercises ────┤
    │                               │       (CASCADE from workout_logs)
    │                               │                             │
    │                               └── workout_log_sets ─────────┘
    │                                       (CASCADE from workout_logs)
    │
    └── races (CASCADE)
```

### Current Foreign Key Status (from schema):

| Relationship | Current Behavior | Recommended |
|--------------|------------------|-------------|
| `mesocycles.macrocycle_id` → `macrocycles` | Not specified | **CASCADE** |
| `microcycles.mesocycle_id` → `mesocycles` | Not specified | **CASCADE** |
| `session_plans.microcycle_id` → `microcycles` | Not specified | **CASCADE** |
| `session_plan_exercises.session_plan_id` → `session_plans` | Not specified | **CASCADE** |
| `session_plan_sets.session_plan_exercise_id` → `session_plan_exercises` | Not specified | **CASCADE** |
| `workout_logs.session_plan_id` → `session_plans` | Not specified | **SET NULL** (preserve athlete data) |
| `workout_log_exercises.session_plan_exercise_id` → `session_plan_exercises` | ON DELETE SET NULL | ✅ Correct |
| `workout_log_sets.session_plan_exercise_id` → `session_plan_exercises` | ON DELETE SET NULL | ✅ Correct |
| `races.macrocycle_id` → `macrocycles` | Not specified | **CASCADE** |
| `athlete_cycles.macrocycle_id` → `macrocycles` | ON DELETE CASCADE | ✅ Correct |

### Required Migration

```sql
-- Migration: add_draft_publish_system

-- 1. Add status column to macrocycles
ALTER TABLE macrocycles
ADD COLUMN status text NOT NULL DEFAULT 'draft'
CONSTRAINT macrocycles_status_check CHECK (status IN ('draft', 'active'));

-- 2. Add is_published to session_plans
ALTER TABLE session_plans
ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- 3. Update existing data (mark all existing plans as active/published)
UPDATE macrocycles SET status = 'active' WHERE status IS NULL OR status = 'draft';
UPDATE session_plans SET is_published = true WHERE is_published = false;

-- 4. Add CASCADE constraints (if not already present)
-- Note: These may require dropping and recreating constraints

-- mesocycles → macrocycles
ALTER TABLE mesocycles
DROP CONSTRAINT IF EXISTS mesocycles_macrocycle_id_fkey,
ADD CONSTRAINT mesocycles_macrocycle_id_fkey
  FOREIGN KEY (macrocycle_id) REFERENCES macrocycles(id) ON DELETE CASCADE;

-- microcycles → mesocycles
ALTER TABLE microcycles
DROP CONSTRAINT IF EXISTS microcycles_mesocycle_id_fkey,
ADD CONSTRAINT microcycles_mesocycle_id_fkey
  FOREIGN KEY (mesocycle_id) REFERENCES mesocycles(id) ON DELETE CASCADE;

-- session_plans → microcycles
ALTER TABLE session_plans
DROP CONSTRAINT IF EXISTS session_plans_microcycle_id_fkey,
ADD CONSTRAINT session_plans_microcycle_id_fkey
  FOREIGN KEY (microcycle_id) REFERENCES microcycles(id) ON DELETE CASCADE;

-- session_plan_exercises → session_plans
ALTER TABLE session_plan_exercises
DROP CONSTRAINT IF EXISTS session_plan_exercises_session_plan_id_fkey,
ADD CONSTRAINT session_plan_exercises_session_plan_id_fkey
  FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE CASCADE;

-- session_plan_sets → session_plan_exercises
ALTER TABLE session_plan_sets
DROP CONSTRAINT IF EXISTS session_plan_sets_session_plan_exercise_id_fkey,
ADD CONSTRAINT session_plan_sets_session_plan_exercise_id_fkey
  FOREIGN KEY (session_plan_exercise_id) REFERENCES session_plan_exercises(id) ON DELETE CASCADE;

-- workout_logs → session_plans (SET NULL to preserve athlete data)
ALTER TABLE workout_logs
DROP CONSTRAINT IF EXISTS workout_logs_session_plan_id_fkey,
ADD CONSTRAINT workout_logs_session_plan_id_fkey
  FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON DELETE SET NULL;

-- races → macrocycles
ALTER TABLE races
DROP CONSTRAINT IF EXISTS races_macrocycle_id_fkey,
ADD CONSTRAINT races_macrocycle_id_fkey
  FOREIGN KEY (macrocycle_id) REFERENCES macrocycles(id) ON DELETE CASCADE;
```

### RLS Policy Updates

```sql
-- Athletes should NOT see draft plans
-- Update RLS policy on session_plans for athletes

CREATE POLICY "Athletes can only see published sessions" ON session_plans
FOR SELECT
TO authenticated
USING (
  -- Coach can see all their sessions
  (auth.uid() IN (SELECT clerk_id FROM users WHERE id = session_plans.user_id))
  OR
  -- Athletes only see published sessions from active plans
  (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM microcycles mic
      JOIN mesocycles mes ON mic.mesocycle_id = mes.id
      JOIN macrocycles mac ON mes.macrocycle_id = mac.id
      WHERE mic.id = session_plans.microcycle_id
      AND mac.status = 'active'
    )
  )
);
```

### UI Logic

**Coach View:**
- See all plans (draft and active)
- Draft plans show "Draft" badge
- "Activate Plan" action to change status to active
- Individual session toggle: "Published" / "Unpublished"

**Athlete View:**
- Only see plans where `macrocycle.status = 'active'`
- Only see sessions where `session_plan.is_published = true`
- No badge needed (they never see drafts)

### Workflow

```
Coach creates new plan
    ↓
Plan starts as: status = 'draft', all sessions is_published = false
    ↓
Coach builds out mesocycles, microcycles, sessions
    ↓
Coach marks individual sessions as "Published" as they finalize them
    ↓
When ready, coach clicks "Activate Plan"
    ↓
Plan status = 'active'
    ↓
Athletes can now see published sessions from this plan
```

---

### Q5: Assign Button

**Decision: Move to Kebab Menu (⋮)**

**Rationale:**
- Coaches typically assign groups during plan creation
- Reassignment is infrequent (new athlete joins, group restructure)
- Reduces button clutter in card header

**New Card Header Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Plan Name                                    [Draft] [Open] │
│ 📅 Jan 1 - Mar 31  👥 Group A  🎯 4 phases                  │
│                                                       [⋮]   │
└─────────────────────────────────────────────────────────────┘

[⋮] Menu:
├── Assign to Groups...
├── Duplicate Plan
├── Export
└── Delete
```

---

## Newly Identified Issues (2025-12-28)

### 🐛 BUG: Duplicate Graph on Mobile (Root Plans Page)

**Location**: [PlansHomeClient.tsx:114-149](apps/web/components/features/plans/home/PlansHomeClient.tsx#L114-L149)

**Problem**: On mobile, the Volume & Intensity chart appears TWICE.

**Fix**: Remove the `lg:hidden` section (lines 139-149).

**Priority**: CRITICAL
**Effort**: 10 minutes

---

### ⚙️ Superset Improvements Needed

#### Issue 1: Superset ID Reindexing
**Problem**: IDs don't reindex when supersets removed.

**Solution**:
```typescript
const reindexSupersets = (exercises: Exercise[]) => {
  const supersetGroups = new Map<string, number>()
  let nextId = 1
  return exercises.map(ex => {
    if (!ex.superset_id) return ex
    if (!supersetGroups.has(ex.superset_id)) {
      supersetGroups.set(ex.superset_id, nextId++)
    }
    return { ...ex, superset_id: String(supersetGroups.get(ex.superset_id)) }
  })
}
```

#### Issue 2: Link Button Placement
**Change**: Rename "🔗 Link" to "🔗 Superset", move next to min/max toggle.

#### Issue 3: No UI to Unlink Supersets
**Add**: "🔓 Unlink All" button in superset header + menu option on each exercise.

---

## Implementation Roadmap

### Phase 1: Critical Bug Fixes (Day 1)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Fix duplicate chart on mobile | CRITICAL | 10m | ⏳ |
| Update phase cards to borderless design | HIGH | 2h | ⏳ |
| Move Assign button to kebab menu | MEDIUM | 1h | ⏳ |

### Phase 2: Superset Improvements (Day 2)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Implement superset ID reindexing | HIGH | 2h | ⏳ |
| Add Unlink button to superset header | HIGH | 1h | ⏳ |
| Rename/reposition Link button to "Superset" | MEDIUM | 30m | ⏳ |

### Phase 3: Draft/Publish System (Day 3-4)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Database migration: add status + is_published | HIGH | 2h | ⏳ |
| Update cascade constraints | HIGH | 1h | ⏳ |
| Update RLS policies for athlete visibility | HIGH | 2h | ⏳ |
| PlansHome UI: real draft/active badges | HIGH | 2h | ⏳ |
| Session publish toggle in SessionPlanner | HIGH | 2h | ⏳ |
| "Activate Plan" action in PlanWorkspace | HIGH | 2h | ⏳ |

### Phase 4: Navigation Enhancements (Day 5)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Default to current week on plan open | MEDIUM | 2h | ⏳ |
| Add "This Week" badge to current microcycle | MEDIUM | 1h | ⏳ |
| Remove undo/redo from plans/[id] | LOW | 30m | ⏳ |

### Phase 5: Session Editing (Week 2)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Implement session title/desc editing | HIGH | 4h | ⏳ |
| Add date picker with validation | HIGH | 4h | ⏳ |

### Phase 6: Group Sprint Timing Feature (Week 2-3)

**Priority**: HIGH - Critical coach workflow feature

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Backend** | | | |
| Create `saveGroupSprintTimesAction` server action | HIGH | 3h | ⏳ |
| Create `getGroupSprintSessionAction` to fetch grid data | HIGH | 2h | ⏳ |
| Add session_mode toggle logic | MEDIUM | 1h | ⏳ |
| **UI Components** | | | |
| Create `SprintGridView.tsx` main component | HIGH | 4h | ⏳ |
| Create `TimeCell.tsx` with inline editing | HIGH | 2h | ⏳ |
| Create `AthleteRow.tsx` component | HIGH | 2h | ⏳ |
| Create `DistanceColumnManager.tsx` (add/remove columns) | MEDIUM | 2h | ⏳ |
| Add Tab key navigation between cells | MEDIUM | 2h | ⏳ |
| Implement debounced auto-save | HIGH | 2h | ⏳ |
| **Integration** | | | |
| Add "Grid View" toggle to session page when mode=group | HIGH | 2h | ⏳ |
| Add athlete group selector for grid view | HIGH | 2h | ⏳ |
| Export to CSV functionality | LOW | 2h | ⏳ |

**Component Hierarchy:**
```
/plans/[id]/session/[sessionId] (existing page)
├── SessionHeader
│   └── [Grid View] toggle (when session_mode='group')
├── SprintGridView (NEW - shown when Grid View active)
│   ├── GridHeader (session name, date, group, save/export)
│   ├── DistanceColumnManager (add column: 30m, 60m, etc.)
│   ├── AthleteGrid
│   │   └── AthleteRow[] (one per athlete in group)
│   │       ├── AthleteNameCell (readonly)
│   │       ├── TimeCell[] (editable, one per distance)
│   │       └── NotesCell (editable)
│   └── GridFooter (stats, save status)
└── SessionPlannerV2 (existing - shown when Grid View inactive)
```

**Data Flow:**
```
1. Coach opens group session → Page checks session_mode
2. If 'group' → Show "Grid View" toggle
3. Coach enables Grid View → Fetch athletes from group
4. Fetch existing workout_logs for this session
5. Render grid: Athletes × Distances matrix
6. Coach enters time in cell → Debounced save to workout_log_sets
7. On blur/tab → Immediate save
```

---

## Appendix A: Research Sources

### Navigation & UX
- [CoachRx Periodization Tools](https://www.coachrx.app/articles/planning-amp-periodization-tools-to-design-better-programs) - Calendar-based UI with zoom in/out
- [TrainerRoad Periodization](https://www.trainerroad.com/blog/training-periodization-macro-meso-microcycles-of-training/) - Block-based calendar view
- [Zfort Fitness App UX](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention) - Tab bar with 3-5 core areas
- [Eastern Peak App Design](https://easternpeak.com/blog/fitness-app-design-best-practices/) - Avoid deep menu structures
- [Stormotion Fitness UX](https://stormotion.io/blog/fitness-app-ux/) - One action per screen

### Group Training
- [TrainHeroic Coach Mobile](https://support.trainheroic.com/hc/en-us/articles/18156852699917-For-Coaches-Editing-Logging-Sessions-for-Athletes-on-Mobile) - Team calendar, per-athlete logging
- [TeamBuildr Platform](https://www.teambuildr.com/) - 800+ athletes, sub-group training
- [SimpliFaster Sprint Training](https://simplifaster.com/articles/implementing-effective-sprint-training/) - Group session challenges

### Sprint Timing
- [Athlete Analyzer](https://www.athleteanalyzer.com/track-field-training-management-and-coaching-software) - Group/individual plans
- [SprintTimer/SprintHit](https://www.sprinthit.com/) - QR-based multi-athlete timing

---

## Appendix B: Individual/Group Mode Current State

### Database Schema
```sql
-- session_plans table
session_mode text -- Values: 'individual', 'group', 'template'

-- workout_logs table
session_mode text -- Values: 'individual', 'group'
```

### Current Logic
```
Coach Creates Session Plan
    ↓
Has athlete_group_id? → session_mode = 'group'
    ↓
No → session_mode = 'individual'
```

### Decision: Build Excel-Like Grid View for Group Sessions ✅
- Field stays for data integrity and future extensibility
- UI shows "Group Session" badge + "Grid View" toggle when `session_mode = 'group'`
- **Grid View**: Excel-like table for coach to enter sprint times (Athletes × Distances)
- Athletes still log individually for non-sprint exercises
- See **Phase 6** in Implementation Roadmap for full task breakdown

---

## Appendix C: Key Takeaways from Research

1. **Calendar is king** - Coaches think in dates, not hierarchies
2. **Minimize taps** - Goal to workout in under 60 seconds
3. **No bulk logging** - Even team platforms do per-athlete logging (exception: Group Sprint Grid)
4. **Draft/publish is standard** - Athletes shouldn't see unfinished work
5. **Borderless = modern** - Clean, minimal card design trending
6. **Excel-like interfaces work** - Coaches familiar with spreadsheet data entry for timing sessions
7. **External timers are standard** - Don't build in-app timing; coaches use dedicated devices
