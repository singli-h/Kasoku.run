"use client"

/**
 * PasteProgramPreview
 *
 * Shows parsed exercises in an editable list before insertion.
 * Allows editing exercise names, removing exercises, reordering,
 * and highlights unparseable lines.
 */

import { useState, useCallback } from "react"
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ParsedExercise } from "@/actions/plans/ai-parse-session-action"

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

  const handleInsertAll = useCallback(() => {
    const validExercises = exercises.filter((ex) => !ex.unparseable)
    onInsert(validExercises)
  }, [exercises, onInsert])

  const validCount = exercises.filter((ex) => !ex.unparseable).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {validCount} exercise{validCount !== 1 ? "s" : ""} parsed
          {exercises.length !== validCount &&
            `, ${exercises.length - validCount} unparseable`}
        </p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {exercises.map((exercise, index) => (
          <div
            key={index}
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
                  <Input
                    value={exercise.exerciseName}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="h-7 text-sm font-medium"
                  />
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
        ))}
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
