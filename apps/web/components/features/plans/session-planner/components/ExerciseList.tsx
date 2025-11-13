"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SessionExercise, SupersetGroup } from "../types"
import { ExerciseRow } from "./ExerciseRow"
import { reorderExercises, groupIntoSupersets } from "../utils"

interface ExerciseListProps {
  exercises: SessionExercise[]
  selection: Set<string>
  expandedRows: Set<string>
  pageMode: "simple" | "detail"
  onToggleSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onUpdateExercise: (id: string, updates: Partial<SessionExercise>) => void
  onDuplicateExercise: (id: string) => void
  onRemoveExercise: (id: string) => void
  onReorder: (exercises: SessionExercise[]) => void
  validationErrors: Map<string, string[]>
}

// Type guard to check if item is a superset group
function isSupersetGroup(item: SessionExercise | SupersetGroup): item is SupersetGroup {
  return "exercises" in item && Array.isArray(item.exercises)
}

// Sortable Exercise Item Wrapper
function SortableExerciseRow({
  exercise,
  isSelected,
  isExpanded,
  pageMode,
  validationErrors,
  onToggleSelect,
  onToggleExpand,
  onUpdateExercise,
  onDuplicateExercise,
  onRemoveExercise,
  _supersetIndex,
  inSuperset,
}: {
  exercise: SessionExercise
  isSelected: boolean
  isExpanded: boolean
  pageMode: "simple" | "detail"
  validationErrors?: string[]
  onToggleSelect: (id: string) => void
  onToggleExpand: (id: string) => void
  onUpdateExercise: (id: string, updates: Partial<SessionExercise>) => void
  onDuplicateExercise: (id: string) => void
  onRemoveExercise: (id: string) => void
  _supersetIndex?: number
  inSuperset?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(inSuperset && "")}>
      <ExerciseRow
        exercise={exercise}
        isSelected={isSelected}
        isExpanded={isExpanded}
        pageMode={pageMode}
        validationErrors={validationErrors}
        onToggleSelect={onToggleSelect}
        onToggleExpand={onToggleExpand}
        onUpdateExercise={onUpdateExercise}
        onDuplicateExercise={onDuplicateExercise}
        onRemoveExercise={onRemoveExercise}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
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
  validationErrors,
}: ExerciseListProps) {
  const [collapsedSupersets, setCollapsedSupersets] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex((ex) => ex.id === active.id)
      const newIndex = exercises.findIndex((ex) => ex.id === over.id)

      const reordered = arrayMove(exercises, oldIndex, newIndex)
      const withUpdatedOrder = reorderExercises(reordered)

      onReorder(withUpdatedOrder)
    }
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

  // Group exercises into supersets for visual rendering
  const grouped = groupIntoSupersets(exercises)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map((ex) => ex.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-w-0">
          {grouped.map((item) => {
            if (isSupersetGroup(item)) {
              // Render superset group
              const isCollapsed = collapsedSupersets.has(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative rounded-lg border-2 border-blue-500/30 bg-card",
                    "shadow-sm hover:shadow-md transition-shadow",
                  )}
                >
                  {/* Superset Header */}
                  <div
                    className="flex items-center gap-2 p-3 bg-blue-500/10 cursor-pointer hover:bg-blue-500/20 transition-colors min-h-[56px] border-b border-blue-500/20"
                    onClick={() => toggleSupersetCollapse(item.id)}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                      Superset
                    </Badge>
                    <span className="text-sm text-muted-foreground">
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

                  {/* Superset Exercises */}
                  {!isCollapsed && (
                    <div className="space-y-0 divide-y divide-border/50 overflow-visible">
                      {item.exercises.map((ex, index) => (
                        <div key={ex.id} className="p-2 bg-muted/10">
                          <SortableExerciseRow
                            exercise={ex}
                            isSelected={selection.has(ex.id)}
                            isExpanded={expandedRows.has(ex.id)}
                            pageMode={pageMode}
                            validationErrors={validationErrors.get(ex.id)}
                            onToggleSelect={onToggleSelect}
                            onToggleExpand={onToggleExpand}
                            onUpdateExercise={onUpdateExercise}
                            onDuplicateExercise={onDuplicateExercise}
                  onRemoveExercise={onRemoveExercise}
                  _supersetIndex={index + 1}
                  inSuperset
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            } else {
              // Render individual exercise
              return (
                <SortableExerciseRow
                  key={item.id}
                  exercise={item}
                  isSelected={selection.has(item.id)}
                  isExpanded={expandedRows.has(item.id)}
                  pageMode={pageMode}
                  validationErrors={validationErrors.get(item.id)}
                  onToggleSelect={onToggleSelect}
                  onToggleExpand={onToggleExpand}
                  onUpdateExercise={onUpdateExercise}
                  onDuplicateExercise={onDuplicateExercise}
                  onRemoveExercise={onRemoveExercise}
                />
              )
            }
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
