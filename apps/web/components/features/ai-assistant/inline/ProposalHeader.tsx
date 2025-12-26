'use client'

/**
 * ProposalHeader Component
 *
 * Displays the header for the inline proposal section with
 * icon, change count, summary, and expand/collapse toggle.
 *
 * Single Responsibility: Header UI only, no business logic
 */

import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Bot className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {changeCount} AI Change{changeCount !== 1 ? 's' : ''} Pending
          </p>
          <p className="text-sm text-gray-500">{summary}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleExpand}
        className="text-gray-500"
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
