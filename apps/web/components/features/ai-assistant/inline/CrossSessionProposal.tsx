'use client'

/**
 * CrossSessionProposal Component
 *
 * Displays proposals that target a different session than the one currently viewed.
 * Shows context indicator, expandable preview, and "Jump to [Session]" link.
 *
 * @see docs/features/plans/individual/tasks.md T027-T029
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Bot,
  Check,
  X,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { ProposalFeedbackInput } from './ProposalFeedbackInput'

type SectionState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

/**
 * Session info for the target session
 */
interface TargetSessionInfo {
  id: string
  name: string
  dayName?: string
}

/**
 * Extract session ID from a change request's proposed data
 */
function getSessionIdFromChange(change: ChangeRequest): string | null {
  // For session_plan_exercise, the session_plan_id is in proposedData
  if (change.entityType === 'session_plan_exercise' && change.proposedData) {
    const sessionPlanId = change.proposedData.session_plan_id
    return typeof sessionPlanId === 'string' ? sessionPlanId : null
  }
  // For session_plan_set, we need to trace back through the exercise
  // For now, return null - sets inherit from their exercise
  return null
}

/**
 * Categorize changes by their target session
 */
interface SessionChanges {
  sessionId: string
  sessionInfo?: TargetSessionInfo
  changes: ChangeRequest[]
}

/**
 * Group changes by target session
 */
function groupChangesBySession(
  changes: ChangeRequest[],
  currentSessionId: string | null,
  sessionLookup: Map<string, TargetSessionInfo>
): {
  currentSession: ChangeRequest[]
  otherSessions: SessionChanges[]
} {
  const currentSession: ChangeRequest[] = []
  const otherSessionsMap = new Map<string, ChangeRequest[]>()

  for (const change of changes) {
    const targetSessionId = getSessionIdFromChange(change)

    if (!targetSessionId || targetSessionId === currentSessionId) {
      currentSession.push(change)
    } else {
      const existing = otherSessionsMap.get(targetSessionId) || []
      existing.push(change)
      otherSessionsMap.set(targetSessionId, existing)
    }
  }

  const otherSessions: SessionChanges[] = []
  for (const [sessionId, sessionChanges] of otherSessionsMap) {
    otherSessions.push({
      sessionId,
      sessionInfo: sessionLookup.get(sessionId),
      changes: sessionChanges,
    })
  }

  return { currentSession, otherSessions }
}

/**
 * Generate compact summary for a group of changes
 */
function getCompactSummary(changes: ChangeRequest[]): string {
  const counts = { add: 0, update: 0, remove: 0 }

  for (const change of changes) {
    if (change.operationType === 'create') counts.add++
    else if (change.operationType === 'update') counts.update++
    else if (change.operationType === 'delete') counts.remove++
  }

  const parts: string[] = []
  if (counts.add > 0) parts.push(`+${counts.add}`)
  if (counts.update > 0) parts.push(`${counts.update} update${counts.update > 1 ? 's' : ''}`)
  if (counts.remove > 0) parts.push(`-${counts.remove}`)

  return parts.join(', ') || 'No changes'
}

interface CrossSessionProposalProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Currently viewed session ID */
  currentSessionId: string | null

  /** Lookup map for session info (id -> {name, dayName}) */
  sessionLookup: Map<string, TargetSessionInfo>

  /** Called when user approves all changes */
  onApprove: () => Promise<void>

  /** Called when user wants AI to regenerate with feedback */
  onRegenerate: (feedback?: string) => void

  /** Called when user dismisses/rejects all changes */
  onDismiss: () => void

  /** Called when user wants to jump to a target session */
  onJumpToSession: (sessionId: string) => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Execution error if any */
  executionError?: ExecutionError

  /** Additional className for styling */
  className?: string
}

export function CrossSessionProposal({
  changeset,
  currentSessionId,
  sessionLookup,
  onApprove,
  onRegenerate,
  onDismiss,
  onJumpToSession,
  isExecuting = false,
  executionError,
  className,
}: CrossSessionProposalProps) {
  const [state, setState] = useState<SectionState>('pending')
  const [feedback, setFeedback] = useState('')
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  // Group changes by session
  const { currentSession, otherSessions } = useMemo(
    () => groupChangesBySession(changeset.changeRequests, currentSessionId, sessionLookup),
    [changeset.changeRequests, currentSessionId, sessionLookup]
  )

  const totalChangeCount = changeset.changeRequests.length
  const hasOtherSessionChanges = otherSessions.length > 0

  // Sync external state with useEffect to avoid setState during render
  useEffect(() => {
    if (executionError) {
      setState('error')
    } else if (isExecuting) {
      setState('executing')
    } else if (!isExecuting && !executionError && state === 'executing') {
      setState('success')
    }
  }, [executionError, isExecuting, state])

  const handleApprove = async () => {
    setState('executing')
    try {
      await onApprove()
      setState('success')
    } catch {
      setState('error')
    }
  }

  const handleRegenerateClick = () => {
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

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  // Success state
  if (state === 'success') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-emerald-500/10 border border-emerald-500/20',
          'animate-in fade-in-0 duration-200',
          className
        )}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-3 w-3 text-white" />
        </div>
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Changes applied
        </span>
      </div>
    )
  }

  // Error state
  if (state === 'error' && executionError) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2 rounded-lg',
          'bg-red-500/10 border border-red-500/20',
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500">
            <X className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm text-red-700 dark:text-red-400 truncate">
            {formatErrorForUser(executionError)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setState('pending')}
            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded transition-colors"
            aria-label="Retry applying changes"
          >
            Retry
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss proposal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  // Feedback input mode
  if (state === 'feedback') {
    return (
      <div
        className={cn(
          'rounded-lg border border-blue-500/20 bg-blue-500/5 p-3',
          'animate-in fade-in-0 slide-in-from-top-1 duration-200',
          className
        )}
      >
        <ProposalFeedbackInput
          value={feedback}
          onChange={setFeedback}
          onSubmit={handleRegenerateClick}
          onCancel={handleCancelFeedback}
        />
      </div>
    )
  }

  // Main cross-session proposal bar
  return (
    <div
      className={cn(
        'rounded-lg',
        'bg-gradient-to-r from-amber-50 to-amber-100/80 dark:from-amber-950/30 dark:to-amber-900/20',
        'border border-amber-200/80 dark:border-amber-800/50',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        {/* Left: AI indicator + summary */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-600 dark:bg-amber-600 shadow-sm">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-100 tabular-nums">
              {totalChangeCount}
            </span>
            <span className="text-sm text-amber-600 dark:text-amber-400">
              change{totalChangeCount !== 1 ? 's' : ''}
            </span>
            {hasOtherSessionChanges && (
              <>
                <span className="text-amber-400 dark:text-amber-600 mx-0.5">|</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  across {otherSessions.length + (currentSession.length > 0 ? 1 : 0)} session{otherSessions.length + (currentSession.length > 0 ? 1 : 0) !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRegenerateClick}
            disabled={state === 'executing'}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
              'text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/30',
              state === 'executing' && 'opacity-50 cursor-not-allowed'
            )}
            title="Regenerate with feedback"
            aria-label="Provide feedback to regenerate proposal"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Change</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={state === 'executing'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              'bg-amber-600 dark:bg-amber-600 text-white',
              'hover:bg-amber-700 dark:hover:bg-amber-500 active:bg-amber-800',
              'shadow-sm transition-all',
              state === 'executing' && 'opacity-70 cursor-not-allowed'
            )}
            aria-label={state === 'executing' ? 'Applying changes' : 'Apply all proposed changes'}
          >
            {state === 'executing' ? (
              <div role="status" aria-live="polite" className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span className="sr-only">Applying changes...</span>
                <span aria-hidden="true">Applying</span>
              </div>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Apply All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cross-session changes detail (always shown for other sessions) */}
      {hasOtherSessionChanges && (
        <div className="border-t border-amber-200/60 dark:border-amber-800/40 px-3 py-2 space-y-2">
          {/* Current session changes (if any) */}
          {currentSession.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-800 dark:text-amber-200">Current session</span>
                <span className="text-amber-600 dark:text-amber-400">({getCompactSummary(currentSession)})</span>
              </div>
            </div>
          )}

          {/* Other session changes */}
          {otherSessions.map(({ sessionId, sessionInfo, changes }) => {
            const isExpanded = expandedSessions.has(sessionId)
            const sessionDisplayName = sessionInfo?.dayName || sessionInfo?.name || `Session ${sessionId.slice(0, 8)}`
            const contentId = `session-${sessionId}-content`

            return (
              <div key={sessionId} className="space-y-1">
                <button
                  onClick={() => toggleSessionExpand(sessionId)}
                  className="w-full flex items-center justify-between text-sm hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  aria-label={isExpanded ? `Collapse ${sessionDisplayName} details` : `Expand ${sessionDisplayName} details`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {sessionDisplayName}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">({getCompactSummary(changes)})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {/* Expanded preview */}
                {isExpanded && (
                  <div id={contentId} className="ml-5 pl-2 border-l-2 border-amber-200 dark:border-amber-800 space-y-1">
                    {changes.slice(0, 5).map((change) => (
                      <div key={change.id} className="text-xs text-amber-700 dark:text-amber-300">
                        {change.operationType === 'create' && '+ Add '}
                        {change.operationType === 'update' && '~ Update '}
                        {change.operationType === 'delete' && '- Remove '}
                        {change.entityType.replace('session_plan_', '')}
                        {change.proposedData?.name && `: ${change.proposedData.name}`}
                      </div>
                    ))}
                    {changes.length > 5 && (
                      <div className="text-xs text-amber-500 dark:text-amber-500">
                        +{changes.length - 5} more...
                      </div>
                    )}

                    {/* Jump to session link */}
                    <button
                      onClick={() => onJumpToSession(sessionId)}
                      className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 mt-1"
                      aria-label={`Jump to ${sessionDisplayName}`}
                    >
                      <span>Jump to {sessionInfo?.dayName || sessionInfo?.name || 'this session'}</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Check if a changeset has cross-session changes
 */
export function hasCrossSessionChanges(
  changeset: ChangeSet,
  currentSessionId: string | null
): boolean {
  for (const change of changeset.changeRequests) {
    const targetSessionId = getSessionIdFromChange(change)
    if (targetSessionId && targetSessionId !== currentSessionId) {
      return true
    }
  }
  return false
}

export type { TargetSessionInfo, SessionChanges }
