/*
<ai_context>
Lean dashboard layout following utility minimalism principles.
Single column, text-based stats, no heavy card patterns.
</ai_context>
*/

"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ChevronRight, Dumbbell, TrendingUp, Flame, BookOpen, Calendar } from "lucide-react"
import type { DashboardData, RecentSession } from "../types/dashboard-types"

interface DashboardLayoutProps {
  data: DashboardData
  /** @deprecated displayName is shown in PageLayout title, not needed here */
  displayName?: string
}

export function DashboardLayout({ data }: DashboardLayoutProps) {
  // Lean athlete dashboard view - single column, minimal
  return <AthleteDashboardView data={data} />
}

// Lean athlete dashboard view
function AthleteDashboardView({ data }: { data: DashboardData }) {
  const todaySession = data.recentSessions.find(
    s => s.status === 'pending' || s.status === 'in-progress'
  )
  const { stats } = data

  return (
    <div className="flex flex-col divide-y divide-border">
      {/* Primary Action: Today's Workout */}
      <section className="pb-6">
        {todaySession ? (
          <TodayWorkoutCard session={todaySession} />
        ) : (
          <NoWorkoutCard />
        )}
      </section>

      {/* Inline Stats Row */}
      <section className="py-4">
        <InlineStats stats={stats} />
      </section>

      {/* Quick Actions */}
      <section className="py-4">
        <QuickActions />
      </section>

      {/* Activity List */}
      <section className="pt-4">
        <ActivityList sessions={data.recentSessions} />
      </section>
    </div>
  )
}

// Today's workout - primary CTA
function TodayWorkoutCard({ session }: { session: RecentSession }) {
  return (
    <Link
      href={`/workout/${session.id}`}
      className="block p-6 -mx-4 sm:mx-0 sm:rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Today&apos;s Workout</p>
          <h2 className="text-xl font-semibold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {session.status === 'in-progress' ? 'Continue where you left off' : 'Ready to start'}
          </p>
        </div>
        <div className="flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground">
          <Dumbbell className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm font-medium text-primary">
        {session.status === 'in-progress' ? 'Continue Workout' : 'Start Workout'}
        <ChevronRight className="ml-1 size-4" />
      </div>
    </Link>
  )
}

// Empty state when no workout scheduled
function NoWorkoutCard() {
  return (
    <div className="p-6 -mx-4 sm:mx-0 sm:rounded-lg border border-dashed border-border text-center">
      <Calendar className="mx-auto size-10 text-muted-foreground/50" />
      <h3 className="mt-3 font-medium">No workout scheduled</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Enjoy your rest day, or browse workouts
      </p>
      <Link
        href="/workout"
        className="inline-flex items-center mt-4 text-sm font-medium text-primary hover:underline"
      >
        Browse Workouts
        <ChevronRight className="ml-1 size-4" />
      </Link>
    </div>
  )
}

// Inline stats - text only, no cards
function InlineStats({ stats }: { stats: DashboardData['stats'] }) {
  const completionRate = stats.totalSessions > 0
    ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
    : 0

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-6 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Flame className="size-4 text-orange-500" />
          <span className="font-medium text-foreground">{stats.completedSessions}</span> completed
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <TrendingUp className="size-4 text-green-500" />
          <span className="font-medium text-foreground">{completionRate}%</span> rate
        </span>
      </div>
      {stats.upcomingSessions > 0 && (
        <span className="text-muted-foreground">
          {stats.upcomingSessions} upcoming
        </span>
      )}
    </div>
  )
}

// Quick action links - simple list, no cards
function QuickActions() {
  const actions = [
    { href: '/workout', label: 'Start a Workout', icon: Dumbbell },
    { href: '/performance', label: 'View Performance', icon: TrendingUp },
    { href: '/library', label: 'Exercise Library', icon: BookOpen },
  ]

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      <div className="space-y-0.5">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-between py-3 px-1 -mx-1 rounded-md hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-3">
              <action.icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// Activity list - simple, text-based
function ActivityList({ sessions }: { sessions: RecentSession[] }) {
  const recentCompleted = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 5)

  if (recentCompleted.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h3>
        <Link
          href="/workout/history"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="space-y-0">
        {recentCompleted.map((session) => (
          <Link
            key={session.id}
            href={`/workout/${session.id}`}
            className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-accent/50 -mx-1 px-1 rounded-sm transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm truncate">{session.title}</span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(session.date, { addSuffix: false })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
