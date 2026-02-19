/**
 * Exercise Dashboard Main Component
 * Central interface for workout execution with session header, status indicators, 
 * video toggle, and dynamic exercise section rendering
 * 
 * Based on the successful ExerciseDashboard from the original Kasoku workout system
 */

"use client"

import { useMemo } from "react"
import { AlertCircle, Clock, CheckCircle, XCircle, Play, Save, Trophy, Eye, EyeOff, ArrowLeft, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { 
  useExerciseContext, 
  useWorkoutSession, 
  type WorkoutExercise,
  type SessionStatus,
  type ExerciseGroup 
} from "../../index"
import { groupExercisesWithSeparateSupersets } from "../../utils/exercise-grouping"
import { SupersetContainer } from "./superset-container"
import { ExerciseTypeSection } from "./exercise-type-section"
import type { WorkoutLogWithDetails } from "@/types/training"

interface ExerciseDashboardProps {
  session: WorkoutLogWithDetails
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
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    variant: "destructive" as const,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200"
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
  const { toast } = useToast()
  const router = useRouter()
  const {
    sessionStatus,
    isLoading,
    error,
    startSession,
    saveSession,
    completeSession,
    abandonSession
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
      toast({
        title: "Failed to start workout",
        description: result.error.message || "Please try again",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Workout started!",
        description: "Let's crush it 💪"
      })
    }
  }

  const handleSaveSession = async () => {
    const result = await saveSession()
    if (!result.success && result.error) {
      console.error("Failed to save session:", result.error)
      toast({
        title: "Failed to save",
        description: result.error.message || "Please try again",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Progress saved",
        description: "Your workout has been saved"
      })
    }
  }

  const handleCompleteSession = async () => {
    const result = await completeSession()
    if (!result.success && result.error) {
      console.error("Failed to complete session:", result.error)
      toast({
        title: "Failed to complete",
        description: result.error.message || "Please try again",
        variant: "destructive"
      })
    }
    // Don't redirect — the UI will show the completion card via sessionStatus === 'completed'
  }

  const handleAbandonSession = async () => {
    const result = await abandonSession()
    if (!result.success && result.error) {
      console.error("Failed to abandon session:", result.error)
      toast({
        title: "Failed to abandon",
        description: result.error.message || "Please try again",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Session abandoned",
        description: "Your progress has been saved"
      })
      router.push('/workout')
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-muted-foreground"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Abandon
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Abandon this session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your logged sets will be saved, but the session will be marked as cancelled. You can start a new session later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Going</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAbandonSession}>
                    Abandon Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Complete Session
            </Button>
          </div>
        )

      case 'completed':
        return null // Handled by completion card below
      
      default:
        return null
    }
  }

  // Completion card — shown when session finishes
  if (sessionStatus === 'completed') {
    return (
      <div className={cn("max-w-4xl mx-auto p-6 space-y-6", className)}>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Workout Complete!
            </h2>
            <p className="text-green-700 mb-1">
              {session.session_plan?.name || "Session"}
            </p>
            <div className="flex items-center gap-4 text-sm text-green-600 mb-6">
              <span>{completionStats.completed}/{completionStats.total} exercises</span>
              {completionStats.total > 0 && (
                <span>{completionStats.percentage}% completed</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/workout/history')}>
                View History
              </Button>
              <Button onClick={() => router.push('/workout')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workouts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("max-w-4xl mx-auto p-6 space-y-6", className)}>
      {/* Session Header */}
      <Card className={cn("transition-colors", statusConfig.bgColor, statusConfig.borderColor)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {session.session_plan?.name || "Workout Session"}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {session.session_plan?.week && (
                  <span>Week {session.session_plan.week}</span>
                )}
                {session.session_plan?.day && (
                  <span>Day {session.session_plan.day}</span>
                )}
                <span>{(session as any).date_time ? new Date((session as any).date_time).toLocaleDateString() : 'No date'}</span>
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
          {(session as any).description && (
            <p className="text-gray-700 mt-2">{(session as any).description}</p>
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
                <Dumbbell className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">No exercises in this session yet.</p>
                <p className="text-sm mt-1">Add exercises from the session planner to get started.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/workout')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workouts
                </Button>
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