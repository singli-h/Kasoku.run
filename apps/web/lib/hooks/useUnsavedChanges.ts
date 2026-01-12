/**
 * useUnsavedChanges Hook
 * Prevents accidental data loss by warning users when leaving with unsaved changes
 *
 * Implements T017-T018 from tasks.md (FR-029 from spec.md)
 * Phase 3: Enhanced with visibilitychange listener for better save reliability
 */

"use client"

import { useEffect, useCallback, useRef } from "react"

interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Custom message (note: modern browsers ignore custom messages for security) */
  message?: string
  /** Callback when user attempts to leave - should be sync/fast for beforeunload */
  onBeforeUnload?: () => void
  /** Async callback when page becomes hidden (tab switch, minimize) - can be async */
  onVisibilityHidden?: () => Promise<void> | void
}

/**
 * Hook to warn users when leaving the page with unsaved changes
 * Enhanced with visibilitychange listener that fires BEFORE beforeunload
 * allowing async operations to complete
 *
 * @param options - Configuration options
 * @returns Object with utility functions
 *
 * @example
 * ```tsx
 * const { forceAllow } = useUnsavedChanges({
 *   hasUnsavedChanges: hasPendingChanges(),
 *   onBeforeUnload: () => saveDraftSync(sessionId, exercises),
 *   onVisibilityHidden: () => forceSave() // Can be async!
 * })
 *
 * // Later, to allow navigation without warning:
 * forceAllow()
 * router.push('/somewhere')
 * ```
 */
export function useUnsavedChanges({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onBeforeUnload,
  onVisibilityHidden
}: UseUnsavedChangesOptions) {
  // Track if we should force-allow navigation (bypass warning)
  const forceAllowRef = useRef(false)
  // Track if we already attempted save on visibility change
  const didSaveOnHiddenRef = useRef(false)

  /**
   * Force-allow the next navigation without warning
   * Useful for programmatic navigation after successful save
   */
  const forceAllow = useCallback(() => {
    forceAllowRef.current = true
  }, [])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      didSaveOnHiddenRef.current = false
      return
    }

    /**
     * Handle visibility change - fires BEFORE beforeunload when:
     * - User switches tabs
     * - User minimizes browser
     * - User closes tab (in most browsers)
     * This gives us time to run async operations
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !didSaveOnHiddenRef.current) {
        didSaveOnHiddenRef.current = true
        // visibilitychange can wait for async operations (unlike beforeunload)
        onVisibilityHidden?.()
      } else if (document.visibilityState === 'visible') {
        // Reset flag when tab becomes visible again
        didSaveOnHiddenRef.current = false
      }
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (forceAllowRef.current) {
        forceAllowRef.current = false
        return
      }

      // Call sync callback (e.g., to save draft to localStorage)
      // Note: beforeunload CANNOT wait for async operations
      onBeforeUnload?.()

      // Modern browsers show a generic message regardless of returnValue
      // but we still set it for compatibility
      event.preventDefault()
      event.returnValue = message
      return message
    }

    // Add both listeners - visibilitychange fires first and can be async
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges, message, onBeforeUnload, onVisibilityHidden])

  return { forceAllow }
}

export default useUnsavedChanges
