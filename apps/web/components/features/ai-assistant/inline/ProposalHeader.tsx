'use client'

/**
 * ProposalHeader Component
 *
 * Displays the header for the inline proposal section with
 * icon, change count, summary, and expand/collapse toggle.
 *
 * Design: Refined, minimal with blue AI accent and clean typography.
 *
 * Single Responsibility: Header UI only, no business logic
 */

import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProposalHeaderProps {
  /** Number of pending changes */
  changeCount: number

  /** Summary text (e.g., "2 exercises added, 1 updated") */
  summary: string

  /** Whether the change list is expanded */
  isExpanded: boolean

  /** Toggle expand/collapse */
  onToggleExpand: () => void
}

export function ProposalHeader({
  changeCount,
  summary,
  isExpanded,
  onToggleExpand,
}: ProposalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left: AI indicator + count */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Refined AI indicator - smaller, more elegant */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>

        {/* Content - compact typography */}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground tracking-tight">
            {changeCount} Change{changeCount !== 1 ? 's' : ''} Pending
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {summary}
          </p>
        </div>
      </div>

      {/* Right: Expand toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleExpand}
        className={cn(
          'h-8 w-8 p-0 text-muted-foreground hover:text-foreground',
          'hover:bg-muted/50 transition-colors'
        )}
        aria-label={isExpanded ? 'Collapse changes' : 'Expand changes'}
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
