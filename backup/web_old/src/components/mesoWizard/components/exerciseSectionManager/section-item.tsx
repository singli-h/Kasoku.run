"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SectionHeader } from "./section-header"
import { ExerciseItemFull } from "./exercise-item-full"
import { SupersetContainer } from "./superset-container"
import { Card, CardContent } from "@/components/ui/card"
import type { SectionActiveInstance, ExerciseUIInstance } from "@/types/exercise-planner"

interface SectionItemProps {
  section: SectionActiveInstance
  exercises: ExerciseUIInstance[]
  isExpanded: boolean
  selectedExercises: string[]
  onToggleExpansion: () => void
  onDeleteSection: () => void
  onAddExercise: () => void
  onCreateSuperset: () => void
  onDeleteExercise: (exerciseUiId: string) => void
  onDissolveSuperset: (supersetUiId: string) => void
  onToggleExerciseSelection: (exerciseUiId: string) => void
  onSetDetailChange: (exerciseUiId: string, setUiId: string, changes: any) => void
  onAddSet: (exerciseUiId: string) => void
  onRemoveSet: (exerciseUiId: string, setUiId: string) => void
}

export function SectionItem({
  section,
  exercises,
  isExpanded,
  selectedExercises,
  onToggleExpansion,
  onDeleteSection,
  onAddExercise,
  onCreateSuperset,
  onDeleteExercise,
  onDissolveSuperset,
  onToggleExerciseSelection,
  onSetDetailChange,
  onAddSet,
  onRemoveSet,
}: SectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.ui_id,
    data: {
      type: "section",
      sectionId: section.ui_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Group exercises by superset
  const supersets = new Map<string, ExerciseUIInstance[]>()
  const standaloneExercises: ExerciseUIInstance[] = []

  exercises.forEach((exercise) => {
    if (exercise.superset_ui_id) {
      if (!supersets.has(exercise.superset_ui_id)) {
        supersets.set(exercise.superset_ui_id, [])
      }
      supersets.get(exercise.superset_ui_id)!.push(exercise)
    } else {
      standaloneExercises.push(exercise)
    }
  })

  // Sort exercises by position
  standaloneExercises.sort((a, b) => a.position_in_section - b.position_in_section)
  supersets.forEach((exercises) => {
    exercises.sort((a, b) => a.position_in_superset! - b.position_in_superset!)
  })

  // Create sorted items for display
  const allItems: Array<{ type: "exercise" | "superset"; data: any; position: number }> = []

  standaloneExercises.forEach((exercise) => {
    allItems.push({
      type: "exercise",
      data: exercise,
      position: exercise.position_in_section,
    })
  })

  supersets.forEach((exercises, supersetId) => {
    const firstExercise = exercises[0]
    allItems.push({
      type: "superset",
      data: { supersetId, exercises },
      position: firstExercise?.position_in_section || 0,
    })
  })

  allItems.sort((a, b) => a.position - b.position)

  const selectedInSection = selectedExercises.filter((id) => {
    const exercise = exercises.find((e) => e.ui_id === id)
    return exercise && !exercise.superset_ui_id
  })

  return (
    <Card ref={setNodeRef} style={style} className={`${isDragging ? "opacity-50" : ""}`}>
      <SectionHeader
        section={section}
        isExpanded={isExpanded}
        selectedExercisesCount={selectedInSection.length}
        onToggleExpansion={onToggleExpansion}
        onDeleteSection={onDeleteSection}
        onAddExercise={onAddExercise}
        onCreateSuperset={onCreateSuperset}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {allItems.map((item, index) =>
              item.type === "exercise" ? (
                <ExerciseItemFull
                  key={item.data.ui_id}
                  exercise={item.data}
                  isSelected={selectedExercises.includes(item.data.ui_id)}
                  onToggleSelection={() => onToggleExerciseSelection(item.data.ui_id)}
                  onDelete={() => onDeleteExercise(item.data.ui_id)}
                  onSetDetailChange={onSetDetailChange}
                  onAddSet={onAddSet}
                  onRemoveSet={onRemoveSet}
                />
              ) : (
                <SupersetContainer
                  key={`superset-${item.data.supersetId}`}
                  supersetId={item.data.supersetId}
                  exercises={item.data.exercises}
                  selectedExercises={selectedExercises}
                  onDissolveSuperset={() => onDissolveSuperset(item.data.supersetId)}
                  onDeleteExercise={onDeleteExercise}
                  onToggleExerciseSelection={onToggleExerciseSelection}
                  onSetDetailChange={onSetDetailChange}
                  onAddSet={onAddSet}
                  onRemoveSet={onRemoveSet}
                />
              ),
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
