/**
 * Sprint Pacing Utilities
 *
 * Provides calculations for sprint training based on personal bests and effort percentages.
 *
 * CRITICAL RULE: Only calculates targets for EXACT distance matches.
 * NO scaling/interpolation between distances (e.g., can't use 100m PB to estimate 200m).
 * Different sprint distances use different energy systems and don't scale linearly.
 *
 * Uses percentage-based pacing zones common in sprint training:
 * - Max Speed: 95-100% of PB
 * - Near Max: 90-95% of PB
 * - Sub-Max: 85-90% of PB
 * - Tempo: 70-85% of PB
 */

export type PacingZone = "max" | "near-max" | "sub-max" | "tempo"

export interface PersonalBest {
  id: number
  athlete_id: number
  exercise_id: number
  value: number  // Time in seconds for sprints (e.g., 12.63)
  unit_id: number  // Unit reference (5 = seconds)
  achieved_date: string
  verified: boolean
}

export interface PacingZoneConfig {
  min: number
  max: number
  label: string
  description: string
}

/**
 * Pacing zone configurations with intensity ranges
 */
export const PACING_ZONES: Record<PacingZone, PacingZoneConfig> = {
  max: {
    min: 0.95,
    max: 1.0,
    label: "Max Speed",
    description: "95-100% of personal best - maximum effort",
  },
  "near-max": {
    min: 0.9,
    max: 0.95,
    label: "Near Max",
    description: "90-95% of personal best - high intensity",
  },
  "sub-max": {
    min: 0.85,
    max: 0.9,
    label: "Sub-Max",
    description: "85-90% of personal best - controlled speed",
  },
  tempo: {
    min: 0.7,
    max: 0.85,
    label: "Tempo",
    description: "70-85% of personal best - endurance focused",
  },
}

/**
 * Calculate target time based on personal best and target intensity
 *
 * Formula: Target Time = PB / Intensity
 *
 * @param personalBestSeconds - Personal best time in seconds
 * @param targetIntensity - Target intensity as decimal (0.70 - 1.00)
 * @returns Target time in seconds, or null if PB is not available
 *
 * @example
 * // Athlete has 12.0s PB, targeting 95% intensity
 * calculateTargetTime(12.0, 0.95) // Returns 12.63s
 *
 * @example
 * // Athlete has 11.5s PB, targeting 90% intensity
 * calculateTargetTime(11.5, 0.90) // Returns 12.78s
 */
export function calculateTargetTime(
  personalBestSeconds: number | null,
  targetIntensity: number
): number | null {
  if (!personalBestSeconds || personalBestSeconds <= 0) {
    return null
  }

  if (targetIntensity <= 0 || targetIntensity > 1.0) {
    throw new Error("Target intensity must be between 0 and 1.0")
  }

  // Target time = PB / intensity
  // Lower intensity = slower pace = higher target time
  return Number((personalBestSeconds / targetIntensity).toFixed(2))
}

/**
 * Calculate actual intensity achieved based on PB and actual time
 *
 * Formula: Actual Intensity = PB / Actual Time
 *
 * @param personalBestSeconds - Personal best time in seconds
 * @param actualTimeSeconds - Actual time achieved in seconds
 * @returns Intensity as decimal (0.0 - 1.0+), or null if inputs invalid
 *
 * @example
 * // Athlete with 12.0s PB runs 12.63s
 * calculateActualIntensity(12.0, 12.63) // Returns 0.95 (95%)
 */
export function calculateActualIntensity(
  personalBestSeconds: number | null,
  actualTimeSeconds: number | null
): number | null {
  if (!personalBestSeconds || !actualTimeSeconds || personalBestSeconds <= 0 || actualTimeSeconds <= 0) {
    return null
  }

  // Actual intensity = PB / actual time
  // Faster than PB = intensity > 1.0 (new PB!)
  return personalBestSeconds / actualTimeSeconds
}

/**
 * Determine pacing zone from intensity value
 *
 * @param intensity - Intensity as decimal (0.0 - 1.0+)
 * @returns Pacing zone or null if intensity out of range
 */
export function getPacingZone(intensity: number | null): PacingZone | null {
  if (!intensity || intensity < PACING_ZONES.tempo.min) {
    return null
  }

  if (intensity >= PACING_ZONES.max.min) return "max"
  if (intensity >= PACING_ZONES["near-max"].min) return "near-max"
  if (intensity >= PACING_ZONES["sub-max"].min) return "sub-max"
  if (intensity >= PACING_ZONES.tempo.min) return "tempo"

  return null
}

/**
 * Format milliseconds to human-readable time string
 *
 * @param ms - Time in milliseconds
 * @param includeMs - Whether to include milliseconds in output
 * @returns Formatted time string (e.g., "12.34s" or "1:05.34")
 */
export function formatTime(ms: number | null, includeMs = true): string {
  if (!ms || ms <= 0) return "-"

  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return includeMs
      ? `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`
      : `${minutes}:${Math.floor(seconds).toString().padStart(2, "0")}`
  }

  return includeMs ? `${seconds.toFixed(2)}s` : `${Math.floor(seconds)}s`
}

/**
 * Format intensity as percentage
 *
 * @param intensity - Intensity as decimal (0.0 - 1.0)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string (e.g., "95.0%")
 */
export function formatIntensity(intensity: number | null, decimals = 1): string {
  if (!intensity) return "-"
  return `${(intensity * 100).toFixed(decimals)}%`
}

/**
 * Calculate pace per 100m based on total distance and time
 *
 * @param distanceMeters - Distance in meters
 * @param timeMs - Time in milliseconds
 * @returns Pace per 100m in milliseconds, or null if invalid
 */
export function calculatePacePer100m(
  distanceMeters: number | null,
  timeMs: number | null
): number | null {
  if (!distanceMeters || !timeMs || distanceMeters <= 0 || timeMs <= 0) {
    return null
  }

  return Math.round((timeMs / distanceMeters) * 100)
}

/**
 * Check if a new time is a personal best
 *
 * @param newTimeMs - New time in milliseconds
 * @param currentPBMs - Current personal best in milliseconds
 * @returns True if new time is better (lower) than current PB
 */
export function isNewPersonalBest(
  newTimeMs: number | null,
  currentPBMs: number | null
): boolean {
  if (!newTimeMs || newTimeMs <= 0) return false
  if (!currentPBMs || currentPBMs <= 0) return true

  return newTimeMs < currentPBMs
}

/**
 * Calculate suggested target intensity based on training phase
 *
 * This is a helper for plan creation to suggest appropriate intensities
 * based on the training phase of the mesocycle.
 *
 * @param phase - Training phase (e.g., "base", "build", "peak", "taper")
 * @returns Suggested intensity range
 */
export function getSuggestedIntensity(
  phase: string | null
): { min: number; max: number; default: number } {
  const normalizedPhase = phase?.toLowerCase() || ""

  // Peak/Competition phase - high intensity
  if (normalizedPhase.includes("peak") || normalizedPhase.includes("competition")) {
    return { min: 0.95, max: 1.0, default: 0.98 }
  }

  // Build/Specific phase - moderate-high intensity
  if (normalizedPhase.includes("build") || normalizedPhase.includes("specific")) {
    return { min: 0.85, max: 0.95, default: 0.90 }
  }

  // Taper - controlled intensity
  if (normalizedPhase.includes("taper")) {
    return { min: 0.80, max: 0.90, default: 0.85 }
  }

  // Base/General - lower intensity, volume focus
  if (normalizedPhase.includes("base") || normalizedPhase.includes("general")) {
    return { min: 0.70, max: 0.85, default: 0.75 }
  }

  // Default to sub-max range
  return { min: 0.85, max: 0.90, default: 0.87 }
}

/**
 * Calculate sprint target time with EXACT exercise matching only
 *
 * RULE: Only calculates if athlete has PB for exact exercise (e.g., "100m Sprint").
 * NO scaling between exercises - different distances use different energy systems.
 *
 * @param athletePBs - Array of athlete's personal bests
 * @param exerciseId - Exercise ID from session (matches specific distance/exercise)
 * @param effort - Effort percentage as decimal (0.70 - 1.00)
 * @returns Target calculation result with time and note
 *
 * @example
 * // Athlete has 100m Sprint PB (exercise_id: 5), session is same exercise @ 95%
 * const pbs = [{ exercise_id: 5, value: 12.0, unit_id: 5, ... }]
 * calculateSprintTarget(pbs, 5, 0.95)
 * // Returns: { targetSeconds: 12.63, pbSeconds: 12.0, note: "95% effort" }
 *
 * @example
 * // Athlete has NO PB for 300m Sprint (exercise_id: 8)
 * const pbs = [{ exercise_id: 5, value: 12.0, ... }, { exercise_id: 6, value: 24.0, ... }]
 * calculateSprintTarget(pbs, 8, 0.90)
 * // Returns: { targetSeconds: null, pbSeconds: null, note: "No PB recorded" }
 */
export function calculateSprintTarget(
  athletePBs: PersonalBest[],
  exerciseId: number,
  effort: number
): {
  targetSeconds: number | null
  pbSeconds: number | null
  note: string
} {
  // Validate effort percentage
  if (effort <= 0 || effort > 1.0) {
    return {
      targetSeconds: null,
      pbSeconds: null,
      note: "Invalid effort percentage"
    }
  }

  // Find EXACT exercise match only (unit_id 5 = seconds for time-based exercises)
  const exactPB = athletePBs.find(
    pb => pb.exercise_id === exerciseId && pb.unit_id === 5
  )

  // No exact match - cannot calculate target
  if (!exactPB) {
    return {
      targetSeconds: null,
      pbSeconds: null,
      note: "No PB recorded"
    }
  }

  // Calculate target using formula: Target = PB / Effort
  const targetSeconds = Number((exactPB.value / effort).toFixed(2))

  return {
    targetSeconds,
    pbSeconds: exactPB.value,
    note: `${(effort * 100).toFixed(0)}% effort`
  }
}

/**
 * Format sprint target for display in UI placeholder
 *
 * @param targetSeconds - Target time in seconds, or null if no target
 * @returns Formatted string for placeholder (e.g., "12.63" or "Enter time")
 *
 * @example
 * formatTargetPlaceholder(12.63) // "12.63"
 * formatTargetPlaceholder(null)  // "Enter time"
 */
export function formatTargetPlaceholder(targetSeconds: number | null): string {
  if (!targetSeconds) {
    return "Enter time"
  }

  return targetSeconds.toFixed(2)
}
