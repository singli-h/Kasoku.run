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
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Minus, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { getChangeSummary } from '@/lib/changeset/ui-helpers'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { ProposalHeader } from './ProposalHeader'
import { ProposalActionBar } from './ProposalActionBar'
import { ProposalFeedbackInput } from './ProposalFeedbackInput'
import { ProposalStatusBanner } from './ProposalStatusBanner'

type SectionState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

/**
 * Get icon for change type
 */
function getChangeIcon(change: ChangeRequest) {
  if (change.operationType === 'create') return Plus
  if (change.operationType === 'delete') return Minus
  if (change.operationType === 'update' && change.proposedData?.exercise_id) {
    return ArrowRightLeft
  }
  return Edit2
}

/**
 * Get simple label for a change
 */
function getChangeLabel(change: ChangeRequest): string {
  const entityLabels: Record<string, string> = {
    preset_session: 'Session',
    preset_exercise: 'Exercise',
    preset_set: 'Set',
  }
  const entity = entityLabels[change.entityType] || change.entityType

  const name = change.proposedData?.exercise_name
    || change.proposedData?.exerciseName
    || change.currentData?.exercise_name
    || change.currentData?.exerciseName

  if (change.operationType === 'create') {
    return name ? `Add ${name}` : `Add ${entity}`
  }
  if (change.operationType === 'delete') {
    return name ? `Remove ${name}` : `Remove ${entity}`
  }
  if (change.operationType === 'update') {
    if (change.proposedData?.exercise_id && change.currentData?.exercise_id) {
      const oldName = change.currentData?.exercise_name || change.currentData?.exerciseName || 'exercise'
      const newName = change.proposedData?.exercise_name || change.proposedData?.exerciseName || 'new exercise'
      return `Swap ${oldName} → ${newName}`
    }
    return name ? `Update ${name}` : `Update ${entity}`
  }
  return `${change.operationType} ${entity}`
}

/**
 * Simple inline change list component
 */
function SimpleChangeList({ changes }: { changes: ChangeRequest[] }) {
  if (changes.length === 0) {
    return (
      <div className="py-2 text-center text-sm text-gray-500">
        No pending changes
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {changes.map((change) => {
        const Icon = getChangeIcon(change)
        return (
          <div
            key={change.id}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1 text-sm',
              change.operationType === 'create' && 'bg-green-50 text-green-700',
              change.operationType === 'delete' && 'bg-red-50 text-red-700',
              change.operationType === 'update' && 'bg-amber-50 text-amber-700'
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span>{getChangeLabel(change)}</span>
          </div>
        )
      })}
    </div>
  )
}

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
  const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default per spec

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
          message="Changes saved!"
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
        'rounded-lg border border-amber-200 bg-amber-50/50',
        className
      )}
    >
      {/* Header */}
      <div className="p-3">
        <ProposalHeader
          changeCount={changeCount}
          summary={summary}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {/* Change list (collapsible) */}
      {isExpanded && state !== 'feedback' && (
        <div className="max-h-48 overflow-y-auto px-3 pb-2">
          <SimpleChangeList changes={changeset.changeRequests} />
        </div>
      )}

      {/* Feedback input (when in feedback mode) */}
      {state === 'feedback' && (
        <div className="px-3 pb-3">
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
        <div className="border-t border-amber-200 bg-amber-50 p-2">
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
