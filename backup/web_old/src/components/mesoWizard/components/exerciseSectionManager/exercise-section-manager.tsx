"use client"

import { useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { SectionItem } from "./section-item"
import { AddSectionControls } from "./add-section-controls"
import { ExerciseSelector } from "./exercise-selector"
import { Card } from "@/components/ui/card"
import type {
  PlannerSessionWithUiId,
  SectionActiveInstance,
  ExerciseUIInstance,
  ExerciseDefinitionBase,
  ReorderPayload,
  ExerciseUISetDetail,
} from "@/types/exercise-planner"

export interface ExerciseSectionManagerProps {
  session: PlannerSessionWithUiId
  sections: SectionActiveInstance[]
  exercises: ExerciseUIInstance[]
  availableExercises: ExerciseDefinitionBase[]
  availableSectionTypes: string[]
  onAddSection: (sectionType: string) => void
  onDeleteSection: (sectionUiId: string) => void
  onAddExercise: (exerciseDefinition: ExerciseDefinitionBase, targetSectionUiId: string) => void
  onDeleteExercise: (exerciseUiId: string) => void
  onCreateSuperset: (sectionUiId: string, exerciseUiIds: string[]) => void
  onDissolveSuperset: (supersetUiId: string) => void
  onReorder: (payload: ReorderPayload) => void
  onSetDetailChange: (exerciseUiId: string, setUiId: string, updatedFields: Partial<ExerciseUISetDetail>) => void
  onAddSet: (exerciseUiId: string) => void
  onRemoveSet: (exerciseUiId: string, setUiId: string) => void
  onDeleteSuperset: (sectionId: string, supersetId: string) => void
  onExerciseFieldChange: (exerciseUiId: string, field: keyof ExerciseUIInstance, value: any) => void
  onReplaceExerciseDefinition: (exerciseUiId: string, newExerciseDefinitionId: string) => void
  onReorderExercises: (payload: ReorderPayload) => void
}

export function ExerciseSectionManager({
  session,
  sections,
  exercises,
  availableExercises,
  availableSectionTypes,
  onAddSection,
  onDeleteSection,
  onAddExercise,
  onDeleteExercise,
  onCreateSuperset,
  onDissolveSuperset,
  onReorder,
  onSetDetailChange,
  onAddSet,
  onRemoveSet,
  onDeleteSuperset,
  onExerciseFieldChange,
  onReplaceExerciseDefinition,
  onReorderExercises,
}: ExerciseSectionManagerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(sections.map((s) => s.ui_id))
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = useState(false)
  const [targetSectionId, setTargetSectionId] = useState<string>("")
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || !overData) return

    // Section reordering
    if (activeData.type === "section" && overData.type === "section") {
      const oldIndex = sections.findIndex((s) => s.ui_id === active.id)
      const newIndex = sections.findIndex((s) => s.ui_id === over.id)

      if (oldIndex !== newIndex) {
        onReorder({
          operationType: "reorder-sections",
          sessionId: session.id,
          newSectionOrder: arrayMove(
            sections.map((s) => s.ui_id),
            oldIndex,
            newIndex,
          ),
        })
      }
      return
    }

    // Exercise reordering
    if (activeData.type === "exercise" && overData.type === "exercise") {
      // Same section and same superset context
      if (activeData.sectionId === overData.sectionId) {
        // Both in same superset
        if (activeData.supersetId && activeData.supersetId === overData.supersetId) {
          const activeExercise = exercises.find((e) => e.ui_id === active.id)
          const overExercise = exercises.find((e) => e.ui_id === over.id)

          if (activeExercise && overExercise) {
            onReorder({
              operationType: "reorder-items-in-superset",
              supersetId: activeData.supersetId,
              itemId: active.id as string,
              newPosition: overExercise.position_in_superset || 0,
            })
          }
        }
        // Both not in superset or different supersets
        else if (!activeData.supersetId && !overData.supersetId) {
          const activeExercise = exercises.find((e) => e.ui_id === active.id)
          const overExercise = exercises.find((e) => e.ui_id === over.id)

          if (activeExercise && overExercise) {
            onReorder({
              operationType: "reorder-items-in-section",
              sectionId: activeData.sectionId,
              itemId: active.id as string,
              newPosition: overExercise.position_in_section,
            })
          }
        }
      }
      // Different sections
      else {
        const overExercise = exercises.find((e) => e.ui_id === over.id)
        onReorder({
          operationType: "move-item-to-section",
          itemId: active.id as string,
          sourceSectionId: activeData.sectionId,
          targetSectionId: overData.sectionId,
          newPosition: overExercise?.position_in_section || 0,
        })
      }
    }
  }

  const toggleSectionExpansion = (sectionUiId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionUiId) ? prev.filter((id) => id !== sectionUiId) : [...prev, sectionUiId],
    )
  }

  const toggleExerciseSelection = (exerciseUiId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseUiId) ? prev.filter((id) => id !== exerciseUiId) : [...prev, exerciseUiId],
    )
  }

  const handleCreateSupersetClick = (sectionUiId: string) => {
    const sectionExercises = selectedExercises.filter((exerciseId) => {
      const exercise = exercises.find((e) => e.ui_id === exerciseId)
      return exercise?.current_section_id === sectionUiId && !exercise.superset_ui_id
    })

    if (sectionExercises.length >= 2) {
      onCreateSuperset(sectionUiId, sectionExercises)
      setSelectedExercises([])
    }
  }

  const openExerciseSelector = (sectionUiId: string) => {
    setTargetSectionId(sectionUiId)
    setExerciseSelectorOpen(true)
  }

  const handleExerciseSelect = (exerciseDefinition: ExerciseDefinitionBase) => {
    onAddExercise(exerciseDefinition, targetSectionId)
    setExerciseSelectorOpen(false)
    setTargetSectionId("")
  }

  // Filter available exercises based on session mode
  const filteredAvailableExercises = availableExercises

  // Get all draggable items (sections + exercises)
  const allDraggableItems = [...sections.map((s) => s.ui_id), ...exercises.map((e) => e.ui_id)]

  return (
    <div className="space-y-4">
      <AddSectionControls availableSectionTypes={availableSectionTypes} onAddSection={onAddSection} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext items={allDraggableItems} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SectionItem
                key={section.ui_id}
                section={section}
                exercises={exercises.filter((e) => e.current_section_id === section.ui_id)}
                isExpanded={expandedSections.includes(section.ui_id)}
                selectedExercises={selectedExercises}
                onToggleExpansion={() => toggleSectionExpansion(section.ui_id)}
                onDeleteSection={() => onDeleteSection(section.ui_id)}
                onAddExercise={() => openExerciseSelector(section.ui_id)}
                onCreateSuperset={() => handleCreateSupersetClick(section.ui_id)}
                onDeleteExercise={onDeleteExercise}
                onDissolveSuperset={onDissolveSuperset}
                onToggleExerciseSelection={toggleExerciseSelection}
                onSetDetailChange={onSetDetailChange}
                onAddSet={onAddSet}
                onRemoveSet={onRemoveSet}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <Card className="p-4 shadow-lg opacity-90">
              <div className="text-sm font-medium">Dragging: {activeId}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ExerciseSelector
        open={exerciseSelectorOpen}
        onOpenChange={setExerciseSelectorOpen}
        exercises={availableExercises}
        onSelect={handleExerciseSelect}
      />
    </div>
  )
}
