'use client'

/**
 * InlineProposalSection Component
 *
 * Main container for displaying AI proposals inline on the page.
 * Orchestrates the header, change list, action bar, and status displays.
 *
 * This component is designed to be rendered as part of the page flow,
 * not as an overlay.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ExecutionError } from '@/lib/changeset/types'
import { getChangeSummary } from '@/lib/changeset/ui-helpers'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { ChangeList } from '../ChangePreview'
import { ProposalHeader } from './ProposalHeader'
import { ProposalActionBar } from './ProposalActionBar'
import { ProposalFeedbackInput } from './ProposalFeedbackInput'
import { ProposalStatusBanner } from './ProposalStatusBanner'

type SectionState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

interface InlineProposalSectionProps {
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

  /** Additional className for styling */
  className?: string
}

export function InlineProposalSection({
  changeset,
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  executionError,
  className,
}: InlineProposalSectionProps) {
  const [state, setState] = useState<SectionState>('pending')
  const [feedback, setFeedback] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const changeCount = changeset.changeRequests.length
  const summary = getChangeSummary(changeset.changeRequests)

  // Sync external state
  useEffect(() => {
    if (executionError) {
      setState('error')
    } else if (isExecuting) {
      setState('executing')
    }
  }, [executionError, isExecuting])

  const handleApprove = async () => {
    setState('executing')
    try {
      await onApprove()
      setState('success')
      // Auto-hide after success (parent will handle cleanup)
    } catch {
      setState('error')
    }
  }

  const handleRegenerateClick = () => {
    if (state === 'feedback') {
      // Submit feedback
      onRegenerate(feedback || undefined)
      setFeedback('')
      setState('pending')
    } else {
      // Open feedback input
      setState('feedback')
    }
  }

  const handleCancelFeedback = () => {
    setFeedback('')
    setState('pending')
  }

  const handleRetry = () => {
    setState('pending')
  }

  // Success state - minimal display
  if (state === 'success') {
    return (
      <div className={cn('rounded-lg', className)}>
        <ProposalStatusBanner
          type="success"
          message="Changes saved successfully!"
        />
      </div>
    )
  }

  // Error state
  if (state === 'error' && executionError) {
    return (
      <div className={cn('rounded-lg', className)}>
        <ProposalStatusBanner
          type="error"
          message={formatErrorForUser(executionError)}
          onDismiss={onDismiss}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50/50',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <ProposalHeader
          changeCount={changeCount}
          summary={summary}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {/* Change list (collapsible) */}
      {isExpanded && state !== 'feedback' && (
        <div className="max-h-60 overflow-y-auto px-4 pb-2">
          <ChangeList changes={changeset.changeRequests} />
        </div>
      )}

      {/* Feedback input (when in feedback mode) */}
      {state === 'feedback' && (
        <div className="px-4 pb-4">
          <ProposalFeedbackInput
            value={feedback}
            onChange={setFeedback}
            onSubmit={handleRegenerateClick}
            onCancel={handleCancelFeedback}
          />
        </div>
      )}

      {/* Action bar */}
      {state !== 'feedback' && (
        <div className="border-t border-blue-200 bg-blue-50 p-3">
          <ProposalActionBar
            onApprove={handleApprove}
            onRegenerate={handleRegenerateClick}
            onDismiss={onDismiss}
            isExecuting={state === 'executing'}
          />
        </div>
      )}
    </div>
  )
}
