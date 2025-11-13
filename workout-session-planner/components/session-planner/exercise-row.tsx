"use client"

import { GripVertical, ChevronDown, Copy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ExerciseInSession } from "@/types/session"
import { EXERCISE_TYPE_DEFAULTS, ALL_FIELDS } from "@/types/session"

interface ExerciseRowProps {
  exercise: ExerciseInSession
  isSelected: boolean
  isExpanded: boolean
  pageMode: "simple" | "detail"
  supersetIndex?: number
  inSuperset?: boolean
  onToggleSelect: () => void
  onToggleExpand: () => void
  onUpdate: (updates: Partial<ExerciseInSession>) => void
  onDuplicate: () => void
  onRemove: () => void
  dragHandleProps?: any
  validationErrors?: string[]
}

export function ExerciseRow({
  exercise,
  isSelected,
  isExpanded,
  pageMode,
  supersetIndex,
  inSuperset = false,
  onToggleSelect,
  onToggleExpand,
  onUpdate,
  onDuplicate,
  onRemove,
  dragHandleProps,
  validationErrors = [],
}: ExerciseRowProps) {
  const typeFields = EXERCISE_TYPE_DEFAULTS[exercise.type] || []
  const displayFields = pageMode === "detail" ? ALL_FIELDS : typeFields.slice(0, 4)
  const hasErrors = validationErrors.length > 0

  const handleSetFieldChange = (setIndex: number, fieldKey: string, value: string) => {
    const updatedSets = [...exercise.sets]
    const numValue = value === "" ? null : Number(value)
    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [fieldKey]: numValue,
    }
    onUpdate({ sets: updatedSets })
  }

  return (
    <div
      className={cn(
        inSuperset ? "bg-card" : "border rounded-lg bg-card",
        "transition-all",
        isSelected && "ring-2 ring-primary",
        hasErrors && "border-destructive",
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 min-h-[48px] sm:min-h-[56px]">
        <div
          {...dragHandleProps}
          className={cn("cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0", inSuperset && "p-0")}
        >
          <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        </div>

        {/* Checkbox */}
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="shrink-0" />

        <Badge variant="outline" className="text-xs sm:text-sm w-7 sm:w-9 justify-center shrink-0 px-1 font-semibold">
          {supersetIndex !== undefined ? supersetIndex : exercise.order}
        </Badge>

        {/* Exercise Name - Centered and Bigger */}
        <div className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-2">
          <span className="font-semibold text-sm sm:text-base md:text-lg truncate block text-center sm:text-left">
            {exercise.name}
          </span>
          {hasErrors && (
            <div className="flex items-center gap-1 text-destructive shrink-0" title={validationErrors.join(", ")}>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
        </div>

        {/* Type Badge */}
        <Badge variant="outline" className="text-xs shrink-0 hidden sm:flex">
          {exercise.type}
        </Badge>

        {pageMode === "simple" && (
          <div className="hidden lg:flex items-center gap-2">
            {typeFields.slice(0, 4).map((field) => (
              <div key={field.key} className="flex items-center gap-1">
                <Input
                  type="number"
                  value={exercise.sets[0]?.[field.key] ?? ""}
                  onChange={(e) => handleSetFieldChange(0, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 w-16 text-xs text-center"
                />
                {field.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-7 w-7 sm:h-8 sm:w-8 p-0">
            <ChevronDown className={cn("h-4 w-4 sm:h-5 sm:w-5 transition-transform", isExpanded && "rotate-180")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDuplicate} className="h-7 w-7 sm:h-8 sm:w-8 p-0 hidden sm:flex">
            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <ul className="text-xs text-destructive space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {isExpanded && (
        <div className="border-t p-3 sm:p-3 space-y-2 sm:space-y-3 bg-muted/30">
          {/* Sets Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sets</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSet: any = { setIndex: exercise.sets.length }
                  displayFields.forEach((f) => {
                    newSet[f.key] = null
                  })
                  onUpdate({ sets: [...exercise.sets, newSet] })
                }}
                className="h-7 text-xs"
              >
                Add Set
              </Button>
            </div>

            {/* Mobile: Card Layout with Snap Scroll */}
            <div className="md:hidden">
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 -mx-2 px-2 scrollbar-thin">
                {exercise.sets.map((set, index) => (
                  <div
                    key={index}
                    className="snap-start shrink-0 w-[85vw] max-w-[320px] border rounded-lg bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs font-bold">
                        Set {index + 1}
                      </Badge>
                    </div>

                    {/* 2-3 Row Grid Layout */}
                    <div className="grid grid-cols-2 gap-2">
                      {displayFields.slice(0, 6).map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-xs text-muted-foreground block">
                            {field.label}
                            {field.unit && <span className="ml-1">({field.unit})</span>}
                          </label>
                          <Input
                            type={field.type}
                            value={set[field.key] ?? ""}
                            onChange={(e) => handleSetFieldChange(index, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-8 text-xs"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Additional fields if in detail mode */}
                    {displayFields.length > 6 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        {displayFields.slice(6).map((field) => (
                          <div key={field.key} className="space-y-1">
                            <label className="text-xs text-muted-foreground block">
                              {field.label}
                              {field.unit && <span className="ml-1">({field.unit})</span>}
                            </label>
                            <Input
                              type={field.type}
                              value={set[field.key] ?? ""}
                              onChange={(e) => handleSetFieldChange(index, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="h-8 text-xs"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {exercise.sets.length > 1 && (
                <p className="text-xs text-muted-foreground text-center mt-1">Swipe to see more sets →</p>
              )}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left w-12 sticky left-0 bg-muted z-10">Set</th>
                    {displayFields.map((field) => (
                      <th key={field.key} className="p-2 text-center whitespace-nowrap">
                        {field.label}
                        {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 font-medium sticky left-0 bg-card z-10">{index + 1}</td>
                      {displayFields.map((field) => (
                        <td key={field.key} className="p-2">
                          <Input
                            type={field.type}
                            value={set[field.key] ?? ""}
                            onChange={(e) => handleSetFieldChange(index, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="h-7 text-xs text-center min-w-[60px]"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 block">Notes</label>
            <Input
              value={exercise.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Add notes..."
              className="h-7 sm:h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
