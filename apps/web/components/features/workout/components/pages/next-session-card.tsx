/**
 * Next Session Card
 * Displays the next scheduled workout session with preview and start action
 */

"use client"

import { Play, Calendar, Clock, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { SessionPlanWithDetails, ExerciseTrainingSessionWithDetails } from "@/types/training"

interface NextSessionCardProps {
  session: ExerciseTrainingSessionWithDetails
  onStart: (session: ExerciseTrainingSessionWithDetails) => void
}

export function NextSessionCard({ session, onStart }: NextSessionCardProps) {
  const presetGroup = session.session_plan
  if (!presetGroup) return null

  const exerciseCount = presetGroup.session_plan_exercises?.length || 0
  const sessionDate = session.date_time ? new Date(session.date_time) : presetGroup.date ? new Date(presetGroup.date) : null

  return (
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

          {/* Start Button */}
          <Button 
            onClick={() => onStart(session)} 
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

