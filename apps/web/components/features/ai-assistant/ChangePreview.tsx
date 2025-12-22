'use client'

/**
 * ChangePreview Component
 *
 * Displays a single change request with visual indicators.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import React from 'react'
import { Plus, RefreshCw, Edit2, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeRequest, UIDisplayType } from '@/lib/changeset/types'
import {
  deriveUIDisplayType,
  getDisplayTypeClasses,
  getDisplayTypeLabel,
  getChangedFields,
  formatFieldChange,
} from '@/lib/changeset/ui-helpers'
import { convertKeysToCamelCase } from '@/lib/changeset/entity-mappings'

interface ChangePreviewProps {
  /** The change request to display */
  change: ChangeRequest

  /** Optional exercise name for display */
  exerciseName?: string

  /** Whether to show detailed field changes */
  showDetails?: boolean

  /** Optional click handler */
  onClick?: () => void
}

const DISPLAY_TYPE_ICONS = {
  add: Plus,
  swap: RefreshCw,
  update: Edit2,
  remove: Minus,
} as const

export function ChangePreview({
  change,
  exerciseName,
  showDetails = true,
  onClick,
}: ChangePreviewProps): React.JSX.Element {
  const displayType: UIDisplayType = deriveUIDisplayType(change)
  const classes = getDisplayTypeClasses(displayType)
  const label: string = getDisplayTypeLabel(displayType)
  const Icon = DISPLAY_TYPE_ICONS[displayType]

  // Convert data for display
  const currentData = change.currentData
    ? convertKeysToCamelCase(change.currentData)
    : null
  const proposedData = change.proposedData
    ? convertKeysToCamelCase(change.proposedData)
    : null

  // Get exercise name from various sources
  const displayName: string =
    exerciseName ||
    String(proposedData?.exerciseName || '') ||
    String(currentData?.exerciseName || '') ||
    getEntityDisplayName(change.entityType)

  // Get changed fields for updates
  const changedFields: string[] =
    displayType === 'update'
      ? getChangedFields(
          change.currentData as Record<string, unknown> | null,
          change.proposedData as Record<string, unknown> | null
        )
      : []

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        classes.background,
        classes.border,
        onClick && 'cursor-pointer hover:bg-opacity-75'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              classes.badge
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
          <span className="font-medium text-gray-900">{displayName}</span>
        </div>
      </div>

      {/* Swap indicator */}
      {displayType === 'swap' &&
        proposedData?.exerciseName !== undefined &&
        proposedData?.exerciseName !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="line-through">
              {String(currentData?.exerciseName ?? '')}
            </span>
            <span>→</span>
            <span className={classes.text}>
              {String(proposedData.exerciseName)}
            </span>
          </div>
        )}

      {/* Changed fields for updates */}
      {showDetails && displayType === 'update' && changedFields.length > 0 && (
        <div className="mt-2 space-y-1">
          {changedFields.slice(0, 3).map((field) => {
            const fieldLabel = formatFieldChange(
              formatFieldName(field),
              change.currentData?.[field],
              change.proposedData?.[field]
            )
            return (
              <div key={field} className="text-sm text-gray-600">
                {fieldLabel}
              </div>
            )
          })}
          {changedFields.length > 3 && (
            <div className="text-sm text-gray-500">
              +{changedFields.length - 3} more changes
            </div>
          )}
        </div>
      )}

      {/* AI Reasoning */}
      {change.aiReasoning && (
        <p className="mt-2 text-sm italic text-gray-500">
          "{change.aiReasoning}"
        </p>
      )}
    </div>
  )
}

/**
 * Gets a display name for entity types.
 */
function getEntityDisplayName(entityType: string): string {
  const names: Record<string, string> = {
    preset_session: 'Session',
    preset_exercise: 'Exercise',
    preset_set: 'Set',
  }
  return names[entityType] || entityType
}

/**
 * Formats a field name for display.
 */
function formatFieldName(field: string): string {
  // Convert snake_case to Title Case
  return field
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

/**
 * Component for displaying a list of changes.
 */
interface ChangeListProps {
  changes: ChangeRequest[]
  onChangeClick?: (change: ChangeRequest) => void
}

export function ChangeList({
  changes,
  onChangeClick,
}: ChangeListProps): React.JSX.Element {
  if (changes.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No pending changes
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <ChangePreview
          key={change.id}
          change={change}
          onClick={onChangeClick ? () => onChangeClick(change) : undefined}
        />
      ))}
    </div>
  )
}
