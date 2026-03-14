/**
 * Exercise Card Component
 * Individual exercise cards with dynamic table layouts, set-by-set tracking,
 * video integration, and completion states
 *
 * Uses the unified Training SetRow component for consistent set rendering
 * across workout, plan, and template views.
 */

"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Check, Video, ExternalLink, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useExerciseContext } from "../../index"
import type { WorkoutExercise } from "../../index"
import type { WorkoutLogSet } from "@/types/training"
import { SetRow, type VisibleFields } from "@/components/features/training/components/SetRow"
import { getVisibleFields } from "@/components/features/training/utils/field-visibility"
import type { TrainingSet } from "@/components/features/training/types"
import { isFreeelapMetadata, type FreeelapMetadata } from "@/types/freelap"
import type { SetMetadata } from "@/components/features/training/types/set-metadata"
import { toast } from "sonner"
import { PRInputSheet } from "./pr-input-sheet"
import { ExerciseTypeId } from "../../utils/exercise-grouping"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

interface ExerciseCardProps {
  exercise: WorkoutExercise
  className?: string
  isSuperset?: boolean
  /** PR for this exercise (from useExercisePRs hook) */
  pr?: PersonalBest | null
  /** Callback to save a PR */
  onSavePR?: (exerciseId: number, value: number, unitId: number) => Promise<boolean>
}

/**
 * Map from camelCase TrainingSet field names to snake_case WorkoutLogSet field names
 * Used to convert Training SetRow onChange callbacks back to the exercise-context format
 */
const CAMEL_TO_SNAKE_FIELD_MAP: Record<string, keyof WorkoutLogSet> = {
  reps: 'reps',
  weight: 'weight',
  distance: 'distance',
  performingTime: 'performing_time',
  restTime: 'rest_time',
  tempo: 'tempo',
  rpe: 'rpe',
  power: 'power',
  velocity: 'velocity',
  height: 'height',
  resistance: 'resistance',
  effort: 'effort',
  completed: 'completed',
  metadata: 'metadata',
}

/**
 * Convert a WorkoutLogSet (snake_case DB row) to TrainingSet (camelCase unified type)
 * for use with the Training SetRow component.
 */
function workoutLogSetToTrainingSet(logSet: WorkoutLogSet, index: number): TrainingSet {
  return {
    id: logSet.id,
    setIndex: logSet.set_index ?? index + 1,
    reps: logSet.reps,
    weight: logSet.weight,
    distance: logSet.distance,
    performingTime: logSet.performing_time,
    restTime: logSet.rest_time,
    tempo: logSet.tempo,
    rpe: logSet.rpe,
    power: logSet.power,
    velocity: logSet.velocity,
    height: logSet.height,
    resistance: logSet.resistance,
    effort: logSet.effort,
    resistanceUnitId: logSet.resistance_unit_id,
    metadata: logSet.metadata as SetMetadata | null,
    completed: logSet.completed ?? false,
  }
}

export function ExerciseCard({ exercise, className, isSuperset = false, pr, onSavePR }: ExerciseCardProps) {
  const { showVideo, updateExercise, toggleSetComplete } = useExerciseContext()

  // Track which sets are expanded for Freelap details (keyed by set ID)
  const [expandedFreeelapIds, setExpandedFreeelapIds] = useState<Set<string | number>>(new Set())
  // PR input sheet state
  const [prSheetOpen, setPrSheetOpen] = useState(false)

  // Toggle Freelap expansion for a set
  const toggleFreeelapExpand = useCallback((setId: string | number) => {
    setExpandedFreeelapIds(prev => {
      const next = new Set(prev)
      if (next.has(setId)) {
        next.delete(setId)
      } else {
        next.add(setId)
      }
      return next
    })
  }, [])

  // Get exercise type ID for field visibility
  const exerciseTypeId = useMemo(() => {
    const ex = exercise.exercise
    if (!ex) return undefined
    return (ex as any).exercise_type?.id ?? (ex as any).exercise_type_id ?? undefined
  }, [exercise.exercise])

  // Whether this exercise type supports PRs (Gym or Sprint only)
  const supportsPR = exerciseTypeId === ExerciseTypeId.Gym || exerciseTypeId === ExerciseTypeId.Sprint

  // Get exercise ID (numeric, from exercises table)
  const numericExerciseId = useMemo(() => {
    const rawId = exercise.exercise?.id ?? (exercise as any).exercise_id
    return typeof rawId === 'string' ? parseInt(rawId, 10) : rawId
  }, [exercise.exercise, (exercise as any).exercise_id])

  // Extract effort values from session_plan_sets for PR preview
  const effortValues = useMemo(() => {
    const planSets = exercise.session_plan_sets || []
    return planSets.map(s => s.effort ?? null)
  }, [exercise.session_plan_sets])

  // Compute effort-based placeholder for a set
  const getSetPlaceholders = useCallback((setIndex: number): Partial<Record<keyof TrainingSet, string>> | undefined => {
    if (!pr?.value || !supportsPR) return undefined

    const planSets = exercise.session_plan_sets || []
    const effort = planSets[setIndex]?.effort ?? null
    if (!effort || effort <= 0) return undefined

    if (exerciseTypeId === ExerciseTypeId.Gym) {
      const target = pr.value * effort
      return { weight: target.toFixed(1) }
    }
    if (exerciseTypeId === ExerciseTypeId.Sprint) {
      const target = pr.value / effort
      return { performingTime: target.toFixed(2) }
    }
    return undefined
  }, [pr, supportsPR, exercise.session_plan_sets, exerciseTypeId])

  // PR display text
  const prDisplayText = pr?.value != null
    ? exerciseTypeId === ExerciseTypeId.Gym
      ? `PR: ${pr.value}kg`
      : exerciseTypeId === ExerciseTypeId.Sprint
        ? `PB: ${pr.value}s`
        : null
    : null

  // Compute visible fields using the unified field-visibility utility
  // forCoach: false = athlete mode (only required + fields with data)
  const visibleFields = useMemo((): VisibleFields => {
    const planSets = (exercise.workout_log_sets || []).map(set => ({
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      performing_time: set.performing_time,
      rest_time: set.rest_time,
      tempo: set.tempo,
      rpe: set.rpe,
      power: set.power,
      velocity: set.velocity,
      height: set.height,
      resistance: set.resistance,
      effort: set.effort,
    }))

    // Also include session_plan_sets data if available (plan values should influence field visibility)
    const sessionPlanSets = (exercise.session_plan_sets || []).map(set => ({
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      performing_time: set.performing_time,
      rest_time: set.rest_time,
      tempo: set.tempo,
      rpe: set.rpe,
      power: set.power,
      velocity: set.velocity,
      height: set.height,
      resistance: set.resistance,
      effort: set.effort,
    }))

    const allSets = [...planSets, ...sessionPlanSets]

    const visibleFieldKeys = getVisibleFields(exerciseTypeId, allSets, {
      forCoach: false
    })

    return {
      reps: visibleFieldKeys.includes('reps'),
      weight: visibleFieldKeys.includes('weight'),
      distance: visibleFieldKeys.includes('distance'),
      performingTime: visibleFieldKeys.includes('performingTime'),
      height: visibleFieldKeys.includes('height'),
      power: visibleFieldKeys.includes('power'),
      velocity: visibleFieldKeys.includes('velocity'),
      rpe: visibleFieldKeys.includes('rpe'),
      restTime: visibleFieldKeys.includes('restTime'),
      tempo: visibleFieldKeys.includes('tempo'),
      effort: visibleFieldKeys.includes('effort'),
      resistance: visibleFieldKeys.includes('resistance'),
    }
  }, [exercise.workout_log_sets, exercise.session_plan_sets, exerciseTypeId])

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const details = exercise.workout_log_sets || []
    const totalSets = (exercise as any).sets || details.length || 1
    const completedSets = details.filter(detail => detail.completed).length

    return {
      total: totalSets,
      completed: completedSets,
      percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
      isComplete: completedSets >= totalSets && totalSets > 0
    }
  }, [exercise.workout_log_sets, (exercise as any).sets])

  // Handle set data updates (accepts snake_case DB field names)
  const updateSetData = useCallback((setIndex: number, field: keyof WorkoutLogSet, value: any) => {
    const updatedDetails = [...(exercise.workout_log_sets || [])]

    // Ensure we have enough detail entries
    while (updatedDetails.length <= setIndex) {
      updatedDetails.push({
        id: '', // Will be set by backend
        workout_log_id: '', // Will be set by backend
        workout_log_exercise_id: '', // Links to workout_log_exercises table
        session_plan_exercise_id: '', // Links to original session plan exercise
        set_index: updatedDetails.length + 1,
        completed: false,
        reps: null,
        weight: null,
        performing_time: null,
        distance: null,
        power: null,
        velocity: null,
        effort: null,
        height: null,
        resistance: null,
        resistance_unit_id: null,
        tempo: null,
        metadata: null,
        rpe: null,
        rest_time: null,
        created_at: null,
        updated_at: null
      })
    }

    // Update the specific field
    updatedDetails[setIndex] = {
      ...updatedDetails[setIndex],
      [field]: value
    }

    // Update exercise with new details
    updateExercise(exercise.id, {
      workout_log_sets: updatedDetails
    })
  }, [exercise.id, exercise.workout_log_sets, updateExercise])

  // Bridge: Training SetRow onUpdate callback (camelCase) -> updateSetData (snake_case)
  const handleSetUpdate = useCallback((setIndex: number, field: keyof TrainingSet, value: number | string | null) => {
    const snakeField = CAMEL_TO_SNAKE_FIELD_MAP[field as string] || field
    updateSetData(setIndex, snakeField as keyof WorkoutLogSet, value)
  }, [updateSetData])

  // Track which sets already triggered a PR auto-update to avoid duplicates
  const autoUpdatedSetsRef = useRef<Set<string | number>>(new Set())

  // Check if a completed set qualifies as a new PR and auto-update
  const checkAutoUpdatePR = useCallback((setIndex: number) => {
    if (!supportsPR || !onSavePR) return
    const detail = exercise.workout_log_sets?.[setIndex]
    if (!detail || detail.completed) return // only check when completing (not un-completing)

    const setId = detail.id || `idx-${setIndex}`
    if (autoUpdatedSetsRef.current.has(setId)) return

    const currentPRValue = pr?.value ?? null
    const exerciseName = exercise.exercise?.name || "Exercise"

    if (exerciseTypeId === ExerciseTypeId.Gym) {
      // Gym: reps === 1 and weight > current PR
      if (detail.reps === 1 && detail.weight != null && detail.weight > 0) {
        if (currentPRValue === null || detail.weight > currentPRValue) {
          autoUpdatedSetsRef.current.add(setId)
          onSavePR(numericExerciseId!, detail.weight, 3).then(ok => {
            if (ok) toast.success(`New PR! ${exerciseName}: ${detail.weight}kg`)
          })
        }
      }
    } else if (exerciseTypeId === ExerciseTypeId.Sprint) {
      // Sprint: time < current PB (lower is better)
      const time = detail.performing_time
      if (time != null && time > 0) {
        if (currentPRValue === null || time < currentPRValue) {
          autoUpdatedSetsRef.current.add(setId)
          onSavePR(numericExerciseId!, time, 5).then(ok => {
            if (ok) toast.success(`New PB! ${exerciseName}: ${time}s`)
          })
        }
      }
    }
  }, [supportsPR, onSavePR, exercise.workout_log_sets, exercise.exercise?.name, pr?.value, exerciseTypeId, numericExerciseId])

  // Handle set completion toggle (by index, for the unified SetRow)
  const handleSetComplete = useCallback((setIndex: number) => {
    const detail = exercise.workout_log_sets?.[setIndex]

    // Check for auto PR update before toggling (only when marking as complete)
    if (!detail?.completed) {
      checkAutoUpdatePR(setIndex)
    }

    if (!detail?.id) {
      // New set without DB ID — toggle via local state update
      updateSetData(setIndex, 'completed', !detail?.completed)
      return
    }

    toggleSetComplete(exercise.id, detail.id)
  }, [exercise.id, exercise.workout_log_sets, toggleSetComplete, updateSetData, checkAutoUpdatePR])

  // Handle Freelap metadata update for a specific set index
  const handleMetadataChange = useCallback((setIndex: number, metadata: FreeelapMetadata) => {
    updateSetData(setIndex, 'metadata', metadata)
  }, [updateSetData])

  // Handle overall exercise completion
  const toggleExerciseCompletion = useCallback(() => {
    updateExercise(exercise.id, { completed: !exercise.completed })
  }, [exercise.id, exercise.completed, updateExercise])

  // Convert workout_log_sets to TrainingSet[] for the unified SetRow component
  // Sort by set_index to ensure correct ordering
  const trainingSets = useMemo((): TrainingSet[] => {
    const details = exercise.workout_log_sets || []
    const sortedDetails = [...details].sort((a, b) => (a.set_index || 0) - (b.set_index || 0))
    return sortedDetails.map((logSet, idx) => workoutLogSetToTrainingSet(logSet, idx))
  }, [exercise.workout_log_sets])

  return (
    <div className={cn(
      "transition-all duration-200",
      exercise.completed && "bg-green-50/50 dark:bg-green-900/10",
      isSuperset && "border-l-2 border-l-primary/60 pl-3",
      className
    )}>
      {/* Thin top divider - lean design */}
      <div className="h-px bg-border/40" />

      {/* Header - edge-to-edge lean design */}
      <div className="py-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Exercise Name */}
            <h4 className={cn(
              "font-semibold text-base truncate",
              exercise.completed ? "text-green-700 dark:text-green-400 line-through" : "text-high-contrast"
            )}>
              {exercise.exercise?.name || "Unknown Exercise"}
            </h4>

            {/* PR Badge - subtle display next to exercise name */}
            {prDisplayText && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Trophy className="h-2.5 w-2.5" />
                {prDisplayText}
              </span>
            )}

            {/* Completion Badge - compact */}
            {exercise.completed && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500 text-white">
                <Check className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          {/* Action Buttons - compact */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* PR Button - only for Gym and Sprint exercises */}
            {supportsPR && onSavePR && !exercise.completed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPrSheetOpen(true)}
                aria-label={`Set PR for ${exercise.exercise?.name}`}
              >
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </Button>
            )}

            {/* Video Button - icon only on mobile */}
            {showVideo && ((exercise.exercise as any)?.demo_url || exercise.exercise?.video_url) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const url = exercise.exercise?.video_url || (exercise.exercise as any)?.demo_url
                  if (url) window.open(url, '_blank')
                }}
              >
                <Video className="h-4 w-4" />
              </Button>
            )}

            {/* Complete Toggle - compact circle */}
            <button
              onClick={toggleExerciseCompletion}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                exercise.completed
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {exercise.completed ? <Check className="h-4 w-4" /> : exercise.exercise_order}
            </button>
          </div>
        </div>

        {/* Progress Bar - thinner */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-muted rounded-full h-1">
            <motion.div
              className={cn(
                "h-1 rounded-full",
                exercise.completed ? "bg-green-500" : "bg-primary"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${completionStatus.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
            {completionStatus.completed}/{completionStatus.total}
          </span>
        </div>
      </div>

      {/* Sets - rendered using the unified Training SetRow component */}
      {trainingSets.length > 0 && (
        <div className="px-0 pb-2 space-y-0">
          {trainingSets.map((trainingSet, index) => {
            const hasFreeelapData = trainingSet.metadata && isFreeelapMetadata(trainingSet.metadata)
            const isFreeelapExpanded = expandedFreeelapIds.has(trainingSet.id)

            return (
              <SetRow
                key={trainingSet.id}
                set={trainingSet}
                isAthlete={true}
                visibleFields={visibleFields}
                onComplete={() => handleSetComplete(index)}
                onUpdate={(field, value) => handleSetUpdate(index, field, value)}
                // Freelap expansion
                hasFreeelapData={!!hasFreeelapData}
                isFreeelapExpanded={isFreeelapExpanded}
                onToggleFreeelapExpand={hasFreeelapData ? () => toggleFreeelapExpand(trainingSet.id) : undefined}
                onMetadataChange={hasFreeelapData ? (metadata) => handleMetadataChange(index, metadata) : undefined}
                // PR effort-based placeholders
                fieldPlaceholders={getSetPlaceholders(index)}
              />
            )
          })}
        </div>
      )}

      {/* Add Set Button */}
      {!exercise.completed && (
        <button
          onClick={() => {
            const nextIndex = trainingSets.length
            updateSetData(nextIndex, 'set_index', nextIndex + 1)
          }}
          className="w-full py-1.5 px-1 text-xs text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
        >
          <span className="text-sm">+</span> Add Set
        </button>
      )}

      {/* Video Embed (if enabled and available) */}
      {showVideo && exercise.exercise?.video_url && (
        <div className="px-2 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const videoUrl = exercise.exercise?.video_url
              if (videoUrl) window.open(videoUrl, '_blank')
            }}
            className="w-full justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Video className="h-4 w-4" />
            <span className="text-xs">Watch Demo</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* PR Input Bottom Sheet */}
      {supportsPR && onSavePR && numericExerciseId && (
        <PRInputSheet
          open={prSheetOpen}
          onOpenChange={setPrSheetOpen}
          exerciseName={exercise.exercise?.name || "Unknown Exercise"}
          exerciseTypeId={exerciseTypeId!}
          exerciseId={numericExerciseId}
          currentPR={pr?.value ?? null}
          effortValues={effortValues}
          onSave={onSavePR}
        />
      )}
    </div>
  )
} 