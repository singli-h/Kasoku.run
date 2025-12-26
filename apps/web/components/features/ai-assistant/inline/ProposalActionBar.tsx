'use client'

/**
 * ProposalActionBar Component
 *
 * Displays action buttons for the proposal section:
 * Approve, Regenerate, and Dismiss.
 *
 * Single Responsibility: Action buttons only, delegates to callbacks
 */

import { Check, RefreshCw, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="flex items-center justify-center gap-2 py-2 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Saving changes...</span>
      </div>
    )
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        <X className="mr-1 h-4 w-4" />
        Dismiss
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={regenerateDisabled}
      >
        <RefreshCw className="mr-1 h-4 w-4" />
        Regenerate
      </Button>
      <Button size="sm" onClick={onApprove}>
        <Check className="mr-1 h-4 w-4" />
        Approve All
      </Button>
    </div>
  )
}
