# Research: Coach Flow V2

**Branch**: `013-coach-flow-v2` | **Date**: 2026-03-11

---

## 1. Workspace Data Flow

### Session Interface
`TrainingPlanWorkspace.tsx:32-41` defines the `Session` interface:
```ts
interface Session {
  id: string; day: number; name: string;
  type: 'speed' | 'strength' | 'recovery' | 'endurance' | 'power';
  duration: number; volume: number; intensity: number;
  exercises: any[];  // ← needs proper typing
}
```

### How Sessions Load
```
getMacrocycleByIdAction (plan-actions.ts:255)
  → Supabase: macrocycles → mesocycles → microcycles → session_plans
    → session_plan_exercises(id, exercise_order, notes, exercise_id, superset_id, exercise:exercises(id, name, description, video_url))
    → NO session_plan_sets fetched at workspace level
  → page.tsx:183-185 maps to Session with HARDCODED: duration=60, volume=0, intensity=0
  → CoachPlanPageWithAI → TrainingPlanWorkspace
```

**Key insight**: Exercise names ARE already fetched (nested join), but never rendered on the card. duration/volume are hardcoded — the actual set data isn't fetched at workspace level.

### Two Session Card Locations
1. **TrainingPlanWorkspace right panel** (lines 1228-1306) — primary coach view, inline `div` cards
2. **MicrocycleEditor** (lines 148-183) — 7-day grid view, separate view mode

### Where Subgroup Dots Go
MicrocycleEditor already has colored type dots (line 206: `w-3 h-3 rounded-full`). Subgroup dots would sit alongside or below these.

---

## 2. Session Planner Architecture

### Sticky Toolbar (SessionPlannerV2.tsx:469-577)
- **Top bar** (470-516): Back, Undo/Redo, Unsaved indicator, Save button
- **Sub-header** (518-576): Session name (h1), description, date — preview dropdown slots here as a new row
- Template buttons ("Save as Template", "Insert from Template", "Paste Program") go in the top bar right side (lines 497-514)

### Exercise Rendering Chain
```
SessionPlannerV2 → WorkoutView (isAthlete=false)
  → Groups by section → SectionDivider per group
    → ExerciseCard per exercise
```

### ExerciseCard Header (ExerciseCard.tsx:286-414)
Left cluster: [Drag grip] [Chevron] [Name block]
Right cluster: [Trash] [Completion circle]

**Subgroup chip insertion point**: Inside name block `<div className="flex items-center gap-1.5 flex-wrap">` at line 327, after the exercise name `<h3>`.

---

## 3. RLS & Subgroup Filtering

### Current RLS on session_plan_exercises
Policy `spe_athlete_view_assigned` (migration `20260305100000`):
```sql
CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT USING (
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
  );
```
**No awareness of target_event_groups.** Must be extended.

### Available RLS Helper Functions
| Function | Returns | Purpose |
|---|---|---|
| `auth_user_id()` | bigint | JWT → internal user ID |
| `auth_athlete_id()` | bigint | Current athlete row ID |
| `auth_athlete_group_id()` | bigint | Athlete's group ID |
| `owns_resource(uid)` | boolean | Is current user the owner? |
| `athlete_in_group(gid)` | boolean | Is athlete in this group? |
| `coaches_group(gid)` | boolean | Does user coach this group? |

**Missing**: No `auth_athlete_event_group()` helper exists yet.

### Recommended RLS Policy Pattern
```sql
CREATE POLICY "spe_athlete_view_assigned" ON public.session_plan_exercises
  FOR SELECT USING (
    session_plan_id IN (
      SELECT sp.id FROM public.session_plans sp
      WHERE sp.microcycle_id IN (
        SELECT id FROM public.microcycles
        WHERE athlete_group_id IS NOT NULL
          AND athlete_in_group(athlete_group_id::bigint)
      )
    )
    AND (
      target_event_groups IS NULL
      OR (SELECT event_group FROM athletes WHERE user_id = auth_user_id()) IS NULL
      OR (SELECT event_group FROM athletes WHERE user_id = auth_user_id()) = ANY(target_event_groups)
    )
  );
```
Three-way condition: (1) no tag = all see it, (2) no event_group on athlete = sees everything (safe default), (3) athlete's event_group matches one of the tags.

### Critical: workout_log_exercises Copy Step
When a session starts, `workout_log_exercises` are created as a copy of `session_plan_exercises`. This copy step MUST also filter by target_event_groups, otherwise athletes see all exercises at session start. The `session_plan_sets` policy (`sps_athlete_view_assigned`) also needs the same filter applied via the parent exercise's target_event_groups.

### Athlete event_group Access
- Written by coach via `updateAthleteProfileAction` (athlete card/roster)
- Read at DB level: `SELECT event_group FROM athletes WHERE user_id = auth_user_id()`
- NOT currently passed to workout page — RLS handles it transparently

---

## 4. Dashboard & Calendar

### DashboardData Shape
```ts
interface DashboardData {
  recentSessions: RecentSession[]  // active + last 10 completed
  stats: DashboardStats
  activeWorkout?: WorkoutLogWithDetails
}
interface RecentSession {
  id: string; title: string; status: 'pending'|'in-progress'|'completed'|'cancelled';
  date: Date; notes?: string; athlete?: { name: string; avatar?: string }
}
```
**No per-day filtering, no exercise data in RecentSession.** Mini calendar needs a new server action.

### TanStack Query Patterns
- Query keys: `as const` arrays, e.g., `['workout-sessions-today']`
- Stale times: 30s (today), 60s (details), 2min (history)
- Cache hydration: `queryClient.setQueryData(key, data)` from server-fetched data
- **No SWR** — exclusively TanStack Query

### Calendar Infrastructure
- `date-fns` v3.6.0 used throughout
- Week convention: Monday start (`weekStartsOn: 1`)
- shadcn/ui `Calendar` component exists (react-day-picker) — available for mini calendar
- `WorkoutConsistencyHeatmap` has a `startOfWeek + addDays` loop pattern to reference
- **No shared date utility file** — date-fns called directly at each site

### Mini Calendar Insertion Point
In `AthleteDashboardView` (dashboard-layout.tsx:46-72): new `<section>` between `InlineStats` (line 58) and `QuickActions` (line 63). Pure additive — no removal needed.

---

## 5. AI Tools & Changeset

### Tool Schemas (proposal-tools.ts)
| Tool | Key Params | Notes |
|---|---|---|
| `createSessionPlanExerciseChangeRequest` | exerciseId, exerciseName, exerciseOrder?, insertAfterExerciseId?, notes?, reasoning | **No targetEventGroups** — must add |
| `createSessionPlanSetChangeRequest` | sessionPlanExerciseId, setCount, reps?, weight?, distance?, performingTime?, etc. | Batch via setCount |
| `updateSessionPlanExerciseChangeRequest` | sessionPlanExerciseId, exerciseId?, exerciseName?, exerciseOrder?, notes?, reasoning | **No targetEventGroups** — must add |

All tools are schema-only (no `execute` callback) — client-side changeset application.

### AI Prompt Structure (plan-assistant.ts)
Sections: PERSONA → levelGuidance → RULES → contextSection
Exercise formatted as: `${exerciseName} (ID: ${id})${supersetInfo}${notesInfo}`
**Subgroup tag insertion**: Same position as supersetInfo, e.g., `[SS]` or `[ALL]`.

### Template Actions
| Action | What It Does | Gap |
|---|---|---|
| `saveAsTemplateAction` | Saves session(s) with `is_template: true` | Works but ignores templateName/Description params |
| `getTemplatesAction` | Fetches user's templates with full exercise join | Works |
| `createPlanFromTemplateAction` | Copies template → new session | Creates NEW session — no "insert into existing" action |
| `deleteTemplateAction` | Soft-deletes template | Works |

**New action needed**: `insertTemplateExercisesAction(templateId, targetSessionPlanId)` — copies exercises + sets from template into an existing session, appending after current exercises.

### Templates Page — What's Broken
- `TemplateWithStats` type has phantom fields (usage_count, avg_rating, etc.) that don't exist in DB
- `avg_rating.toFixed(1)` crashes on undefined at render
- Search only checks description, not name
- "Use Template" creates a dangling session with no microcycle
- No sidebar navigation entry
- No role guard

---

## 6. Shared Infrastructure Gaps

| Gap | Impact | Solution |
|---|---|---|
| No `computeSessionMetrics()` | Volume hardcoded 0, duration hardcoded 60 everywhere | Create `@/lib/training-utils.ts` |
| No `formatExerciseSummary()` | Dead `formatShorthand` in types.ts never imported | Create in same file, based on existing formatShorthand logic |
| No `auth_athlete_event_group()` RLS helper | Inlined subquery works but helper is cleaner | Add to base helper functions migration |
| No "insert exercises into session" action | Template insertion is create-new-session only | New `insertTemplateExercisesAction` |
| No weekly session fetch action | Dashboard only fetches active + last 10 | New `getWeekSessionsAction(weekStart)` |
| Workspace doesn't fetch sets | Can't compute volume/duration | Extend `getMacrocycleByIdAction` Supabase select to include `session_plan_sets` |
