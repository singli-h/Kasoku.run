"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
  Trash2,
  Plus,
  Minus,
  Link2,
  AlertCircle,
} from "lucide-react"
import type { SessionExercise, SetParameter } from "../types"
import { getFieldsForExercise } from "../types"
import { addSet, removeSet, updateSet } from "../utils"

interface ExerciseRowProps {
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
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function ExerciseRow({
  exercise,
  isSelected,
  isExpanded,
  pageMode,
  validationErrors = [],
  onToggleSelect,
  onToggleExpand,
  onUpdateExercise,
  onDuplicateExercise,
  onRemoveExercise,
  dragHandleProps,
}: ExerciseRowProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  // Get dynamic fields based on exercise type
  const displayFields = getFieldsForExercise(exercise, pageMode)

  const handleAddSet = () => {
    const updated = addSet(exercise)
    onUpdateExercise(exercise.id, { sets: updated.sets })
  }

  const handleRemoveSet = (setIndex: number) => {
    const updated = removeSet(exercise, setIndex)
    onUpdateExercise(exercise.id, { sets: updated.sets })
  }

  const handleUpdateSet = (setIndex: number, updates: Partial<SetParameter>) => {
    const updated = updateSet(exercise, setIndex, updates)
    onUpdateExercise(exercise.id, { sets: updated.sets })
  }

  const handleSetFieldChange = (setIndex: number, fieldKey: keyof SetParameter, value: string) => {
    const field = displayFields.find((f) => f.key === fieldKey)
    let parsedValue: number | string | null = value === "" ? null : value

    if (field?.type === "number" && value !== "") {
      parsedValue = field.step ? parseFloat(value) : parseInt(value)
      if (isNaN(parsedValue as number)) parsedValue = null
    }

    handleUpdateSet(setIndex, { [fieldKey]: parsedValue } as Partial<SetParameter>)
  }

  const handleNotesChange = (notes: string) => {
    onUpdateExercise(exercise.id, { notes: notes || null })
  }

  const hasErrors = validationErrors.length > 0

  return (
    <div
      className={`border rounded-lg ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : "bg-card"
      } ${hasErrors ? "border-destructive" : ""}`}
    >
      {/* Exercise Header */}
      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {/* Drag Handle */}
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing shrink-0">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Checkbox */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(exercise.id)} />
        </div>

        {/* Clickable header area for expand/collapse */}
        <div
          className="flex-1 flex items-center gap-2 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors min-w-0"
          onClick={() => onToggleExpand(exercise.id)}
        >
          {/* Expand/Collapse Icon */}
          <div className="shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>

          {/* Exercise Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base truncate">{exercise.exercise?.name || "Unknown Exercise"}</span>
              {exercise.superset_id && (
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <Link2 className="h-3 w-3" />
                  Superset
                </Badge>
              )}
              {hasErrors && (
                <div className="flex items-center gap-1 text-destructive shrink-0" title={validationErrors.join(", ")}>
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
              {exercise.sets[0]?.reps && ` × ${exercise.sets[0].reps} reps`}
              {exercise.sets[0]?.weight && ` @ ${exercise.sets[0].weight}kg`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onDuplicateExercise(exercise.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveExercise(exercise.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-3 space-y-3 bg-muted/30">
          {/* Validation Errors */}
          {hasErrors && (
            <div className="bg-destructive/10 border border-destructive rounded p-2 text-sm text-destructive">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sets Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sets</span>
              <Button size="sm" variant="outline" onClick={handleAddSet} className="h-7 text-xs">
                <Plus className="h-4 w-4 mr-1" />
                Add Set
              </Button>
            </div>

            {/* Mobile: Card Layout with Snap Scroll */}
            <div className="md:hidden">
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 scrollbar-thin">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="snap-start shrink-0 w-[85vw] max-w-[320px] border rounded-lg bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs font-bold">
                        Set {setIndex + 1}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSet(setIndex)}
                        disabled={exercise.sets.length <= 1}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* 2-column Grid Layout for Fields */}
                    <div className="grid grid-cols-2 gap-2">
                      {displayFields.slice(0, 6).map((field) => {
                        const value = set[field.key]
                        const displayValue = value === null || value === undefined ? "" : String(value)
                        return (
                          <div key={field.key} className="space-y-1">
                            <label className="text-xs text-muted-foreground block">
                              {field.label}
                              {field.unit && <span className="ml-1">({field.unit})</span>}
                            </label>
                            <Input
                              type={field.type}
                              value={displayValue}
                              onChange={(e) => handleSetFieldChange(setIndex, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="h-8 text-xs"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Additional fields if more than 6 */}
                    {displayFields.length > 6 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        {displayFields.slice(6).map((field) => {
                          const value = set[field.key]
                          const displayValue = value === null || value === undefined ? "" : String(value)
                          return (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs text-muted-foreground block">
                                {field.label}
                                {field.unit && <span className="ml-1">({field.unit})</span>}
                              </label>
                              <Input
                                type={field.type}
                                value={displayValue}
                                onChange={(e) => handleSetFieldChange(setIndex, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="h-8 text-xs"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {exercise.sets.length > 1 && (
                <p className="text-xs text-muted-foreground text-center mt-1">Swipe to see more sets →</p>
              )}
            </div>

            {/* Desktop: Scrollable Table with ScrollArea */}
            <div className="hidden md:block -mx-3">
              <ScrollArea className="w-full border rounded-lg">
                <div className="min-w-full inline-block">
                  <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left w-12 sticky left-0 bg-muted z-10 border-r">
                          Set
                        </th>
                        {displayFields.map((field) => (
                          <th key={field.key} className="p-2 text-center whitespace-nowrap min-w-[80px]">
                            {field.label}
                            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                          </th>
                        ))}
                        <th className="p-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="border-t">
                          <td className="p-2 font-medium sticky left-0 bg-card z-10 border-r">
                            {setIndex + 1}
                          </td>
                          {displayFields.map((field) => {
                            const value = set[field.key]
                            const displayValue = value === null || value === undefined ? "" : String(value)
                            return (
                              <td key={field.key} className="p-2 whitespace-nowrap">
                                <Input
                                  type={field.type}
                                  value={displayValue}
                                  onChange={(e) => handleSetFieldChange(setIndex, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="h-7 text-xs text-center w-[70px]"
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                />
                              </td>
                            )
                          })}
                          <td className="p-2 align-middle">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSet(setIndex)}
                              disabled={exercise.sets.length <= 1}
                              className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={exercise.notes || ""}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes for this exercise..."
                  className="min-h-[60px]"
                />
                <Button size="sm" onClick={() => setIsEditingNotes(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <div
                className="text-sm text-muted-foreground p-2 border rounded cursor-pointer hover:bg-accent"
                onClick={() => setIsEditingNotes(true)}
              >
                {exercise.notes || "Click to add notes..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
