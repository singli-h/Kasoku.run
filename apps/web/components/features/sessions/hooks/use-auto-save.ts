/*
<ai_context>
useAutoSave - Custom hook for auto-saving performance data with debounce and queue.
Batches updates and sends them after 2 seconds of inactivity.
Handles errors gracefully and retries failed updates.
</ai_context>
*/

"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { updateSessionDetailAction } from "@/actions/sessions"

interface PendingUpdate {
  sessionId: string
  athleteId: number
  exerciseId: number
  setIndex: number
  performingTime: number | null
  key: string // Unique key for deduplication
}

interface UseAutoSaveOptions {
  debounceMs?: number // Delay before saving (default 2000ms)
  onSaveSuccess?: () => void
  onSaveError?: (error: string) => void
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    debounceMs = 2000,
    onSaveSuccess,
    onSaveError
  } = options

  // Queue of pending updates
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map())

  // Timeout ref for debouncing
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reactive state for UI updates
  const [isSaving, setIsSaving] = useState(false)
  const [hasPendingUpdates, setHasPendingUpdates] = useState(false)

  /**
   * Flush all pending updates to the server
   */
  const flushPendingUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.size === 0 || isSaving) {
      return
    }

    setIsSaving(true)
    const updates = Array.from(pendingUpdatesRef.current.values())
    pendingUpdatesRef.current.clear()
    setHasPendingUpdates(false)

    try {
      // Send all updates in parallel with their original update objects
      const results = await Promise.allSettled(
        updates.map((update, index) =>
          updateSessionDetailAction(
            update.sessionId,
            update.athleteId,
            update.exerciseId,
            update.setIndex,
            update.performingTime
          ).then(result => ({ result, update, index }))
        )
      )

      // Check for failures and collect failed updates
      const failedUpdates: PendingUpdate[] = []

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedUpdates.push(updates[index])
        } else if (result.status === 'fulfilled' && !result.value.result.isSuccess) {
          failedUpdates.push(result.value.update)
        }
      })

      if (failedUpdates.length === 0) {
        onSaveSuccess?.()
      } else {
        const errorMsg = `Failed to save ${failedUpdates.length} update(s)`
        console.error('[useAutoSave]', errorMsg, failedUpdates)
        onSaveError?.(errorMsg)
        toast.error(errorMsg)

        // Re-add failed updates to queue for retry
        failedUpdates.forEach(update => {
          pendingUpdatesRef.current.set(update.key, update)
        })
        setHasPendingUpdates(pendingUpdatesRef.current.size > 0)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[useAutoSave]', error)
      onSaveError?.(errorMsg)
      toast.error(`Auto-save failed: ${errorMsg}`)

      // Re-add all updates to queue for retry
      updates.forEach(update => {
        pendingUpdatesRef.current.set(update.key, update)
      })
      setHasPendingUpdates(pendingUpdatesRef.current.size > 0)
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, onSaveSuccess, onSaveError])

  /**
   * Queue an update for auto-save
   */
  const queueUpdate = useCallback((
    sessionId: string,
    athleteId: number,
    exerciseId: number,
    setIndex: number,
    performingTime: number | null
  ) => {
    // Create unique key for deduplication
    const key = `${sessionId}-${athleteId}-${exerciseId}-${setIndex}`

    // Add/update in queue
    pendingUpdatesRef.current.set(key, {
      sessionId,
      athleteId,
      exerciseId,
      setIndex,
      performingTime,
      key
    })

    // Update pending state
    setHasPendingUpdates(true)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to flush after debounce period
    timeoutRef.current = setTimeout(() => {
      flushPendingUpdates()
    }, debounceMs)
  }, [debounceMs, flushPendingUpdates])

  /**
   * Force immediate save (for manual save button or on unmount)
   */
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    return flushPendingUpdates()
  }, [flushPendingUpdates])

  // Cleanup on unmount - attempt to flush pending updates
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Attempt final flush (best effort, may not complete if component unmounts)
      if (pendingUpdatesRef.current.size > 0) {
        flushPendingUpdates()
      }
    }
  }, [flushPendingUpdates])

  return {
    queueUpdate,
    saveNow,
    hasPendingUpdates,
    isSaving
  }
}
