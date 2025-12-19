"use client"

import { RefreshCw, Plus, Minus, ArrowRight, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SessionExercise, ExerciseSet, ChangeType, SessionChange, SetChange } from "./types"

interface ExerciseCardInlineProps {
  exercise: SessionExercise
  change?: SessionChange
  isNew?: boolean  // For newly added exercises
}

const changeConfig: Record<ChangeType, { icon: typeof Plus; label: string; color: string; bgColor: string }> = {
  swap: { icon: RefreshCw, label: 'SWAP', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  add: { icon: Plus, label: 'ADD', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  remove: { icon: Minus, label: 'REMOVE', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  update: { icon: Edit2, label: 'UPDATE', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
}

export function ExerciseCardInline({ exercise, change, isNew }: ExerciseCardInlineProps) {
  const config = change ? changeConfig[change.type] : null
  const Icon = config?.icon

  // Use updated sets if this is an update change, otherwise original
  const displaySets = (change?.type === 'update' && change.updatedSets)
    ? change.updatedSets
    : exercise.sets

  // Determine which columns to show based on data
  const columns = getVisibleColumns(displaySets)

  // Build lookup for set changes
  const setChangesMap = buildSetChangesMap(change?.setChanges)

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden",
        change && config?.bgColor,
        isNew && "border-dashed border-green-400 bg-green-50/50",
        change?.type === 'remove' && "opacity-75"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {exercise.exerciseOrder}
          </span>
          <div>
            <div className="flex items-center gap-2">
              {change?.type === 'swap' ? (
                <>
                  <span className="text-sm font-medium line-through text-muted-foreground">
                    {exercise.name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">
                    {change.newExerciseName}
                  </span>
                </>
              ) : change?.type === 'remove' ? (
                <span className="text-sm font-medium line-through text-muted-foreground">
                  {exercise.name}
                </span>
              ) : (
                <span className="text-sm font-medium">{exercise.name}</span>
              )}
            </div>
            {change && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {change.aiReasoning}
              </p>
            )}
          </div>
        </div>

        {/* Change Badge */}
        {change && Icon && (
          <Badge variant="outline" className={cn("text-xs gap-1", config?.color)}>
            <Icon className="h-3 w-3" />
            {config?.label}
          </Badge>
        )}
        {isNew && (
          <Badge variant="outline" className="text-xs gap-1 text-green-600">
            <Plus className="h-3 w-3" />
            NEW
          </Badge>
        )}
      </div>

      {/* Sets Table - Horizontally scrollable for many columns */}
      <div className="px-3 pb-3 w-full">
        <div className="rounded border bg-background overflow-x-auto max-w-full">
          <table className="text-xs min-w-max">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-10 sticky left-0 bg-muted/50">Set</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-1.5 text-center font-medium text-muted-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displaySets.map((set) => {
                const isRowChanged = set.isChanged
                const rowChanges = setChangesMap.get(set.setIndex) || new Map()

                return (
                  <tr
                    key={set.setIndex}
                    className={cn(
                      "border-b last:border-0",
                      isRowChanged && "bg-amber-50/50"
                    )}
                  >
                    <td className={cn(
                      "px-2 py-1.5 text-muted-foreground sticky left-0",
                      isRowChanged ? "bg-amber-50/50" : "bg-background"
                    )}>{set.setIndex}</td>
                    {columns.map((col) => {
                      const fieldChange = rowChanges.get(col.key)
                      const hasChange = !!fieldChange

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-2 py-1.5 text-center",
                            hasChange && "font-medium"
                          )}
                        >
                          {hasChange ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="line-through text-muted-foreground text-[10px]">
                                {formatRawValue(fieldChange.oldValue, col.key)}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-amber-500" />
                              <span className="text-amber-600">
                                {formatRawValue(fieldChange.newValue, col.key)}
                              </span>
                            </span>
                          ) : (
                            formatValue(set, col.key, col.unit)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// New exercise card for additions
export function NewExerciseCard({ exercise, change }: { exercise: SessionExercise; change: SessionChange }) {
  const columns = getVisibleColumns(exercise.sets)

  return (
    <div className="rounded-lg border-2 border-dashed border-green-400 bg-green-50/30 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{exercise.name}</span>
        </div>
        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
          NEW
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-2">{change.aiReasoning}</p>

      {/* Sets Table - Horizontally scrollable for many columns */}
      <div className="rounded border border-green-200 bg-white overflow-x-auto max-w-full">
        <table className="text-xs min-w-max">
          <thead>
            <tr className="border-b bg-green-50/50">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-10">Set</th>
              {columns.map((col) => (
                <th key={col.key} className="px-2 py-1.5 text-center font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set) => (
              <tr key={set.setIndex} className="border-b last:border-0">
                <td className="px-2 py-1.5 text-muted-foreground">{set.setIndex}</td>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5 text-center">
                    {formatValue(set, col.key, col.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Helper: Get visible columns based on data
function getVisibleColumns(sets: ExerciseSet[]) {
  const columns: { key: keyof ExerciseSet; label: string; unit?: string }[] = []

  // Always show reps
  columns.push({ key: 'reps', label: 'Reps' })

  // Check what data exists
  const hasWeight = sets.some((s) => s.weight !== null)
  const hasPercentage = sets.some((s) => s.percentage !== null)
  const hasPower = sets.some((s) => s.power !== null)
  const hasRest = sets.some((s) => s.restTime !== null && s.restTime > 0)
  const hasRpe = sets.some((s) => s.rpe !== null)
  const hasTempo = sets.some((s) => s.tempo !== null)
  const hasVelocity = sets.some((s) => s.velocity !== null)
  const hasDistance = sets.some((s) => s.distance !== null)
  const hasDuration = sets.some((s) => s.duration !== null)
  const hasHeartRate = sets.some((s) => s.heartRate !== null)
  const hasCalories = sets.some((s) => s.calories !== null)

  if (hasWeight) columns.push({ key: 'weight', label: 'kg' })
  if (hasPercentage) columns.push({ key: 'percentage', label: '%' })
  if (hasPower) columns.push({ key: 'power', label: 'W' })
  if (hasVelocity) columns.push({ key: 'velocity', label: 'm/s' })
  if (hasDuration) columns.push({ key: 'duration', label: 'TUT' })
  if (hasRest) columns.push({ key: 'restTime', label: 'Rest' })
  if (hasRpe) columns.push({ key: 'rpe', label: 'RPE' })
  if (hasTempo) columns.push({ key: 'tempo', label: 'Tempo' })
  if (hasDistance) columns.push({ key: 'distance', label: 'm' })
  if (hasHeartRate) columns.push({ key: 'heartRate', label: 'HR' })
  if (hasCalories) columns.push({ key: 'calories', label: 'kcal' })

  return columns
}

// Helper: Format value with unit
function formatValue(set: ExerciseSet, key: keyof ExerciseSet, unit?: string): string {
  const value = set[key]
  if (value === null || value === undefined) return '-'

  if (key === 'restTime') {
    const seconds = value as number
    if (seconds === 0) return '-'
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`
    return `${seconds}s`
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return String(value)
}

// Helper: Format raw change value
function formatRawValue(value: number | string | null, key: keyof ExerciseSet): string {
  if (value === null || value === undefined) return '-'

  if (key === 'restTime') {
    const seconds = value as number
    if (seconds === 0) return '-'
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m`
    return `${seconds}s`
  }

  return String(value)
}

// Helper: Build map of set changes for quick lookup
// Returns Map<setIndex, Map<field, { oldValue, newValue }>>
function buildSetChangesMap(
  setChanges?: SetChange[]
): Map<number, Map<keyof ExerciseSet, { oldValue: number | string | null; newValue: number | string | null }>> {
  const map = new Map<number, Map<keyof ExerciseSet, { oldValue: number | string | null; newValue: number | string | null }>>()

  if (!setChanges) return map

  for (const change of setChanges) {
    if (!map.has(change.setIndex)) {
      map.set(change.setIndex, new Map())
    }
    map.get(change.setIndex)!.set(change.field, {
      oldValue: change.oldValue,
      newValue: change.newValue,
    })
  }

  return map
}
