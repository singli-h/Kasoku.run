/*
<ai_context>
Coach dashboard view - lean layout matching AthleteDashboardView style.
Single column, text-based, no heavy card patterns.
Shows athletes, active plans, and recent activity across all athletes.
</ai_context>
*/

"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Users, Activity, ChevronRight } from "lucide-react"
import type { CoachDashboardData } from "../types/dashboard-types"

interface CoachDashboardViewProps {
  data: CoachDashboardData
}

export function CoachDashboardView({ data }: CoachDashboardViewProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {/* Inline Stats Row */}
      <section className="pb-4">
        <CoachStats
          totalAthletes={data.totalAthletes}
          activePlans={data.activePlans}
        />
      </section>

      {/* Athletes List */}
      <section className="py-4">
        <AthletesList athletes={data.athletes} />
      </section>

      {/* Recent Activity */}
      <section className="pt-4">
        <RecentActivityList activity={data.recentActivity} />
      </section>
    </div>
  )
}

// Inline stats - text only, no cards
function CoachStats({ totalAthletes, activePlans }: { totalAthletes: number; activePlans: number }) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Users className="size-4 text-blue-500" />
        <span className="font-medium text-foreground">{totalAthletes}</span> athletes
      </span>
      <span className="flex items-center gap-1.5">
        <Activity className="size-4 text-green-500" />
        <span className="font-medium text-foreground">{activePlans}</span> active plans
      </span>
    </div>
  )
}

// Athletes list - simple, text-based
function AthletesList({ athletes }: { athletes: CoachDashboardData['athletes'] }) {
  const displayAthletes = athletes.slice(0, 10)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Athletes
        </h3>
        {athletes.length > 10 && (
          <Link
            href="/athletes"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        )}
      </div>
      {displayAthletes.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No athletes yet.{' '}
          <Link href="/athletes" className="text-primary hover:underline">
            Add your first athlete
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {displayAthletes.map((athlete) => (
            <Link
              key={athlete.id}
              href={`/athletes/${athlete.id}`}
              className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-accent/50 -mx-1 px-1 rounded-sm transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-2 rounded-full shrink-0 ${
                    athlete.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm truncate">{athlete.name}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {athlete.lastWorkoutDate
                  ? formatDistanceToNow(athlete.lastWorkoutDate, { addSuffix: true })
                  : 'No activity'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Recent activity list - simple, text-based
function RecentActivityList({ activity }: { activity: CoachDashboardData['recentActivity'] }) {
  const displayActivity = activity.slice(0, 10)

  if (displayActivity.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Recent Activity
      </h3>
      <div className="space-y-0">
        {displayActivity.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-3 border-b border-border last:border-0 -mx-1 px-1"
          >
            <div className="flex items-center gap-3 min-w-0">
              <StatusBadge status={item.status} />
              <div className="min-w-0">
                <p className="text-sm truncate">{item.athleteName}</p>
                <p className="text-xs text-muted-foreground truncate">{item.sessionName}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {formatDistanceToNow(item.date, { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Status badge for workout sessions
function StatusBadge({ status }: { status: 'pending' | 'in-progress' | 'completed' | 'cancelled' }) {
  const config = {
    completed: 'bg-green-500',
    'in-progress': 'bg-blue-500',
    pending: 'bg-gray-400',
    cancelled: 'bg-red-500'
  }

  return <div className={`size-2 rounded-full shrink-0 ${config[status]}`} />
}
