'use client'

/**
 * ApprovalBanner Component
 *
 * Ultra-compact notification bar for AI change proposals.
 * Shows concise summary with inline approve/change actions.
 *
 * Design: Industrial/utilitarian - functional status bar aesthetic.
 *
 * Flow:
 * - User clicks "Change" → addToolOutput returns rejection → AI asks in chat
 * - User clicks "Apply" → execute changes
 * - NO feedback input in banner - feedback comes from chat
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
 */

import { useState, useEffect } from 'react'
import { Bot, Check, X, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeSet, ChangeRequest, ExecutionError } from '@/lib/changeset/types'
import { formatErrorForUser } from '@/lib/changeset/errors'

type BannerState = 'pending' | 'executing' | 'success' | 'error'

/**
 * Generate ultra-concise summary (e.g., "+5 sets, 2 updates")
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

interface ApprovalBannerProps {
  /** The changeset awaiting approval */
  changeset: ChangeSet

  /** Called when user approves all changes */
  onApprove: () => Promise<void>

  /** Called when user wants to revise - AI will ask in chat what to change */
  onRegenerate: () => void

  /** Called when user dismisses/rejects all changes (for error state) */
  onDismiss: () => void

  /** Whether execution is in progress */
  isExecuting?: boolean

  /** Execution error if any */
  executionError?: ExecutionError

  /** Additional className for styling */
  className?: string
}

export function ApprovalBanner({
  changeset,
  onApprove,
  onRegenerate,
  onDismiss,
  isExecuting = false,
  executionError,
  className,
}: ApprovalBannerProps) {
  const [state, setState] = useState<BannerState>('pending')

  const changeCount = changeset.changeRequests.length
  const compactSummary = getCompactSummary(changeset.changeRequests)

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
    } catch {
      setState('error')
    }
  }

  const handleChange = () => {
    // Simply call onRegenerate - AI will ask in chat what to change
    onRegenerate()
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
        <span className="text-sm font-medium text-emerald-700">
          Changes applied
        </span>
      </div>
    )
  }

  // Error state - inline with retry
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
          <span className="text-sm text-red-700 truncate">
            {formatErrorForUser(executionError)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setState('pending')}
            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Main compact bar - single line with everything
  return (
    <div
      className={cn(
        // Industrial status bar aesthetic
        'flex items-center justify-between gap-3',
        'px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-slate-50 to-slate-100/80',
        'border border-slate-200/80',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]',
        'transition-all duration-200',
        className
      )}
    >
      {/* Left: AI indicator + summary */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Compact AI badge */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Concise summary - single line */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-slate-800 tabular-nums">
            {changeCount}
          </span>
          <span className="text-sm text-slate-500">
            change{changeCount !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-300 mx-0.5">|</span>
          <span className="text-sm font-medium text-slate-600 truncate">
            {compactSummary}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Change button - triggers rejection, AI will ask in chat */}
        <button
          onClick={handleChange}
          disabled={state === 'executing'}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
            'text-slate-500 hover:text-blue-600 hover:bg-blue-50',
            state === 'executing' && 'opacity-50 cursor-not-allowed'
          )}
          title="Request changes - AI will ask what to modify"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Change</span>
        </button>

        {/* Approve button - prominent */}
        <button
          onClick={handleApprove}
          disabled={state === 'executing'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-blue-600 text-white',
            'hover:bg-blue-700 active:bg-blue-800',
            'shadow-sm transition-all',
            state === 'executing' && 'opacity-70 cursor-not-allowed'
          )}
        >
          {state === 'executing' ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Applying</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Apply</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
