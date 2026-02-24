"use client"

import { useCallback, useState, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Bot, Check, GripVertical, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrainingSet } from "../types"
import type { UIDisplayType } from "@/lib/changeset/types"
import { AI_BG_COLORS } from "@/lib/changeset/ui-constants"
import { FreeelapMetricsTable } from "@/components/features/workout/components/exercise/freelap-metrics-table"
import { isFreeelapMetadata, type FreeelapMetadata } from "@/types/freelap"
import type { SetMetadata } from "../types/set-metadata"

// ============================================================================
// T049: Inline Diff Display Component
// ============================================================================

/**
 * InlineDiffValue Component (T049)
 *
 * Renders a field value with inline diff display for AI changes.
 * Shows "old → new" format for low-density changes.
 *
 * @see docs/features/plans/individual/tasks.md T049
 */
interface InlineDiffValueProps {
  oldValue: unknown
  newValue: unknown
  unit: string
  isHighlightMode?: boolean
}

function InlineDiffValue({ oldValue, newValue, unit, isHighlightMode = false }: InlineDiffValueProps) {
  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return '-'
    return `${val}${unit}`
  }

  // T059: Highlight-only mode - just show new value with amber background
  if (isHighlightMode) {
    return (
      <span className="font-medium text-amber-800 dark:text-amber-200">
        {formatValue(newValue)}
      </span>
    )
  }

  // T049: Full inline diff - "old → new"
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="text-muted-foreground line-through text-[10px]">
        {formatValue(oldValue)}
      </span>
      <ArrowRight className="h-2.5 w-2.5 text-amber-500 shrink-0" />
      <span className="font-medium text-amber-800 dark:text-amber-200">
        {formatValue(newValue)}
      </span>
    </span>
  )
}

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

/**
 * Display mode for AI changes (T056, T059)
 * - 'inline': Show full old→new diff for each field
 * - 'highlight': Show only new value with highlight (for high-density changes)
 */
export type AIDiffDisplayMode = 'inline' | 'highlight'

export interface SetRowProps {
  set: TrainingSet
  isAthlete: boolean
  isActive?: boolean
  /** Task 10.1: Pre-computed visible fields from ExerciseCard */
  visibleFields?: VisibleFields
  /**
   * T054: Whether to show advanced fields (RPE, tempo, velocity, effort)
   * When false, these fields are hidden even if visibleFields indicates they should show.
   * This layers ON TOP of visibleFields - both must be true for field to render.
   * @default true
   */
  showAdvancedFields?: boolean
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
  /** For UPDATE: current data for diff display (shows old→new) */
  aiCurrentData?: Record<string, unknown> | null
  /** For UPDATE: proposed data for diff display */
  aiProposedData?: Record<string, unknown> | null
  /**
   * Display mode for AI diffs (T049, T059)
   * - 'inline': Show full old→new diff for each field (low-density)
   * - 'highlight': Show only new value with highlight (high-density)
   * @default 'inline'
   */
  aiDiffDisplayMode?: AIDiffDisplayMode
  // Ghost row mode (for pending CREATE operations)
  /** If true, renders as a read-only ghost row with dashed border */
  isGhostRow?: boolean
  /** Data for ghost row display (from AI proposal) */
  ghostData?: Record<string, unknown> | null
  // Freelap data expansion
  /** Whether this set has Freelap metadata to expand */
  hasFreeelapData?: boolean
  /** Whether the Freelap details are currently expanded */
  isFreeelapExpanded?: boolean
  /** Callback to toggle Freelap expansion */
  onToggleFreeelapExpand?: () => void
  /** Callback when Freelap metadata changes */
  onMetadataChange?: (metadata: FreeelapMetadata) => void
}

/**
 * SetRow - Unified set input row component for both athlete and coach views
 *
 * - Athlete view: Tappable set number for completion, inline editable inputs
 * - Coach view: Drag handle for reordering, all fields visible, remove button
 */

export function SetRow({
  set,
  isAthlete,
  isActive,
  visibleFields,
  showAdvancedFields = true,
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
  aiCurrentData,
  aiProposedData,
  aiDiffDisplayMode = 'inline',
  // Ghost row props
  isGhostRow = false,
  ghostData,
  // Freelap expansion props
  hasFreeelapData = false,
  isFreeelapExpanded = false,
  onToggleFreeelapExpand,
  onMetadataChange,
}: SetRowProps) {
  // Task 10.1: Use pre-computed visible fields from ExerciseCard
  // Fall back to showing reps if no visibleFields provided
  const showReps = visibleFields?.reps ?? true
  const showWeight = visibleFields?.weight ?? false
  const showDistance = visibleFields?.distance ?? false
  const showTime = visibleFields?.performingTime ?? false
  const showHeight = visibleFields?.height ?? false
  const showPower = visibleFields?.power ?? false
  // T054: Advanced fields - only show when both visibleFields and showAdvancedFields are true
  const showVelocity = (visibleFields?.velocity ?? false) && showAdvancedFields
  const showRPE = (visibleFields?.rpe ?? false) && showAdvancedFields
  const showRestTime = visibleFields?.restTime ?? false
  const showTempo = (visibleFields?.tempo ?? false) && showAdvancedFields
  const showEffort = (visibleFields?.effort ?? false) && showAdvancedFields
  const showResistance = visibleFields?.resistance ?? false

  // T055: Calculate if we have many fields visible (for enhanced scroll indicators on mobile)
  const hasAdvancedFieldsVisible = showVelocity || showRPE || showTempo || showEffort

  // Helper to check if a field was changed by AI (for UPDATE operations)
  const isFieldChanged = useCallback((field: string): boolean => {
    if (aiChangeType !== 'update' || !aiProposedData) return false
    const proposedVal = aiProposedData[field]
    const currentVal = aiCurrentData?.[field]
    return proposedVal !== undefined && proposedVal !== currentVal
  }, [aiChangeType, aiProposedData, aiCurrentData])

  // Helper to get display value - use proposed value for UPDATE, current otherwise
  const getDisplayValue = useCallback((field: string, currentValue: unknown): unknown => {
    if (aiChangeType === 'update' && aiProposedData?.[field] !== undefined) {
      return aiProposedData[field]
    }
    return currentValue
  }, [aiChangeType, aiProposedData])

  // Is this a remove operation?
  const isRemove = aiChangeType === 'remove'
  const isUpdate = aiChangeType === 'update'

  // T049: Get old value for inline diff display
  const getOldValue = useCallback((field: string): unknown => {
    if (!aiCurrentData) return undefined
    // Check both snake_case and camelCase
    const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase()
    return aiCurrentData[field] ?? aiCurrentData[snakeField]
  }, [aiCurrentData])

  // T059: Check if we should use highlight-only mode (high-density)
  const useHighlightMode = aiDiffDisplayMode === 'highlight'

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
      case "effort":
        // Percentage (0-100), stored as 0-100 in UI, converted to 0-1 for database
        return value >= 0 && value <= 100 ? Math.round(value * 100) / 100 : null
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

  // Ghost row mode - read-only display for pending CREATE operations
  if (isGhostRow && ghostData) {
    // Extract values from ghost data (snake_case from changeset)
    const gReps = ghostData.reps ?? ghostData.set_count
    const gWeight = ghostData.weight
    const gDistance = ghostData.distance
    const gTime = ghostData.performing_time ?? ghostData.performingTime
    const gHeight = ghostData.height
    const gPower = ghostData.power
    const gVelocity = ghostData.velocity
    const gRpe = ghostData.rpe
    const gRestTime = ghostData.rest_time ?? ghostData.restTime
    const gTempo = ghostData.tempo
    const gEffort = ghostData.effort
    const gResistance = ghostData.resistance

    // Use visibleFields for ghost rows too
    const gShowReps = visibleFields?.reps ?? true
    const gShowWeight = visibleFields?.weight ?? false
    const gShowDistance = visibleFields?.distance ?? false
    const gShowTime = visibleFields?.performingTime ?? false
    const gShowHeight = visibleFields?.height ?? false
    const gShowPower = visibleFields?.power ?? false
    const gShowVelocity = visibleFields?.velocity ?? false
    const gShowRPE = visibleFields?.rpe ?? false
    const gShowRestTime = visibleFields?.restTime ?? true
    const gShowTempo = visibleFields?.tempo ?? false
    const gShowEffort = visibleFields?.effort ?? false
    const gShowResistance = visibleFields?.resistance ?? false

    const pillClass = "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-emerald-100/80 text-emerald-700"

    return (
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
          "border-2 border-dashed border-emerald-400 bg-emerald-50/60",
          "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        )}
      >
        {/* Set number with plus icon (emerald styling indicates new) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-medium text-emerald-700">
            <Plus className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Read-only value pills */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {gShowReps && gReps != null && (
            <div className={pillClass}>
              <span>{String(gReps)}</span>
              <span className="text-emerald-500 text-xs">x</span>
            </div>
          )}
          {gShowWeight && gWeight != null && (
            <div className={pillClass}>
              <span>{String(gWeight)}</span>
              <span className="text-emerald-500 text-xs">kg</span>
            </div>
          )}
          {gShowDistance && gDistance != null && (
            <div className={pillClass}>
              <span>{String(gDistance)}</span>
              <span className="text-emerald-500 text-xs">m</span>
            </div>
          )}
          {gShowTime && gTime != null && (
            <div className={pillClass}>
              <span>{String(gTime)}</span>
              <span className="text-emerald-500 text-xs">s</span>
            </div>
          )}
          {gShowHeight && gHeight != null && (
            <div className={pillClass}>
              <span>{String(gHeight)}</span>
              <span className="text-emerald-500 text-xs">cm</span>
            </div>
          )}
          {gShowResistance && gResistance != null && (
            <div className={pillClass}>
              <span>{String(gResistance)}</span>
              <span className="text-emerald-500 text-xs">R</span>
            </div>
          )}
          {gShowPower && gPower != null && (
            <div className={pillClass}>
              <span>{String(gPower)}</span>
              <span className="text-emerald-500 text-xs">W</span>
            </div>
          )}
          {gShowVelocity && gVelocity != null && (
            <div className={pillClass}>
              <span>{String(gVelocity)}</span>
              <span className="text-emerald-500 text-xs">m/s</span>
            </div>
          )}
          {gShowRestTime && gRestTime != null && (
            <div className={pillClass}>
              <span>{String(gRestTime)}</span>
              <span className="text-emerald-500 text-xs">rest</span>
            </div>
          )}
          {gShowTempo && gTempo != null && (
            <div className={pillClass}>
              <span>{String(gTempo)}</span>
            </div>
          )}
          {gShowEffort && gEffort != null && (
            <div className={pillClass}>
              <span>{String(gEffort)}</span>
              <span className="text-emerald-500 text-xs">%</span>
            </div>
          )}
          {gShowRPE && gRpe != null && (
            <div className={pillClass}>
              <span className="text-emerald-500 text-xs">RPE</span>
              <span>{String(gRpe)}</span>
            </div>
          )}

          {/* Fallback if no fields have values */}
          {!gReps && !gWeight && !gDistance && !gTime && (
            <div className={cn(pillClass, "text-emerald-500/70 italic")}>
              Pending...
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get Freelap metadata if available
  const freelapMetadata = set.metadata && isFreeelapMetadata(set.metadata)
    ? set.metadata as FreeelapMetadata
    : null

  // Athlete view - inline editable inputs with completion toggle on far right
  if (isAthlete) {
    return (
      <Fragment>
        <div className={cn(
          "flex items-center gap-1 py-1.5 px-1 transition-colors min-w-0 w-full",
          // Apply AI styling if there's a pending change, otherwise normal styling
          hasPendingChange && aiChangeType
            ? AI_BG_COLORS[aiChangeType]
            : set.completed ? "bg-green-500/5" : "",
          isFreeelapExpanded && hasFreeelapData && "bg-primary/5 dark:bg-primary/10"
        )}>
          {/* Expand indicator - LEFT of set number, larger icon */}
          <div className="w-5 flex items-center justify-center shrink-0">
            {hasFreeelapData && onToggleFreeelapExpand ? (
              <button
                type="button"
                onClick={onToggleFreeelapExpand}
                className="rounded transition-colors"
                aria-label={isFreeelapExpanded ? "Collapse" : "Expand"}
                aria-expanded={isFreeelapExpanded}
              >
                <span className={cn(
                  "text-base font-medium leading-none",
                  isFreeelapExpanded ? "text-primary" : "text-muted-foreground"
                )}>
                  {isFreeelapExpanded ? "▾" : "▸"}
                </span>
              </button>
            ) : null}
          </div>

          {/* Set number - always aligned */}
          <div className="relative shrink-0">
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
              set.completed ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"
            )}>
              {set.setIndex}
            </span>
            {/* AI indicator badge */}
            {hasPendingChange && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 text-white">
                <Bot className="h-1.5 w-1.5" />
              </span>
            )}
          </div>

        {/* Inline editable inputs - horizontal scroll */}
        {/* T055: Enhanced scroll affordance when advanced fields are visible on mobile */}
        <div className={cn(
          "flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0",
          hasAdvancedFieldsVisible && "scroll-smooth md:overflow-x-visible"
        )}>
          {showReps && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={999}
                value={set.reps ?? ""}
                onChange={(e) => handleChange("reps", e.target.value)}
                aria-label={`Set ${set.setIndex} reps`}
                className={cn(inputClass, "w-8")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">x</span>
            </div>
          )}
          {showWeight && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={9999}
                step={0.5}
                value={set.weight ?? ""}
                onChange={(e) => handleChange("weight", e.target.value)}
                aria-label={`Set ${set.setIndex} weight in kilograms`}
                className={cn(inputClass, "w-10")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">kg</span>
            </div>
          )}
          {showDistance && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                value={set.distance ?? ""}
                onChange={(e) => handleChange("distance", e.target.value)}
                aria-label={`Set ${set.setIndex} distance in meters`}
                className={cn(inputClass, "w-9")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">m</span>
            </div>
          )}
          {showTime && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                step={0.01}
                value={set.performingTime ?? ""}
                onChange={(e) => handleChange("performingTime", e.target.value)}
                aria-label={`Set ${set.setIndex} time in seconds`}
                className={cn(inputClass, "w-12")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">s</span>
            </div>
          )}
          {showVelocity && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99}
                step={0.01}
                value={set.velocity ?? ""}
                onChange={(e) => handleChange("velocity", e.target.value)}
                aria-label={`Set ${set.setIndex} target velocity in meters per second`}
                className={cn(inputClass, "w-12")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">m/s</span>
            </div>
          )}
          {showHeight && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={999}
                step={0.1}
                value={set.height ?? ""}
                onChange={(e) => handleChange("height", e.target.value)}
                aria-label={`Set ${set.setIndex} height in centimeters`}
                className={cn(inputClass, "w-9")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">cm</span>
            </div>
          )}
          {showRestTime && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={999}
                value={set.restTime ?? ""}
                onChange={(e) => handleChange("restTime", e.target.value)}
                aria-label={`Set ${set.setIndex} rest time in seconds`}
                className={cn(inputClass, "w-9")}
                placeholder="60"
              />
              <span className="text-muted-foreground text-xs">rest</span>
            </div>
          )}
          {showRPE && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <span className="text-muted-foreground text-xs">RPE</span>
              <input
                type="number"
                min={1}
                max={10}
                value={set.rpe ?? ""}
                onChange={(e) => handleChange("rpe", e.target.value)}
                aria-label={`Set ${set.setIndex} rate of perceived exertion`}
                className={cn(inputClass, "w-7")}
                placeholder="-"
              />
            </div>
          )}
          {showTempo && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="text"
                value={set.tempo ?? ""}
                onChange={(e) => onUpdate?.("tempo", e.target.value || null)}
                aria-label={`Set ${set.setIndex} tempo (eccentric-bottom-concentric-top)`}
                className={cn(inputClass, "w-16")}
                placeholder="3-1-2-0"
              />
            </div>
          )}
          {showEffort && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={100}
                value={set.effort ?? ""}
                onChange={(e) => handleChange("effort", e.target.value)}
                aria-label={`Set ${set.setIndex} effort percentage`}
                className={cn(inputClass, "w-9")}
                placeholder="80"
              />
              <span className="text-muted-foreground text-xs">%</span>
            </div>
          )}
          {showPower && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={99999}
                step={0.1}
                value={set.power ?? ""}
                onChange={(e) => handleChange("power", e.target.value)}
                aria-label={`Set ${set.setIndex} power in watts`}
                className={cn(inputClass, "w-12")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">W</span>
            </div>
          )}
          {showResistance && (
            <div className={cn("px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0", set.completed ? "bg-green-500/20" : "bg-muted")}>
              <input
                type="number"
                min={0}
                max={9999}
                step={0.5}
                value={set.resistance ?? ""}
                onChange={(e) => handleChange("resistance", e.target.value)}
                aria-label={`Set ${set.setIndex} resistance level`}
                className={cn(inputClass, "w-10")}
                placeholder="-"
              />
              <span className="text-muted-foreground text-xs">R</span>
            </div>
          )}
        </div>

        {/* Completion toggle - moved to far right */}
        <button
          onClick={onComplete}
          aria-label={`Mark set ${set.setIndex} as ${set.completed ? 'incomplete' : 'complete'}`}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 shrink-0 flex-shrink-0 active:scale-90",
            set.completed
              ? "bg-green-500 text-white"
              : "bg-background border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {set.completed ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4 opacity-30" />}
        </button>
        </div>

        {/* Freelap Data Expansion - Lean inline design */}
        <AnimatePresence mode="wait">
          {isFreeelapExpanded && freelapMetadata && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="overflow-hidden"
            >
              {/* Lean inline sub-row - aligned with set content (skip expand col + index col) */}
              <div className="ml-10 pl-2 border-l border-primary/30 py-0.5">
                <FreeelapMetricsTable
                  metadata={freelapMetadata}
                  onMetadataChange={onMetadataChange}
                  readOnly={set.completed}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Fragment>
    )
  }

  // Coach view - draggable with type-appropriate fields visible
  // Use visibleFields if provided, otherwise show common fields
  // T054: Apply showAdvancedFields toggle to advanced fields (RPE, tempo, velocity, effort)
  const coachShowReps = visibleFields?.reps ?? true
  const coachShowWeight = visibleFields?.weight ?? true
  const coachShowDistance = visibleFields?.distance ?? false
  const coachShowTime = visibleFields?.performingTime ?? false
  const coachShowHeight = visibleFields?.height ?? false
  const coachShowPower = visibleFields?.power ?? false
  const coachShowVelocity = (visibleFields?.velocity ?? false) && showAdvancedFields
  const coachShowRPE = (visibleFields?.rpe ?? false) && showAdvancedFields
  const coachShowRestTime = visibleFields?.restTime ?? true
  const coachShowTempo = (visibleFields?.tempo ?? false) && showAdvancedFields
  const coachShowEffort = (visibleFields?.effort ?? false) && showAdvancedFields
  const coachShowResistance = visibleFields?.resistance ?? false

  // T055: Calculate if coach view has many fields visible (for enhanced scroll indicators)
  const coachHasAdvancedFieldsVisible = coachShowVelocity || coachShowRPE || coachShowTempo || coachShowEffort

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
          // Apply AI styling: update only highlights cells, not the row
          : hasPendingChange && aiChangeType && aiChangeType !== 'update'
            ? AI_BG_COLORS[aiChangeType]
            : "bg-muted/30 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <GripVertical className={cn(
          "w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing",
          isRemove && "opacity-50"
        )} />
        <div className="relative">
          <span className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
            isRemove ? "bg-red-100 text-red-600 line-through" : "bg-muted text-muted-foreground"
          )}>
            {set.setIndex}
          </span>
          {/* AI indicator badge - only for update (remove uses strikethrough on set index) */}
          {hasPendingChange && !isRemove && (
            <span className={cn(
              "absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white",
              isUpdate ? "bg-amber-500" : "bg-blue-500"
            )}>
              <Bot className="h-2 w-2" />
            </span>
          )}
        </div>
      </div>

      {/* Pill notation inputs - show only type-appropriate fields */}
      {/* T055: Enhanced scroll affordance when advanced fields are visible on mobile */}
      <div className={cn(
        "flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide min-w-0",
        isRemove && "opacity-60",
        coachHasAdvancedFieldsVisible && "scroll-smooth md:overflow-x-visible"
      )}>
        {coachShowReps && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('reps')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {/* T049/T059: Show inline diff when field changed */}
            {isFieldChanged('reps') ? (
              <InlineDiffValue
                oldValue={getOldValue('reps')}
                newValue={getDisplayValue('reps', set.reps)}
                unit=""
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <input
                type="number"
                min={0}
                max={999}
                value={getDisplayValue('reps', set.reps) as number ?? ""}
                onChange={(e) => handleChange("reps", e.target.value)}
                disabled={isRemove}
                aria-label={`Set ${set.setIndex} reps`}
                className={cn(inputClass, "w-8", isRemove && "cursor-not-allowed")}
                placeholder="-"
              />
            )}
            <span className="text-muted-foreground text-xs">x</span>
          </div>
        )}
        {coachShowWeight && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('weight')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {/* T049/T059: Show inline diff when field changed */}
            {isFieldChanged('weight') ? (
              <InlineDiffValue
                oldValue={getOldValue('weight')}
                newValue={getDisplayValue('weight', set.weight)}
                unit="kg"
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <input
                type="number"
                min={0}
                max={9999}
                step={0.5}
                value={getDisplayValue('weight', set.weight) as number ?? ""}
                onChange={(e) => handleChange("weight", e.target.value)}
                disabled={isRemove}
                aria-label={`Set ${set.setIndex} weight in kilograms`}
                className={cn(inputClass, "w-10", isRemove && "cursor-not-allowed")}
                placeholder="-"
              />
            )}
            <span className={cn("text-muted-foreground text-xs", isFieldChanged('weight') && "hidden")}>kg</span>
          </div>
        )}
        {coachShowDistance && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('distance')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {isFieldChanged('distance') ? (
              <InlineDiffValue
                oldValue={getOldValue('distance')}
                newValue={getDisplayValue('distance', set.distance)}
                unit="m"
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  value={set.distance ?? ""}
                  onChange={(e) => handleChange("distance", e.target.value)}
                  aria-label={`Set ${set.setIndex} distance in meters`}
                  className={cn(inputClass, "w-9")}
                  placeholder="-"
                />
                <span className="text-muted-foreground text-xs">m</span>
              </>
            )}
          </div>
        )}
        {coachShowTime && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('performing_time') || isFieldChanged('performingTime')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {isFieldChanged('performing_time') || isFieldChanged('performingTime') ? (
              <InlineDiffValue
                oldValue={getOldValue('performing_time') ?? getOldValue('performingTime')}
                newValue={getDisplayValue('performingTime', set.performingTime)}
                unit="s"
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  step={0.01}
                  value={set.performingTime ?? ""}
                  onChange={(e) => handleChange("performingTime", e.target.value)}
                  aria-label={`Set ${set.setIndex} time in seconds`}
                  className={cn(inputClass, "w-12")}
                  placeholder="-"
                />
                <span className="text-muted-foreground text-xs">s</span>
              </>
            )}
          </div>
        )}
        {coachShowVelocity && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('velocity')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {isFieldChanged('velocity') ? (
              <InlineDiffValue
                oldValue={getOldValue('velocity')}
                newValue={getDisplayValue('velocity', set.velocity)}
                unit="m/s"
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={99}
                  step={0.01}
                  value={set.velocity ?? ""}
                  onChange={(e) => handleChange("velocity", e.target.value)}
                  aria-label={`Set ${set.setIndex} target velocity in meters per second`}
                  className={cn(inputClass, "w-12")}
                  placeholder="-"
                />
                <span className="text-muted-foreground text-xs">m/s</span>
              </>
            )}
          </div>
        )}
        {coachShowHeight && (
          <div className="px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-muted shrink-0">
            <input
              type="number"
              min={0}
              max={999}
              step={0.1}
              value={set.height ?? ""}
              onChange={(e) => handleChange("height", e.target.value)}
              aria-label={`Set ${set.setIndex} height in centimeters`}
              className={cn(inputClass, "w-9")}
              placeholder="-"
            />
            <span className="text-muted-foreground text-xs">cm</span>
          </div>
        )}
        {coachShowRestTime && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('rest_time') || isFieldChanged('restTime')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            {isFieldChanged('rest_time') || isFieldChanged('restTime') ? (
              <InlineDiffValue
                oldValue={getOldValue('rest_time') ?? getOldValue('restTime')}
                newValue={getDisplayValue('restTime', set.restTime)}
                unit="s"
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={set.restTime ?? ""}
                  onChange={(e) => handleChange("restTime", e.target.value)}
                  aria-label={`Set ${set.setIndex} rest time in seconds`}
                  className={cn(inputClass, "w-9")}
                  placeholder="60"
                />
                <span className="text-muted-foreground text-xs">rest</span>
              </>
            )}
          </div>
        )}
        {coachShowRPE && (
          <div className={cn(
            "px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 shrink-0",
            isFieldChanged('rpe')
              ? useHighlightMode
                ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-700"
                : "ai-update-cell"
              : "bg-muted"
          )}>
            <span className="text-muted-foreground text-xs">RPE</span>
            {isFieldChanged('rpe') ? (
              <InlineDiffValue
                oldValue={getOldValue('rpe')}
                newValue={getDisplayValue('rpe', set.rpe)}
                unit=""
                isHighlightMode={useHighlightMode}
              />
            ) : (
              <input
                type="number"
                min={1}
                max={10}
                value={set.rpe ?? ""}
                onChange={(e) => handleChange("rpe", e.target.value)}
                aria-label={`Set ${set.setIndex} rate of perceived exertion`}
                className={cn(inputClass, "w-7")}
                placeholder="-"
              />
            )}
          </div>
        )}
        {coachShowTempo && (
          <div className="px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-muted shrink-0">
            <input
              type="text"
              value={set.tempo ?? ""}
              onChange={(e) => onUpdate?.("tempo", e.target.value || null)}
              aria-label={`Set ${set.setIndex} tempo (eccentric-bottom-concentric-top)`}
              className={cn(inputClass, "w-16")}
              placeholder="3-1-2-0"
            />
          </div>
        )}
        {coachShowEffort && (
          <div className="px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-muted shrink-0">
            <input
              type="number"
              min={0}
              max={100}
              value={set.effort ?? ""}
              onChange={(e) => handleChange("effort", e.target.value)}
              aria-label={`Set ${set.setIndex} effort percentage`}
              className={cn(inputClass, "w-9")}
              placeholder="80"
            />
            <span className="text-muted-foreground text-xs">%</span>
          </div>
        )}
        {coachShowPower && (
          <div className="px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-muted shrink-0">
            <input
              type="number"
              min={0}
              max={99999}
              step={0.1}
              value={set.power ?? ""}
              onChange={(e) => handleChange("power", e.target.value)}
              aria-label={`Set ${set.setIndex} power in watts`}
              className={cn(inputClass, "w-12")}
              placeholder="-"
            />
            <span className="text-muted-foreground text-xs">W</span>
          </div>
        )}
        {coachShowResistance && (
          <div className="px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5 bg-muted shrink-0">
            <input
              type="number"
              min={0}
              max={9999}
              step={0.5}
              value={set.resistance ?? ""}
              onChange={(e) => handleChange("resistance", e.target.value)}
              aria-label={`Set ${set.setIndex} resistance level`}
              className={cn(inputClass, "w-10")}
              placeholder="-"
            />
            <span className="text-muted-foreground text-xs">R</span>
          </div>
        )}
      </div>

      <button
        onClick={onRemove}
        aria-label={`Remove set ${set.setIndex}`}
        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
