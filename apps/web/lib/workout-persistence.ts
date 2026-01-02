/**
 * Workout Draft Persistence
 * Handles local storage of workout drafts to prevent data loss on page refresh
 *
 * Implements FR-026 to FR-029 from spec.md
 */

import type { WorkoutLogSet } from "@/types/training"

// Draft storage key prefix
const DRAFT_KEY_PREFIX = 'kasoku-workout-draft-'

// Draft expiration time (24 hours)
const DRAFT_EXPIRATION_MS = 24 * 60 * 60 * 1000

// Memory fallback for private browsing mode
const memoryDrafts = new Map<string, WorkoutDraft>()

/**
 * Workout draft data structure
 */
export interface WorkoutDraft {
  /** Session ID this draft belongs to */
  sessionId: string
  /** Map of exercise ID to set data */
  exercises: Record<string, WorkoutExerciseDraft>
  /** Session-level notes */
  notes?: string
  /** When the draft was last modified */
  lastModified: number
  /** Schema version for future migrations */
  version: number
}

export interface WorkoutExerciseDraft {
  /** Session plan exercise ID */
  exerciseId: string
  /** Set data array */
  sets: WorkoutSetDraft[]
  /** Exercise-level notes */
  notes?: string
}

export interface WorkoutSetDraft {
  /** Set index (1-based) */
  setIndex: number
  /** Number of reps performed */
  reps?: number
  /** Weight used */
  weight?: number
  /** RPE (1-10) */
  rpe?: number
  /** Whether set is complete */
  completed: boolean
}

/**
 * Save workout draft to localStorage
 * Debounce this call (500ms recommended per FR-027)
 *
 * @param sessionId - Workout session ID
 * @param exercises - Current exercise state from context
 * @param notes - Optional session notes
 */
export function saveDraft(
  sessionId: string,
  exercises: Array<{ id: string; workout_log_sets?: WorkoutLogSet[]; notes?: string }>,
  notes?: string
): void {
  const key = `${DRAFT_KEY_PREFIX}${sessionId}`

  // Transform exercises to draft format
  const exerciseDrafts: Record<string, WorkoutExerciseDraft> = {}

  for (const exercise of exercises) {
    if (!exercise.workout_log_sets?.length) continue

    exerciseDrafts[exercise.id] = {
      exerciseId: exercise.id,
      sets: exercise.workout_log_sets.map((set, index) => ({
        setIndex: index + 1,
        reps: set.reps ?? undefined,
        weight: set.weight ?? undefined,
        rpe: set.rpe ?? undefined,
        completed: set.completed ?? false
      })),
      notes: exercise.notes
    }
  }

  const draft: WorkoutDraft = {
    sessionId,
    exercises: exerciseDrafts,
    notes,
    lastModified: Date.now(),
    version: 1
  }

  try {
    localStorage.setItem(key, JSON.stringify(draft))
  } catch (e) {
    // Fallback to memory storage (e.g., private browsing mode)
    console.warn('[workout-persistence] localStorage unavailable, using memory fallback')
    memoryDrafts.set(key, draft)
  }
}

/**
 * Get workout draft from localStorage
 * Returns null if no draft exists or draft is expired
 *
 * @param sessionId - Workout session ID
 * @returns Draft data or null
 */
export function getDraft(sessionId: string): WorkoutDraft | null {
  const key = `${DRAFT_KEY_PREFIX}${sessionId}`

  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      // Check memory fallback
      return memoryDrafts.get(key) ?? null
    }

    const draft: WorkoutDraft = JSON.parse(stored)

    // Check expiration (24 hours)
    if (Date.now() - draft.lastModified > DRAFT_EXPIRATION_MS) {
      clearDraft(sessionId)
      return null
    }

    return draft
  } catch (e) {
    console.error('[workout-persistence] Failed to read draft:', e)
    // Try memory fallback
    return memoryDrafts.get(key) ?? null
  }
}

/**
 * Clear workout draft from localStorage
 * Call this after successful save/complete (FR-028)
 *
 * @param sessionId - Workout session ID
 */
export function clearDraft(sessionId: string): void {
  const key = `${DRAFT_KEY_PREFIX}${sessionId}`

  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore errors
  }

  // Also clear memory fallback
  memoryDrafts.delete(key)
}

/**
 * Check if a draft exists for the given session
 *
 * @param sessionId - Workout session ID
 * @returns true if draft exists and is not expired
 */
export function hasDraft(sessionId: string): boolean {
  return getDraft(sessionId) !== null
}

/**
 * Get draft age in human-readable format
 *
 * @param sessionId - Workout session ID
 * @returns Human-readable age string or null if no draft
 */
export function getDraftAge(sessionId: string): string | null {
  const draft = getDraft(sessionId)
  if (!draft) return null

  const ageMs = Date.now() - draft.lastModified
  const ageMinutes = Math.floor(ageMs / 60000)

  if (ageMinutes < 1) return 'just now'
  if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`

  const ageHours = Math.floor(ageMinutes / 60)
  if (ageHours < 24) return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`

  return 'over a day ago'
}

/**
 * Clear all workout drafts (useful for testing or logout)
 */
export function clearAllDrafts(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(DRAFT_KEY_PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  } catch {
    // Ignore errors
  }
  memoryDrafts.clear()
}
