'use client'

/**
 * ProposalStatusBanner Component
 *
 * Displays status messages for success and error states.
 *
 * Design: Clean, minimal status feedback with subtle semantic colors.
 *
 * Single Responsibility: Status display only
 */

import { Check, AlertCircle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StatusType = 'success' | 'error'

interface ProposalStatusBannerProps {
  /** The status type */
  type: StatusType

  /** The message to display */
  message: string

  /** Called when dismissed (optional for success, required for error) */
  onDismiss?: () => void

  /** Called when retry is clicked (error state only) */
  onRetry?: () => void
}

export function ProposalStatusBanner({
  type,
  message,
  onDismiss,
  onRetry,
}: ProposalStatusBannerProps) {
  const isSuccess = type === 'success'

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        isSuccess
          ? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/30'
          : 'border-rose-200/60 bg-rose-50/50 dark:border-rose-800/60 dark:bg-rose-950/30'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Status indicator + message */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
              isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-rose-100 dark:bg-rose-900/50'
            )}
          >
            {isSuccess ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <span
            className={cn(
              'text-sm font-medium truncate',
              isSuccess ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            )}
          >
            {message}
          </span>
        </div>

        {/* Error actions */}
        {!isSuccess && (
          <div className="flex items-center gap-1 shrink-0">
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-7 px-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-100/50 dark:hover:bg-rose-900/30"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 w-7 p-0 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100/50 dark:hover:bg-rose-900/30"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
