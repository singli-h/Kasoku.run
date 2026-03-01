"use client"

/**
 * GhostSetRow - Displays a pending new set (CREATE operation) before approval
 *
 * This component renders AI-proposed new sets with a distinctive "ghost" style:
 * - Dashed green border
 * - Semi-transparent green background
 * - 🤖 NEW badge
 * - Read-only display of proposed values
 *
 * @see specs/004-feature-pattern-standard/ai-ui-implementation-plan.md
 */

import { Bot, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VisibleFields } from "./SetRow"

export interface GhostSetRowProps {
  /** Proposed set data from AI */
  proposedData?: Record<string, unknown> | null
  /** Visible fields computed from exercise type */
  visibleFields?: VisibleFields
  /** Set index (position in the set list) */
  setIndex: number
}

/**
 * Format a value for display with unit
 */
function formatValue(value: unknown, unit: string): string {
  if (value == null) return '--'
  return `${value}${unit}`
}

export function GhostSetRow({
  proposedData,
  visibleFields,
  setIndex,
}: GhostSetRowProps) {
  // Extract values from proposed data (snake_case from changeset)
  const reps = proposedData?.reps ?? proposedData?.set_count
  const weight = proposedData?.weight
  const distance = proposedData?.distance
  const performingTime = proposedData?.performing_time ?? proposedData?.performingTime
  const height = proposedData?.height
  const power = proposedData?.power
  const velocity = proposedData?.velocity
  const rpe = proposedData?.rpe
  const restTime = proposedData?.rest_time ?? proposedData?.restTime
  const tempo = proposedData?.tempo
  const effort = proposedData?.effort
  const resistance = proposedData?.resistance

  // Determine which fields to show
  const showReps = visibleFields?.reps ?? true
  const showWeight = visibleFields?.weight ?? true
  const showDistance = visibleFields?.distance ?? false
  const showTime = visibleFields?.performingTime ?? false
  const showHeight = visibleFields?.height ?? false
  const showPower = visibleFields?.power ?? false
  const showVelocity = visibleFields?.velocity ?? false
  const showRPE = visibleFields?.rpe ?? false
  const showRestTime = visibleFields?.restTime ?? true
  const showTempo = visibleFields?.tempo ?? false
  const showEffort = visibleFields?.effort ?? false
  const showResistance = visibleFields?.resistance ?? false

  const pillClass = "px-2 py-1 rounded-md text-sm font-mono flex items-center gap-1 bg-emerald-100/80 text-emerald-700"

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-2 rounded-lg transition-colors",
        "border-2 border-dashed border-emerald-400 bg-emerald-50/60",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
    >
      {/* Set number with NEW badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-sm font-medium text-emerald-700">
            <Plus className="w-3.5 h-3.5" />
          </span>
          {/* AI NEW badge */}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Bot className="h-2.5 w-2.5" />
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
          New
        </span>
      </div>

      {/* Read-only value pills */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {showReps && reps != null && (
          <div className={pillClass}>
            <span>{String(reps)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">x</span>
          </div>
        )}
        {showWeight && weight != null && (
          <div className={pillClass}>
            <span>{String(weight)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">kg</span>
          </div>
        )}
        {showDistance && distance != null && (
          <div className={pillClass}>
            <span>{String(distance)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">m</span>
          </div>
        )}
        {showTime && performingTime != null && (
          <div className={pillClass}>
            <span>{String(performingTime)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">s</span>
          </div>
        )}
        {showHeight && height != null && (
          <div className={pillClass}>
            <span>{String(height)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">cm</span>
          </div>
        )}
        {showResistance && resistance != null && (
          <div className={pillClass}>
            <span>{String(resistance)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">R</span>
          </div>
        )}
        {showPower && power != null && (
          <div className={pillClass}>
            <span>{String(power)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">W</span>
          </div>
        )}
        {showVelocity && velocity != null && (
          <div className={pillClass}>
            <span>{String(velocity)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">m/s</span>
          </div>
        )}
        {showRestTime && restTime != null && (
          <div className={pillClass}>
            <span>{String(restTime)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">rest</span>
          </div>
        )}
        {showTempo && tempo != null && (
          <div className={pillClass}>
            <span>{String(tempo)}</span>
          </div>
        )}
        {showEffort && effort != null && (
          <div className={pillClass}>
            <span>{String(effort)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">%</span>
          </div>
        )}
        {showRPE && rpe != null && (
          <div className={pillClass}>
            <span className="text-emerald-700 dark:text-emerald-400 text-xs">RPE</span>
            <span>{String(rpe)}</span>
          </div>
        )}

        {/* Fallback if no fields have values */}
        {!reps && !weight && !distance && !performingTime && (
          <div className={cn(pillClass, "text-emerald-700 dark:text-emerald-400 italic")}>
            Pending...
          </div>
        )}
      </div>
    </div>
  )
}
