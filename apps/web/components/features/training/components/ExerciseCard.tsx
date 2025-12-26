"use client"

import { useState, useCallback, useMemo } from "react"
import { Bot, Check, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrainingExercise, TrainingSet } from "../types"
import { formatShorthand, getCompletedCount } from "../types"
import { SetRow, type VisibleFields } from "./SetRow"
import { getVisibleFields } from "../utils/field-visibility"
import type { UIDisplayType } from "@/lib/changeset/types"

export interface ExerciseCardProps {
  exercise: TrainingExercise
  isAthlete: boolean
  showSupersetBar?: boolean
  supersetLabel?: string
  onToggleExpand: () => void
  onCompleteSet: (setId: string | number) => void
  onCompleteAllSets?: () => void
  onUpdateSet?: (setId: string | number, field: keyof TrainingSet, value: number | string | null) => void
  onAddSet?: () => void
  onRemoveSet?: (setId: string | number) => void
  onRemoveExercise?: () => void
  // Set reordering
  onReorderSets?: (fromIndex: number, toIndex: number) => void
  // Exercise drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, exerciseId: string | number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetExerciseId: string | number) => void
  // AI pending change indicators
  /** Whether this exercise has a pending AI change */
  hasPendingChange?: boolean
  /** The type of AI change for styling */
  aiChangeType?: UIDisplayType | null
  /** Map of set ID to pending change info */
  setAIChanges?: Map<string | number, { changeType: UIDisplayType }>
  /** Count of sets with pending AI changes */
  pendingSetCount?: number
}

/**
 * ExerciseCard - Unified exercise card for both athlete and coach views
 *
 * - Athlete view: Tappable to expand, shows progress, completion toggle per set
 * - Coach view: Draggable for reordering, add/remove sets
 */
export function ExerciseCard({
  exercise,
  isAthlete,
  showSupersetBar,
  supersetLabel,
  onToggleExpand,
  onCompleteSet,
  onCompleteAllSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  onReorderSets,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  // AI indicator props
  hasPendingChange = false,
  aiChangeType,
  setAIChanges,
  pendingSetCount = 0,
}: ExerciseCardProps) {
  const [draggingSetId, setDraggingSetId] = useState<string | number | null>(null)
  const [dragOverSetId, setDragOverSetId] = useState<string | number | null>(null)

  // AI change indicator colors
  const AI_BG_COLORS: Record<UIDisplayType, string> = {
    swap: 'bg-blue-50/80 border-blue-200',
    add: 'bg-green-50/80 border-green-200',
    update: 'bg-amber-50/80 border-amber-200',
    remove: 'bg-red-50/60 border-red-200 opacity-60',
  }

  const completedCount = getCompletedCount(exercise)
  const totalSets = exercise.sets.length
  const isComplete = completedCount === totalSets && totalSets > 0
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0

  // Compute visible fields based on exercise type requirements + plan data
  // Uses field-visibility utility to ensure required fields always show
  const visibleFields = useMemo((): VisibleFields => {
    // Get plan sets from exercise (session_plan_sets or workout_log_sets with plan data)
    // For workout exercises, we need to check if sets have plan data
    // For now, we'll use the sets themselves as plan data source
    const planSets = exercise.sets.map(set => ({
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      performing_time: set.performingTime,
      rest_time: set.restTime,
      tempo: set.tempo,
      rpe: set.rpe,
      power: set.power,
      velocity: set.velocity,
      height: set.height,
      resistance: set.resistance,
      effort: set.effort,
    }))

    // Get visible field keys from utility
    // Coach mode shows all configurable fields, athlete mode shows required + optional with values
    const visibleFieldKeys = getVisibleFields(exercise.exerciseTypeId, planSets, { forCoach: !isAthlete })

    // Convert to VisibleFields object
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
  }, [exercise.sets, exercise.exerciseTypeId, isAthlete])

  const handleHeaderClick = useCallback(() => {
    onToggleExpand()
  }, [onToggleExpand])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggleExpand()
    }
  }, [onToggleExpand])

  // Set drag handlers
  const handleSetDragStart = useCallback((e: React.DragEvent, setId: string | number) => {
    setDraggingSetId(setId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(setId))
  }, [])

  const handleSetDragOver = useCallback((e: React.DragEvent, setId: string | number) => {
    e.preventDefault()
    if (setId !== draggingSetId) {
      setDragOverSetId(setId)
    }
  }, [draggingSetId])

  const handleSetDragEnd = useCallback(() => {
    setDraggingSetId(null)
    setDragOverSetId(null)
  }, [])

  const handleSetDrop = useCallback((e: React.DragEvent, targetSetId: string | number) => {
    e.preventDefault()
    if (draggingSetId && draggingSetId !== targetSetId && onReorderSets) {
      const fromIndex = exercise.sets.findIndex((s) => s.id === draggingSetId)
      const toIndex = exercise.sets.findIndex((s) => s.id === targetSetId)
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorderSets(fromIndex, toIndex)
      }
    }
    setDraggingSetId(null)
    setDragOverSetId(null)
  }, [draggingSetId, exercise.sets, onReorderSets])

  return (
    <div
      className={cn(
        "flex transition-opacity",
        isDragging && "opacity-50"
      )}
      draggable={!isAthlete}
      onDragStart={(e) => !isAthlete && onDragStart?.(e, exercise.id)}
      onDragOver={(e) => {
        if (!isAthlete) {
          e.preventDefault()
          onDragOver?.(e)
        }
      }}
      onDragEnd={() => !isAthlete && onDragEnd?.()}
      onDrop={(e) => !isAthlete && onDrop?.(e, exercise.id)}
    >
      {showSupersetBar && (
        <div className="w-1 bg-primary/60 rounded-full mr-3 shrink-0 relative">
          {supersetLabel && (
            <span className="absolute -left-1 top-0 text-[10px] font-bold text-primary bg-background px-0.5">
              {supersetLabel}
            </span>
          )}
        </div>
      )}

      <div className={cn(
        "flex-1 bg-card border rounded-xl overflow-hidden transition-colors",
        hasPendingChange && aiChangeType ? AI_BG_COLORS[aiChangeType] : "border-border"
      )}>
        {/* Header - compact to give more space to sets */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleHeaderClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors",
            !isAthlete ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Drag grip for coach mode - integrated into header */}
            {!isAthlete && (
              <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0 -ml-1" />
            )}
            {/* Exercise circle - shows order number, clickable to toggle all sets (FR-051) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCompleteAllSets?.()
              }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all",
                isAthlete && "hover:scale-110 active:scale-95",
                isComplete
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              title={isComplete ? "Mark all incomplete" : "Mark all complete"}
            >
              {isComplete ? <Check className="w-3.5 h-3.5" /> : exercise.exerciseOrder}
            </button>

            <div className="flex-1 min-w-0">
              {/* Exercise name is always read-only - comes from exercise library */}
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-medium truncate">{exercise.name}</h3>
                {/* AI change indicator */}
                {(hasPendingChange || pendingSetCount > 0) && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shrink-0"
                    title={`${pendingSetCount > 0 ? pendingSetCount : 1} AI change${pendingSetCount !== 1 ? 's' : ''} pending`}
                  >
                    <Bot className="h-2.5 w-2.5" />
                    {pendingSetCount > 0 && <span>{pendingSetCount}</span>}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {formatShorthand(exercise)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAthlete && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {completedCount}/{totalSets}
              </span>
            )}

            {!isAthlete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveExercise?.()
                }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {exercise.expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isAthlete && (
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {exercise.expanded && (
          <div className="p-4 pt-2 space-y-2 border-t border-border">
            {exercise.sets.map((set, index) => {
              // First incomplete set is active
              const firstIncompleteIndex = exercise.sets.findIndex((s) => !s.completed)
              const isActive = isAthlete && index === firstIncompleteIndex
              const isSetDragging = draggingSetId === set.id
              const isSetDragOver = dragOverSetId === set.id
              // Get AI change info for this set
              const setChange = setAIChanges?.get(set.id)

              return (
                <div
                  key={set.id}
                  className={cn(
                    "transition-all",
                    isSetDragOver && "border-t-2 border-primary pt-1"
                  )}
                >
                  <SetRow
                    set={set}
                    isAthlete={isAthlete}
                    isActive={isActive}
                    visibleFields={visibleFields}
                    onComplete={() => onCompleteSet(set.id)}
                    onUpdate={(field, value) => onUpdateSet?.(set.id, field, value)}
                    onRemove={() => onRemoveSet?.(set.id)}
                    isDragging={isSetDragging}
                    onDragStart={handleSetDragStart}
                    onDragOver={(e) => handleSetDragOver(e, set.id)}
                    onDragEnd={handleSetDragEnd}
                    onDrop={handleSetDrop}
                    // AI indicator props
                    hasPendingChange={!!setChange}
                    aiChangeType={setChange?.changeType}
                  />
                </div>
              )
            })}

            {!isAthlete && (
              <button
                onClick={onAddSet}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg hover:border-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Set
              </button>
            )}

            {exercise.notes && (
              <p className="text-sm text-muted-foreground italic mt-2 px-3">
                {exercise.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
