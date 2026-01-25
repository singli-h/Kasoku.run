"use client"

/**
 * WeekWorkoutList
 *
 * Compact list showing all workouts in the current week.
 * Allows quick switching between workouts.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5.2
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SessionPlanWithDetails } from "@/types/training"

interface WeekWorkoutListProps {
  workouts: SessionPlanWithDetails[]
  selectedWorkoutId: string | null
  todayWorkoutId: string | null
  onSelectWorkout: (workoutId: string) => void
}

/**
 * Get day label from day number
 */
function getDayLabel(day: number | null): string {
  if (day === null) return "—"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[day] ?? "—"
}

/**
 * Sort workouts by day of week
 */
function sortByDay(workouts: SessionPlanWithDetails[]): SessionPlanWithDetails[] {
  return [...workouts].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
}

export function WeekWorkoutList({
  workouts,
  selectedWorkoutId,
  todayWorkoutId,
  onSelectWorkout,
}: WeekWorkoutListProps) {
  const sortedWorkouts = sortByDay(workouts)
  const today = new Date().getDay()

  if (workouts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No workouts scheduled
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">This Week</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {sortedWorkouts.map((workout) => {
          const isSelected = workout.id === selectedWorkoutId
          const isToday = workout.id === todayWorkoutId
          const isPast = (workout.day ?? 7) < today
          const exerciseCount = workout.session_plan_exercises?.length ?? 0

          return (
            <button
              key={workout.id}
              onClick={() => onSelectWorkout(workout.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                isSelected
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50",
                isPast && !isSelected && "opacity-60"
              )}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isPast ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className={cn(
                    "h-5 w-5",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>

              {/* Workout info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {workout.name || "Workout"}
                  </span>
                  {isToday && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{getDayLabel(workout.day)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {exerciseCount}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
