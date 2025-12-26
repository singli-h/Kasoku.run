/**
 * useUnsavedChanges Hook
 * Prevents accidental data loss by warning users when leaving with unsaved changes
 *
 * Implements T017-T018 from tasks.md (FR-029 from spec.md)
 */

"use client"

import { useEffect, useCallback } from "react"

interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Custom message (note: modern browsers ignore custom messages for security) */
  message?: string
  /** Callback when user attempts to leave */
  onBeforeUnload?: () => void
}

/**
 * Hook to warn users when leaving the page with unsaved changes
 *
 * @param options - Configuration options
 * @returns Object with utility functions
 *
 * @example
 * ```tsx
 * const { forceAllow } = useUnsavedChanges({
 *   hasUnsavedChanges: hasPendingChanges(),
 *   onBeforeUnload: () => forceSave()
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
  onBeforeUnload
}: UseUnsavedChangesOptions) {
  // Track if we should force-allow navigation (bypass warning)
  let forceAllowNavigation = false

  /**
   * Force-allow the next navigation without warning
   * Useful for programmatic navigation after successful save
   */
  const forceAllow = useCallback(() => {
    forceAllowNavigation = true
  }, [])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (forceAllowNavigation) {
        forceAllowNavigation = false
        return
      }

      // Call optional callback (e.g., to attempt last-minute save)
      onBeforeUnload?.()

      // Modern browsers show a generic message regardless of returnValue
      // but we still set it for compatibility
      event.preventDefault()
      event.returnValue = message
      return message
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges, message, onBeforeUnload])

  return { forceAllow }
}

export default useUnsavedChanges
