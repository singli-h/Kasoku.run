/**
 * Ongoing Session Banner
 * Prominent banner shown when user has an ongoing workout session
 * Replaces auto-redirect to give users control over their navigation
 */

"use client"

import { Play, Clock, Dumbbell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import type { WorkoutLogWithDetails } from "@/types/training"

interface OngoingSessionBannerProps {
  session: WorkoutLogWithDetails
  onResume: () => void
}

export function OngoingSessionBanner({ session, onResume }: OngoingSessionBannerProps) {
  const sessionPlan = session.session_plan
  const sessionName = sessionPlan?.name || "Workout Session"
  const exerciseCount = sessionPlan?.session_plan_exercises?.length || 0
  const startTime = session.date_time ? new Date(session.date_time) : null

  return (
    <Card className="border-amber-500/50 bg-amber-500/10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Dumbbell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Workout in Progress
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Ongoing
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sessionName}
                {exerciseCount > 0 && ` • ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
                {startTime && ` • Started ${format(startTime, 'h:mm a')}`}
              </p>
            </div>
          </div>
          <Button onClick={onResume} className="shrink-0">
            <Play className="h-4 w-4 mr-2" />
            Resume Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
