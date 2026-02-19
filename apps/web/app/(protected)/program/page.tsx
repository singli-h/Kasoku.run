import { Suspense } from "react"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { serverProtectRoute } from "@/components/auth/server-protect-route"
import { getAthleteAssignedPlanAction } from "@/actions/plans/plan-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Clock, Play } from "lucide-react"

export default async function ProgramPage() {
  await serverProtectRoute({ allowedRoles: ['athlete'] })

  return (
    <PageLayout
      title="My Program"
      description="View your assigned training program"
    >
      <Suspense fallback={<UnifiedPageSkeleton title="My Program" variant="plans" />}>
        <ProgramContent />
      </Suspense>
    </PageLayout>
  )
}

const statusConfig = {
  completed: { label: "Completed", icon: CheckCircle2, variant: "default" as const, className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  ongoing: { label: "In Progress", icon: Play, variant: "default" as const, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  assigned: { label: "Assigned", icon: Clock, variant: "default" as const, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  upcoming: { label: "Upcoming", icon: Circle, variant: "secondary" as const, className: "" },
}

async function ProgramContent() {
  const result = await getAthleteAssignedPlanAction()

  if (!result.isSuccess) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load program: {result.message}</p>
      </div>
    )
  }

  if (!result.data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground">No program assigned</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your coach hasn&apos;t assigned a training plan to your group yet.
        </p>
      </div>
    )
  }

  const { planName, currentWeek, totalWeeks, sessions } = result.data

  // Group sessions by week
  const sessionsByWeek = new Map<number, typeof sessions>()
  for (const session of sessions) {
    const week = session.week ?? 0
    if (!sessionsByWeek.has(week)) {
      sessionsByWeek.set(week, [])
    }
    sessionsByWeek.get(week)!.push(session)
  }

  return (
    <div className="space-y-6">
      {/* Phase/Week indicator */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-sm">
          Week {currentWeek} of {totalWeeks}
        </Badge>
      </div>

      {/* Sessions grouped by week */}
      {Array.from(sessionsByWeek.entries())
        .sort(([a], [b]) => a - b)
        .map(([week, weekSessions]) => (
          <Card key={week}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Week {week}
                {week === currentWeek && (
                  <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekSessions
                .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
                .map(session => {
                  const config = statusConfig[session.status]
                  const StatusIcon = config.icon
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {session.name || `Session ${session.day ?? ''}`}
                          </p>
                          {session.day != null && (
                            <p className="text-xs text-muted-foreground">
                              Day {session.day}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={config.variant} className={config.className}>
                        {config.label}
                      </Badge>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        ))}

      {sessions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No sessions scheduled for the current weeks.</p>
        </div>
      )}
    </div>
  )
}
