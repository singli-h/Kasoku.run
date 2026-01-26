'use client'

/**
 * BlockSummarySection Component
 *
 * Displays proposals that span multiple weeks (block-wide changes).
 * Shows a text summary with week-by-week breakdown in the chat area.
 * Features [Looks Good] and [Make Changes] approval buttons.
 *
 * @see docs/features/plans/individual/tasks.md T041-T045
 */

import { useState, useMemo, useEffect } from 'react'
import {
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { formatErrorForUser } from '@/lib/changeset/errors'

type SectionState = 'pending' | 'editing' | 'executing' | 'success' | 'error'

/**
 * Week info for the block summary
 */
interface WeekInfo {
  id: number
  name: string | null
  sessions: Array<{
    id: string
    name: string | null
    day: number | null
  }>
}

/**
 * Week-level change summary
 */
interface WeekChangeSummary {
  weekId: number
  weekName: string
  sessions: SessionChangeSummary[]
  totalChanges: number
}

/**
 * Session-level change summary
 */
interface SessionChangeSummary {
  sessionId: string
  sessionName: string
  dayName: string
  changes: ChangeDetail[]
}

/**
 * Individual change detail
 */
interface ChangeDetail {
  type: 'add' | 'update' | 'remove'
  entityType: string
  description: string
}

/**
 * Extract session ID from a change request
 */
function getSessionIdFromChange(change: ChangeRequest): string | null {
  if (change.entityType === 'session_plan_exercise' && change.proposedData) {
    return change.proposedData.session_plan_id as string | null
  }
  if (change.entityType === 'session_plan' && change.entityId) {
    return String(change.entityId)
  }
  return null
}

/**
 * Get day name from day number
 */
function getDayName(day: number | null): string {
  if (day === null) return 'Unscheduled'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[day] ?? 'Day'
}

/**
 * Get a description for a change
 */
function getChangeDescription(change: ChangeRequest): string {
  const name =
    (change.proposedData?.name as string) ||
    (change.currentData?.name as string) ||
    'item'

  if (change.operationType === 'create') {
    return `Add ${name}`
  } else if (change.operationType === 'update') {
    const currentName = change.currentData?.name as string | undefined
    const proposedName = change.proposedData?.name as string | undefined
    if (currentName && proposedName && currentName !== proposedName) {
      return `${currentName} -> ${proposedName}`
    }
    return `Update ${name}`
  } else if (change.operationType === 'delete') {
    return `Remove ${name}`
  }
  return name
}

/**
 * Analyze changes to build week-by-week summary
 */
function buildWeekSummaries(
  changes: ChangeRequest[],
  weeks: WeekInfo[],
  sessionToWeekMap: Map<string, number>
): WeekChangeSummary[] {
  // Group changes by week -> session
  const weekMap = new Map<number, Map<string, ChangeRequest[]>>()

  for (const change of changes) {
    const sessionId = getSessionIdFromChange(change)
    if (!sessionId) continue

    const weekId = sessionToWeekMap.get(sessionId)
    if (weekId === undefined) continue

    if (!weekMap.has(weekId)) {
      weekMap.set(weekId, new Map())
    }
    const sessionMap = weekMap.get(weekId)!
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, [])
    }
    sessionMap.get(sessionId)!.push(change)
  }

  // Convert to summaries
  const summaries: WeekChangeSummary[] = []

  for (const week of weeks) {
    const weekChanges = weekMap.get(week.id)
    if (!weekChanges || weekChanges.size === 0) continue

    const sessionSummaries: SessionChangeSummary[] = []
    let totalChanges = 0

    for (const session of week.sessions) {
      const sessionChanges = weekChanges.get(session.id)
      if (!sessionChanges || sessionChanges.length === 0) continue

      const details: ChangeDetail[] = sessionChanges.map((change) => ({
        type:
          change.operationType === 'create'
            ? 'add'
            : change.operationType === 'update'
              ? 'update'
              : 'remove',
        entityType: change.entityType.replace('session_plan_', ''),
        description: getChangeDescription(change),
      }))

      sessionSummaries.push({
        sessionId: session.id,
        sessionName: session.name || 'Session',
        dayName: getDayName(session.day),
        changes: details,
      })

      totalChanges += sessionChanges.length
    }

    if (sessionSummaries.length > 0) {
      summaries.push({
        weekId: week.id,
        weekName: week.name || `Week ${week.id}`,
        sessions: sessionSummaries,
        totalChanges,
      })
    }
  }

  return summaries
}

interface BlockSummarySectionProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Weeks in the training block */
  weeks: WeekInfo[]

  /** Mapping from session ID to week ID */
  sessionToWeekMap: Map<string, number>

  /** Called when user approves (clicks "Looks Good") */
  onApprove: () => Promise<void>

  /** Called when user wants to modify (with optional feedback) */
  onModify: (feedback: string) => void

  /** Called when user dismisses */
  onDismiss: () => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Execution error if any */
  executionError?: ExecutionError

  /** Whether the section is expanded to full width */
  isExpanded?: boolean

  /** Additional className for styling */
  className?: string
}

export function BlockSummarySection({
  changeset,
  weeks,
  sessionToWeekMap,
  onApprove,
  onModify,
  onDismiss,
  isExecuting = false,
  executionError,
  isExpanded = false,
  className,
}: BlockSummarySectionProps) {
  const [state, setState] = useState<SectionState>('pending')
  const [modifyInput, setModifyInput] = useState('')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())

  // Build week-by-week summary
  const weekSummaries = useMemo(
    () => buildWeekSummaries(changeset.changeRequests, weeks, sessionToWeekMap),
    [changeset.changeRequests, weeks, sessionToWeekMap]
  )

  const totalChanges = changeset.changeRequests.length
  const totalWeeks = weekSummaries.length

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

  const handleModifyClick = () => {
    setState('editing')
  }

  const handleModifySubmit = () => {
    if (modifyInput.trim()) {
      onModify(modifyInput.trim())
      setModifyInput('')
      setState('pending')
    }
  }

  const handleCancelEdit = () => {
    setModifyInput('')
    setState('pending')
  }

  const toggleWeekExpand = (weekId: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekId)) {
        next.delete(weekId)
      } else {
        next.add(weekId)
      }
      return next
    })
  }

  // Success state
  if (state === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg',
          'bg-emerald-500/10 border border-emerald-500/20',
          'animate-in fade-in-0 duration-200',
          className
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Block changes applied to {totalWeeks} weeks
        </span>
      </div>
    )
  }

  // Error state
  if (state === 'error' && executionError) {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-3 rounded-lg',
          'bg-red-500/10 border border-red-500/20',
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500">
            <X className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm text-red-700 dark:text-red-400 truncate">
            {formatErrorForUser(executionError)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setState('pending')}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
            aria-label="Retry applying changes"
          >
            Retry
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss proposal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  // Main block summary section
  return (
    <div
      role="region"
      aria-label="Block-wide AI proposal"
      className={cn(
        'rounded-lg',
        'bg-gradient-to-r from-indigo-50 to-indigo-100/80 dark:from-indigo-950/30 dark:to-indigo-900/20',
        'border border-indigo-200/80 dark:border-indigo-800/50',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
        'transition-all duration-300',
        isExpanded && 'w-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-indigo-200/60 dark:border-indigo-800/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-600 shadow-sm">
            <Layers className="h-4 w-4 text-white" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              {changeset.title || 'Block-Wide Changes'}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              {totalChanges} changes across {totalWeeks} week
              {totalWeeks !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="p-1.5 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          title="Dismiss"
          aria-label="Dismiss proposal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Week-by-week breakdown */}
      <div className="px-4 py-3 space-y-2 max-h-[300px] overflow-y-auto">
        {weekSummaries.map((week) => {
          const isWeekExpanded = expandedWeeks.has(week.weekId)
          const contentId = `block-week-${week.weekId}-content`

          return (
            <div key={week.weekId} className="space-y-1">
              {/* Week header */}
              <button
                onClick={() => toggleWeekExpand(week.weekId)}
                className="w-full flex items-center justify-between text-sm hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 rounded-md px-2 py-1.5 -mx-2 transition-colors"
                aria-expanded={isWeekExpanded}
                aria-controls={contentId}
                aria-label={
                  isWeekExpanded
                    ? `Collapse ${week.weekName} details`
                    : `Expand ${week.weekName} details`
                }
              >
                <div className="flex items-center gap-2">
                  <Calendar
                    className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-indigo-800 dark:text-indigo-200">
                    {week.weekName}
                  </span>
                  <span className="text-indigo-500 dark:text-indigo-400">
                    ({week.totalChanges} change
                    {week.totalChanges !== 1 ? 's' : ''})
                  </span>
                </div>
                {isWeekExpanded ? (
                  <ChevronUp
                    className="h-4 w-4 text-indigo-500 dark:text-indigo-400"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4 text-indigo-500 dark:text-indigo-400"
                    aria-hidden="true"
                  />
                )}
              </button>

              {/* Session breakdown (when expanded) */}
              {isWeekExpanded && (
                <div
                  id={contentId}
                  className="ml-5 pl-3 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-2"
                >
                  {week.sessions.map((session) => (
                    <div key={session.sessionId} className="space-y-1">
                      <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {session.dayName}: {session.sessionName}
                      </div>
                      <div className="space-y-0.5">
                        {session.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'text-xs pl-2',
                              change.type === 'add' &&
                                'text-emerald-600 dark:text-emerald-400',
                              change.type === 'update' &&
                                'text-amber-600 dark:text-amber-400',
                              change.type === 'remove' &&
                                'text-red-600 dark:text-red-400'
                            )}
                          >
                            {change.type === 'add' && '+ '}
                            {change.type === 'update' && '~ '}
                            {change.type === 'remove' && '- '}
                            {change.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Approval buttons */}
      <div className="border-t border-indigo-200/60 dark:border-indigo-800/40 px-4 py-3 space-y-3">
        {state === 'editing' ? (
          /* Modify input mode */
          <div className="space-y-2">
            <textarea
              value={modifyInput}
              onChange={(e) => setModifyInput(e.target.value)}
              placeholder="Describe what you'd like to change..."
              className={cn(
                'w-full px-3 py-2 text-sm rounded-md',
                'bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700',
                'focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400',
                'placeholder:text-indigo-400 dark:placeholder:text-indigo-500',
                'dark:text-indigo-100',
                'resize-none'
              )}
              rows={2}
              autoFocus
              aria-label="Describe changes you want"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleModifySubmit}
                disabled={!modifyInput.trim()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium',
                  'bg-indigo-600 dark:bg-indigo-600 text-white',
                  'hover:bg-indigo-700 dark:hover:bg-indigo-500 active:bg-indigo-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors'
                )}
                aria-label="Submit modification request"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Submit Changes</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-2 text-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/30 rounded-md transition-colors"
                aria-label="Cancel modification"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Default approval buttons */
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={state === 'executing'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium',
                  'bg-indigo-600 dark:bg-indigo-600 text-white',
                  'hover:bg-indigo-700 dark:hover:bg-indigo-500 active:bg-indigo-800',
                  'shadow-sm transition-all',
                  state === 'executing' && 'opacity-70 cursor-not-allowed'
                )}
                aria-label={
                  state === 'executing'
                    ? 'Applying changes'
                    : 'Apply all proposed changes'
                }
              >
                {state === 'executing' ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-1.5"
                  >
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Applying changes...</span>
                    <span aria-hidden="true">Applying...</span>
                  </div>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Looks Good</span>
                  </>
                )}
              </button>

              <button
                onClick={handleModifyClick}
                disabled={state === 'executing'}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-medium',
                  'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700',
                  'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100',
                  'transition-colors',
                  state === 'executing' && 'opacity-50 cursor-not-allowed'
                )}
                aria-label="Request modifications to proposal"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                <span>Make Changes</span>
              </button>
            </div>

            {/* "Or type to modify" hint */}
            <div
              className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400"
              aria-hidden="true"
            >
              <span className="flex-1 h-px bg-indigo-200 dark:bg-indigo-800" />
              <span>or type to modify</span>
              <span className="flex-1 h-px bg-indigo-200 dark:bg-indigo-800" />
            </div>

            <input
              type="text"
              value={modifyInput}
              onChange={(e) => setModifyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && modifyInput.trim()) {
                  onModify(modifyInput.trim())
                  setModifyInput('')
                }
              }}
              placeholder="e.g., 'Only change Week 1' or 'Keep leg exercises'"
              className={cn(
                'w-full px-3 py-2 text-sm rounded-md',
                'bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700',
                'focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400',
                'placeholder:text-indigo-400 dark:placeholder:text-indigo-500',
                'dark:text-indigo-100'
              )}
              disabled={state === 'executing'}
              aria-label="Quick modification input"
            />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Check if a changeset appears to be a block-wide change
 * (affects multiple weeks)
 */
export function isBlockWideChangeSet(
  changeset: ChangeSet,
  sessionToWeekMap: Map<string, number>
): boolean {
  const weeksAffected = new Set<number>()

  for (const change of changeset.changeRequests) {
    let sessionId: string | null = null

    if (change.entityType === 'session_plan_exercise' && change.proposedData) {
      sessionId = change.proposedData.session_plan_id as string | null
    } else if (change.entityType === 'session_plan' && change.entityId) {
      sessionId = String(change.entityId)
    }

    if (sessionId) {
      const weekId = sessionToWeekMap.get(sessionId)
      if (weekId !== undefined) {
        weeksAffected.add(weekId)
      }
    }
  }

  // Consider it block-wide if it affects 2+ weeks
  return weeksAffected.size >= 2
}

/**
 * Check if the changeset title/description indicates block-wide changes
 */
export function hasBlockWideIndicators(changeset: ChangeSet): boolean {
  const title = changeset.title.toLowerCase()
  const description = changeset.description.toLowerCase()

  const blockIndicators = [
    'block',
    'all weeks',
    'entire program',
    'whole program',
    'throughout',
    'across all',
    'every week',
    'all sessions',
    'program-wide',
  ]

  return blockIndicators.some(
    (indicator) =>
      title.includes(indicator) || description.includes(indicator)
  )
}

export type { WeekInfo, WeekChangeSummary, SessionChangeSummary, ChangeDetail }
