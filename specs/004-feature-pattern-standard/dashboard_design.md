# Dashboard Design Specification

> **Last Updated**: 2025-12-27
> **Status**: Source of Truth
> **Feature**: Coach & Athlete Dashboard
> **Stack**: Next.js 16 + Supabase + React Query + Suspense

---

## Table of Contents

1. [Overview](#overview)
2. [User Research & Requirements](#user-research--requirements)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [UI/UX Design Patterns](#uiux-design-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Implementation Guide](#implementation-guide)
7. [Component Specifications](#component-specifications)
8. [Anti-Patterns & Pitfalls](#anti-patterns--pitfalls)
9. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose

The dashboard serves as the primary entry point for both coaches and athletes, providing:
- **Coaches**: At-a-glance athlete status, session compliance, quick actions
- **Athletes**: Today's workout, progress visualization, upcoming schedule

### Design Philosophy

> **"5-Second Rule"**: What's the one thing the user must understand in 5 seconds?
> - **Coaches**: Which athletes need attention today?
> - **Athletes**: What should I do right now?

### Current State vs Target

| Aspect | Current | Target |
|--------|---------|--------|
| Role-based views | Single view | Coach/Athlete differentiated |
| Data freshness | Page load only | Real-time updates + optimistic UI |
| Performance metrics | Basic stats | Workload, recovery, PRs |
| Mobile experience | Functional | Optimized touch targets, swipe actions |

---

## User Research & Requirements

### Coach Dashboard Requirements

| Feature | Priority | Description | Data Source |
|---------|----------|-------------|-------------|
| **Priority Athletes** | P0 | Athletes needing attention (at-risk, low compliance) | `workout_logs` + calculation |
| **Quick Stats** | P0 | Active athletes, sessions today, pending reviews | Aggregated queries |
| **Athlete Grid** | P0 | Status cards with quick actions | `athletes` + `workout_logs` |
| **Activity Feed** | P1 | Recent athlete activity stream | `workout_logs` real-time |
| **Workload Management** | P1 | Acute:Chronic ratio visualization | `workout_log_sets` aggregated |
| **Recovery Readiness** | P2 | Who's ready for high intensity | Calculated from rest days |
| **Injury Risk Alerts** | P2 | Flag athletes with warning signs | Pattern detection |

### Athlete Dashboard Requirements

| Feature | Priority | Description | Data Source |
|---------|----------|-------------|-------------|
| **Today's Workout** | P0 | Big, prominent, actionable CTA | `session_plans` for today |
| **Quick Stats** | P0 | Streak, weekly volume, recent PRs | `workout_logs` aggregated |
| **Progress Visualization** | P1 | Trend charts (volume, PRs) | `workout_log_sets` time series |
| **Upcoming Schedule** | P1 | Next 5-7 sessions | `session_plans` future |
| **Coach Feedback** | P1 | Comments on recent sessions | `workout_logs.notes` (coach) |
| **Personal Records** | P2 | Recent and all-time PRs | `workout_log_sets` max values |
| **Recovery Status** | P2 | Simple readiness indicator | Days since last session |

### Key Metrics (KPIs)

**Coach KPIs:**
```typescript
interface CoachKPIs {
  athleteComplianceRate: number      // % sessions completed this week
  avgSessionCompletionTime: number   // Minutes
  athletesRequiringIntervention: number
  trainingLoadDistribution: {
    low: number
    moderate: number
    high: number
  }
}
```

**Athlete KPIs:**
```typescript
interface AthleteKPIs {
  weeklyVolumeCompleted: number
  weeklyVolumePlanned: number
  completionPercentage: number
  currentStreak: number              // Consecutive days with sessions
  prsThisMonth: number
  progressToGoal: number             // 0-100%
}
```

---

## Architecture & Data Flow

### Component Hierarchy

```
app/(protected)/dashboard/page.tsx (Server Component)
  |
  +-- DashboardContent (Async Server Component)
  |     |-- Auth check (redirect if needed)
  |     |-- Parallel data fetching (Promise.all)
  |     +-- Role-based routing
  |
  +-- CoachDashboard OR AthleteDashboard (Client Component)
        |
        +-- Suspense boundaries for each section
        |     |-- StatsSection
        |     |-- ActionSection
        |     |-- ActivitySection
        |
        +-- React Query for client-side updates
```

### Data Flow Pattern

```
                    +-----------------+
                    |  Server Action  |
                    | (Initial Load)  |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+       +-----------v-----------+
    |  getDashboardData |       |  getCoachDashboard    |
    |  (Athlete View)   |       |  (Coach View)         |
    +--------+----------+       +-----------+-----------+
             |                              |
             v                              v
    +------------------+         +----------------------+
    |  React Query     |         |  React Query         |
    |  Cache (5 min)   |         |  Cache (2 min)       |
    +--------+---------+         +-----------+----------+
             |                              |
             v                              v
    +------------------+         +----------------------+
    |  Optimistic UI   |         |  Optimistic UI       |
    |  Updates         |         |  Updates             |
    +------------------+         +----------------------+
```

### Query Key Structure

```typescript
// Hierarchical query keys for proper invalidation
const queryKeys = {
  dashboard: ['dashboard'] as const,

  // Coach-specific
  coachStats: ['dashboard', 'coach', 'stats'] as const,
  coachAthletes: ['dashboard', 'coach', 'athletes'] as const,
  coachActivity: ['dashboard', 'coach', 'activity'] as const,

  // Athlete-specific
  athleteStats: ['dashboard', 'athlete', 'stats'] as const,
  athleteWorkout: ['dashboard', 'athlete', 'today'] as const,
  athleteSchedule: ['dashboard', 'athlete', 'schedule'] as const,
  athletePRs: ['dashboard', 'athlete', 'prs'] as const,
}
```

---

## UI/UX Design Patterns

### Design Philosophy: Utility Minimalism

**Core Principles**:
1. **One primary action per view** - Everything else is secondary
2. **Text over cards** - Stats as inline text, not heavy card components
3. **Borders over shadows** - Lighter visual weight, better performance
4. **No hover gymnastics** - Remove scale transforms, excessive shadows
5. **Single visual rhythm** - Consistent 16px/24px spacing throughout

**Anti-patterns to avoid**:
- Multi-column grids on mobile
- Color-coded status badges (use text labels)
- Hover scale/shadow effects (mobile-hostile)
- Stats displayed as individual cards (wasteful)
- Progress bars for simple percentages (text is clearer)

### Visual Hierarchy (Simplified)

```
+----------------------------------------+
|  PRIMARY ACTION                        |
|  Single CTA, full attention            |
+----------------------------------------+
|  stat  ·  stat  ·  stat                |  <- Inline text row
+----------------------------------------+
|  List item                             |
|  List item                             |  <- Simple scrollable
|  List item                             |
+----------------------------------------+
```

**Key differences from typical dashboards**:
- No "stats bar" with 4+ heavy cards
- No multi-column grids (single column, always)
- No color-coded badges (text labels only)
- No floating action buttons

### Coach Dashboard Layout (Lean v1)

```
+----------------------------------------+
|  3 athletes need attention             |
|  [View All Athletes ->]                |
+----------------------------------------+
|  12 active  ·  8 today  ·  85% rate    |
+----------------------------------------+
|  Activity                              |
|  ──────────────────────────────────────|
|  Sarah completed Legs · 2h             |
|  Mike PR: Squat 140kg · 5h             |
|  John missed session · 1d              |
+----------------------------------------+
```

### Athlete Dashboard Layout (Lean v1)

```
+----------------------------------------+
|  Upper Body Strength                   |
|  6 exercises · ~45 min                 |
|                                        |
|  [Start Workout]                       |
+----------------------------------------+
|  5 day streak  ·  3/4 this week        |
+----------------------------------------+
|  Up Next                               |
|  ──────────────────────────────────────|
|  Tomorrow · Legs                       |
|  Wed · Cardio                          |
|  Fri · Full Body                       |
+----------------------------------------+
```

### Mobile-First Implementation

```typescript
// Minimal touch targets (Apple HIG compliant)
const touchTargets = {
  button: 'min-h-11',           // 44px height
  listItem: 'py-4',             // Comfortable tap area
  iconButton: 'size-11',        // 44px square
}

// Single-column always - no responsive grid complexity
const layoutPattern = 'flex flex-col gap-0'  // Sections separated by borders

// Loading: Single skeleton, not per-section
const loadingSkeleton = 'animate-pulse bg-muted h-96 rounded-lg'
```

**Deferred to v2+**:
- Swipe actions on list items
- Multi-column layouts
- Real-time activity polling
- Avatar images

### Loading States

```typescript
// Skeleton patterns for each section
const skeletons = {
  statsBar: 'h-20 flex gap-4',           // 4 stat cards
  heroSection: 'h-48 rounded-xl',        // Main action area
  listSection: 'space-y-3',              // Stacked items
  gridSection: 'grid grid-cols-2 gap-4', // Card grid
}

// Progressive loading order
// 1. Stats bar (fastest, smallest query)
// 2. Hero section (primary action)
// 3. Main content (can wait)
// 4. Activity feed (lowest priority)
```

### Status Indicators (Text-Based)

**Philosophy**: Use text labels, not color badges. Colors have accessibility issues and add visual noise.

```typescript
// Session status - text labels only
const sessionStatus = {
  assigned: 'Upcoming',
  'in-progress': 'In Progress',
  completed: 'Done',
  cancelled: 'Cancelled',
}

// Athlete attention status - shown in activity list, not as badges
// "Sarah · missed 2 sessions" vs "[RED BADGE] Sarah"

// Only use color for:
// 1. Primary CTA button (brand color)
// 2. Destructive actions (red, sparingly)
// 3. Success confirmation toasts (green, brief)
```

**Semantic colors (limit to 3)**:
```css
--color-primary: /* Brand accent for CTAs */
--color-muted: /* Secondary text, borders */
--color-destructive: /* Errors, warnings only */
```

---

## Performance Optimization

### Query Optimization

```typescript
// 1. Select only needed fields - NEVER use select('*')
const athleteListQuery = supabase
  .from('athletes')
  .select('id, first_name, last_name, avatar_url')  // Specific fields
  .eq('coach_user_id', dbUserId)
  .order('last_name')
  .limit(20)  // Pagination

// 2. Parallel queries with Promise.all
const [athletes, stats, activity] = await Promise.all([
  getAthletesAction(),
  getDashboardStatsAction(),
  getRecentActivityAction()
])

// 3. Use aggregation functions in Postgres
const statsQuery = supabase
  .rpc('get_coach_dashboard_stats', { coach_id: dbUserId })
  // Returns: { total_athletes, sessions_today, pending_reviews, compliance_rate }
```

### Caching Strategy

```typescript
// React Query configuration per data type
const cacheConfig = {
  // Coach dashboard - more dynamic, shorter cache
  coachStats: {
    staleTime: 2 * 60 * 1000,      // 2 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
  },

  // Athlete dashboard - less dynamic, longer cache
  athleteStats: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 30 * 60 * 1000,        // 30 minutes
    refetchOnWindowFocus: true,
  },

  // Activity feed - real-time feel
  activityFeed: {
    staleTime: 30 * 1000,          // 30 seconds
    gcTime: 5 * 60 * 1000,         // 5 minutes
    refetchInterval: 60 * 1000,    // Poll every minute
  },
}

// Usage in component
const { data: stats } = useQuery({
  queryKey: queryKeys.coachStats,
  queryFn: getCoachStatsAction,
  ...cacheConfig.coachStats,
})
```

### Cache Invalidation Patterns

```typescript
// 1. Invalidate on mutation success
const completeMutation = useMutation({
  mutationFn: completeSessionAction,
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['workout', 'history'] })
  },
})

// 2. Optimistic updates for instant feedback
const updateMutation = useMutation({
  mutationFn: updateAthleteStatusAction,
  onMutate: async (newStatus) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.coachAthletes })

    // Snapshot current value
    const previous = queryClient.getQueryData(queryKeys.coachAthletes)

    // Optimistically update
    queryClient.setQueryData(queryKeys.coachAthletes, (old) => ({
      ...old,
      athletes: old.athletes.map(a =>
        a.id === newStatus.athleteId ? { ...a, status: newStatus.status } : a
      )
    }))

    return { previous }
  },
  onError: (err, newStatus, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.coachAthletes, context.previous)
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: queryKeys.coachAthletes })
  },
})

// 3. Server-side revalidation after mutations
// In server action:
revalidatePath('/dashboard')
revalidatePath('/athletes')
```

### Server Component Optimization

```typescript
// app/(protected)/dashboard/page.tsx
import { Suspense } from 'react'

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats load first - small query */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Hero section - primary action */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Main content - can wait */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<ListSkeleton />}>
          <MainListSection />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <ActivityWidget />
        </Suspense>
      </div>
    </div>
  )
}

// Parallel data fetching in async components
async function StatsSection() {
  const [stats, todayCount] = await Promise.all([
    getDashboardStatsAction(),
    getTodaySessionCountAction(),
  ])

  if (!stats.isSuccess) return <StatsError />

  return <StatsBar stats={stats.data} todayCount={todayCount.data} />
}
```

### Database Optimization

```sql
-- Indexes for dashboard queries (add via migration)

-- Coach: Athletes with recent activity
CREATE INDEX idx_athletes_coach_updated
ON athletes(coach_user_id, updated_at DESC);

-- Athlete: Today's sessions
CREATE INDEX idx_workout_logs_athlete_date
ON workout_logs(athlete_id, date_time DESC);

-- Activity feed: Recent completions
CREATE INDEX idx_workout_logs_status_date
ON workout_logs(session_status, date_time DESC)
WHERE session_status = 'completed';

-- Stats aggregation (consider materialized view for heavy dashboards)
CREATE MATERIALIZED VIEW coach_dashboard_stats AS
SELECT
  c.id as coach_id,
  COUNT(DISTINCT a.id) as total_athletes,
  COUNT(CASE WHEN wl.date_time::date = CURRENT_DATE THEN 1 END) as sessions_today,
  COUNT(CASE WHEN wl.session_status = 'completed' THEN 1 END)::float /
    NULLIF(COUNT(wl.id), 0) as compliance_rate
FROM coaches c
LEFT JOIN athletes a ON a.coach_user_id = c.user_id
LEFT JOIN workout_logs wl ON wl.athlete_id = a.id
  AND wl.date_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.id;

-- Refresh strategy (via cron or trigger)
REFRESH MATERIALIZED VIEW coach_dashboard_stats;
```

---

## Implementation Guide

### Directory Structure

```
apps/web/
├── app/(protected)/dashboard/
│   ├── page.tsx                    # Main server component
│   ├── layout.tsx                  # Dashboard layout
│   └── loading.tsx                 # Unified loading skeleton
│
├── components/features/dashboard/
│   ├── components/
│   │   ├── index.ts
│   │   ├── dashboard-layout.tsx    # Role-based layout wrapper
│   │   ├── coach/
│   │   │   ├── coach-dashboard.tsx
│   │   │   ├── priority-athletes-section.tsx
│   │   │   ├── athlete-grid.tsx
│   │   │   ├── athlete-status-card.tsx
│   │   │   └── coach-activity-feed.tsx
│   │   ├── athlete/
│   │   │   ├── athlete-dashboard.tsx
│   │   │   ├── todays-workout-hero.tsx
│   │   │   ├── progress-stats-bar.tsx
│   │   │   ├── upcoming-sessions.tsx
│   │   │   └── personal-records.tsx
│   │   └── shared/
│   │       ├── stats-card.tsx
│   │       ├── activity-item.tsx
│   │       └── quick-action-button.tsx
│   ├── hooks/
│   │   ├── use-dashboard-data.ts   # React Query wrapper
│   │   ├── use-coach-dashboard.ts
│   │   └── use-athlete-dashboard.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── dashboard-types.ts
│   └── constants/
│       └── dashboard-config.ts
│
└── actions/dashboard/
    ├── dashboard-actions.ts        # Shared actions
    ├── coach-dashboard-actions.ts  # Coach-specific
    └── athlete-dashboard-actions.ts # Athlete-specific
```

### Server Actions Implementation

```typescript
// actions/dashboard/coach-dashboard-actions.ts
"use server"

import supabase from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/server-action-types"

interface CoachDashboardData {
  priorityAthletes: PriorityAthlete[]
  stats: CoachStats
  athleteGrid: AthleteGridItem[]
  recentActivity: ActivityItem[]
}

interface PriorityAthlete {
  id: number
  name: string
  avatarUrl?: string
  issue: 'missed_sessions' | 'high_fatigue' | 'pending_review'
  issueDetail: string
  lastActive: Date
}

export async function getCoachDashboardAction(): Promise<
  ActionState<CoachDashboardData>
> {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return { isSuccess: false, message: "Authentication required" }
    }

    const dbUserId = await getDbUserId(clerkUserId)

    // Verify coach role
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!coach) {
      return { isSuccess: false, message: "Coach profile not found" }
    }

    // Parallel fetch all dashboard data
    const [
      priorityResult,
      statsResult,
      gridResult,
      activityResult
    ] = await Promise.all([
      getPriorityAthletes(dbUserId),
      getCoachStats(dbUserId),
      getAthleteGrid(dbUserId),
      getRecentActivity(dbUserId)
    ])

    return {
      isSuccess: true,
      message: "Coach dashboard loaded",
      data: {
        priorityAthletes: priorityResult,
        stats: statsResult,
        athleteGrid: gridResult,
        recentActivity: activityResult
      }
    }
  } catch (error) {
    console.error("[getCoachDashboardAction]:", error)
    return { isSuccess: false, message: "Failed to load dashboard" }
  }
}

// Helper: Get athletes needing attention
async function getPriorityAthletes(coachUserId: string): Promise<PriorityAthlete[]> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Athletes with missed sessions or no recent activity
  const { data: athletes } = await supabase
    .from('athletes')
    .select(`
      id,
      user:users!inner(first_name, last_name, avatar_url),
      workout_logs(
        id,
        session_status,
        date_time
      )
    `)
    .eq('coach_user_id', coachUserId)
    .gte('workout_logs.date_time', oneWeekAgo.toISOString())
    .limit(5)

  if (!athletes) return []

  return athletes
    .filter(a => {
      const logs = a.workout_logs || []
      const missedCount = logs.filter(l => l.session_status === 'cancelled').length
      return missedCount >= 2 || logs.length === 0
    })
    .map(a => ({
      id: a.id,
      name: `${a.user.first_name} ${a.user.last_name}`,
      avatarUrl: a.user.avatar_url,
      issue: 'missed_sessions' as const,
      issueDetail: 'Missed 2+ sessions this week',
      lastActive: new Date()
    }))
    .slice(0, 3) // Top 3 priority
}

// Helper: Get coach stats
async function getCoachStats(coachUserId: string): Promise<CoachStats> {
  const today = new Date().toISOString().split('T')[0]

  const { data, count } = await supabase
    .from('athletes')
    .select('id, workout_logs!inner(session_status, date_time)', { count: 'exact' })
    .eq('coach_user_id', coachUserId)

  const totalAthletes = count || 0
  const sessionsToday = data?.flatMap(a => a.workout_logs)
    .filter(l => l.date_time?.startsWith(today)).length || 0
  const pendingReviews = data?.flatMap(a => a.workout_logs)
    .filter(l => l.session_status === 'completed').length || 0 // Simplified

  return {
    totalAthletes,
    sessionsToday,
    pendingReviews,
    complianceRate: 85 // Calculate from actual data
  }
}
```

### Client Component Implementation

```typescript
// components/features/dashboard/hooks/use-coach-dashboard.ts
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCoachDashboardAction } from "@/actions/dashboard/coach-dashboard-actions"
import { queryKeys, cacheConfig } from "../constants/dashboard-config"

export function useCoachDashboard() {
  const queryClient = useQueryClient()

  const dashboardQuery = useQuery({
    queryKey: queryKeys.coachDashboard,
    queryFn: async () => {
      const result = await getCoachDashboardAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    ...cacheConfig.coachDashboard,
  })

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
    invalidate: invalidateDashboard,
  }
}
```

```typescript
// components/features/dashboard/components/coach/coach-dashboard.tsx
"use client"

import { Suspense } from "react"
import { useCoachDashboard } from "../../hooks/use-coach-dashboard"
import { PriorityAthletesSection } from "./priority-athletes-section"
import { CoachStatsBar } from "./coach-stats-bar"
import { AthleteGrid } from "./athlete-grid"
import { CoachActivityFeed } from "./coach-activity-feed"
import { ComponentSkeleton } from "@/components/layout"

export function CoachDashboard() {
  const { data, isLoading, error } = useCoachDashboard()

  if (error) {
    return <DashboardError message={error.message} />
  }

  return (
    <div className="space-y-6">
      {/* Priority Athletes - Most Important */}
      <section aria-label="Priority Athletes">
        {isLoading ? (
          <ComponentSkeleton type="card" className="h-32" />
        ) : (
          <PriorityAthletesSection athletes={data?.priorityAthletes || []} />
        )}
      </section>

      {/* Stats Bar */}
      <section aria-label="Quick Statistics">
        {isLoading ? (
          <ComponentSkeleton type="stats" />
        ) : (
          <CoachStatsBar stats={data?.stats} />
        )}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <section aria-label="Athlete Overview">
            {isLoading ? (
              <ComponentSkeleton type="grid" />
            ) : (
              <AthleteGrid athletes={data?.athleteGrid || []} />
            )}
          </section>
        </div>

        <div>
          <section aria-label="Recent Activity">
            {isLoading ? (
              <ComponentSkeleton type="list" />
            ) : (
              <CoachActivityFeed activities={data?.recentActivity || []} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
```

---

## Component Specifications

### StatsCard

```typescript
interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  icon?: LucideIcon
  href?: string
}

// Usage
<StatsCard
  title="Active Athletes"
  value={12}
  subtitle="2 new this week"
  trend={{ direction: 'up', value: '+2' }}
  icon={Users}
/>
```

### AthleteStatusCard

```typescript
interface AthleteStatusCardProps {
  athlete: {
    id: number
    name: string
    avatarUrl?: string
    status: 'ready' | 'fatigued' | 'at_risk' | 'review'
    lastSession?: Date
    complianceRate: number
  }
  onView: () => void
  onMessage?: () => void
  onEditPlan?: () => void
}

// Visual states
const statusStyles = {
  ready: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950',
  fatigued: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  at_risk: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950',
  review: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950',
}
```

### TodaysWorkoutHero

```typescript
interface TodaysWorkoutHeroProps {
  workout: {
    id: number
    name: string
    description?: string
    estimatedDuration: number // minutes
    exerciseCount: number
    status: 'not_started' | 'in_progress' | 'completed'
  } | null
}

// Empty state
if (!workout) {
  return (
    <div className="text-center py-12">
      <CalendarOff className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">No workout scheduled</h3>
      <p className="text-muted-foreground">Enjoy your rest day!</p>
    </div>
  )
}
```

---

## Anti-Patterns & Pitfalls

### Query Anti-Patterns

```typescript
// WRONG: Over-fetching with select('*')
const { data } = await supabase
  .from('athletes')
  .select('*')  // Fetches ALL columns including unused

// CORRECT: Specific fields only
const { data } = await supabase
  .from('athletes')
  .select('id, first_name, last_name, avatar_url')


// WRONG: N+1 queries
for (const athlete of athletes) {
  const { data: sessions } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('athlete_id', athlete.id)
}

// CORRECT: Single join query
const { data } = await supabase
  .from('athletes')
  .select(`
    id, first_name, last_name,
    workout_logs(id, date_time, session_status)
  `)


// WRONG: No pagination
const { data } = await supabase
  .from('workout_logs')
  .select('*')  // Could return thousands

// CORRECT: Always paginate
const { data } = await supabase
  .from('workout_logs')
  .select('id, date_time, session_status')
  .order('date_time', { ascending: false })
  .limit(20)
```

### Cache Anti-Patterns

```typescript
// WRONG: No cache invalidation after mutation
const updateMutation = useMutation({
  mutationFn: updateAthleteAction,
  // Missing onSuccess invalidation!
})

// CORRECT: Always invalidate related queries
const updateMutation = useMutation({
  mutationFn: updateAthleteAction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['athletes'] })
  },
})


// WRONG: Over-invalidation (too broad)
queryClient.invalidateQueries() // Invalidates EVERYTHING

// CORRECT: Targeted invalidation
queryClient.invalidateQueries({ queryKey: ['dashboard', 'coach'] })


// WRONG: Too-short staleTime causing excessive refetches
const { data } = useQuery({
  queryKey: ['dashboard'],
  queryFn: getDashboardData,
  staleTime: 0,  // Refetches on every focus!
})

// CORRECT: Appropriate staleTime for data volatility
const { data } = useQuery({
  queryKey: ['dashboard'],
  queryFn: getDashboardData,
  staleTime: 2 * 60 * 1000,  // 2 minutes for dynamic data
})
```

### Component Anti-Patterns

```typescript
// WRONG: Mixing server and client data fetching
'use client'
export function Dashboard() {
  // Client-side fetch
  useEffect(() => {
    fetch('/api/dashboard').then(...)
  }, [])

  // Also calling server action
  const { data } = useQuery({ queryFn: getDashboardAction })
}

// CORRECT: Choose one pattern and stick to it
// Option A: Server component with Suspense
export default async function DashboardPage() {
  const data = await getDashboardAction()
  return <DashboardView data={data} />
}

// Option B: Client component with React Query
'use client'
export function Dashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardAction
  })
  return <DashboardView data={data} />
}


// WRONG: Hardcoded fallback data
const volume = data?.volume || [5, 6, 7, 5]  // NEVER hardcode defaults

// CORRECT: Explicit empty states
if (!data?.volume || data.volume.length === 0) {
  return <EmptyState message="No volume data available" />
}


// WRONG: No loading or error states
export function StatsSection({ data }) {
  return <div>{data.totalSessions}</div>  // Crashes if data is undefined
}

// CORRECT: Handle all states
export function StatsSection({ data, isLoading, error }) {
  if (isLoading) return <StatsSkeleton />
  if (error) return <StatsError error={error} />
  if (!data) return <EmptyStats />
  return <div>{data.totalSessions}</div>
}
```

### Auth Anti-Patterns

```typescript
// WRONG: Assuming auth will always succeed
export async function getDashboardAction() {
  const { userId } = await auth()
  const data = await supabase.from('table').select('*')
  // Missing userId check!
}

// CORRECT: Always check auth first
export async function getDashboardAction() {
  const { userId } = await auth()
  if (!userId) {
    return { isSuccess: false, message: "Authentication required" }
  }
  // Now safe to proceed
}


// WRONG: Trusting client-side role checks alone
'use client'
export function CoachDashboard() {
  const { isCoach } = useUserRole()
  if (!isCoach) return null  // Can be bypassed!
}

// CORRECT: Server-side role verification
export async function getCoachDashboardAction() {
  const { userId } = await auth()
  const dbUserId = await getDbUserId(userId)

  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', dbUserId)
    .single()

  if (!coach) {
    return { isSuccess: false, message: "Coach access required" }
  }
  // Now safe for coach data
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/actions/dashboard/coach-dashboard-actions.test.ts
import { getCoachDashboardAction } from '@/actions/dashboard/coach-dashboard-actions'

describe('getCoachDashboardAction', () => {
  it('should return error when not authenticated', async () => {
    // Mock auth to return no userId
    jest.mock('@clerk/nextjs/server', () => ({
      auth: jest.fn().mockResolvedValue({ userId: null })
    }))

    const result = await getCoachDashboardAction()

    expect(result.isSuccess).toBe(false)
    expect(result.message).toBe('Authentication required')
  })

  it('should return dashboard data for authenticated coach', async () => {
    // Mock auth and database
    const result = await getCoachDashboardAction()

    expect(result.isSuccess).toBe(true)
    expect(result.data).toHaveProperty('priorityAthletes')
    expect(result.data).toHaveProperty('stats')
  })
})
```

### Integration Tests

```typescript
// __tests__/integration/dashboard.test.ts
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CoachDashboard } from '@/components/features/dashboard'

describe('CoachDashboard Integration', () => {
  it('should render all dashboard sections', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <CoachDashboard />
      </QueryClientProvider>
    )

    // Check all sections load
    await waitFor(() => {
      expect(screen.getByLabelText('Priority Athletes')).toBeInTheDocument()
      expect(screen.getByLabelText('Quick Statistics')).toBeInTheDocument()
      expect(screen.getByLabelText('Athlete Overview')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests

```typescript
// __tests__/e2e/dashboard.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as coach
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'coach@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('coach sees athlete grid and stats', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByText(/active athletes/i)).toBeVisible()
    await expect(page.getByText(/sessions today/i)).toBeVisible()
  })

  test('can navigate to athlete from dashboard', async ({ page }) => {
    await page.click('[data-testid="athlete-card"]')
    await expect(page).toHaveURL(/\/athletes\/\d+/)
  })
})
```

---

## References

### Research Sources
- [AI Sports Training Coach 2025](https://www.esferasoft.com/blog/ai-solutions-for-sports-building-an-ai-sports-training-coach)
- [Dashboard Design Principles - UXPin](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [CoachNow 2025 Features](https://coachnow.com/blog/2025-key-features)
- [Athlete Monitoring 2025 - Checklick](https://www.checklick.com/athlete-monitoring-the-future-of-data-driven-coaching-in-2025/)
- [Fitness App UX Best Practices - Zfort](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)
- [Dashboard UX Patterns - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)

### Internal Documentation
- [Feature Pattern Standard](./feature-pattern.md)
- [ActionState Pattern](../docs/patterns/actionstate-pattern.md)
- [Component Architecture](../docs/architecture/component-architecture.md)
- [Loading Patterns](../docs/development/loading-patterns.md)

---

**Last Updated**: 2025-12-27
**Author**: Development Team
**Version**: 1.0.0
