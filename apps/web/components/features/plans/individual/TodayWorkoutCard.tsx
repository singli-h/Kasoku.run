"use client"

/**
 * TodayWorkoutCard
 *
 * Expandable workout card that shows workout summary when collapsed
 * and embeds WorkoutView for inline editing when expanded.
 *
 * @see INDIVIDUAL_LAUNCH_PLAN.md Section 5.2
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronUp,
  Play,
  Dumbbell,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SessionPlanWithDetails } from "@/types/training"

interface TodayWorkoutCardProps {
  workout: SessionPlanWithDetails
  blockId: number
  isToday?: boolean
  defaultExpanded?: boolean
}

/**
 * Get day label from day number
 */
function getDayLabel(day: number | null): string | null {
  if (day === null) return null
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[day] ?? null
}

export function TodayWorkoutCard({
  workout,
  blockId,
  isToday = false,
  defaultExpanded = false,
}: TodayWorkoutCardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const exerciseCount = workout.session_plan_exercises?.length ?? 0
  const dayLabel = getDayLabel(workout.day)

  // Navigate to full session editor
  const handleOpenFullEditor = () => {
    router.push(`/plans/${blockId}/session/${workout.id}`)
  }

  // Start workout (navigate to workout execution page)
  const handleStartWorkout = () => {
    // TODO: Navigate to workout execution or start session
    router.push(`/plans/${blockId}/session/${workout.id}`)
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isToday && "ring-2 ring-primary/20"
    )}>
      <CardHeader className="pb-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Today badge */}
            {isToday && (
              <Badge variant="default" className="mb-2 text-xs">
                Today
              </Badge>
            )}

            {/* Workout name */}
            <h2 className="text-lg font-semibold truncate">
              {workout.name || "Workout"}
            </h2>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {dayLabel && (
                <Badge variant="secondary" className="text-xs">
                  {dayLabel}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5" />
                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Start button - prominent on mobile */}
            <Button
              size="sm"
              onClick={handleStartWorkout}
              className="gap-1.5"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Start</span>
            </Button>

            {/* Expand/collapse toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0"
            >
              {expanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Expandable content */}
      {expanded && (
        <CardContent className="pt-2">
          {/* Exercise list preview */}
          {exerciseCount > 0 ? (
            <div className="space-y-2">
              {workout.session_plan_exercises?.slice(0, 5).map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium truncate">
                      {exercise.exercise?.name || "Exercise"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {exercise.session_plan_sets?.length ?? 0} sets
                  </span>
                </div>
              ))}

              {/* Show more indicator */}
              {exerciseCount > 5 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{exerciseCount - 5} more exercises
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No exercises added yet
            </p>
          )}

          {/* Open full editor link */}
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleOpenFullEditor}
            >
              <ExternalLink className="h-4 w-4" />
              Open Full Editor
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
