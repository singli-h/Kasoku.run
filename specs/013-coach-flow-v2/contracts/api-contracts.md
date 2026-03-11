# API Contracts: Coach Flow V2

**Branch**: `013-coach-flow-v2` | **Date**: 2026-03-11

---

## New Server Actions

### `getWeekSessionsAction(weekStart: string)`
**Location**: `apps/web/actions/dashboard/dashboard-actions.ts`
**Used by**: Dashboard mini calendar (#31)

```ts
input:  { weekStart: string }  // ISO date, Monday of the target week
output: ActionState<WeekCalendarSession[]>

// Fetches sessions for a 7-day window with exercise details
// Applies subgroup filtering for athlete role
// Returns exercises with formatted summaries
```

### `insertTemplateExercisesAction(templateId: string, targetSessionPlanId: string)`
**Location**: `apps/web/actions/plans/session-plan-actions.ts`
**Used by**: Template insertion in session planner (#33)

```ts
input:  { templateId: string, targetSessionPlanId: string }
output: ActionState<SessionPlanExerciseWithDetails[]>

// Copies exercises + sets from template into existing session
// Appends after current max exercise_order
// Preserves target_event_groups from template
// Returns newly inserted exercises
```

### `getEventGroupsForGroupAction(groupId: number)`
**Location**: `apps/web/actions/athletes/athlete-actions.ts`
**Used by**: Subgroup chip popover, preview dropdown (#23)

```ts
input:  { groupId: number }
output: ActionState<string[]>

// Returns distinct event_group values for athletes in the group
// Filters out NULL values
// Sorted alphabetically
```

---

## Modified Server Actions

### `getSessionPlanByIdAction` (exercise-actions.ts)
**Change**: Return `target_event_groups` in exercise data
- Already uses `SELECT *` on `session_plan_exercises` — column will auto-include after migration
- No code change needed, just type regeneration

### `getMacrocycleByIdAction` (plan-actions.ts)
**Change**: Include `session_plan_sets` in workspace fetch for volume/duration computation
```ts
// Current (line 290):
session_plan_exercises(id, exercise_order, notes, exercise_id, superset_id, exercise:exercises(id, name, description, video_url))

// Updated:
session_plan_exercises(id, exercise_order, notes, exercise_id, superset_id, target_event_groups, exercise:exercises(id, name, description, video_url, exercise_type_id), session_plan_sets(*))
```

### `startTrainingSessionAction` (workout-session-actions.ts)
**Change**: Filter exercises by `target_event_groups` when copying to `workout_log_exercises`
```ts
// Before copying session_plan_exercises → workout_log_exercises:
// 1. Fetch athlete's event_group
// 2. Filter: include exercise if target_event_groups IS NULL
//    OR athlete.event_group IS NULL
//    OR athlete.event_group IN target_event_groups
```

---

## Modified AI Tool Schemas

### `createSessionPlanExerciseChangeRequest`
**File**: `apps/web/lib/changeset/tools/proposal-tools.ts`
**Change**: Add `targetEventGroups` parameter

```ts
// Add to createExerciseChangeRequestSchema:
targetEventGroups: z.array(z.string())
  .optional()
  .describe("Event groups this exercise targets. Omit or null for all athletes. E.g., ['SS'] or ['MS', 'LS']")
```

### `updateSessionPlanExerciseChangeRequest`
**Change**: Add same `targetEventGroups` parameter for updating tags.

---

## New TanStack Query Hooks

### `useWeekSessions(weekStart: string)`
**File**: `apps/web/components/features/dashboard/hooks/use-dashboard-queries.ts` (NEW)
**Used by**: Mini calendar component

```ts
queryKey: ['dashboard-week-sessions', weekStart]
queryFn: () => getWeekSessionsAction(weekStart)
staleTime: 60_000  // 1 minute
gcTime: 300_000     // 5 minutes
```

### `useEventGroupsForGroup(groupId: number)`
**File**: `apps/web/components/features/training/hooks/use-session-planner-queries.ts` (or existing hook file)
**Used by**: Subgroup chip popover, preview dropdown

```ts
queryKey: ['event-groups', groupId]
queryFn: () => getEventGroupsForGroupAction(groupId)
staleTime: 300_000  // 5 minutes (rarely changes)
```

---

## Shared Utilities Contract

### `computeSessionMetrics(exercises: ExerciseWithSets[]): SessionMetrics`
**File**: `apps/web/lib/training-utils.ts` (NEW)

```ts
interface ExerciseWithSets {
  exercise_type_id?: number | null
  sets: Array<{
    reps?: number | null
    weight?: number | null
    distance?: number | null
    performing_time?: number | null
    rest_time?: number | null
  }>
}

// Returns: { volume, volumeUnit, duration, exerciseCount }
// Volume formula per exercise_type_id:
//   1-3 (strength): Σ(reps × weight) → unit: 'kg'
//   4-5 (sprint/endurance): Σ(distance) → unit: 'm'
//   6 (timed/plyometric): Σ(performing_time) → unit: 's'
//   default (bodyweight): Σ(reps) → unit: 'reps'
// Duration: Σ(performing_time + rest_time) across all sets
```

### `formatExerciseSummary(exercise: ExerciseWithSets): string`
**File**: `apps/web/lib/training-utils.ts`

```ts
// Returns one-line summary string:
//   Strength: "3×10 80kg"
//   Sprint: "4×60m 7.2s"
//   Timed: "3×30s"
//   Bodyweight: "3×12"
// Uses first set's values as representative (uniform sets)
// For varied sets: "3 sets" fallback
```

### `abbreviateEventGroup(eventGroup: string): string`
**File**: `apps/web/lib/training-utils.ts`

```ts
// Maps full event_group strings to 3-char display codes:
// 'SS' → 'SS', 'Hurdles' → 'HRD', 'Multi-events' → 'MUL', etc.
```

### `formatSubgroupChip(groups: string[] | null): string | null`
**File**: `apps/web/lib/training-utils.ts`

```ts
// Returns null if groups is null/empty (= ALL)
// Returns "SS" for single, "SS·MS" for multiple
// Uses abbreviateEventGroup for each
```
