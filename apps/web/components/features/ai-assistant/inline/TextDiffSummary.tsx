'use client'

/**
 * TextDiffSummary Component
 *
 * Displays a text-based summary for high-density field changes
 * like deload weeks or volume adjustments.
 *
 * Shows a clear summary header (e.g., "Summary: -40% volume")
 * followed by a breakdown of changes per session.
 *
 * @see docs/features/plans/individual/tasks.md T037-T038
 */

import { useState, useEffect } from 'react'
import {
  Bot,
  Check,
  X,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { ProposalFeedbackInput } from './ProposalFeedbackInput'

type SectionState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

/**
 * Session summary for deload changes
 */
interface SessionSummary {
  sessionId: string
  sessionName: string
  dayName?: string
  changes: {
    setsRemoved: number
    setsModified: number
    exercisesAffected: number
    weightReductions: number
    repReductions: number
  }
}

/**
 * Analyze changes to determine if they're deload/volume related
 */
function analyzeDeloadChanges(
  changes: ChangeRequest[],
  sessionLookup: Map<string, { name: string; dayName?: string }>
): {
  isDeloadChange: boolean
  summaryHeader: string
  sessionSummaries: SessionSummary[]
  totalStats: {
    setsRemoved: number
    setsModified: number
    exercisesAffected: number
    sessionsAffected: number
  }
} {
  // Group changes by session
  const sessionChanges = new Map<string, ChangeRequest[]>()
  const exerciseIds = new Set<string>()

  let totalSetsRemoved = 0
  let totalSetsModified = 0
  let isDeloadChange = false

  for (const change of changes) {
    // Get session ID from change
    const sessionId = (change.proposedData?.session_plan_id as string) ||
      (change.currentData?.session_plan_id as string) ||
      'unknown'

    const existing = sessionChanges.get(sessionId) || []
    existing.push(change)
    sessionChanges.set(sessionId, existing)

    // Track exercise IDs affected
    if (change.entityType === 'session_plan_exercise') {
      exerciseIds.add(change.entityId || '')
    }
    if (change.entityType === 'session_plan_set') {
      const exerciseId = (change.proposedData?.session_plan_exercise_id as string) ||
        (change.currentData?.session_plan_exercise_id as string)
      if (exerciseId) exerciseIds.add(exerciseId)
    }

    // Count set changes
    if (change.entityType === 'session_plan_set') {
      if (change.operationType === 'delete') {
        totalSetsRemoved++
        isDeloadChange = true
      } else if (change.operationType === 'update') {
        // Check if this is a volume/weight reduction
        const currentWeight = change.currentData?.weight as number | undefined
        const proposedWeight = change.proposedData?.weight as number | undefined
        if (currentWeight && proposedWeight && proposedWeight < currentWeight) {
          totalSetsModified++
          isDeloadChange = true
        }

        const currentReps = change.currentData?.reps as number | undefined
        const proposedReps = change.proposedData?.reps as number | undefined
        if (currentReps && proposedReps && proposedReps < currentReps) {
          totalSetsModified++
          isDeloadChange = true
        }
      }
    }
  }

  // Build session summaries
  const sessionSummaries: SessionSummary[] = []
  for (const [sessionId, sessionChangeList] of sessionChanges) {
    const sessionInfo = sessionLookup.get(sessionId)
    const summary: SessionSummary = {
      sessionId,
      sessionName: sessionInfo?.name || 'Session',
      dayName: sessionInfo?.dayName,
      changes: {
        setsRemoved: 0,
        setsModified: 0,
        exercisesAffected: 0,
        weightReductions: 0,
        repReductions: 0,
      }
    }

    const sessionExercises = new Set<string>()

    for (const change of sessionChangeList) {
      if (change.entityType === 'session_plan_set') {
        if (change.operationType === 'delete') {
          summary.changes.setsRemoved++
        } else if (change.operationType === 'update') {
          const currentWeight = change.currentData?.weight as number | undefined
          const proposedWeight = change.proposedData?.weight as number | undefined
          if (currentWeight && proposedWeight && proposedWeight < currentWeight) {
            summary.changes.weightReductions++
            summary.changes.setsModified++
          }

          const currentReps = change.currentData?.reps as number | undefined
          const proposedReps = change.proposedData?.reps as number | undefined
          if (currentReps && proposedReps && proposedReps < currentReps) {
            summary.changes.repReductions++
            summary.changes.setsModified++
          }
        }

        const exerciseId = (change.proposedData?.session_plan_exercise_id as string) ||
          (change.currentData?.session_plan_exercise_id as string)
        if (exerciseId) sessionExercises.add(exerciseId)
      }
    }

    summary.changes.exercisesAffected = sessionExercises.size
    sessionSummaries.push(summary)
  }

  // Generate summary header
  let summaryHeader = 'Volume adjustment'
  if (totalSetsRemoved > 0 && totalSetsModified > 0) {
    summaryHeader = `Deload: ${totalSetsRemoved} sets removed, ${totalSetsModified} sets reduced`
  } else if (totalSetsRemoved > 0) {
    summaryHeader = `Volume reduced: ${totalSetsRemoved} sets removed`
  } else if (totalSetsModified > 0) {
    summaryHeader = `Intensity reduced: ${totalSetsModified} sets modified`
  }

  return {
    isDeloadChange,
    summaryHeader,
    sessionSummaries,
    totalStats: {
      setsRemoved: totalSetsRemoved,
      setsModified: totalSetsModified,
      exercisesAffected: exerciseIds.size,
      sessionsAffected: sessionChanges.size,
    }
  }
}

interface TextDiffSummaryProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Lookup map for session info */
  sessionLookup: Map<string, { name: string; dayName?: string }>

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

export function TextDiffSummary({
  changeset,
  sessionLookup,
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  executionError,
  className,
}: TextDiffSummaryProps) {
  const [state, setState] = useState<SectionState>('pending')
  const [feedback, setFeedback] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Analyze changes
  const analysis = analyzeDeloadChanges(changeset.changeRequests, sessionLookup)

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
          Deload changes applied
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
          'rounded-lg border border-teal-500/20 bg-teal-500/5 p-3',
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

  // Main text diff summary
  return (
    <div
      className={cn(
        'rounded-lg',
        'bg-gradient-to-r from-teal-50 to-teal-100/80 dark:from-teal-950/30 dark:to-teal-900/20',
        'border border-teal-200/80 dark:border-teal-800/50',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header row with summary */}
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        {/* Left: Deload indicator + summary header */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-600 dark:bg-teal-600 shadow-sm">
            <TrendingDown className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-100">
              {analysis.summaryHeader}
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400">
              {analysis.totalStats.sessionsAffected} session{analysis.totalStats.sessionsAffected !== 1 ? 's' : ''} affected
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRegenerateClick}
            disabled={state === 'executing'}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
              'text-teal-600 dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-800/30',
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
              'bg-teal-600 dark:bg-teal-600 text-white',
              'hover:bg-teal-700 dark:hover:bg-teal-500 active:bg-teal-800',
              'shadow-sm transition-all',
              state === 'executing' && 'opacity-70 cursor-not-allowed'
            )}
            aria-label={state === 'executing' ? 'Applying deload changes' : 'Apply deload changes'}
          >
            {state === 'executing' ? (
              <div role="status" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span className="sr-only">Applying deload changes...</span>
                <span aria-hidden="true">Applying</span>
              </div>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Apply Deload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats summary bar */}
      <div className="border-t border-teal-200/60 dark:border-teal-800/40 px-3 py-2">
        <div className="flex items-center gap-4 text-xs text-teal-700 dark:text-teal-300">
          {analysis.totalStats.setsRemoved > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-red-600 dark:text-red-400">-{analysis.totalStats.setsRemoved}</span>
              <span>sets removed</span>
            </div>
          )}
          {analysis.totalStats.setsModified > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-amber-600 dark:text-amber-400">{analysis.totalStats.setsModified}</span>
              <span>sets reduced</span>
            </div>
          )}
          {analysis.totalStats.exercisesAffected > 0 && (
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-teal-500 dark:text-teal-400" />
              <span>{analysis.totalStats.exercisesAffected} exercises</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable session details */}
      {analysis.sessionSummaries.length > 0 && (
        <div className="border-t border-teal-200/60 dark:border-teal-800/40">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            aria-expanded={isExpanded}
            aria-controls="text-diff-session-breakdown"
            aria-label={isExpanded ? "Hide session breakdown" : "View session breakdown"}
          >
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
              View session breakdown
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-teal-500 dark:text-teal-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-teal-500 dark:text-teal-400" aria-hidden="true" />
            )}
          </button>

          {isExpanded && (
            <div id="text-diff-session-breakdown" className="px-3 pb-3 space-y-2">
              {analysis.sessionSummaries.map((session) => (
                <div
                  key={session.sessionId}
                  className="text-xs bg-white/50 dark:bg-black/20 rounded-md p-2 space-y-1"
                >
                  <div className="font-medium text-teal-800 dark:text-teal-200">
                    {session.dayName || session.sessionName}
                  </div>
                  <div className="text-teal-600 dark:text-teal-400">
                    {session.changes.exercisesAffected} exercise{session.changes.exercisesAffected !== 1 ? 's' : ''}
                    {session.changes.setsRemoved > 0 && ` · ${session.changes.setsRemoved} sets removed`}
                    {session.changes.setsModified > 0 && ` · ${session.changes.setsModified} sets reduced`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Check if a changeset appears to be a deload/volume change
 */
export function isDeloadChangeSet(changeset: ChangeSet): boolean {
  // Check title/description for deload keywords
  const title = changeset.title.toLowerCase()
  const description = changeset.description.toLowerCase()

  if (
    title.includes('deload') ||
    title.includes('volume') ||
    title.includes('reduce') ||
    title.includes('fatigue') ||
    description.includes('deload') ||
    description.includes('volume')
  ) {
    return true
  }

  // Check if there are significant set deletions or weight reductions
  let setDeletions = 0
  let weightReductions = 0

  for (const change of changeset.changeRequests) {
    if (change.entityType === 'session_plan_set') {
      if (change.operationType === 'delete') {
        setDeletions++
      } else if (change.operationType === 'update') {
        const currentWeight = change.currentData?.weight as number | undefined
        const proposedWeight = change.proposedData?.weight as number | undefined
        if (currentWeight && proposedWeight && proposedWeight < currentWeight) {
          weightReductions++
        }
      }
    }
  }

  // If there are multiple set deletions or weight reductions, likely a deload
  return setDeletions >= 3 || weightReductions >= 3
}

export type { SessionSummary }
