/*
<ai_context>
Coach dashboard view — action-oriented weekly overview.
Three sections: This Week stats, Today by event group, Active Plans.
No per-athlete lists. Numbers scale to 60+ athletes.
</ai_context>
*/

import Link from "next/link"
import { Calendar, Users, TrendingUp, Target } from "lucide-react"
import type { CoachWeekDashboardData } from "../types/dashboard-types"
import { EventGroupBadge } from "@/components/features/athletes/components/event-group-badge"

interface CoachDashboardViewProps {
  data: CoachWeekDashboardData
}

export function CoachDashboardView({ data }: CoachDashboardViewProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <section className="pb-4">
        <WeekStats stats={data.weekStats} weekLabel={data.weekLabel} />
      </section>

      <section className="py-4">
        <TodaySessions groups={data.todayGroups} total={data.todayTotal} />
      </section>

      <section className="pt-4">
        <ActivePlans plans={data.activePlanDetails} />
      </section>
    </div>
  )
}

function WeekStats({
  stats,
  weekLabel
}: {
  stats: CoachWeekDashboardData['weekStats']
  weekLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          This Week
        </h3>
        <span className="text-xs text-muted-foreground">{weekLabel}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm">
          <TrendingUp className="size-4 text-green-500 shrink-0" />
          <span className="font-medium text-foreground">{stats.completionRate}%</span>
          <span className="text-muted-foreground">
            completed · {stats.completedSessions}/{stats.totalSessions} sessions
          </span>
        </div>

        {stats.athletesNotTrained > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-4 text-amber-500 shrink-0" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{stats.athletesNotTrained}</span>
              {' '}athlete{stats.athletesNotTrained !== 1 ? 's' : ''} haven&apos;t trained yet
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm">
          <Target className="size-4 text-blue-500 shrink-0" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{stats.activePlans}</span>
            {' '}active plan{stats.activePlans !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function TodaySessions({
  groups,
  total
}: {
  groups: CoachWeekDashboardData['todayGroups']
  total: CoachWeekDashboardData['todayTotal']
}) {
  const today = new Date()
  const dayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Calendar className="size-3.5 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Today
        </h3>
        <span className="text-xs text-muted-foreground">· {dayLabel}</span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No sessions scheduled today</p>
      ) : (
        <>
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupComplianceBar
                key={group.eventGroup}
                eventGroup={group.eventGroup}
                completed={group.completed}
                total={group.total}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {total.completed}/{total.total} sessions completed
          </p>
        </>
      )}
    </div>
  )
}

function GroupComplianceBar({
  eventGroup,
  completed,
  total
}: {
  eventGroup: string
  completed: number
  total: number
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <EventGroupBadge value={eventGroup} size="xs" className="w-12" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
        {completed}/{total}
      </span>
    </div>
  )
}

function ActivePlans({ plans }: { plans: CoachWeekDashboardData['activePlanDetails'] }) {
  if (plans.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Plans
        </h3>
        <p className="text-sm text-muted-foreground py-2">
          No active plans.{' '}
          <Link href="/plans/new" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Active Plans
      </h3>
      <div className="space-y-3">
        {plans.map((plan) => {
          const pct = Math.round((plan.currentWeek / plan.totalWeeks) * 100)
          return (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="block hover:bg-accent/50 -mx-1 px-1 py-1.5 rounded-sm transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm truncate">{plan.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">
                  Wk {plan.currentWeek}/{plan.totalWeeks}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan.currentPhase && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {plan.currentPhase}
                  </span>
                )}
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
