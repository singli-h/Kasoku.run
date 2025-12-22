'use client'

/**
 * ApprovalBanner Component
 *
 * Displays pending AI changes and provides approve/regenerate/dismiss actions.
 * Sticky banner at the bottom of the session view.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { useState } from 'react'
import { Bot, Check, RefreshCw, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChangeSet, ExecutionError } from '@/lib/changeset/types'
import { getChangeSummary } from '@/lib/changeset/ui-helpers'
import { formatErrorForUser } from '@/lib/changeset/errors'

interface ApprovalBannerProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Called when user approves all changes */
  onApprove: () => Promise<void>

  /** Called when user wants AI to regenerate with feedback */
  onRegenerate: (feedback?: string) => void

  /** Called when user dismisses/rejects all changes */
  onDismiss: () => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Execution error if any */
  executionError?: ExecutionError
}

type BannerState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

export function ApprovalBanner({
  changeset,
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  executionError,
}: ApprovalBannerProps) {
  const [state, setState] = useState<BannerState>(
    executionError ? 'error' : isExecuting ? 'executing' : 'pending'
  )
  const [feedback, setFeedback] = useState('')

  const changeCount = changeset.changeRequests.length
  const summary = getChangeSummary(changeset.changeRequests)

  const handleApprove = async () => {
    setState('executing')
    try {
      await onApprove()
      setState('success')
      // Auto-dismiss after success
      setTimeout(() => {
        onDismiss()
      }, 2000)
    } catch {
      setState('error')
    }
  }

  const handleRegenerate = () => {
    if (state === 'feedback') {
      onRegenerate(feedback || undefined)
      setFeedback('')
      setState('pending')
    } else {
      setState('feedback')
    }
  }

  const handleCancelFeedback = () => {
    setFeedback('')
    setState('pending')
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-green-50 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-green-700">
          <Check className="h-5 w-5" />
          <span className="font-medium">Changes saved successfully!</span>
        </div>
      </div>
    )
  }

  // Error state
  if (state === 'error' || executionError) {
    const errorMessage = executionError
      ? formatErrorForUser(executionError)
      : 'Failed to save changes'

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-red-50 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setState('pending')}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Executing state
  if (state === 'executing' || isExecuting) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-blue-50 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-blue-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Saving changes...</span>
        </div>
      </div>
    )
  }

  // Feedback input state
  if (state === 'feedback') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-sm text-gray-600">
            What would you like the AI to change?
          </p>
          <div className="flex gap-2">
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Use lighter weights, add more sets..."
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && feedback) {
                  handleRegenerate()
                }
                if (e.key === 'Escape') {
                  handleCancelFeedback()
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={handleCancelFeedback}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRegenerate} disabled={!feedback}>
              Send Feedback
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default pending state
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
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

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="mr-1 h-4 w-4" />
            Dismiss
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Regenerate
          </Button>
          <Button size="sm" onClick={handleApprove}>
            <Check className="mr-1 h-4 w-4" />
            Approve All
          </Button>
        </div>
      </div>
    </div>
  )
}
