'use client'

/**
 * AIContextIndicator
 *
 * Shows the current AI context scope (block/week/session/exercise).
 * Helps users understand what the AI is "seeing" when they chat.
 *
 * Implements T069 from tasks.md (Phase 14: Polish)
 *
 * @see docs/features/plans/individual/tasks.md
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Bot, Layers, Calendar, Dumbbell, Target } from 'lucide-react'
import { usePlanContextOptional, type AIContextLevel } from './context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AIContextIndicatorProps {
  /** Override the context level (useful when not inside PlanContext) */
  contextLevel?: AIContextLevel
  /** Additional className */
  className?: string
  /** Visual variant */
  variant?: 'badge' | 'inline' | 'tooltip'
  /** Whether to show the icon */
  showIcon?: boolean
}

/**
 * Context level configuration for display
 */
const CONTEXT_CONFIG: Record<AIContextLevel, {
  label: string
  shortLabel: string
  description: string
  icon: typeof Bot
  color: string
}> = {
  block: {
    label: 'Full Block',
    shortLabel: 'Block',
    description: 'AI sees your entire training block',
    icon: Layers,
    color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
  },
  week: {
    label: 'This Week',
    shortLabel: 'Week',
    description: 'AI sees the selected week',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  },
  session: {
    label: 'This Session',
    shortLabel: 'Session',
    description: 'AI sees the selected workout',
    icon: Dumbbell,
    color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  },
  exercise: {
    label: 'This Exercise',
    shortLabel: 'Exercise',
    description: 'AI is focused on the expanded exercise',
    icon: Target,
    color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  },
}

/**
 * Displays the current AI context scope.
 *
 * @example Badge variant (for headers):
 * ```tsx
 * <AIContextIndicator variant="badge" />
 * ```
 *
 * @example Inline variant (for chat):
 * ```tsx
 * <AIContextIndicator variant="inline" />
 * ```
 *
 * @example With tooltip:
 * ```tsx
 * <AIContextIndicator variant="tooltip" />
 * ```
 */
export function AIContextIndicator({
  contextLevel: overrideLevel,
  className,
  variant = 'badge',
  showIcon = true,
}: AIContextIndicatorProps) {
  const planContext = usePlanContextOptional()
  const contextLevel = overrideLevel ?? planContext?.aiContextLevel ?? 'block'

  const config = useMemo(() => CONTEXT_CONFIG[contextLevel], [contextLevel])
  const Icon = config.icon

  // Inline variant - just text with optional icon
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
        {showIcon && <Bot className="h-3 w-3" />}
        <span>AI context: {config.label}</span>
      </span>
    )
  }

  // Tooltip variant - icon with tooltip explanation
  if (variant === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                config.color,
                className
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{config.shortLabel}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.description}
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Badge variant (default) - compact colored badge
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.shortLabel}</span>
    </div>
  )
}
