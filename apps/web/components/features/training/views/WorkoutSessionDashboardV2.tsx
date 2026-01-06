"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUnsavedChanges } from "@/lib/hooks/useUnsavedChanges"

// Import workout feature context and hooks
import {
  ExerciseProvider,
  useExerciseContext,
  useWorkoutSession,
  type WorkoutExercise
} from "../../workout/index"

// Import training types and views
import type { TrainingExercise, TrainingSet } from "../types"
import { WorkoutView } from "./WorkoutView"
import { legacyToTrainingExercises, type LegacyWorkoutExercise } from "../adapters/workout-adapter"

// Import AI change detection hook for ghost row display
import { useAIExerciseChanges } from "@/components/features/ai-assistant/hooks"

// Import types
import type {
  WorkoutLogWithDetails,
  SessionPlanWithDetails,
  WorkoutLogSet
} from "@/types/training"

interface WorkoutSessionDashboardV2Props {
  presetGroup: SessionPlanWithDetails
  existingSession?: WorkoutLogWithDetails
  className?: string
}

export function WorkoutSessionDashboardV2({
  presetGroup,
  existingSession,
  className
}: WorkoutSessionDashboardV2Props) {
  return (
    <ExerciseProvider sessionId={(existingSession as any)?.id}>
      <WorkoutSessionContentV2
        presetGroup={presetGroup}
        existingSession={existingSession}
        className={className}
      />
    </ExerciseProvider>
  )
}

function WorkoutSessionContentV2({
  presetGroup,
  existingSession,
  className
}: WorkoutSessionDashboardV2Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { exercises, setExercises, updateExercise, toggleSetComplete, forceSave, hasPendingChanges, saveStatus } = useExerciseContext()

  // Track expanded exercises
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set())

  // T018: Warn users when leaving with unsaved changes
  useUnsavedChanges({
    hasUnsavedChanges: hasPendingChanges(),
    onBeforeUnload: () => {}
  })

  // Session management hook
  const {
    sessionStatus,
    startSession,
    completeSession,
    saveSession,
    isLoading
  } = useWorkoutSession(existingSession)

  // Get AI change indicators for exercises (for ghost row display)
  // Uses workout entity types: workout_log_exercise and workout_log_set
  const aiChangesByExercise = useAIExerciseChanges({
    exerciseEntityType: 'workout_log_exercise',
    setEntityType: 'workout_log_set',
  })

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning || sessionStatus !== 'ongoing') return

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, sessionStatus])

  // Auto-start timer when session starts
  useEffect(() => {
    if (sessionStatus === 'ongoing' && !isTimerRunning) {
      setIsTimerRunning(true)
    }
  }, [sessionStatus, isTimerRunning])

  // Populate exercises from preset group/session on mount
  useEffect(() => {
    try {
      // Check if we have existing workout_log_exercises (athlete's actual workout data)
      const existingWorkoutExercises = (existingSession as any)?.workout_log_exercises || []

      if (existingWorkoutExercises.length > 0) {
        // Use existing workout_log_exercises directly - these have the actual completed sets
        const mapped: WorkoutExercise[] = existingWorkoutExercises
          .slice()
          .sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))
          .map((wle: any) => ({
            ...wle,
            // Use nested workout_log_sets from workout_log_exercises
            workout_log_sets: wle.workout_log_sets || [],
            completed: (wle.workout_log_sets || []).every((s: any) => s.completed),
          }))

        setExercises(mapped)

        // Expand first exercise by default
        if (mapped.length > 0) {
          setExpandedIds(new Set([mapped[0].id]))
        }
        return
      }

      // Fallback: Initialize from session plan (for new sessions without workout_log_exercises)
      const basePresets = (presetGroup?.session_plan_exercises
        || existingSession?.session_plan?.session_plan_exercises
        || [])
        .slice()
        .sort((a: any, b: any) => (a.exercise_order || 0) - (b.exercise_order || 0))

      // Try to match workout_log_sets by session_plan_exercise_id (legacy mapping)
      const details: WorkoutLogSet[] = existingSession?.workout_log_sets || []
      const detailsByPresetId = new Map<number, WorkoutLogSet[]>()
      for (const d of details) {
        const pid = (d as any).session_plan_exercise_id as number | undefined
        if (!pid) continue
        const list = detailsByPresetId.get(pid) || []
        list.push(d)
        detailsByPresetId.set(pid, list)
      }

      const mapped: WorkoutExercise[] = basePresets.map((preset: any) => {
        // Get existing workout_log_sets if any
        const existingLogSets = detailsByPresetId.get(preset.id) || []

        // If no log sets exist, initialize from session_plan_sets
        // This ensures the user can input values immediately
        let workoutLogSets: WorkoutLogSet[] = existingLogSets
        if (existingLogSets.length === 0 && preset.session_plan_sets?.length > 0) {
          workoutLogSets = preset.session_plan_sets.map((planSet: any, idx: number) => ({
            // Use negative IDs for new sets (will be created on save)
            id: -(preset.id * 1000 + idx + 1),
            set_index: planSet.set_index ?? idx + 1,
            reps: planSet.reps ?? null,
            weight: planSet.weight ?? null,
            distance: planSet.distance ?? null,
            performing_time: planSet.performing_time ?? null,
            rest_time: planSet.rest_time ?? null,
            rpe: planSet.rpe ?? null,
            completed: false,
            session_plan_exercise_id: preset.id,
          }))
        }

        return {
          ...preset,
          workout_log_sets: workoutLogSets,
          completed: false,
        }
      })

      setExercises(mapped)

      // Expand first exercise by default
      if (mapped.length > 0) {
        setExpandedIds(new Set([mapped[0].id]))
      }
    } catch (err) {
      console.error("Failed to initialize workout exercises", err)
    }
  }, [presetGroup?.session_plan_exercises, existingSession?.session_plan?.session_plan_exercises, existingSession?.workout_log_sets, existingSession, setExercises])

  // Local state for session notes
  const [sessionNotes, setSessionNotes] = useState((existingSession as any)?.notes || "")

  // Convert legacy exercises to TrainingExercises for the view
  const trainingExercises = useMemo(() => {
    return legacyToTrainingExercises(exercises as unknown as LegacyWorkoutExercise[], expandedIds)
  }, [exercises, expandedIds])

  // Handle toggle expand
  const handleToggleExpand = useCallback((exerciseId: number | string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }, [])

  // Handle complete set
  const handleCompleteSet = useCallback((exerciseId: number | string, setId: number | string) => {
    // Use toggleSetComplete from context - it handles both state update and auto-save
    if (typeof exerciseId === 'string' && typeof setId === 'string') {
      toggleSetComplete(exerciseId, setId)
    } else {
      console.warn('[WorkoutSessionDashboardV2] Cannot complete set - invalid IDs', { exerciseId, setId })
    }
  }, [toggleSetComplete])

  // Handle complete all sets for an exercise (FR-051: Circle toggle)
  const handleCompleteAllSets = useCallback((exerciseId: number | string) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const allCompleted = exercise.workout_log_sets.every(s => s.completed)
    const newCompleted = !allCompleted

    // Update all sets to the new completion state
    const updatedSets = exercise.workout_log_sets.map(set => ({
      ...set,
      completed: newCompleted
    }))

    updateExercise(exerciseId as string, { workout_log_sets: updatedSets })
  }, [exercises, updateExercise])

  // Handle update set
  const handleUpdateSet = useCallback((
    exerciseId: number | string,
    setId: number | string,
    field: keyof TrainingSet,
    value: number | string | null
  ) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const setIndex = exercise.workout_log_sets.findIndex(s => s.id === setId)
    if (setIndex === -1) return

    // Map TrainingSet field to WorkoutLogSet field
    const dbField = field === 'performingTime' ? 'performing_time'
      : field === 'restTime' ? 'rest_time'
        : field

    // Update the set in the exercise's workout_log_sets array
    const updatedSets = exercise.workout_log_sets.map((set, idx) =>
      idx === setIndex ? { ...set, [dbField]: value } : set
    )

    updateExercise(exerciseId as string, { workout_log_sets: updatedSets })
  }, [exercises, updateExercise])

  // Handle session start
  const handleStartSession = useCallback(async () => {
    try {
      const result = await startSession()
      if (result.success) {
        setIsTimerRunning(true)
        toast({
          title: "Session Started",
          description: "Your workout session has begun!"
        })
      } else {
        throw result.error || new Error("Failed to start session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      })
    }
  }, [startSession, toast])

  // Handle finish session
  const handleFinishSession = useCallback(async () => {
    try {
      const saveSuccess = await forceSave()
      if (!saveSuccess) {
        toast({
          title: "Save Failed",
          description: "Failed to save exercise data before completing. Please try again.",
          variant: "destructive"
        })
        return
      }

      const result = await completeSession()
      if (result.success) {
        setIsTimerRunning(false)
        toast({
          title: "Session Completed!",
          description: "Great work! Your session has been saved."
        })
      } else {
        throw result.error || new Error("Failed to complete session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive"
      })
    }
  }, [forceSave, completeSession, toast])

  // Handle save session
  const handleSaveSession = useCallback(async () => {
    try {
      const saveSuccess = await forceSave()
      if (!saveSuccess) {
        toast({
          title: "Save Failed",
          description: "Failed to save exercise data. Please try again.",
          variant: "destructive"
        })
        return
      }

      const result = await saveSession()
      if (result.success) {
        toast({
          title: "Session Saved",
          description: "Your progress has been saved"
        })
      } else {
        throw result.error || new Error("Failed to save session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive"
      })
    }
  }, [forceSave, saveSession, toast])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => {
            // Set flag to prevent auto-redirect back to this session
            sessionStorage.setItem('workout-intentional-return', 'true')
            router.push('/workout')
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workouts
        </Button>
      </div>

      {/* Main Workout View - session is started before navigation, so always show workout */}
      <WorkoutView
        title={(presetGroup as any).name || "Workout Session"}
        description={(presetGroup as any).description}
        sessionDate={existingSession?.date_time || (presetGroup as any)?.date}
        exercises={trainingExercises}
        isAthlete={true}
        elapsedSeconds={elapsedSeconds}
        isTimerRunning={isTimerRunning}
        sessionStatus={sessionStatus === 'cancelled' ? 'completed' : sessionStatus}
        saveStatus={saveStatus}
        onToggleTimer={() => setIsTimerRunning(prev => !prev)}
        onToggleExpand={handleToggleExpand}
        onCompleteSet={handleCompleteSet}
        onCompleteAllSets={handleCompleteAllSets}
        onUpdateSet={handleUpdateSet}
        onFinishSession={handleFinishSession}
        onSaveSession={handleSaveSession}
        aiChangesByExercise={aiChangesByExercise}
      />

      {/* Session Notes */}
      <div className="space-y-2 px-4">
        <h3 className="text-sm font-medium">Notes</h3>
        <Textarea
          placeholder="Add notes about your workout session..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          className="min-h-20"
          disabled={sessionStatus === 'completed'}
        />
      </div>
    </div>
  )
}
