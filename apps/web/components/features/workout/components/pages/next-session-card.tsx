/**
 * Next Session Card
 * Displays the next scheduled workout session with preview and start action
 */

"use client"

import { useState } from "react"
import { Play, Calendar, Clock, Target, SkipForward } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import type { SessionPlanWithDetails, WorkoutLogWithDetails } from "@/types/training"

interface NextSessionCardProps {
  session: WorkoutLogWithDetails
  onStart: (session: WorkoutLogWithDetails) => void
  onSkip?: (session: WorkoutLogWithDetails) => void
  isLoading?: boolean
  isSkipping?: boolean
}

export function NextSessionCard({ session, onStart, onSkip, isLoading = false, isSkipping = false }: NextSessionCardProps) {
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const presetGroup = session.session_plan
  if (!presetGroup) return null

  // Prefer workout_log_exercises count (filtered for athlete) over session_plan_exercises (unfiltered)
  const exerciseCount = (session as any).workout_log_exercises?.length || presetGroup.session_plan_exercises?.length || 0
  const sessionDate = session.date_time ? new Date(session.date_time) : presetGroup.date ? new Date(presetGroup.date) : null

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{presetGroup.name || "Untitled Workout"}</CardTitle>
              <CardDescription>
                {presetGroup.description || "Your next scheduled workout session"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              <Calendar className="h-3 w-3 mr-1" />
              {sessionDate ? format(sessionDate, "MMM d") : "Scheduled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Session Preview */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}</span>
              </div>
              {sessionDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(sessionDate, "h:mm a")}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => onStart(session)}
                className="flex-1"
                size="lg"
                disabled={isLoading || isSkipping}
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? "Starting..." : "Start Workout"}
              </Button>
              {onSkip && (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setShowSkipDialog(true)}
                  disabled={isLoading || isSkipping}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  {isSkipping ? "Skipping..." : "Skip"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark &ldquo;{presetGroup.name}&rdquo; as skipped. You won&apos;t be able to start it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onSkip?.(session)}
            >
              Skip Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

