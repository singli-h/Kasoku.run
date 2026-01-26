/**
 * useAdvancedFieldsToggle Hook
 *
 * Persists advanced training fields visibility preference to localStorage.
 * Used by the Individual Plan Page to show/hide advanced fields (RPE, tempo, velocity, etc.)
 *
 * Implements T053 from tasks.md (Phase 10: User Story 8)
 */

"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "kasoku:advanced-fields-visible"

interface UseAdvancedFieldsToggleOptions {
  /** Default value when no localStorage value exists */
  defaultValue?: boolean
}

interface UseAdvancedFieldsToggleReturn {
  /** Whether advanced fields are currently visible */
  showAdvancedFields: boolean
  /** Toggle the visibility state */
  toggleAdvancedFields: () => void
  /** Explicitly set the visibility state */
  setShowAdvancedFields: (value: boolean) => void
  /** Whether the hook has loaded the persisted value */
  isLoaded: boolean
}

/**
 * Hook to manage advanced training fields visibility with localStorage persistence.
 *
 * @param options - Configuration options
 * @returns Object with visibility state and control functions
 *
 * @example
 * ```tsx
 * const { showAdvancedFields, toggleAdvancedFields } = useAdvancedFieldsToggle()
 *
 * return (
 *   <div>
 *     <Switch checked={showAdvancedFields} onCheckedChange={toggleAdvancedFields} />
 *     {showAdvancedFields && <RPEField />}
 *   </div>
 * )
 * ```
 */
export function useAdvancedFieldsToggle(
  options: UseAdvancedFieldsToggleOptions = {}
): UseAdvancedFieldsToggleReturn {
  const { defaultValue = false } = options

  // Initialize with default, will be updated from localStorage on mount
  const [showAdvancedFields, setShowAdvancedFieldsState] = useState(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setShowAdvancedFieldsState(stored === "true")
      }
    } catch (error) {
      // localStorage not available (SSR or disabled)
      console.warn("[useAdvancedFieldsToggle] Failed to read from localStorage:", error)
    }
    setIsLoaded(true)
  }, [])

  // Persist to localStorage when value changes
  const setShowAdvancedFields = useCallback((value: boolean) => {
    setShowAdvancedFieldsState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch (error) {
      console.warn("[useAdvancedFieldsToggle] Failed to write to localStorage:", error)
    }
  }, [])

  // Toggle helper
  const toggleAdvancedFields = useCallback(() => {
    setShowAdvancedFields(!showAdvancedFields)
  }, [showAdvancedFields, setShowAdvancedFields])

  return {
    showAdvancedFields,
    toggleAdvancedFields,
    setShowAdvancedFields,
    isLoaded,
  }
}

export default useAdvancedFieldsToggle
