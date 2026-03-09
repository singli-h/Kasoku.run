"use client"

import { useState, useEffect, useCallback } from "react"
import type { SprintTimeRange, GymTimeRange } from "../config/query-config"

/**
 * Performance page user preferences stored in localStorage
 */
export interface PerformancePreferences {
  // Sprint tab preferences
  sprintTimeRange: SprintTimeRange
  sprintTargetStandard: '10.00' | '11.00'
  showCompetitionPBs: boolean
  showBenchmarks: ('10.00' | '11.00' | '12.00')[]

  // Race progression chart preferences
  raceProgressionDistance: number

  // Gym tab preferences
  gymTimeRange: GymTimeRange
}

const DEFAULT_PREFERENCES: PerformancePreferences = {
  sprintTimeRange: 'all',
  sprintTargetStandard: '11.00',
  showCompetitionPBs: true,
  showBenchmarks: ['10.00', '11.00'],
  raceProgressionDistance: 100,
  gymTimeRange: '3months',
}

const STORAGE_KEY = 'kasoku-performance-preferences'

/**
 * Get preferences from localStorage (client-side only)
 */
function getStoredPreferences(): PerformancePreferences | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    // Merge with defaults to handle missing fields from older versions
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch (error) {
    console.warn('[usePerformancePreferences] Failed to parse stored preferences:', error)
    return null
  }
}

/**
 * Save preferences to localStorage
 */
function savePreferences(preferences: PerformancePreferences): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.warn('[usePerformancePreferences] Failed to save preferences:', error)
  }
}

/**
 * Hook for managing performance page user preferences
 * Uses localStorage for persistence (per-device)
 */
export function usePerformancePreferences() {
  const [preferences, setPreferences] = useState<PerformancePreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = getStoredPreferences()
    if (stored) {
      setPreferences(stored)
    }
    setIsLoaded(true)
  }, [])

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof PerformancePreferences>(
    key: K,
    value: PerformancePreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      savePreferences(updated)
      return updated
    })
  }, [])

  // Update multiple preferences at once
  const updatePreferences = useCallback((updates: Partial<PerformancePreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates }
      savePreferences(updated)
      return updated
    })
  }, [])

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    savePreferences(DEFAULT_PREFERENCES)
  }, [])

  return {
    preferences,
    isLoaded,
    updatePreference,
    updatePreferences,
    resetPreferences,
  }
}

/**
 * Hook specifically for sprint preferences (convenience wrapper)
 */
export function useSprintPreferences() {
  const { preferences, isLoaded, updatePreference } = usePerformancePreferences()

  return {
    timeRange: preferences.sprintTimeRange,
    targetStandard: preferences.sprintTargetStandard,
    showCompetitionPBs: preferences.showCompetitionPBs,
    showBenchmarks: preferences.showBenchmarks,
    raceProgressionDistance: preferences.raceProgressionDistance,
    isLoaded,
    setTimeRange: (value: SprintTimeRange) => updatePreference('sprintTimeRange', value),
    setTargetStandard: (value: '10.00' | '11.00') => updatePreference('sprintTargetStandard', value),
    setShowCompetitionPBs: (value: boolean) => updatePreference('showCompetitionPBs', value),
    setShowBenchmarks: (value: ('10.00' | '11.00' | '12.00')[]) => updatePreference('showBenchmarks', value),
    setRaceProgressionDistance: (value: number) => updatePreference('raceProgressionDistance', value),
  }
}

/**
 * Hook specifically for gym preferences (convenience wrapper)
 */
export function useGymPreferences() {
  const { preferences, isLoaded, updatePreference } = usePerformancePreferences()

  return {
    timeRange: preferences.gymTimeRange,
    isLoaded,
    setTimeRange: (value: GymTimeRange) => updatePreference('gymTimeRange', value),
  }
}
