'use client'

/**
 * AIProposalSkeleton
 *
 * Loading skeleton for AI proposal sections.
 *
 * @see docs/features/plans/individual/tasks.md T071
 */

import { Bot } from 'lucide-react'

/**
 * Skeleton for AI proposal during processing.
 */
export function AIProposalSkeleton() {
  return (
    <div className="animate-pulse p-4 rounded-xl border border-border/40 bg-muted/20">
      <div className="flex items-start gap-3">
        {/* AI icon */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary animate-pulse" />
        </div>

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>

          {/* Content lines */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
