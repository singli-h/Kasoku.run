'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Dumbbell, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { MesocycleWithDetails } from "@/types/training"

interface TrainingBlockCardProps {
  block: MesocycleWithDetails
  isActive?: boolean
  todayWorkout?: {
    id: string
    name: string
    exerciseCount: number
  } | null
}

/**
 * Simplified card for individual users showing their Training Block
 * Reuses the mesocycle data structure but presents it in user-friendly terms
 */
export function TrainingBlockCard({ block, isActive = false, todayWorkout }: TrainingBlockCardProps) {
  // P1 Fix: Handle nullable dates safely with defaults
  const startDate = block.start_date ? new Date(block.start_date) : new Date()
  const endDate = block.end_date ? new Date(block.end_date) : new Date()
  const today = new Date()

  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))

  // Calculate current week
  const currentWeek = Math.ceil(daysElapsed / 7)
  const totalWeeks = Math.ceil(totalDays / 7)

  // Count workouts (completion tracking requires workout_logs, simplified for now)
  const microcycles = block.microcycles || []
  const allWorkouts = microcycles.flatMap(m => m.session_plans || [])
  const totalWorkouts = allWorkouts.length

  // Format date range
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card className={isActive ? "border-primary" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{block.name || "Training Block"}</CardTitle>
              {isActive && <Badge variant="default">Active</Badge>}
              {!isActive && progress >= 100 && <Badge variant="secondary">Completed</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
              <span>Week {currentWeek} of {totalWeeks}</span>
            </div>
          </div>
          <Link href={`/plans/${block.id}`}>
            <Button variant={isActive ? "default" : "outline"} size="sm">
              {isActive ? "Continue" : "View"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Today's Workout (if active) */}
        {isActive && todayWorkout && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Today&apos;s Workout</p>
                <p className="text-sm text-muted-foreground">
                  {todayWorkout.name} &middot; {todayWorkout.exerciseCount} exercises
                </p>
              </div>
              <Link href={`/plans/${block.id}/session/${todayWorkout.id}`}>
                <Button size="sm">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Start
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              <Dumbbell className="h-3.5 w-3.5 inline mr-1" />
              {totalWorkouts} workouts
            </span>
            {block.metadata && (block.metadata as any).focus && (
              <Badge variant="outline" className="text-xs">
                {(block.metadata as any).focus}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
