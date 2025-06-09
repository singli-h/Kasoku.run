"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Link } from "lucide-react"
import type { SectionActiveInstance } from "@/types/exercise-planner"

interface SectionHeaderProps {
  section: SectionActiveInstance
  isExpanded: boolean
  selectedExercisesCount: number
  onToggleExpansion: () => void
  onDeleteSection: () => void
  onAddExercise: () => void
  onCreateSuperset: () => void
  dragHandleProps: any
}

export function SectionHeader({
  section,
  isExpanded,
  selectedExercisesCount,
  onToggleExpansion,
  onDeleteSection,
  onAddExercise,
  onCreateSuperset,
  dragHandleProps,
}: SectionHeaderProps) {
  const getSectionIcon = (typeId: string) => {
    switch (typeId) {
      case "sprint":
        return "🏃"
      case "gym":
        return "🏋️"
      case "warmup":
        return "🔥"
      case "plyometric":
        return "⚡"
      case "isometric":
        return "💪"
      case "circuit":
        return "🔄"
      case "drill":
        return "🎯"
      default:
        return "📋"
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="cursor-grab active:cursor-grabbing p-1" {...dragHandleProps}>
          <GripVertical className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onToggleExpansion} className="p-1">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-lg">{getSectionIcon(section.type_id)}</span>
          <h3 className="font-semibold text-lg">{section.name}</h3>
          <Badge variant="outline" className="text-xs">
            {section.type_id}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAddExercise} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCreateSuperset}
          disabled={selectedExercisesCount < 2}
          className="flex items-center gap-1"
        >
          <Link className="h-4 w-4" />
          Create Superset
          {selectedExercisesCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedExercisesCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteSection}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
