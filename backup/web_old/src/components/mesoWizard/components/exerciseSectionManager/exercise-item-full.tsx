"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExerciseDetailFieldsOverlay } from "./exercise-detail-fields-overlay"
import { GripVertical, Trash2, Plus, Minus, Settings } from "lucide-react"
import type { ExerciseUIInstance, ExerciseUISetDetail } from "@/types/exercise-planner"

interface ExerciseItemFullProps {
  exercise: ExerciseUIInstance
  isSelected: boolean
  onToggleSelection: () => void
  onDelete: () => void
  onSetDetailChange: (exerciseUiId: string, setUiId: string, changes: any) => void
  onAddSet: (exerciseUiId: string) => void
  onRemoveSet: (exerciseUiId: string, setUiId: string) => void
}

export function ExerciseItemFull({
  exercise,
  isSelected,
  onToggleSelection,
  onDelete,
  onSetDetailChange,
  onAddSet,
  onRemoveSet,
}: ExerciseItemFullProps) {
  const [detailsOverlayOpen, setDetailsOverlayOpen] = useState(false)
  const [selectedSetId, setSelectedSetId] = useState<string>("")

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.ui_id,
    data: {
      type: "exercise",
      sectionId: exercise.current_section_id,
      supersetId: exercise.superset_ui_id,
      position: exercise.position_in_section,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSetChange = (setId: string, field: string, value: any) => {
    onSetDetailChange(exercise.ui_id, setId, { [field]: value })
  }

  const openDetailsOverlay = (setId: string) => {
    setSelectedSetId(setId)
    setDetailsOverlayOpen(true)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gym":
        return "bg-blue-100 text-blue-800"
      case "sprint":
        return "bg-green-100 text-green-800"
      case "plyometric":
        return "bg-purple-100 text-purple-800"
      case "isometric":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderSetDisplay = (set: ExerciseUISetDetail) => {
    if (exercise.category === "sprint") {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            value={set.reps || ""}
            onChange={(e) => handleSetChange(set.ui_id, "reps", e.target.value)}
            className="w-16 h-8"
            placeholder="Reps"
          />
          <span>Reps</span>
          <Input
            type="number"
            value={set.distance || ""}
            onChange={(e) => handleSetChange(set.ui_id, "distance", e.target.value)}
            className="w-20 h-8"
            placeholder="Distance"
          />
          <span>m @</span>
          <Input
            type="text"
            value={set.effort || ""}
            onChange={(e) => handleSetChange(set.ui_id, "effort", e.target.value)}
            className="w-16 h-8"
            placeholder="90%"
          />
          <Input
            type="number"
            value={set.rest || ""}
            onChange={(e) => handleSetChange(set.ui_id, "rest", e.target.value)}
            className="w-16 h-8"
            placeholder="Rest"
          />
          <span>s Rest</span>
          {(set.power || set.velocity) && (
            <span className="text-xs text-muted-foreground">
              ({set.power && `${set.power}W`}
              {set.power && set.velocity && ", "}
              {set.velocity && `${set.velocity}m/s`})
            </span>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Input
            type="number"
            value={set.reps || ""}
            onChange={(e) => handleSetChange(set.ui_id, "reps", e.target.value)}
            className="w-16 h-8"
            placeholder="Reps"
          />
          <span>Reps</span>
          <Input
            type="text"
            value={set.weight || ""}
            onChange={(e) => handleSetChange(set.ui_id, "weight", e.target.value)}
            className="w-20 h-8"
            placeholder="Weight"
          />
          <span>kg</span>
          <Input
            type="number"
            value={set.rest || ""}
            onChange={(e) => handleSetChange(set.ui_id, "rest", e.target.value)}
            className="w-16 h-8"
            placeholder="Rest"
          />
          <span>s Rest</span>
          {(set.power || set.velocity || set.tempo) && (
            <span className="text-xs text-muted-foreground">
              (
              {[set.power && `${set.power}W`, set.velocity && `${set.velocity}m/s`, set.tempo]
                .filter(Boolean)
                .join(", ")}
              )
            </span>
          )}
        </div>
      )
    }
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? "opacity-50" : ""} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} />

              <Button
                variant="ghost"
                size="sm"
                className="cursor-grab active:cursor-grabbing p-1"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>

              <div>
                <h4 className="font-medium">{exercise.exercise_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getCategoryColor(exercise.category)}>{exercise.category}</Badge>
                  {exercise.superset_ui_id && (
                    <Badge variant="outline" className="text-xs">
                      Superset
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onAddSet(exercise.ui_id)} className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {exercise.set_details.map((set, index) => (
              <div key={set.ui_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-8 h-6 flex items-center justify-center text-xs">
                    {set.set_number}
                  </Badge>
                  {renderSetDisplay(set)}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetailsOverlay(set.ui_id)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  {exercise.set_details.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSet(exercise.ui_id, set.ui_id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ExerciseDetailFieldsOverlay
        open={detailsOverlayOpen}
        onOpenChange={setDetailsOverlayOpen}
        setDetail={exercise.set_details.find((s) => s.ui_id === selectedSetId) || {
          ui_id: '',
          set_number: 0,
          reps: 0,
          weight: 0,
          rest: 60
        }}
        onSave={(changes) => {
          onSetDetailChange(exercise.ui_id, selectedSetId, changes)
          setDetailsOverlayOpen(false)
        }}
      />
    </>
  )
}
