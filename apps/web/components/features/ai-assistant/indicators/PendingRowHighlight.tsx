'use client'

/**
 * PendingRowHighlight Component
 *
 * Wrapper that adds visual highlighting to rows with pending changes.
 * Pure presentation component - receives state via props.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { cn } from '@/lib/utils'
import type { UIDisplayType } from '@/lib/changeset/types'

interface PendingRowHighlightProps {
  /** Whether this row has a pending change */
  isPending: boolean
  /** The type of change (affects color) */
  changeType?: UIDisplayType
  /** Whether to show left border accent */
  showBorder?: boolean
  /** Children to wrap */
  children: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

const BG_COLORS: Record<UIDisplayType, string> = {
  swap: 'bg-blue-50/50 dark:bg-blue-950/30',
  add: 'bg-green-50/50 dark:bg-green-950/30',
  update: 'bg-amber-50/50 dark:bg-amber-950/30',
  remove: 'bg-red-50/30 dark:bg-red-950/20',
}

const BORDER_COLORS: Record<UIDisplayType, string> = {
  swap: 'border-l-blue-400',
  add: 'border-l-green-400',
  update: 'border-l-amber-400',
  remove: 'border-l-red-400',
}

/**
 * Wraps content with pending change highlighting.
 * Adds colored background and optional left border.
 */
export function PendingRowHighlight({
  isPending,
  changeType = 'update',
  showBorder = true,
  children,
  className,
}: PendingRowHighlightProps) {
  if (!isPending) {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        'transition-colors duration-200',
        BG_COLORS[changeType],
        showBorder && 'border-l-2',
        showBorder && BORDER_COLORS[changeType],
        changeType === 'remove' && 'opacity-60',
        className
      )}
      data-testid="pending-highlight"
      data-change-type={changeType}
    >
      {children}
    </div>
  )
}

/**
 * Highlight specifically for new/added items.
 * Uses dashed border style.
 */
interface NewItemHighlightProps {
  children: React.ReactNode
  className?: string
}

export function NewItemHighlight({ children, className }: NewItemHighlightProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/30',
        'transition-all duration-200',
        className
      )}
      data-testid="new-item-highlight"
    >
      {children}
    </div>
  )
}

/**
 * Highlight specifically for removed items.
 * Uses faded appearance with strikethrough support.
 */
interface RemovedItemHighlightProps {
  children: React.ReactNode
  className?: string
}

export function RemovedItemHighlight({ children, className }: RemovedItemHighlightProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20 opacity-60',
        'transition-all duration-200',
        className
      )}
      data-testid="removed-item-highlight"
    >
      {children}
    </div>
  )
}

/**
 * Highlight specifically for swap changes.
 * Shows blue accent for replacement items.
 */
interface SwapItemHighlightProps {
  children: React.ReactNode
  className?: string
}

export function SwapItemHighlight({ children, className }: SwapItemHighlightProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30',
        'transition-all duration-200',
        className
      )}
      data-testid="swap-item-highlight"
    >
      {children}
    </div>
  )
}
