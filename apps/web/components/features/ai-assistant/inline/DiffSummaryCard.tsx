'use client'

/**
 * DiffSummaryCard Component
 *
 * Compact summary card for high-density AI change proposals.
 * Shows aggregated changes with optional expand/collapse for details.
 *
 * Used when change density exceeds inline display thresholds,
 * particularly on mobile devices.
 *
 * @see docs/features/plans/individual/tasks.md T057, T058, T060, T061
 */

import { useState, useEffect } from 'react'
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { formatErrorForUser } from '@/lib/changeset/errors'
import { generateSetChangeSummary, analyzeChangeDensity } from './utils'
import { ProposalFeedbackInput } from './ProposalFeedbackInput'

type CardState = 'pending' | 'feedback' | 'executing' | 'success' | 'error'

/**
 * Format a field change for display.
 * Handles snake_case to readable format conversion.
 */
function formatFieldName(field: string): string {
  const labels: Record<string, string> = {
    weight: 'Weight',
    reps: 'Reps',
    distance: 'Distance',
    performing_time: 'Time',
    performingTime: 'Time',
    height: 'Height',
    power: 'Power',
    velocity: 'Velocity',
    rpe: 'RPE',
    rest_time: 'Rest',
    restTime: 'Rest',
    tempo: 'Tempo',
    effort: 'Effort',
    resistance: 'Resistance',
  }
  return labels[field] || field
}

/**
 * Format a value with appropriate units.
 */
function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '-'

  const units: Record<string, string> = {
    weight: 'kg',
    distance: 'm',
    performing_time: 's',
    performingTime: 's',
    height: 'cm',
    power: 'W',
    velocity: 'm/s',
    rest_time: 's',
    restTime: 's',
    effort: '%',
  }

  const unit = units[field] || ''
  return `${value}${unit}`
}

/**
 * Get detailed change breakdown for expand view.
 */
function getDetailedChanges(changes: ChangeRequest[]): Array<{
  field: string
  oldValue: unknown
  newValue: unknown
  setIndex?: number
}> {
  const details: Array<{
    field: string
    oldValue: unknown
    newValue: unknown
    setIndex?: number
  }> = []

  for (const change of changes) {
    if (change.entityType !== 'session_plan_set' || change.operationType !== 'update') continue

    const current = change.currentData
    const proposed = change.proposedData
    if (!current || !proposed) continue

    const setIndex = (current.set_index ?? current.setIndex) as number | undefined

    const numericFields = [
      'weight', 'reps', 'distance', 'performing_time', 'performingTime',
      'height', 'power', 'velocity', 'rpe', 'rest_time', 'restTime', 'effort'
    ]

    for (const field of numericFields) {
      const oldVal = current[field]
      const newVal = proposed[field]

      if (newVal !== undefined && newVal !== oldVal) {
        details.push({
          field,
          oldValue: oldVal,
          newValue: newVal,
          setIndex,
        })
      }
    }
  }

  return details
}

interface DiffSummaryCardProps {
  /** The changeset to summarize */
  changeset: ChangeSet

  /** Exercise name for context (optional) */
  exerciseName?: string

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

export function DiffSummaryCard({
  changeset,
  exerciseName,
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  executionError,
  className,
}: DiffSummaryCardProps) {
  const [state, setState] = useState<CardState>('pending')
  const [feedback, setFeedback] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Analyze change density
  const density = analyzeChangeDensity(changeset)
  const setChanges = changeset.changeRequests.filter(c => c.entityType === 'session_plan_set')
  const summary = generateSetChangeSummary(setChanges)
  const detailedChanges = getDetailedChanges(setChanges)

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

  // Success state - brief flash
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
          'rounded-lg border border-amber-500/20 bg-amber-500/5 p-3',
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

  // Main summary card
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden',
        'bg-gradient-to-r from-amber-50 to-amber-100/80',
        'dark:from-amber-950/30 dark:to-amber-900/20',
        'border border-amber-200/80 dark:border-amber-800/50',
        'shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Main header row */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        {/* Left: AI indicator + summary (T058) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500 dark:bg-amber-600 shadow-sm">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            {/* Summary text format: "3 sets - weight +5kg, reps +2" */}
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100 truncate">
              {summary.summary}
            </span>
            {exerciseName && (
              <span className="text-xs text-amber-700/70 dark:text-amber-300/60 truncate">
                {exerciseName}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (T061) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Change button */}
          <button
            onClick={handleRegenerateClick}
            disabled={state === 'executing'}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
              'text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200',
              'hover:bg-amber-200/50 dark:hover:bg-amber-800/30',
              state === 'executing' && 'opacity-50 cursor-not-allowed'
            )}
            title="Regenerate with feedback"
            aria-label="Provide feedback to regenerate proposal"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Change</span>
          </button>

          {/* Apply All button (T061) */}
          <button
            onClick={handleApprove}
            disabled={state === 'executing'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              'bg-amber-500 dark:bg-amber-600 text-white',
              'hover:bg-amber-600 dark:hover:bg-amber-500 active:bg-amber-700',
              'shadow-sm transition-all',
              state === 'executing' && 'opacity-70 cursor-not-allowed'
            )}
            aria-label={state === 'executing' ? 'Applying changes' : 'Apply all proposed changes'}
          >
            {state === 'executing' ? (
              <div role="status" aria-live="polite">
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

      {/* View Details expand/collapse (T060) */}
      {detailedChanges.length > 0 && (
        <div className="border-t border-amber-200/60 dark:border-amber-800/40">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
            aria-expanded={isExpanded}
            aria-controls="diff-summary-details"
            aria-label={isExpanded ? "Hide change details" : "View change details"}
          >
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {isExpanded ? 'Hide Details' : 'View Details'}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
          </button>

          {/* Expanded details */}
          {isExpanded && (
            <div id="diff-summary-details" className="px-3 pb-3 space-y-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
              {detailedChanges.map((change, index) => (
                <div
                  key={`${change.field}-${index}`}
                  className="flex items-center gap-2 text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1.5"
                >
                  {change.setIndex !== undefined && (
                    <span className="text-amber-600/60 dark:text-amber-400/60 font-mono">
                      S{change.setIndex}
                    </span>
                  )}
                  <span className="font-medium text-amber-800 dark:text-amber-200">
                    {formatFieldName(change.field)}:
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 line-through">
                    {formatValue(change.field, change.oldValue)}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">→</span>
                  <span className="font-medium text-amber-900 dark:text-amber-100">
                    {formatValue(change.field, change.newValue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats bar for additional context */}
      <div className="border-t border-amber-200/60 dark:border-amber-800/40 px-3 py-1.5">
        <div className="flex items-center gap-3 text-[10px] text-amber-700/70 dark:text-amber-300/60">
          <span>{density.setsAffected} set{density.setsAffected !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{density.totalFieldChanges} field{density.totalFieldChanges !== 1 ? 's' : ''}</span>
          {density.exerciseOperations > 0 && (
            <>
              <span>•</span>
              <span>{density.exerciseOperations} exercise{density.exerciseOperations !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
