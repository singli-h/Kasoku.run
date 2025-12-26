'use client'

/**
 * AIBadge Component
 *
 * Small indicator showing that content was AI-proposed.
 * Pure presentation component.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { Bot } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface AIBadgeProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md'
  /** Tooltip text */
  tooltip?: string
  /** Show as pending indicator */
  pending?: boolean
  /** Additional CSS classes */
  className?: string
}

const SIZE_CLASSES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}

/**
 * AI badge with optional tooltip.
 * Shows a bot icon to indicate AI-proposed content.
 */
export function AIBadge({
  size = 'sm',
  tooltip = 'AI proposed',
  pending = false,
  className,
}: AIBadgeProps) {
  const badge = (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        pending && 'animate-pulse',
        className
      )}
      data-testid="ai-badge"
    >
      <Bot className={cn(SIZE_CLASSES[size], 'text-blue-600')} />
    </span>
  )

  if (!tooltip) {
    return badge
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * AI badge with pending count.
 * Shows "🤖 3" format for multiple pending changes.
 */
interface AIBadgeWithCountProps {
  count: number
  className?: string
}

export function AIBadgeWithCount({ count, className }: AIBadgeWithCountProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700',
        className
      )}
      data-testid="ai-badge-count"
    >
      <Bot className="h-3 w-3" />
      <span>{count}</span>
    </span>
  )
}

/**
 * Minimal AI indicator for tight spaces.
 * Just shows "🤖" emoji.
 */
export function AIIndicator({ className }: { className?: string }) {
  return (
    <span className={cn('text-blue-600', className)} aria-label="AI proposed">
      🤖
    </span>
  )
}
