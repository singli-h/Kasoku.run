"use client"

/**
 * PasteProgramPreview
 *
 * Shows parsed exercises in an editable list before insertion.
 * Groups exercises by section headers detected during AI parsing.
 * Allows editing exercise names, removing exercises, reordering,
 * and highlights unparseable lines.
 */

import { useState, useCallback, useMemo } from "react"
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ParsedExercise, ExerciseTypeName } from "@/actions/plans/ai-parse-session-action"

const EXERCISE_TYPE_OPTIONS: { value: ExerciseTypeName; label: string }[] = [
  { value: 'gym', label: 'Gym' },
  { value: 'sprint', label: 'Sprint' },
  { value: 'drill', label: 'Drill' },
  { value: 'plyometric', label: 'Plyo' },
  { value: 'warmup', label: 'Warmup' },
  { value: 'isometric', label: 'Isometric' },
  { value: 'circuit', label: 'Circuit' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'other', label: 'Other' },
]

interface PasteProgramPreviewProps {
  exercises: ParsedExercise[]
  onInsert: (exercises: ParsedExercise[]) => void
  onCancel: () => void
}

function formatSetSummary(exercise: ParsedExercise): string {
  const sets = exercise.sets
  if (sets.length === 0) return "No sets"

  const first = sets[0]
  const allSame = sets.every(
    (s) =>
      s.reps === first.reps &&
      s.weight === first.weight &&
      s.distance === first.distance &&
      s.performing_time === first.performing_time
  )

  const parts: string[] = []

  if (allSame && sets.length > 1) {
    parts.push(`${sets.length}x`)
    if (first.reps) parts.push(`${first.reps}`)
    if (first.weight) parts.push(`${first.weight}kg`)
    if (first.distance) parts.push(`${first.distance}m`)
    if (first.performing_time) parts.push(`${first.performing_time}s`)
  } else {
    parts.push(`${sets.length} set${sets.length > 1 ? "s" : ""}`)
    if (first.reps) parts.push(`${first.reps} reps`)
    if (first.weight) parts.push(`${first.weight}kg`)
    if (first.distance) parts.push(`${first.distance}m`)
    if (first.performing_time) parts.push(`${first.performing_time}s`)
  }

  if (first.rest_time) parts.push(`rest ${first.rest_time}s`)
  if (first.rpe) parts.push(`RPE ${first.rpe}`)

  return parts.join(" ")
}

export function PasteProgramPreview({
  exercises: initialExercises,
  onInsert,
  onCancel,
}: PasteProgramPreviewProps) {
  const [exercises, setExercises] = useState<ParsedExercise[]>(initialExercises)

  // Collect unique section names for section header rendering
  const sectionNames = useMemo(() => {
    const seen = new Set<string>()
    const sections: string[] = []
    for (const ex of exercises) {
      if (ex.sectionName && !seen.has(ex.sectionName)) {
        seen.add(ex.sectionName)
        sections.push(ex.sectionName)
      }
    }
    return sections
  }, [exercises])

  const handleRemove = useCallback((index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    setExercises((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }, [])

  const handleMoveDown = useCallback((index: number) => {
    setExercises((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }, [])

  const handleNameChange = useCallback((index: number, name: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, exerciseName: name } : ex))
    )
  }, [])

  const handleTypeChange = useCallback((index: number, exerciseType: ExerciseTypeName) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, exerciseType } : ex))
    )
  }, [])

  const handleInsertAll = useCallback(() => {
    const validExercises = exercises.filter((ex) => !ex.unparseable)
    onInsert(validExercises)
  }, [exercises, onInsert])

  const validCount = exercises.filter((ex) => !ex.unparseable).length

  // Track which section we've already rendered a header for
  let lastRenderedSection: string | null = null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {validCount} exercise{validCount !== 1 ? "s" : ""} parsed
          {exercises.length !== validCount &&
            `, ${exercises.length - validCount} unparseable`}
          {sectionNames.length > 0 &&
            ` in ${sectionNames.length} section${sectionNames.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {exercises.map((exercise, index) => {
          // Render section header if this exercise starts a new section
          const showSectionHeader =
            exercise.sectionName &&
            exercise.sectionName !== lastRenderedSection &&
            !exercise.unparseable
          if (exercise.sectionName && !exercise.unparseable) {
            lastRenderedSection = exercise.sectionName
          }

          return (
            <div key={index}>
              {showSectionHeader && (
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {exercise.sectionName}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border",
                  exercise.unparseable
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                    : "bg-card border-border"
                )}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === exercises.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Exercise content */}
                <div className="flex-1 min-w-0">
                  {exercise.unparseable ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                        Unparseable
                      </Badge>
                      <p className="text-xs text-muted-foreground truncate">
                        {exercise.originalText || exercise.exerciseName}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={exercise.exerciseName}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          className="h-7 text-sm font-medium flex-1"
                        />
                        <Select
                          value={exercise.exerciseType || 'other'}
                          onValueChange={(val) => handleTypeChange(index, val as ExerciseTypeName)}
                        >
                          <SelectTrigger className="h-7 w-[90px] text-[10px] px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXERCISE_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatSetSummary(exercise)}
                        </span>
                        {exercise.targetEventGroups?.map((group) => (
                          <Badge key={group} variant="secondary" className="text-[10px] h-4">
                            {group}
                          </Badge>
                        ))}
                      </div>
                      {exercise.description && (
                        <p className="text-[11px] text-muted-foreground/70 truncate">
                          {exercise.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleInsertAll} disabled={validCount === 0}>
          Insert {validCount} Exercise{validCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  )
}
