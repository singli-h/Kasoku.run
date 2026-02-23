/**
 * Freelap Metrics Display Component
 * Compact, pill-style display matching SetRow design language
 *
 * Features:
 * - Editable inputs for all metrics
 * - Synchronized horizontal scrolling across split rows (within same set)
 * - For single distances (20m): inline pill metrics
 * - For multi-split (40m+): compact split rows with inline pills
 */

"use client"

import { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import type {
  FreeelapMetadata,
  FreeelapSplit,
} from "@/types/freelap"
import {
  hasSplits,
  formatSplitLabel
} from "@/types/freelap"

interface FreeelapMetricsTableProps {
  /** The Freelap metadata from workout_log_sets.metadata */
  metadata: FreeelapMetadata
  /** Optional className for styling */
  className?: string
  /** Callback when metadata changes */
  onMetadataChange?: (metadata: FreeelapMetadata) => void
  /** Whether the data is read-only */
  readOnly?: boolean
}

/**
 * Editable pill-style metric input - matches SetRow styling
 */
function MetricInput({
  value,
  unit,
  onChange,
  readOnly = false,
  className
}: {
  value: number | string | undefined
  unit: string
  onChange?: (value: number | undefined) => void
  readOnly?: boolean
  className?: string
}) {
  if (value === undefined && readOnly) return null

  const formattedValue = typeof value === 'number'
    ? (unit === 'st' ? value.toFixed(1) : value.toFixed(2))
    : value ?? ''

  // Input width based on unit type - wider for decimal values
  const inputWidth = unit === 's' ? 'w-12'      // time: "12.45"
    : unit === 'm/s' ? 'w-12'                   // speed: "8.50"
    : unit === 'Hz' ? 'w-10'                    // frequency: "4.25"
    : unit === 'm' ? 'w-10'                     // stride: "2.15"
    : unit === 'st' ? 'w-10'                     // steps: "25"
    : 'w-10'

  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded bg-muted/60 inline-flex items-center gap-0.5 text-xs font-mono tabular-nums shrink-0 text-foreground",
      className
    )}>
      <input
        type="number"
        step={unit === 's' || unit === 'm/s' ? 0.01 : 0.1}
        min={0}
        value={formattedValue}
        onChange={(e) => {
          const val = e.target.value ? parseFloat(e.target.value) : undefined
          onChange?.(val)
        }}
        className={cn(
          "h-5 text-xs text-center bg-transparent border-0 p-0 focus:ring-0 focus:outline-none",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          inputWidth
        )}
        placeholder="--"
      />
      <span className="text-[9px] text-muted-foreground/70">{unit}</span>
    </span>
  )
}

/**
 * Single split row content (without container) for table layout
 */
function SplitRowContent({
  split,
  index,
  splits,
  onSplitChange,
  readOnly
}: {
  split: FreeelapSplit
  index: number
  splits: FreeelapSplit[]
  onSplitChange?: (splitIndex: number, field: keyof FreeelapSplit, value: number | undefined) => void
  readOnly?: boolean
}) {
  const label = formatSplitLabel(index, splits)

  return (
    <div className="flex items-center gap-1 py-0.5 text-xs whitespace-nowrap">
      {/* Split label - fixed width */}
      <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">
        {label}
      </span>

      {/* Metrics inline */}
      <MetricInput
        value={split.time}
        unit="s"
        onChange={(val) => onSplitChange?.(index, 'time', val)}
        readOnly={readOnly}
      />

      {(split.speed !== undefined || !readOnly) && (
        <MetricInput
          value={split.speed}
          unit="m/s"
          onChange={(val) => onSplitChange?.(index, 'speed', val)}
          readOnly={readOnly}
        />
      )}

      {(split.frequency !== undefined || !readOnly) && (
        <MetricInput
          value={split.frequency}
          unit="Hz"
          onChange={(val) => onSplitChange?.(index, 'frequency', val)}
          readOnly={readOnly}
        />
      )}

      {(split.stride_length !== undefined || !readOnly) && (
        <MetricInput
          value={split.stride_length}
          unit="m"
          onChange={(val) => onSplitChange?.(index, 'stride_length', val)}
          readOnly={readOnly}
        />
      )}

      {(split.steps !== undefined || !readOnly) && (
        <MetricInput
          value={split.steps}
          unit="st"
          onChange={(val) => onSplitChange?.(index, 'steps', val)}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}

/**
 * FreeelapMetricsTable - Editable, synchronized scroll display
 * All split rows scroll together horizontally within the same set
 */
export function FreeelapMetricsTable({
  metadata,
  className,
  onMetadataChange,
  readOnly = false
}: FreeelapMetricsTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Handle split field changes
  const handleSplitChange = useCallback((splitIndex: number, field: keyof FreeelapSplit, value: number | undefined) => {
    if (!metadata.splits || !onMetadataChange) return

    const newSplits = [...metadata.splits]
    newSplits[splitIndex] = {
      ...newSplits[splitIndex],
      [field]: value
    }

    onMetadataChange({
      ...metadata,
      splits: newSplits
    })
  }, [metadata, onMetadataChange])

  // Handle top-level field changes (for single distance sprints)
  const handleFieldChange = useCallback((field: keyof FreeelapMetadata, value: number | undefined) => {
    if (!onMetadataChange) return
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }, [metadata, onMetadataChange])

  // For single distance (no splits) - inline metrics
  if (!hasSplits(metadata)) {
    return (
      <div className={cn("flex items-center gap-1 py-0.5 overflow-x-auto scrollbar-hide", className)}>
        {(metadata.time !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.time}
            unit="s"
            onChange={(val) => handleFieldChange('time', val)}
            readOnly={readOnly}
          />
        )}
        {(metadata.speed !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.speed}
            unit="m/s"
            onChange={(val) => handleFieldChange('speed', val)}
            readOnly={readOnly}
          />
        )}
        {(metadata.frequency !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.frequency}
            unit="Hz"
            onChange={(val) => handleFieldChange('frequency', val)}
            readOnly={readOnly}
          />
        )}
        {(metadata.stride_length !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.stride_length}
            unit="m"
            onChange={(val) => handleFieldChange('stride_length', val)}
            readOnly={readOnly}
          />
        )}
        {(metadata.steps !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.steps}
            unit="st"
            onChange={(val) => handleFieldChange('steps', val)}
            readOnly={readOnly}
          />
        )}
        {(metadata.reaction_time !== undefined || !readOnly) && (
          <MetricInput
            value={metadata.reaction_time}
            unit="s"
            onChange={(val) => handleFieldChange('reaction_time', val)}
            readOnly={readOnly}
          />
        )}
      </div>
    )
  }

  // For multi-split sprints - all rows in single scroll container for synchronized scrolling
  const splits = metadata.splits!

  return (
    <div
      ref={scrollContainerRef}
      className={cn("overflow-x-auto scrollbar-hide", className)}
    >
      {/* All split rows in a single scrollable container */}
      <div className="space-y-0 min-w-max">
        {splits.map((split, index) => (
          <SplitRowContent
            key={index}
            split={split}
            index={index}
            splits={splits}
            onSplitChange={handleSplitChange}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

export default FreeelapMetricsTable
