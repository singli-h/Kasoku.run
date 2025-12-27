'use client'

/**
 * ProposalActionBar Component
 *
 * Displays action buttons for the proposal section:
 * Approve, Regenerate, and Dismiss.
 *
 * Design: Clean, minimal with clear visual hierarchy.
 * Primary action (Approve) is prominent, secondary actions are subtle.
 *
 * Single Responsibility: Action buttons only, delegates to callbacks
 */

import { Check, RefreshCw, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProposalActionBarProps {
  /** Called when user approves all changes */
  onApprove: () => void

  /** Called when user wants to regenerate (opens feedback input) */
  onRegenerate: () => void

  /** Called when user dismisses all changes */
  onDismiss: () => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Whether the regenerate button is disabled (e.g., feedback mode active) */
  regenerateDisabled?: boolean
}

export function ProposalActionBar({
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  regenerateDisabled = false,
}: ProposalActionBarProps) {
  if (isExecuting) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-1">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-muted-foreground">
          Applying changes...
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Dismiss - most subtle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
      >
        <X className="mr-1 h-3.5 w-3.5" />
        <span className="text-xs">Dismiss</span>
      </Button>

      {/* Regenerate - secondary */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRegenerate}
        disabled={regenerateDisabled}
        className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="mr-1 h-3.5 w-3.5" />
        <span className="text-xs">Revise</span>
      </Button>

      {/* Approve - primary action, prominent */}
      <Button
        size="sm"
        onClick={onApprove}
        className={cn(
          'h-8 px-3 text-xs font-medium',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'shadow-sm transition-all'
        )}
      >
        <Check className="mr-1 h-3.5 w-3.5" />
        Apply
      </Button>
    </div>
  )
}
