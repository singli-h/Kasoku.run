"use client"

import type React from "react"

import { useState } from "react"
import { ExerciseRow } from "./exercise-row"
import { groupIntoSupersets, reorderExercises } from "@/lib/session-utils"
import type { ExerciseInSession, SupersetGroup } from "@/types/session"
import { cn } from "@/lib/utils"
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ExerciseListProps {
  exercises: ExerciseInSession[]
  selection: Set<string>
  expandedRows: Set<string>
  pageMode: "simple" | "detail"
  onToggleSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onUpdateExercise: (id: string, updates: Partial<ExerciseInSession>) => void
  onDuplicateExercise: (id: string) => void
  onRemoveExercise: (id: string) => void
  onReorder: (exercises: ExerciseInSession[]) => void
  validationErrors?: Map<string, string[]>
}

function isSupersetGroup(item: ExerciseInSession | SupersetGroup): item is SupersetGroup {
  return "exercises" in item && Array.isArray(item.exercises)
}

export function ExerciseList({
  exercises,
  selection,
  expandedRows,
  pageMode,
  onToggleSelect,
  onToggleExpand,
  onUpdateExercise,
  onDuplicateExercise,
  onRemoveExercise,
  onReorder,
  validationErrors = new Map(),
}: ExerciseListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [draggedSupersetId, setDraggedSupersetId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [collapsedSupersets, setCollapsedSupersets] = useState<Set<string>>(new Set())

  const grouped = groupIntoSupersets(exercises)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("exerciseId", id)
  }

  const handleSupersetDragStart = (e: React.DragEvent, supersetId: string) => {
    setDraggedSupersetId(supersetId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("supersetId", supersetId)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverId(id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDraggedSupersetId(null)
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    const exerciseId = e.dataTransfer.getData("exerciseId")
    const supersetId = e.dataTransfer.getData("supersetId")

    // Handle superset dragging
    if (supersetId && draggedSupersetId) {
      const supersetExercises = exercises.filter((ex) => ex.supersetId === supersetId)
      const targetIndex = exercises.findIndex((ex) => ex.id === targetId)

      if (targetIndex === -1 || supersetExercises.length === 0) {
        handleDragEnd()
        return
      }

      // Remove all superset exercises
      const newExercises = exercises.filter((ex) => ex.supersetId !== supersetId)

      // Insert them at the target position
      newExercises.splice(targetIndex, 0, ...supersetExercises)

      onReorder(reorderExercises(newExercises))
      handleDragEnd()
      return
    }

    // Handle individual exercise dragging
    if (exerciseId && draggedId && exerciseId !== targetId) {
      const draggedIndex = exercises.findIndex((ex) => ex.id === exerciseId)
      const targetIndex = exercises.findIndex((ex) => ex.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        handleDragEnd()
        return
      }

      const newExercises = [...exercises]
      const [draggedExercise] = newExercises.splice(draggedIndex, 1)
      newExercises.splice(targetIndex, 0, draggedExercise)

      onReorder(reorderExercises(newExercises))
    }

    handleDragEnd()
  }

  const toggleSupersetCollapse = (supersetId: string) => {
    setCollapsedSupersets((prev) => {
      const next = new Set(prev)
      if (next.has(supersetId)) {
        next.delete(supersetId)
      } else {
        next.add(supersetId)
      }
      return next
    })
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {grouped.map((item) => {
        if (isSupersetGroup(item)) {
          const isCollapsed = collapsedSupersets.has(item.id)
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleSupersetDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.exercises[0].id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, item.exercises[0].id)}
              className={cn(
                "relative rounded-lg border bg-card overflow-hidden transition-opacity",
                draggedSupersetId === item.id && "opacity-30",
              )}
            >
              <div
                className="flex items-center gap-2 p-2 sm:p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors min-h-[48px] sm:min-h-[56px]"
                onClick={() => toggleSupersetCollapse(item.id)}
              >
                <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground cursor-grab shrink-0" />
                <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs">
                  Superset
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {item.exercises.length} exercise{item.exercises.length !== 1 ? "s" : ""}
                </span>
                <div className="ml-auto">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="space-y-1 sm:space-y-2">
                  {item.exercises.map((ex, index) => (
                    <div
                      key={ex.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ex.id)}
                      onDragOver={(e) => handleDragOver(e, ex.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, ex.id)}
                      className={cn(
                        "transition-opacity",
                        dragOverId === ex.id && "opacity-50",
                        draggedId === ex.id && "opacity-30",
                      )}
                    >
                      <ExerciseRow
                        exercise={ex}
                        isSelected={selection.has(ex.id)}
                        isExpanded={expandedRows.has(ex.id)}
                        pageMode={pageMode}
                        supersetIndex={index + 1}
                        inSuperset={true}
                        onToggleSelect={() => onToggleSelect(ex.id)}
                        onToggleExpand={() => onToggleExpand(ex.id)}
                        onUpdate={(updates) => onUpdateExercise(ex.id, updates)}
                        onDuplicate={() => onDuplicateExercise(ex.id)}
                        onRemove={() => onRemoveExercise(ex.id)}
                        validationErrors={validationErrors.get(ex.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        } else {
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, item.id)}
              className={cn(
                "transition-opacity",
                dragOverId === item.id && "opacity-50",
                draggedId === item.id && "opacity-30",
              )}
            >
              <ExerciseRow
                exercise={item}
                isSelected={selection.has(item.id)}
                isExpanded={expandedRows.has(item.id)}
                pageMode={pageMode}
                onToggleSelect={() => onToggleSelect(item.id)}
                onToggleExpand={() => onToggleExpand(item.id)}
                onUpdate={(updates) => onUpdateExercise(item.id, updates)}
                onDuplicate={() => onDuplicateExercise(item.id)}
                onRemove={() => onRemoveExercise(item.id)}
                validationErrors={validationErrors.get(item.id)}
              />
            </div>
          )
        }
      })}
    </div>
  )
}
