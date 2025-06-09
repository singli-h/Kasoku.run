"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ExerciseItemFull } from "./exercise-item-full"
import { ChevronDown, ChevronRight, Unlink, Users } from "lucide-react"
import type { ExerciseUIInstance } from "@/types/exercise-planner"

interface SupersetContainerProps {
  supersetId: string
  exercises: ExerciseUIInstance[]
  selectedExercises: string[]
  onDissolveSuperset: () => void
  onDeleteExercise: (exerciseUiId: string) => void
  onToggleExerciseSelection: (exerciseUiId: string) => void
  onSetDetailChange: (exerciseUiId: string, setUiId: string, changes: any) => void
  onAddSet: (exerciseUiId: string) => void
  onRemoveSet: (exerciseUiId: string, setUiId: string) => void
}

export function SupersetContainer({
  supersetId,
  exercises,
  selectedExercises,
  onDissolveSuperset,
  onDeleteExercise,
  onToggleExerciseSelection,
  onSetDetailChange,
  onAddSet,
  onRemoveSet,
}: SupersetContainerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const sortedExercises = [...exercises].sort((a, b) => (a.position_in_superset || 0) - (b.position_in_superset || 0))

  return (
    <Card className="border-2 border-dashed border-purple-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-1">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-purple-800">Superset ({exercises.length} exercises)</h4>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                {exercises.map((e) => e.exercise_name).join(" + ")}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDissolveSuperset}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <Unlink className="h-4 w-4" />
            Dissolve
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 pl-4 border-l-2 border-purple-200">
            {sortedExercises.map((exercise, index) => (
              <div key={exercise.ui_id} className="relative">
                <div className="absolute -left-6 top-4 w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-800">
                  {String.fromCharCode(65 + index)}
                </div>
                <ExerciseItemFull
                  exercise={exercise}
                  isSelected={selectedExercises.includes(exercise.ui_id)}
                  onToggleSelection={() => onToggleExerciseSelection(exercise.ui_id)}
                  onDelete={() => onDeleteExercise(exercise.ui_id)}
                  onSetDetailChange={onSetDetailChange}
                  onAddSet={onAddSet}
                  onRemoveSet={onRemoveSet}
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
