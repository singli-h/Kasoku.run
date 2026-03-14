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
import { useToast } from "@/hooks/use-toast"
import { useExerciseContext } from "../../index"
import type { WorkoutExercise } from "../../index"
import type { WorkoutLogSet } from "@/types/training"
import { SetRow, type VisibleFields } from "@/components/features/training/components/SetRow"
import { getVisibleFields } from "@/components/features/training/utils/field-visibility"
import type { TrainingSet } from "@/components/features/training/types"
import { isFreeelapMetadata, type FreeelapMetadata } from "@/types/freelap"
import type { SetMetadata } from "@/components/features/training/types/set-metadata"
import { findPR } from "../../hooks/use-exercise-prs"
import {
  PRInputSheet,
  getSprintPRMode,
  SPRINT_AUTO_PR_NAMES,
} from "./pr-input-sheet"
import { ExerciseTypeId } from "../../utils/exercise-grouping"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

interface ExerciseCardProps {
  exercise: WorkoutExercise
  className?: string
  isSuperset?: boolean
  /** All PRs for this exercise (multiple distances for sprints) */
  prs?: PersonalBest[]
  /** Callback to save a PR (supports distance for sprints) */
  onSavePR?: (exerciseId: number, value: number, unitId: number, distance?: number | null) => Promise<boolean>
}

/**
 * Map from camelCase TrainingSet field names to snake_case WorkoutLogSet field names
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
    // Convert effort from DB (0-1) to UI (0-100)
    effort: logSet.effort != null ? logSet.effort * 100 : null,
    resistanceUnitId: logSet.resistance_unit_id,
    metadata: logSet.metadata as SetMetadata | null,
    completed: logSet.completed ?? false,
  }
}

export function ExerciseCard({ exercise, className, isSuperset = false, prs, onSavePR }: ExerciseCardProps) {
  const { showVideo, updateExercise, toggleSetComplete } = useExerciseContext()
  const { toast } = useToast()

  const [expandedFreeelapIds, setExpandedFreeelapIds] = useState<Set<string | number>>(new Set())
  const [prSheetOpen, setPrSheetOpen] = useState(false)

  const toggleFreeelapExpand = useCallback((setId: string | number) => {
    setExpandedFreeelapIds(prev => {
      const next = new Set(prev)
      if (next.has(setId)) next.delete(setId)
      else next.add(setId)
      return next
    })
  }, [])

  const exerciseTypeId = useMemo(() => {
    const ex = exercise.exercise
    if (!ex) return undefined
    return (ex as any).exercise_type?.id ?? (ex as any).exercise_type_id ?? undefined
  }, [exercise.exercise])

  const exerciseName = exercise.exercise?.name || ""
  const sprintMode = exerciseTypeId === ExerciseTypeId.Sprint ? getSprintPRMode(exerciseName) : null

  // PR supported for Gym (always) and Sprint (only if has a sprint PR mode config)
  const supportsPR = exerciseTypeId === ExerciseTypeId.Gym || (exerciseTypeId === ExerciseTypeId.Sprint && sprintMode != null)

  const numericExerciseId = useMemo(() => {
    const rawId = exercise.exercise?.id ?? (exercise as any).exercise_id
    return typeof rawId === 'string' ? parseInt(rawId, 10) : rawId
  }, [exercise.exercise, (exercise as any).exercise_id])

  // Effort + distance from session plan sets for PR sheet preview
  const setEfforts = useMemo(() => {
    const planSets = exercise.session_plan_sets || []
    return planSets.map((s, i) => ({
      effort: s.effort ?? null,
      distance: s.distance ?? null,
      setIndex: i + 1,
    }))
  }, [exercise.session_plan_sets])

  // Distance-aware effort placeholder calculation
  const getSetPlaceholders = useCallback((setIndex: number): Partial<Record<keyof TrainingSet, string>> | undefined => {
    if (!supportsPR || !prs || prs.length === 0) return undefined

    const planSets = exercise.session_plan_sets || []
    const planSet = planSets[setIndex]
    const effort = planSet?.effort ?? null
    if (!effort || effort <= 0) return undefined

    // session_plan_sets effort is in DB format (0-1), use directly for calculations
    const normalizedEffort = effort

    if (exerciseTypeId === ExerciseTypeId.Gym) {
      const pr = findPR(prs)
      if (!pr?.value) return undefined
      const target = Number(pr.value) * normalizedEffort
      return { weight: target.toFixed(1) }
    }

    if (exerciseTypeId === ExerciseTypeId.Sprint && sprintMode) {
      const setDistance = planSet?.distance ?? null

      if (sprintMode.type === "reference") {
        // Reference PB mode: targetTime = racePB × (setDistance / raceDistance) / effort
        const referencePR = findPR(prs, sprintMode.raceDistance)
        if (!referencePR?.value || !setDistance) return undefined
        const target = Number(referencePR.value) * (setDistance / sprintMode.raceDistance) / normalizedEffort
        return { performingTime: target.toFixed(2) }
      }

      // Direct mode: targetTime = PB_at_distance / effort
      if (setDistance) {
        const pr = findPR(prs, setDistance)
        if (!pr?.value) return undefined
        const target = Number(pr.value) / normalizedEffort
        return { performingTime: target.toFixed(2) }
      }
    }

    return undefined
  }, [supportsPR, prs, exercise.session_plan_sets, exerciseTypeId, sprintMode])

  // PR display text — show primary PR
  const prDisplayText = useMemo(() => {
    if (!prs || prs.length === 0) return null
    if (exerciseTypeId === ExerciseTypeId.Gym) {
      const pr = findPR(prs)
      return pr?.value != null ? `1RM: ${pr.value}kg` : null
    }
    if (exerciseTypeId === ExerciseTypeId.Sprint && sprintMode) {
      if (sprintMode.type === "reference") {
        const pr = findPR(prs, sprintMode.raceDistance)
        return pr?.value != null ? `${sprintMode.raceDistance}m: ${pr.value}s` : null
      }
      // Direct: show count or first PR
      if (prs.length === 1) {
        return `${prs[0].distance ?? ""}m: ${prs[0].value}s`
      }
      return `${prs.length} PBs`
    }
    return null
  }, [prs, exerciseTypeId, sprintMode])

  // Visible fields
  const visibleFields = useMemo((): VisibleFields => {
    const planSets = (exercise.workout_log_sets || []).map(set => ({
      reps: set.reps, weight: set.weight, distance: set.distance,
      performing_time: set.performing_time, rest_time: set.rest_time,
      tempo: set.tempo, rpe: set.rpe, power: set.power,
      velocity: set.velocity, height: set.height, resistance: set.resistance,
      effort: set.effort,
    }))
    const sessionPlanSets = (exercise.session_plan_sets || []).map(set => ({
      reps: set.reps, weight: set.weight, distance: set.distance,
      performing_time: set.performing_time, rest_time: set.rest_time,
      tempo: set.tempo, rpe: set.rpe, power: set.power,
      velocity: set.velocity, height: set.height, resistance: set.resistance,
      effort: set.effort,
    }))
    const allSets = [...planSets, ...sessionPlanSets]
    const visibleFieldKeys = getVisibleFields(exerciseTypeId, allSets, { forCoach: false })
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

  const updateSetData = useCallback((setIndex: number, field: keyof WorkoutLogSet, value: any) => {
    const updatedDetails = [...(exercise.workout_log_sets || [])]
    while (updatedDetails.length <= setIndex) {
      updatedDetails.push({
        id: '', workout_log_id: '', workout_log_exercise_id: '',
        session_plan_exercise_id: '', set_index: updatedDetails.length + 1,
        completed: false, reps: null, weight: null, performing_time: null,
        distance: null, power: null, velocity: null, effort: null,
        height: null, resistance: null, resistance_unit_id: null,
        tempo: null, metadata: null, rpe: null, rest_time: null,
        created_at: null, updated_at: null
      })
    }
    updatedDetails[setIndex] = { ...updatedDetails[setIndex], [field]: value }
    updateExercise(exercise.id, { workout_log_sets: updatedDetails })
  }, [exercise.id, exercise.workout_log_sets, updateExercise])

  const handleSetUpdate = useCallback((setIndex: number, field: keyof TrainingSet, value: number | string | null) => {
    const snakeField = CAMEL_TO_SNAKE_FIELD_MAP[field as string] || field
    updateSetData(setIndex, snakeField as keyof WorkoutLogSet, value)
  }, [updateSetData])

  // Auto-PR tracking
  const autoUpdatedSetsRef = useRef<Set<string | number>>(new Set())

  const checkAutoUpdatePR = useCallback((setIndex: number) => {
    if (!supportsPR || !onSavePR || !numericExerciseId) return
    const detail = exercise.workout_log_sets?.[setIndex]
    if (!detail || detail.completed) return

    const setId = detail.id || `idx-${setIndex}`
    if (autoUpdatedSetsRef.current.has(setId)) return

    const name = exercise.exercise?.name || "Exercise"

    if (exerciseTypeId === ExerciseTypeId.Gym) {
      // Gym: reps === 1 and weight > current PR
      if (detail.reps === 1 && detail.weight != null && detail.weight > 0) {
        const currentPR = findPR(prs)
        if (!currentPR || detail.weight > Number(currentPR.value)) {
          autoUpdatedSetsRef.current.add(setId)
          onSavePR(numericExerciseId!, detail.weight, 3).then(ok => {
            if (ok) toast({ title: `New PR! ${name}: ${detail.weight}kg` })
          })
        }
      }
    } else if (exerciseTypeId === ExerciseTypeId.Sprint && SPRINT_AUTO_PR_NAMES.has(name)) {
      // Sprint (direct PR only): time < PB at that distance
      // Check both set fields and Freelap metadata (Freelap stores time/distance in metadata)
      const meta = detail.metadata as Record<string, unknown> | null
      const time = detail.performing_time ?? (meta?.time as number | undefined)
      const setDistance = detail.distance ?? (meta?.distance as number | undefined)
      if (time != null && time > 0 && setDistance != null && setDistance > 0) {
        const currentPR = findPR(prs, setDistance)
        if (!currentPR || time < Number(currentPR.value)) {
          autoUpdatedSetsRef.current.add(setId)
          onSavePR(numericExerciseId!, time, 5, setDistance).then(ok => {
            if (ok) toast({ title: `New PB! ${name} ${setDistance}m: ${time}s` })
          })
        }
      }
    }
  }, [supportsPR, onSavePR, exercise.workout_log_sets, exercise.exercise?.name, prs, exerciseTypeId, numericExerciseId])

  const handleSetComplete = useCallback((setIndex: number) => {
    const detail = exercise.workout_log_sets?.[setIndex]
    if (!detail?.completed) {
      checkAutoUpdatePR(setIndex)
    }
    if (!detail?.id) {
      updateSetData(setIndex, 'completed', !detail?.completed)
      return
    }
    toggleSetComplete(exercise.id, detail.id)
  }, [exercise.id, exercise.workout_log_sets, toggleSetComplete, updateSetData, checkAutoUpdatePR])

  const handleMetadataChange = useCallback((setIndex: number, metadata: FreeelapMetadata) => {
    updateSetData(setIndex, 'metadata', metadata)
  }, [updateSetData])

  const toggleExerciseCompletion = useCallback(() => {
    updateExercise(exercise.id, { completed: !exercise.completed })
  }, [exercise.id, exercise.completed, updateExercise])

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
      <div className="h-px bg-border/40" />

      {/* Header */}
      <div className="py-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h4 className={cn(
              "font-semibold text-base truncate",
              exercise.completed ? "text-green-700 dark:text-green-400 line-through" : "text-high-contrast"
            )}>
              {exerciseName || "Unknown Exercise"}
            </h4>

            {prDisplayText && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Trophy className="h-2.5 w-2.5" />
                {prDisplayText}
              </span>
            )}

            {exercise.completed && (
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500 text-white">
                <Check className="h-2.5 w-2.5" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {supportsPR && onSavePR && !exercise.completed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPrSheetOpen(true)}
                aria-label={`Set PR for ${exerciseName}`}
              >
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </Button>
            )}

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

      {/* Sets */}
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
                hasFreeelapData={!!hasFreeelapData}
                isFreeelapExpanded={isFreeelapExpanded}
                onToggleFreeelapExpand={hasFreeelapData ? () => toggleFreeelapExpand(trainingSet.id) : undefined}
                onMetadataChange={hasFreeelapData ? (metadata) => handleMetadataChange(index, metadata) : undefined}
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

      {/* Video Embed */}
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
          exerciseName={exerciseName || "Unknown Exercise"}
          exerciseTypeId={exerciseTypeId!}
          exerciseId={numericExerciseId}
          existingPRs={prs || []}
          setEfforts={setEfforts}
          onSave={onSavePR}
        />
      )}
    </div>
  )
}
