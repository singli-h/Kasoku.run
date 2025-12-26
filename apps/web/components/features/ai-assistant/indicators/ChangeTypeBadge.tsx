'use client'

/**
 * ChangeTypeBadge Component
 *
 * Visual badge indicating the type of change: SWAP, NEW, UPDATE, REMOVE.
 * Pure presentation component.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { ArrowLeftRight, Plus, Pencil, Trash2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UIDisplayType } from '@/lib/changeset/types'

interface ChangeTypeBadgeProps {
  /** The type of change */
  type: UIDisplayType
  /** Size variant */
  size?: 'sm' | 'md'
  /** Show icon only (no text) */
  iconOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

interface BadgeConfig {
  label: string
  icon: LucideIcon
  bgColor: string
  textColor: string
  borderColor: string
}

const BADGE_CONFIG: Record<UIDisplayType, BadgeConfig> = {
  swap: {
    label: 'SWAP',
    icon: ArrowLeftRight,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  add: {
    label: 'NEW',
    icon: Plus,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  update: {
    label: 'UPDATE',
    icon: Pencil,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  remove: {
    label: 'REMOVE',
    icon: Trash2,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
}

const SIZE_CLASSES = {
  sm: {
    badge: 'px-1.5 py-0.5 text-[10px]',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'h-3.5 w-3.5',
  },
}

/**
 * Badge showing the type of change with color coding.
 */
export function ChangeTypeBadge({
  type,
  size = 'sm',
  iconOnly = false,
  className,
}: ChangeTypeBadgeProps) {
  const config = BADGE_CONFIG[type]
  const sizeClasses = SIZE_CLASSES[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium uppercase',
        config.bgColor,
        config.textColor,
        sizeClasses.badge,
        className
      )}
      data-testid="change-type-badge"
      data-change-type={type}
    >
      <Icon className={sizeClasses.icon} />
      {!iconOnly && <span>{config.label}</span>}
    </span>
  )
}

/**
 * Get the display type from operation type and data.
 * Used to derive UI display type from ChangeRequest.
 */
export function deriveUIDisplayType(
  operationType: 'create' | 'update' | 'delete',
  currentData?: Record<string, unknown> | null,
  proposedData?: Record<string, unknown> | null
): UIDisplayType {
  if (operationType === 'create') return 'add'
  if (operationType === 'delete') return 'remove'

  // For updates, check if exercise_id changed (swap)
  if (
    currentData?.exercise_id !== undefined &&
    proposedData?.exercise_id !== undefined &&
    currentData.exercise_id !== proposedData.exercise_id
  ) {
    return 'swap'
  }

  return 'update'
}

/**
 * Get color classes for a change type.
 * Useful for styling containers/rows.
 */
export function getChangeTypeColors(type: UIDisplayType) {
  return BADGE_CONFIG[type]
}
