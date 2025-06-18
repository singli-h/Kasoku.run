/**
 * Exercise Dashboard Main Component
 * Central interface for workout execution with session header, status indicators, 
 * video toggle, and dynamic exercise section rendering
 * 
 * Based on the successful ExerciseDashboard from the original Kasoku workout system
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { AlertCircle, Clock, CheckCircle, Play, Save, Trophy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { 
  useExerciseContext, 
  useWorkoutSession, 
  type WorkoutExercise,
  type SessionStatus,
  type ExerciseGroup 
} from "../index"
import { groupExercisesWithSeparateSupersets } from "../utils/exercise-grouping"
import { SupersetContainer } from "./superset-container"
import { ExerciseTypeSection } from "./exercise-type-section"
import type { ExerciseTrainingSessionWithDetails } from "@/types/training"

interface ExerciseDashboardProps {
  session: ExerciseTrainingSessionWithDetails
  exercises: WorkoutExercise[]
  className?: string
}

// Status configuration matching the old system's approach
const SESSION_STATUS_CONFIG = {
  assigned: {
    icon: AlertCircle,
    label: "Assigned",
    variant: "secondary" as const,
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200"
  },
  ongoing: {
    icon: Clock,
    label: "In Progress", 
    variant: "default" as const,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200"
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "outline" as const,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200"
  },
  unknown: {
    icon: AlertCircle,
    label: "Unknown",
    variant: "secondary" as const,
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200"
  }
}

export function ExerciseDashboard({ session, exercises, className }: ExerciseDashboardProps) {
  const { showVideo, toggleVideo } = useExerciseContext()
  const {
    sessionStatus,
    isLoading,
    error,
    startSession,
    saveSession,
    completeSession
  } = useWorkoutSession(session)

  // Group exercises using the brilliant algorithm with separate supersets
  const exerciseGroups = useMemo(() => {
    return groupExercisesWithSeparateSupersets(exercises)
  }, [exercises])

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const totalExercises = exercises.length
    const completedExercises = exercises.filter(ex => ex.completed).length
    const completionPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
    
    return {
      total: totalExercises,
      completed: completedExercises,
      percentage: completionPercentage
    }
  }, [exercises])

  // Get status configuration
  const statusConfig = SESSION_STATUS_CONFIG[sessionStatus] || SESSION_STATUS_CONFIG.unknown
  const StatusIcon = statusConfig.icon

  // Action handlers
  const handleStartSession = async () => {
    const result = await startSession()
    if (!result.success && result.error) {
      console.error("Failed to start session:", result.error)
      // TODO: Show toast notification
    }
  }

  const handleSaveSession = async () => {
    const result = await saveSession()
    if (!result.success && result.error) {
      console.error("Failed to save session:", result.error)
      // TODO: Show toast notification
    } else {
      // TODO: Show success toast
    }
  }

  const handleCompleteSession = async () => {
    const result = await completeSession()
    if (!result.success && result.error) {
      console.error("Failed to complete session:", result.error)
      // TODO: Show toast notification
    } else {
      // TODO: Show success toast and possibly redirect
    }
  }

  // Render action buttons based on session status
  const renderActionButtons = () => {
    switch (sessionStatus) {
      case 'assigned':
        return (
          <Button 
            onClick={handleStartSession} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        )
      
      case 'ongoing':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSaveSession}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </Button>
            <Button 
              onClick={handleCompleteSession}
              disabled={isLoading || completionStats.percentage < 100}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Complete Session
            </Button>
          </div>
        )
      
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
            <CheckCircle className="h-4 w-4" />
            Session Completed
          </Badge>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={cn("max-w-4xl mx-auto p-6 space-y-6", className)}>
      {/* Session Header */}
      <Card className={cn("transition-colors", statusConfig.bgColor, statusConfig.borderColor)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {session.exercise_preset_group?.name || "Workout Session"}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {session.exercise_preset_group?.week && (
                  <span>Week {session.exercise_preset_group.week}</span>
                )}
                {session.exercise_preset_group?.day && (
                  <span>Day {session.exercise_preset_group.day}</span>
                )}
                <span>{new Date(session.date_time).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <Badge 
                variant={statusConfig.variant}
                className={cn("flex items-center gap-2", statusConfig.textColor)}
              >
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Session Description */}
          {session.description && (
            <p className="text-gray-700 mt-2">{session.description}</p>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {completionStats.completed}/{completionStats.total} exercises ({completionStats.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionStats.percentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {/* Video Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVideo}
              className="flex items-center gap-2"
            >
              {showVideo ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Videos
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Videos
                </>
              )}
            </Button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {renderActionButtons()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{error.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Sections */}
      <div className="space-y-6">
        {exerciseGroups.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No exercises found for this session.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          exerciseGroups.map((group: ExerciseGroup, index: number) => {
            // Handle superset groups separately
            if (group.type === 'superset') {
              return (
                <SupersetContainer
                  key={`superset-${group.id || index}`}
                  exercises={group.exercises}
                  supersetId={group.id}
                />
              )
            }

            // Handle regular exercise type sections
            return (
              <ExerciseTypeSection
                key={`${group.type}-${index}`}
                group={group}
              />
            )
          })
        )}
      </div>
    </div>
  )
} 