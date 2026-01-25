/**
 * Save Status Indicator
 * Shows the current auto-save status for workout performance data
 *
 * Enhanced with:
 * - Count of pending changes when saving
 * - Relative timestamp for last saved
 * - Details on failed saves with retry option (Option C from UX improvements)
 */

"use client"

import { useState, useEffect } from "react"
import { CloudOff, Loader2, Check, RefreshCw } from "lucide-react"
import { useExerciseContext } from "../context/exercise-context"
import { cn } from "@/lib/utils"

/**
 * Format a date as relative time (e.g., "just now", "2m ago")
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  return `${diffHours}h ago`
}

export function SaveStatusIndicator() {
  const { saveInfo, retryFailedSaves } = useExerciseContext()
  const [isRetrying, setIsRetrying] = useState(false)
  const [relativeTime, setRelativeTime] = useState('')

  // Update relative time display every 30 seconds
  useEffect(() => {
    if (!saveInfo.lastSavedAt) return

    // Initial calculation
    setRelativeTime(formatRelativeTime(saveInfo.lastSavedAt))

    // Update every 30 seconds
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(saveInfo.lastSavedAt))
    }, 30000)

    return () => clearInterval(interval)
  }, [saveInfo.lastSavedAt])

  // Handle retry click
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await retryFailedSaves()
    } finally {
      setIsRetrying(false)
    }
  }

  // Don't show indicator when idle with no recent activity
  if (saveInfo.status === 'idle' && !saveInfo.lastSavedAt) return null

  // Show brief "saved" confirmation then hide
  if (saveInfo.status === 'idle' && saveInfo.lastSavedAt) {
    // Only show if saved within the last 5 seconds
    const recentlySaved = Date.now() - saveInfo.lastSavedAt.getTime() < 5000
    if (!recentlySaved) return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
      "transition-all duration-200",
      (saveInfo.status === 'saving' || isRetrying) && "bg-blue-50 border border-blue-200 text-blue-700",
      (saveInfo.status === 'saved' || saveInfo.status === 'idle') && saveInfo.failedItems.length === 0 && "bg-green-50 border border-green-200 text-green-700",
      saveInfo.status === 'error' && "bg-red-50 border border-red-200 text-red-700"
    )}>
      {/* Saving state - show count of pending changes */}
      {(saveInfo.status === 'saving' || isRetrying) && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            {isRetrying
              ? 'Retrying...'
              : saveInfo.pendingCount > 1
                ? `Saving ${saveInfo.pendingCount} changes...`
                : 'Saving...'}
          </span>
        </>
      )}

      {/* Saved state - show confirmation with timestamp */}
      {(saveInfo.status === 'saved' || saveInfo.status === 'idle') && saveInfo.failedItems.length === 0 && (
        <>
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">
            All changes saved
            {relativeTime && <span className="text-xs opacity-75 ml-1">· {relativeTime}</span>}
          </span>
        </>
      )}

      {/* Error state - show what failed with retry option */}
      {saveInfo.status === 'error' && saveInfo.failedItems.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CloudOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Failed to save {saveInfo.failedItems.length} {saveInfo.failedItems.length === 1 ? 'change' : 'changes'}
            </span>
          </div>
          {/* Show first failed item as example */}
          {saveInfo.failedItems[0] && (
            <span className="text-xs opacity-80 pl-6">
              {saveInfo.failedItems[0].exerciseName} Set {saveInfo.failedItems[0].setIndex}
              {saveInfo.failedItems.length > 1 && ` +${saveInfo.failedItems.length - 1} more`}
            </span>
          )}
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 mt-1 pl-6 text-xs font-medium text-red-700 hover:text-red-800 transition-colors"
          >
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
            Retry
          </button>
        </div>
      )}

      {/* Generic error state (no specific failed items) */}
      {saveInfo.status === 'error' && saveInfo.failedItems.length === 0 && (
        <>
          <CloudOff className="h-4 w-4" />
          <span className="text-sm font-medium">Save failed</span>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-1 ml-2 text-xs font-medium text-red-700 hover:text-red-800 transition-colors"
          >
            <RefreshCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
            Retry
          </button>
        </>
      )}
    </div>
  )
}
