'use client'

/**
 * ProposalStatusBanner Component
 *
 * Displays status messages for success and error states.
 *
 * Single Responsibility: Status display only
 */

import { Check, AlertCircle, X } from 'lucide-react'
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
        'rounded-lg border p-4',
        isSuccess
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex items-center gap-2',
            isSuccess ? 'text-green-700' : 'text-red-700'
          )}
        >
          {isSuccess ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message}</span>
        </div>

        {!isSuccess && (
          <div className="flex gap-2">
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="mr-1 h-4 w-4" />
                Dismiss
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
