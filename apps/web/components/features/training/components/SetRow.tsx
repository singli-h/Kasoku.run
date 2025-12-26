"use client"

import { useCallback } from "react"
import { Bot, Check, GripVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrainingSet } from "../types"
import type { UIDisplayType } from "@/lib/changeset/types"

/** Visible fields computed from exercise type and plan data */
export interface VisibleFields {
  reps: boolean
  weight: boolean
  distance: boolean
  performingTime: boolean
  height: boolean
  power: boolean
  velocity: boolean
  rpe: boolean
  restTime: boolean
  tempo: boolean
  effort: boolean
  resistance: boolean
}

export interface SetRowProps {
  set: TrainingSet
  isAthlete: boolean
  isActive?: boolean
  /** Task 10.1: Pre-computed visible fields from ExerciseCard */
  visibleFields?: VisibleFields
  onComplete?: () => void
  onUpdate?: (field: keyof TrainingSet, value: number | string | null) => void
  onRemove?: () => void
  // Drag-and-drop
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, setId: string | number) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, targetSetId: string | number) => void
  // AI pending change indicators
  /** Whether this set has a pending AI change */
  hasPendingChange?: boolean
  /** The type of AI change for styling */
  aiChangeType?: UIDisplayType | null
}

/**
 * SetRow - Unified set input row component for both athlete and coach views
 *
 * - Athlete view: Tappable set number for completion, inline editable inputs
 * - Coach view: Drag handle for reordering, all fields visible, remove button
 */
// AI change indicator colors for sets
const AI_SET_COLORS: Record<UIDisplayType, string> = {
  swap: 'bg-blue-50/60 border-l-2 border-l-blue-400',
  add: 'bg-green-50/60 border-l-2 border-l-green-400',
  update: 'bg-amber-50/60 border-l-2 border-l-amber-400',
  remove: 'bg-red-50/40 border-l-2 border-l-red-400 opacity-60',
}

export function SetRow({
  set,
  isAthlete,
  isActive,
  visibleFields,
  onComplete,
  onUpdate,
  onRemove,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  // AI indicator props
  hasPendingChange = false,
  aiChangeType,
}: SetRowProps) {
  // Task 10.1: Use pre-computed visible fields from ExerciseCard
  // Fall back to showing reps if no visibleFields provided
  const showReps = visibleFields?.reps ?? true
  const showWeight = visibleFields?.weight ?? false
  const showDistance = visibleFields?.distance ?? false
  const showTime = visibleFields?.performingTime ?? false
  const showHeight = visibleFields?.height ?? false
  const showPower = visibleFields?.power ?? false
  const showVelocity = visibleFields?.velocity ?? false
  const showRPE = visibleFields?.rpe ?? false

  // Shared input styles - larger for better touch targets
  const inputClass = cn(
    "h-8 text-center font-mono text-sm bg-transparent border-0 rounded",
    "focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none",
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    "transition-colors cursor-text"
  )

  // Validation constraints based on database schema
  const validateField = useCallback((field: keyof TrainingSet, value: number): number | null => {
    // All numeric fields must be non-negative
    if (value < 0) return null

    switch (field) {
      case "reps":
        // Integer, non-negative, reasonable max
        return Number.isInteger(value) && value <= 999 ? value : null
      case "weight":
        // Real, up to 2 decimal places, reasonable max (kg)
        return value <= 9999 ? Math.round(value * 100) / 100 : null
      case "distance":
        // Real, non-negative (meters)
        return value <= 99999 ? Math.round(value * 100) / 100 : null
      case "performingTime":
        // Real, non-negative (seconds)
        return value <= 99999 ? Math.round(value * 100) / 100 : null
      case "height":
        // Real, non-negative (cm)
        return value <= 999 ? Math.round(value * 10) / 10 : null
      case "rpe":
        // Integer, 1-10 range
        return Number.isInteger(value) && value >= 1 && value <= 10 ? value : null
      case "power":
        // Real, non-negative (watts)
        return value <= 99999 ? Math.round(value * 10) / 10 : null
      case "velocity":
        // Real, non-negative (m/s)
        return value <= 99 ? Math.round(value * 100) / 100 : null
      default:
        return value
    }
  }, [])

  const handleChange = useCallback((field: keyof TrainingSet, value: string) => {
    if (value === "") {
      onUpdate?.(field, null)
    } else {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        const validatedValue = validateField(field, numValue)
        if (validatedValue !== null) {
          onUpdate?.(field, validatedValue)
        }
      }
    }
  }, [onUpdate, validateField])

  // Athlete view - inline editable inputs with completion toggle
  if (isAthlete) {
    return (
      <div className={cn(
        "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
        // Apply AI styling if there's a pending change, otherwise normal styling
        hasPendingChange && aiChangeType
          ? AI_SET_COLORS[aiChangeType]
          : set.completed ? "bg-green-500/10" : "bg-muted/30"
      )}>
        {/* Set number / completion toggle */}
        <div className="relative shrink-0">
          <button
            onClick={onComplete}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              set.completed
                ? "bg-green-500 text-white"
                : "bg-background border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {set.completed ? <Check className="w-4 h-4" /> : set.setIndex}
          </button>
          {/* AI indicator badge */}
          {hasPendingChange && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white">
              <Bot className="h-2 w-2" />
            </span>
          )}
        </div>

        {/* Inline editable inputs */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {showReps && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={999}
                value={set.reps ?? ""}
                onChange={(e) => handleChange("reps", e.target.value)}
                className={cn(inputClass, "w-8")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">x</span>
            </div>
          )}
          {showWeight && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={9999}
                step={0.5}
                value={set.weight ?? ""}
                onChange={(e) => handleChange("weight", e.target.value)}
                className={cn(inputClass, "w-10")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">kg</span>
            </div>
          )}
          {showDistance && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                value={set.distance ?? ""}
                onChange={(e) => handleChange("distance", e.target.value)}
                className={cn(inputClass, "w-9")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">m</span>
            </div>
          )}
          {showTime && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                step={0.01}
                value={set.performingTime ?? ""}
                onChange={(e) => handleChange("performingTime", e.target.value)}
                className={cn(inputClass, "w-12")}
                placeholder="0.00"
              />
              <span className="text-muted-foreground text-xs">s</span>
            </div>
          )}
          {showHeight && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={999}
                step={0.1}
                value={set.height ?? ""}
                onChange={(e) => handleChange("height", e.target.value)}
                className={cn(inputClass, "w-9")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">cm</span>
            </div>
          )}
          {showPower && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                step={0.1}
                value={set.power ?? ""}
                onChange={(e) => handleChange("power", e.target.value)}
                className={cn(inputClass, "w-12")}
                placeholder="--"
              />
              <span className="text-muted-foreground text-xs">W</span>
            </div>
          )}
          {showVelocity && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99}
                step={0.01}
                value={set.velocity ?? ""}
                onChange={(e) => handleChange("velocity", e.target.value)}
                className={cn(inputClass, "w-12")}
                placeholder="0.00"
              />
              <span className="text-muted-foreground text-xs">m/s</span>
            </div>
          )}
          {showRPE && (
            <div className={cn("px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <span className="text-muted-foreground text-xs">RPE</span>
              <input
                type="number"
                min={1}
                max={10}
                value={set.rpe ?? ""}
                onChange={(e) => handleChange("rpe", e.target.value)}
                className={cn(inputClass, "w-7")}
                placeholder="--"
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Coach view - draggable with type-appropriate fields visible
  // Use visibleFields if provided, otherwise show common fields
  const coachShowReps = visibleFields?.reps ?? true
  const coachShowWeight = visibleFields?.weight ?? true
  const coachShowDistance = visibleFields?.distance ?? false
  const coachShowTime = visibleFields?.performingTime ?? false
  const coachShowHeight = visibleFields?.height ?? false
  const coachShowPower = visibleFields?.power ?? false
  const coachShowVelocity = visibleFields?.velocity ?? false
  const coachShowRPE = visibleFields?.rpe ?? false
  const coachShowRestTime = visibleFields?.restTime ?? true
  const coachShowTempo = visibleFields?.tempo ?? false
  const coachShowEffort = visibleFields?.effort ?? false
  const coachShowResistance = visibleFields?.resistance ?? false

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, set.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(e)
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop?.(e, set.id)}
      className={cn(
        "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
        isDragging
          ? "opacity-50 bg-primary/10 border border-dashed border-primary"
          // Apply AI styling if there's a pending change, otherwise normal styling
          : hasPendingChange && aiChangeType
            ? AI_SET_COLORS[aiChangeType]
            : "bg-muted/30 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
        <div className="relative">
          <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            {set.setIndex}
          </span>
          {/* AI indicator badge */}
          {hasPendingChange && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-white">
              <Bot className="h-2 w-2" />
            </span>
          )}
        </div>
      </div>

      {/* Pill notation inputs - show only type-appropriate fields */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {coachShowReps && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={999}
              value={set.reps ?? ""}
              onChange={(e) => handleChange("reps", e.target.value)}
              className={cn(inputClass, "w-8")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">x</span>
          </div>
        )}
        {coachShowWeight && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={9999}
              step={0.5}
              value={set.weight ?? ""}
              onChange={(e) => handleChange("weight", e.target.value)}
              className={cn(inputClass, "w-10")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">kg</span>
          </div>
        )}
        {coachShowDistance && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={99999}
              value={set.distance ?? ""}
              onChange={(e) => handleChange("distance", e.target.value)}
              className={cn(inputClass, "w-9")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">m</span>
          </div>
        )}
        {coachShowTime && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={99999}
              step={0.01}
              value={set.performingTime ?? ""}
              onChange={(e) => handleChange("performingTime", e.target.value)}
              className={cn(inputClass, "w-12")}
              placeholder="0.00"
            />
            <span className="text-muted-foreground text-xs">s</span>
          </div>
        )}
        {coachShowHeight && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={999}
              step={0.1}
              value={set.height ?? ""}
              onChange={(e) => handleChange("height", e.target.value)}
              className={cn(inputClass, "w-9")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">cm</span>
          </div>
        )}
        {coachShowResistance && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={9999}
              step={0.5}
              value={set.resistance ?? ""}
              onChange={(e) => handleChange("resistance", e.target.value)}
              className={cn(inputClass, "w-10")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">R</span>
          </div>
        )}
        {coachShowPower && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={99999}
              step={0.1}
              value={set.power ?? ""}
              onChange={(e) => handleChange("power", e.target.value)}
              className={cn(inputClass, "w-12")}
              placeholder="--"
            />
            <span className="text-muted-foreground text-xs">W</span>
          </div>
        )}
        {coachShowVelocity && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={99}
              step={0.01}
              value={set.velocity ?? ""}
              onChange={(e) => handleChange("velocity", e.target.value)}
              className={cn(inputClass, "w-12")}
              placeholder="0.00"
            />
            <span className="text-muted-foreground text-xs">m/s</span>
          </div>
        )}
        {coachShowRestTime && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={999}
              value={set.restTime ?? ""}
              onChange={(e) => handleChange("restTime", e.target.value)}
              className={cn(inputClass, "w-9")}
              placeholder="60"
            />
            <span className="text-muted-foreground text-xs">rest</span>
          </div>
        )}
        {coachShowTempo && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="text"
              value={set.tempo ?? ""}
              onChange={(e) => onUpdate?.("tempo", e.target.value || null)}
              className={cn(inputClass, "w-16")}
              placeholder="3-1-2-0"
            />
          </div>
        )}
        {coachShowEffort && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <input
              type="number"
              min={0}
              max={100}
              value={set.effort ?? ""}
              onChange={(e) => handleChange("effort", e.target.value)}
              className={cn(inputClass, "w-9")}
              placeholder="80"
            />
            <span className="text-muted-foreground text-xs">%</span>
          </div>
        )}
        {coachShowRPE && (
          <div className="px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-muted">
            <span className="text-muted-foreground text-xs">RPE</span>
            <input
              type="number"
              min={1}
              max={10}
              value={set.rpe ?? ""}
              onChange={(e) => handleChange("rpe", e.target.value)}
              className={cn(inputClass, "w-7")}
              placeholder="--"
            />
          </div>
        )}
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
