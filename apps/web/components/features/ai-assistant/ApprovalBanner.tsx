'use client'

/**
 * ApprovalBanner Component
 *
 * Minimal banner for batch approval of AI changes.
 * Design: Collapsed by default, tap to see simple change list.
 *
 * @see specs/004-feature-pattern-standard/ai-ui-proposal.md
 */

import { useState } from 'react'
import { Bot, Check, RefreshCw, X, Loader2, AlertCircle, ChevronDown, ChevronUp, Plus, Edit2, Minus, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { getChangeSummary } from '@/lib/changeset/ui-helpers'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { cn } from '@/lib/utils'

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

/**
 * Get icon for change type
 */
function getChangeIcon(change: ChangeRequest) {
  if (change.operationType === 'create') return Plus
  if (change.operationType === 'delete') return Minus
  // Check if it's a swap (exercise_id changed)
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

  // Try to get exercise name from proposed or current data
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
    // Check for swap
    if (change.proposedData?.exercise_id && change.currentData?.exercise_id) {
      const oldName = change.currentData?.exercise_name || change.currentData?.exerciseName || 'exercise'
      const newName = change.proposedData?.exercise_name || change.proposedData?.exerciseName || 'new exercise'
      return `Swap ${oldName} → ${newName}`
    }
    return name ? `Update ${name}` : `Update ${entity}`
  }
  return `${change.operationType} ${entity}`
}

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
  const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default per spec

  const changeCount = changeset.changeRequests.length
  const summary = getChangeSummary(changeset.changeRequests)

  const handleApprove = async () => {
    setState('executing')
    try {
      await onApprove()
      setState('success')
      // Note: Don't call onDismiss here - SessionAssistant.handleApprove
      // already clears the changeset and hides the banner via setShowBanner(false)
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-green-50 p-3">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-green-700">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Changes saved!</span>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-red-50 p-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setState('pending')}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Executing state
  if (state === 'executing' || isExecuting) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-blue-50 p-3">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      </div>
    )
  }

  // Feedback input state
  if (state === 'feedback') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 shadow-lg">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-xs text-gray-500">
            What should the AI change?
          </p>
          <div className="flex gap-2">
            <Input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Use lighter weights..."
              className="flex-1 h-9 text-sm"
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
            <Button variant="ghost" size="sm" onClick={handleCancelFeedback}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRegenerate} disabled={!feedback}>
              Send
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Default pending state - minimal banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <div className="mx-auto max-w-4xl">
        {/* Compact header */}
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <Bot className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {changeCount} Change{changeCount !== 1 ? 's' : ''} Pending
              </p>
              {!isExpanded && (
                <p className="text-xs text-gray-500">{summary}</p>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8 px-2">
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRegenerate} className="h-8 px-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleApprove} className="h-8">
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>

        {/* Simple change list when expanded */}
        {isExpanded && (
          <div className="border-t px-3 pb-3 pt-2">
            <div className="space-y-1">
              {changeset.changeRequests.map((change) => {
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
          </div>
        )}
      </div>
    </div>
  )
}
