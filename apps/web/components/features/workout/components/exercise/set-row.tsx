/**
 * Set Row Input Component
 * Dynamic input fields for exercise training data with smart field detection
 *
 * Based on the sophisticated SetRow system from the original Kasoku workout system
 * Handles real-time input updates with proper number formatting and validation
 *
 * Enhanced with Freelap timing data expansion support
 */

"use client"

import { useCallback, useState, Fragment } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SetRowDetails } from "./set-row-details"
import { isFreeelapMetadata } from "@/types/freelap"
import type { Json } from "@/types/database"

// Field configuration interface for dynamic column generation
interface FieldConfig {
  key: string
  label: string
  unit?: string
  always?: boolean
  type?: "number" | "text"
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

// Training detail interface matching our exercise data structure
// Uses database field names directly (snake_case) since data comes from DB
interface TrainingDetail {
  id: string
  reps?: number | null
  weight?: number | null
  distance?: number | null
  performing_time?: number | null // Database field name
  resistance?: number | null
  power?: number | null
  velocity?: number | null
  tempo?: string | null
  rest_time?: number | null
  effort?: string | null
  notes?: string | null
  /** Freelap timing metadata */
  metadata?: Json | null
}

interface SetRowProps {
  detail: TrainingDetail
  index: number
  columns: FieldConfig[]
  onInputChange: (detailId: string, field: string, value: number | string | null) => void
  onToggleComplete?: (detailId: string) => void
  className?: string
  isCompleted?: boolean
  /** Whether this row is expanded to show Freelap details */
  isExpanded?: boolean
  /** Whether this row has Freelap metadata to display */
  hasMetadata?: boolean
  /** Callback to toggle expansion */
  onToggleExpand?: (detailId: string) => void
  /** Total column count for expanded row colspan */
  totalColumns?: number
}

// Default field configuration - the complete field system
export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
  { 
    key: 'reps', 
    label: 'Reps', 
    always: true, 
    type: 'number',
    min: 0,
    placeholder: '0'
  },
  { 
    key: 'weight', 
    label: 'Weight', 
    unit: 'kg', 
    type: 'number',
    min: 0,
    step: 0.5,
    placeholder: '0'
  },
  {
    key: 'distance', 
    label: 'Distance', 
    unit: 'm', 
    type: 'number',
    min: 0,
    placeholder: '0'
  },
  {
    key: 'performing_time',
    label: 'Duration',
    unit: 's',
    type: 'number',
    min: 0,
    placeholder: '0'
  },
  { 
    key: 'resistance', 
    label: 'Resistance', 
    unit: 'kg', 
    type: 'number',
    min: 0,
    step: 0.5,
    placeholder: '0'
  },
  { 
    key: 'power', 
    label: 'Power', 
    unit: 'W', 
    type: 'number',
    min: 0,
    placeholder: '0'
  },
  { 
    key: 'velocity', 
    label: 'Velocity', 
    unit: 'm/s', 
    type: 'number',
    min: 0,
    step: 0.1,
    placeholder: '0.0'
  },
  { 
    key: 'tempo', 
    label: 'Tempo', 
    type: 'text',
    placeholder: '3-1-2-0'
  },
  { 
    key: 'effort', 
    label: 'Effort', 
    type: 'text',
    placeholder: '8 RPE'
  }
]

/**
 * Helper function to determine which columns should be displayed
 * based on available data in the training details
 */
export const getDisplayColumns = (
  details: TrainingDetail[], 
  fieldConfig: FieldConfig[] = DEFAULT_FIELD_CONFIG
): FieldConfig[] => {
  return fieldConfig.filter(cfg => 
    cfg.always || details.some(d => d[cfg.key as keyof TrainingDetail] !== null && d[cfg.key as keyof TrainingDetail] !== undefined)
  )
}

/**
 * SetRow Component - Individual set input row with dynamic fields
 * Enhanced with Freelap data expansion support
 */
export function SetRow({
  detail,
  index,
  columns,
  onInputChange,
  onToggleComplete,
  className,
  isCompleted = false,
  isExpanded = false,
  hasMetadata = false,
  onToggleExpand,
  totalColumns = 0
}: SetRowProps) {

  // Handle input changes with proper type conversion
  const handleChange = useCallback((field: string, value: string) => {
    const fieldConfig = columns.find(cfg => cfg.key === field)

    if (!fieldConfig) return

    // Handle empty values
    if (value === "") {
      onInputChange(detail.id, field, null)
      return
    }

    // Convert based on field type
    if (fieldConfig.type === "number") {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        onInputChange(detail.id, field, numValue)
      }
    } else {
      onInputChange(detail.id, field, value)
    }
  }, [detail.id, columns, onInputChange])

  // Common input styling - optimized for table layouts
  const inputClass = cn(
    "w-14 px-2 py-2 text-sm border rounded",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    "transition-colors duration-200",
    // Remove spinner arrows for number inputs
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    // Completed state styling
    isCompleted ? "bg-green-50 border-green-200" : "bg-white border-gray-300 hover:border-gray-400",
    "disabled:bg-gray-50 disabled:cursor-not-allowed"
  )

  // Calculate colspan for expanded details row
  // +1 for expand column, +1 for checkbox, +1 for set number, + columns
  const colSpan = totalColumns > 0 ? totalColumns : columns.length + 3

  return (
    <Fragment>
      <tr className={cn(
        "border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150",
        isCompleted && "bg-green-50/50",
        isExpanded && "bg-blue-50/30",
        className
      )}>
        {/* Expand icon - FIRST column (leftmost) */}
        <td className="px-1 py-2 w-8 text-center">
          {hasMetadata && onToggleExpand ? (
            <button
              type="button"
              onClick={() => onToggleExpand(detail.id)}
              className={cn(
                "p-1 rounded hover:bg-gray-200 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6" /> // Empty placeholder to maintain alignment
          )}
        </td>

        {/* Completion checkbox */}
        <td className="px-2 py-2 w-10 text-center">
          {onToggleComplete ? (
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => onToggleComplete(detail.id)}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
              aria-label={`Mark set ${index + 1} as complete`}
            />
          ) : (
            <div className={cn(
              "w-4 h-4 rounded flex items-center justify-center",
              isCompleted && "bg-green-500"
            )} />
          )}
        </td>

        {/* Set number column */}
        <td className="px-2 py-2 font-medium text-gray-900 w-10 text-center">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            isCompleted
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700"
          )}>
            {index + 1}
          </div>
        </td>

        {/* Dynamic metric columns */}
        {columns.map(cfg => {
          const value = detail[cfg.key as keyof TrainingDetail]
          const displayValue = value !== null && value !== undefined && cfg.key !== 'metadata'
            ? String(value)
            : ""

          return (
            <td key={cfg.key} className="px-2 py-2 w-20">
              <div className="flex items-center gap-1">
                <input
                  type={cfg.type || "number"}
                  value={displayValue}
                  onChange={e => handleChange(cfg.key, e.target.value)}
                  className={inputClass}
                  placeholder={cfg.placeholder}
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  aria-label={`${cfg.label} for set ${index + 1}`}
                  title={`${cfg.label}${cfg.unit ? ` (${cfg.unit})` : ''}`}
                />
                {cfg.unit && (
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    {cfg.unit}
                  </span>
                )}
              </div>
            </td>
          )
        })}
      </tr>

      {/* Expandable Freelap details row */}
      {hasMetadata && (
        <SetRowDetails
          isExpanded={isExpanded}
          metadata={detail.metadata}
          colSpan={colSpan}
        />
      )}
    </Fragment>
  )
}

/**
 * SetTableHeader Component - Dynamic table header for set inputs
 * Now includes expand column for Freelap data
 */
export function SetTableHeader({
  columns,
  showCheckbox = false,
  showExpandColumn = false
}: {
  columns: FieldConfig[]
  showCheckbox?: boolean
  /** Whether to show the expand column (for Freelap data) */
  showExpandColumn?: boolean
}) {
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        {/* Expand column header - empty but takes space */}
        {showExpandColumn && (
          <th className="px-1 py-2 w-8">
            <span className="sr-only">Expand</span>
          </th>
        )}
        {showCheckbox && (
          <th className="px-2 py-2 text-center font-medium text-gray-500 w-10">
            <span className="text-xs">✓</span>
          </th>
        )}
        <th className="px-2 py-2 text-left font-medium text-gray-500 w-10 text-center">
          Set
        </th>
        {columns.map(cfg => (
          <th
            key={cfg.key}
            className="px-2 py-2 text-left font-medium text-gray-500 w-20"
            title={cfg.unit ? `${cfg.label} (${cfg.unit})` : cfg.label}
          >
            <div className="flex flex-col items-start">
              <span className="text-xs">{cfg.label}</span>
              {cfg.unit && (
                <span className="text-xs text-gray-400 font-normal">
                  ({cfg.unit})
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}

/**
 * SetTable Component - Complete table with header and rows
 * Enhanced with Freelap data expansion management
 */
interface SetTableProps {
  details: TrainingDetail[]
  columns?: FieldConfig[]
  onInputChange: (detailId: string, field: string, value: number | string | null) => void
  onToggleComplete?: (detailId: string) => void
  completedSets?: Set<string>
  className?: string
}

export function SetTable({
  details,
  columns,
  onInputChange,
  onToggleComplete,
  completedSets = new Set(),
  className
}: SetTableProps) {
  // Track which rows are expanded
  const [expandedSetIds, setExpandedSetIds] = useState<Set<string>>(new Set())

  // Toggle expansion for a specific row
  const handleToggleExpand = useCallback((detailId: string) => {
    setExpandedSetIds(prev => {
      const next = new Set(prev)
      if (next.has(detailId)) {
        next.delete(detailId)
      } else {
        next.add(detailId)
      }
      return next
    })
  }, [])

  // Check if any detail has Freelap metadata
  const hasAnyMetadata = details.some(d => isFreeelapMetadata(d.metadata))

  // Use provided columns or auto-detect
  const displayColumns = columns || getDisplayColumns(details)

  // Calculate total column count for colspan
  // expand column + checkbox + set number + dynamic columns
  const totalColumns = (hasAnyMetadata ? 1 : 0) + (onToggleComplete ? 1 : 0) + 1 + displayColumns.length

  // Determine table layout based on column count
  const tableClass = displayColumns.length <= 4 ? 'table-fixed' : 'table-auto'

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn("w-full text-sm", tableClass)}>
        <SetTableHeader
          columns={displayColumns}
          showCheckbox={!!onToggleComplete}
          showExpandColumn={hasAnyMetadata}
        />
        <tbody>
          {details.map((detail, index) => {
            const hasMetadata = isFreeelapMetadata(detail.metadata)
            return (
              <SetRow
                key={detail.id}
                detail={detail}
                index={index}
                columns={displayColumns}
                onInputChange={onInputChange}
                onToggleComplete={onToggleComplete}
                isCompleted={completedSets.has(detail.id)}
                isExpanded={expandedSetIds.has(detail.id)}
                hasMetadata={hasMetadata}
                onToggleExpand={hasAnyMetadata ? handleToggleExpand : undefined}
                totalColumns={totalColumns}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 