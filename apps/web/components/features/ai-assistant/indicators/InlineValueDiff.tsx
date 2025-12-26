'use client'

/**
 * InlineValueDiff Component
 *
 * Displays a diff between original and pending values in format: "old→new"
 * Pure presentation component - no context access.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { cn } from '@/lib/utils'

interface InlineValueDiffProps {
  /** Original value (null for new values) */
  original: string | number | null | undefined
  /** Pending/proposed value */
  pending: string | number
  /** Optional unit to append (e.g., "kg", "s") */
  unit?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Renders inline diff for changed values.
 *
 * Examples:
 * - Same value: "80"
 * - Changed: "80→85"
 * - New value: "100" (green)
 */
export function InlineValueDiff({
  original,
  pending,
  unit = '',
  className,
}: InlineValueDiffProps) {
  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    return `${value}${unit}`
  }

  // New value (no original)
  if (original === null || original === undefined) {
    return (
      <span className={cn('font-medium text-green-700', className)}>
        {formatValue(pending)}
      </span>
    )
  }

  // No change
  if (original === pending) {
    return <span className={className}>{formatValue(original)}</span>
  }

  // Show diff: "old→new"
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <span className="text-gray-400 line-through">{formatValue(original)}</span>
      <span className="text-gray-400 mx-0.5">→</span>
      <span className="font-medium text-amber-700">{formatValue(pending)}</span>
    </span>
  )
}

/**
 * Compact version for tight spaces (tables, etc.)
 */
export function InlineValueDiffCompact({
  original,
  pending,
  unit = '',
  className,
}: InlineValueDiffProps) {
  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    return `${value}${unit}`
  }

  // New value
  if (original === null || original === undefined) {
    return (
      <span className={cn('text-green-700', className)}>
        {formatValue(pending)}
      </span>
    )
  }

  // No change
  if (original === pending) {
    return <span className={className}>{formatValue(original)}</span>
  }

  // Compact diff
  return (
    <span className={cn('text-amber-700', className)}>
      {formatValue(pending)}
      <sup className="text-[10px] text-gray-400 ml-0.5">
        was {formatValue(original)}
      </sup>
    </span>
  )
}
