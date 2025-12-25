"use client"

import { useState, useCallback } from "react"
import { Check, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrainingExercise, TrainingSet } from "../types"
import { formatShorthand, getCompletedCount } from "../types"
import { SetRow } from "./SetRow"

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
  onUpdateName?: (name: string) => void
  // Set reordering
  onReorderSets?: (fromIndex: number, toIndex: number) => void
  // Exercise drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, exerciseId: string | number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetExerciseId: string | number) => void
}

/**
 * ExerciseCard - Unified exercise card for both athlete and coach views
 *
 * - Athlete view: Tappable to expand, shows progress, completion toggle per set
 * - Coach view: Draggable for reordering, editable name, add/remove sets
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
  onUpdateName,
  onReorderSets,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: ExerciseCardProps) {
  const [draggingSetId, setDraggingSetId] = useState<string | number | null>(null)
  const [dragOverSetId, setDragOverSetId] = useState<string | number | null>(null)

  const completedCount = getCompletedCount(exercise)
  const totalSets = exercise.sets.length
  const isComplete = completedCount === totalSets && totalSets > 0
  const progress = totalSets > 0 ? (completedCount / totalSets) * 100 : 0

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

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
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
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                isComplete
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <Check className="w-3 h-3" /> : completedCount}
            </div>

            <div className="flex-1 min-w-0">
              {isAthlete ? (
                <h3 className="text-sm font-medium truncate">{exercise.name}</h3>
              ) : (
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => onUpdateName?.(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 w-full"
                />
              )}
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
              const hasVBTFields = exercise.sets.some((s) => s.power !== undefined || s.velocity !== undefined)
              const isSetDragging = draggingSetId === set.id
              const isSetDragOver = dragOverSetId === set.id

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
                    hasVBTFields={hasVBTFields}
                    onComplete={() => onCompleteSet(set.id)}
                    onUpdate={(field, value) => onUpdateSet?.(set.id, field, value)}
                    onRemove={() => onRemoveSet?.(set.id)}
                    isDragging={isSetDragging}
                    onDragStart={handleSetDragStart}
                    onDragOver={(e) => handleSetDragOver(e, set.id)}
                    onDragEnd={handleSetDragEnd}
                    onDrop={handleSetDrop}
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
