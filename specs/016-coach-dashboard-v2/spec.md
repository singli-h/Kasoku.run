# Coach Dashboard v2 — Action-Oriented Weekly View

## Problem

The current coach dashboard is a passive display: two stat numbers, a flat athlete list (duplicating `/athletes`), and a chronological activity feed. A coach opens it, glances, and has no clear next action. It doesn't answer the morning question: "How's my team doing this week?"

## Goal

Replace the coach dashboard with an action-oriented weekly view focused on compliance at a glance. Three sections, zero complex logic, one primary query scope (this week's `workout_logs`).

## Design

```
┌──────────────────────────────────────────┐
│  THIS WEEK                   Mar 10 – 16 │
│  75% completed · 18/24 sessions          │
│  3 athletes haven't trained yet          │
│  2 active plans                          │
├──────────────────────────────────────────┤
│  TODAY  ·  Thursday Mar 15               │
│                                          │
│  SS  ██████░░  6/8                       │
│  MS  ████░░░░  4/8                       │
│  LS  ████████  5/5                       │
│                                          │
│  15/21 sessions completed                │
├──────────────────────────────────────────┤
│  ACTIVE PLANS                            │
│  Sprint Season → SPP · Wk 6/8 ████████░ │
│  XC Develop    → GPP · Wk 3/12 ███░░░░░ │
└──────────────────────────────────────────┘
```

### Section 1: This Week (stats row)

Aggregate numbers from this week's `workout_logs`:
- **Completion rate**: `completed / total` (percentage + fraction)
- **Athletes not trained**: `totalAthletes - uniqueAthletesWithCompletedLog` (client-side subtraction, no extra query)
- **Active plans**: count of macrocycles where today is between `start_date` and `end_date`

### Section 2: Today (event group compliance bars)

Today's sessions grouped by athlete `event_group`:
- Each group shows a progress bar: `completed / total` for today
- Groups displayed as compact rows: `SS ██████░░ 6/8`
- Bottom line shows today's total: `15/21 sessions completed`
- Clicking a group row navigates to `/athletes` (filtered by group — future enhancement)
- Athletes without an event group are shown under "General" or similar label
- Scales to 60+ athletes: shows numbers, not individual names

### Section 3: Active Plans

Active macrocycles with current phase context:
- Plan name + current mesocycle name (phase: GPP, SPP, etc.)
- Current week / total weeks with progress bar
- Current week = `floor((today - mesocycle.start_date) / 7) + 1`
- Clicking navigates to `/plans/[id]`

## Data Requirements

### Primary query: This week's workout_logs

Reuses the existing pattern from `getCoachDashboardDataAction`:
1. Resolve `coach_id` → `group_ids` → `athlete_ids` (3 queries, already cached pattern)
2. Single `workout_logs` query scoped to `date_time` within Mon–Sun of current week
3. Join `athletes.event_group` for grouping (already on the athletes query)

All aggregation (compliance rates, group breakdowns, today filter) is computed client-side from the single result set. No complex server-side logic.

### Secondary query: Active plans with phase

1. `macrocycles` where `start_date <= today <= end_date` and `user_id = coachUserId`
2. For each active macrocycle, find the `mesocycle` where `start_date <= today <= end_date`
3. Week number = date math from mesocycle start

### Performance constraints

- No full-table scans. Week-scoped queries only.
- No "last activity" scan across all athletes (the "haven't trained" count comes from the week query, not a global scan)
- Target: dashboard loads in <500ms

## What Gets Removed

- **Flat athlete list** — redundant with `/athletes` page
- **Generic activity feed** — replaced by structured Today section with group compliance
- Per-athlete detail on dashboard (stays on `/athletes/[id]`)

## What's NOT in Scope

- Athlete name lists on dashboard (numbers only, scales to 60+)
- Weekly grid/heatmap (overwhelming, removed during design)
- Needs Attention section (complex logic, latency risk — folded into stats row as "X athletes haven't trained")
- Chat, reactions, engagement features
- Readiness/wellness surveys
- Click-to-filter on event groups (future enhancement)

## Types

```typescript
interface CoachWeekDashboardData {
  // Section 1: This Week
  weekStats: {
    totalSessions: number
    completedSessions: number
    completionRate: number       // 0-100
    athletesNotTrained: number   // totalAthletes - unique athletes with >=1 completed this week
    totalAthletes: number
    activePlans: number
  }
  weekLabel: string             // "Mar 10 – 16"

  // Section 2: Today
  todayGroups: Array<{
    eventGroup: string          // "SS", "MS", "LS", or "General"
    completed: number
    total: number
  }>
  todayTotal: {
    completed: number
    total: number
  }

  // Section 3: Active Plans
  activePlanDetails: Array<{
    id: number
    name: string
    currentPhase: string | null // mesocycle name
    currentWeek: number
    totalWeeks: number
  }>
}
```

## Files to Modify

1. `apps/web/components/features/dashboard/types/dashboard-types.ts` — add `CoachWeekDashboardData` type
2. `apps/web/actions/dashboard/dashboard-actions.ts` — add `getCoachWeekDashboardDataAction`
3. `apps/web/components/features/dashboard/components/coach-dashboard-view.tsx` — rewrite UI
4. `apps/web/app/(protected)/dashboard/page.tsx` — update to call new action

## Frontend Best Practices

- Server Component by default — fetch data server-side in the page, pass to client components only where interactivity is needed
- Use `Promise.all()` for parallel data fetching (week stats + active plans)
- No barrel imports — direct imports only
- Memoize computed values (compliance rates, group aggregations) to avoid re-renders
- Progress bars use CSS (Tailwind `w-[%]`) not JS animation
- Semantic HTML: `<section>`, `<h2>`, proper heading hierarchy
- Mobile-first: stack sections vertically, readable at 320px

## Query Optimization

- Single `workout_logs` query for the week — all aggregation done client-side from one result set
- Reuse existing `coach_id → group_ids → athlete_ids` resolution pattern
- Minimize joins: only join `athletes.event_group` (already fetched in the athletes query)
- Active plans query uses indexed `start_date`/`end_date` range conditions
- No N+1 queries — never query per-athlete inside a loop
- Consider `unstable_cache` or `revalidatePath` for plan phase data that changes infrequently

## Cleanup

Remove dead/legacy code from the old coach dashboard:
- Remove old `CoachStats`, `AthletesList`, `RecentActivityList` components from `coach-dashboard-view.tsx`
- Remove `getCoachDashboardDataAction` if fully replaced (or deprecate if used elsewhere)
- Remove unused types from `dashboard-types.ts` (`CoachDashboardData` if no longer referenced)
- Clean up any imports that reference removed code

## Acceptance Criteria

- [ ] Coach dashboard shows 3 sections: This Week stats, Today by group, Active Plans
- [ ] Compliance rate is computed from current week's workout_logs only
- [ ] "Athletes not trained" count is derived client-side (no extra query)
- [ ] Today section groups by event_group with progress bars
- [ ] Active plans show current phase name and week progress
- [ ] Dashboard loads in <500ms (no full-table scans)
- [ ] Works with 0 athletes (empty state)
- [ ] Works with 60+ athletes (no name lists, numbers only)
- [ ] Mobile responsive (sections stack vertically)
- [ ] Flat athlete list and activity feed are removed
- [ ] Old `CoachDashboardData` type and `getCoachDashboardDataAction` cleaned up (no dead code)
- [ ] Old `CoachStats`, `AthletesList`, `RecentActivityList` components removed
- [ ] All data fetching uses `Promise.all()` for parallel queries
- [ ] No N+1 query patterns
- [ ] Server Component fetches data; client components only where interactive
