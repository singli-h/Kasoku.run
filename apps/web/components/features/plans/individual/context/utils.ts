/**
 * Plan Context Utilities
 *
 * Utility functions for the plan context, including AI context level detection.
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import type { AIContextLevel } from './PlanContext'
import type { MicrocycleWithDetails, SessionPlanWithDetails } from '@/types/training'

// ============================================================================
// AI Context Detection
// ============================================================================

interface AIContextDetectionParams {
  selectedWeekId: number | null
  selectedSessionId: string | null
  selectedExerciseId: string | null
}

/**
 * Compute the AI context level from selection state.
 *
 * Context levels:
 * - 'exercise': User has expanded a specific exercise
 * - 'session': User has selected a specific session/workout
 * - 'week': User has selected a specific week
 * - 'block': No specific selection (default to full training block)
 */
export function getAIContextLevel(params: AIContextDetectionParams): AIContextLevel {
  const { selectedWeekId, selectedSessionId, selectedExerciseId } = params

  if (selectedExerciseId) return 'exercise'
  if (selectedSessionId) return 'session'
  if (selectedWeekId) return 'week'
  return 'block'
}

// ============================================================================
// Week Utilities
// ============================================================================

/**
 * Find the current week based on today's date.
 */
export function findCurrentWeek(
  microcycles?: MicrocycleWithDetails[]
): MicrocycleWithDetails | null {
  if (!microcycles?.length) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  // First try to find the actual current week
  const currentWeek = microcycles.find(week => {
    if (!week.start_date || !week.end_date) return false
    const start = new Date(week.start_date)
    const end = new Date(week.end_date)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return today >= start && today <= end
  })

  if (currentWeek) return currentWeek

  // If no current week, return the first week
  return microcycles[0]
}

/**
 * Check if a week is the current week based on dates.
 */
export function isWeekCurrent(week: MicrocycleWithDetails): boolean {
  if (!week.start_date || !week.end_date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(week.start_date + 'T00:00:00')
  const end = new Date(week.end_date + 'T00:00:00')
  end.setHours(23, 59, 59, 999)

  return today >= start && today <= end
}

/**
 * Check if a week is in the past.
 */
export function isWeekPast(week: MicrocycleWithDetails): boolean {
  if (!week.end_date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(week.end_date + 'T00:00:00')
  end.setHours(23, 59, 59, 999)

  return today > end
}

/**
 * Check if a week is in the future.
 */
export function isWeekFuture(week: MicrocycleWithDetails): boolean {
  if (!week.start_date) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(week.start_date + 'T00:00:00')

  return today < start
}

// ============================================================================
// Session/Workout Utilities
// ============================================================================

/**
 * Find today's workout in a list of session plans.
 */
export function findTodayWorkout(
  workouts?: SessionPlanWithDetails[]
): SessionPlanWithDetails | null {
  if (!workouts?.length) return null

  const today = new Date().getDay() // 0 = Sunday, 6 = Saturday

  // Try to find a workout scheduled for today
  const todayWorkout = workouts.find(w => w.day === today)
  if (todayWorkout) return todayWorkout

  // If no workout today, find the next upcoming one in the week
  // Sort by day, treating Sunday (0) as 7 for correct ordering
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const dayA = a.day === 0 ? 7 : (a.day ?? 8)
    const dayB = b.day === 0 ? 7 : (b.day ?? 8)
    return dayA - dayB
  })

  // Find first workout after today
  const todayNormalized = today === 0 ? 7 : today
  const nextWorkout = sortedWorkouts.find(w => {
    const workoutDay = w.day === 0 ? 7 : (w.day ?? 8)
    return workoutDay >= todayNormalized
  })

  return nextWorkout || sortedWorkouts[0]
}

/**
 * Sort workouts by day of week (Monday first, Sunday last).
 */
export function sortByDay(workouts: SessionPlanWithDetails[]): SessionPlanWithDetails[] {
  return [...workouts].sort((a, b) => {
    // Treat Sunday (0) as 7 for sorting, so Monday (1) comes first
    const dayA = a.day === 0 ? 7 : (a.day ?? 8)
    const dayB = b.day === 0 ? 7 : (b.day ?? 8)
    return dayA - dayB
  })
}

/**
 * Get day abbreviation from day number.
 */
export function getDayAbbrev(day: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] ?? '—'
}

/**
 * Get full day name from day number.
 */
export function getDayName(day: number | null): string {
  if (day === null) return 'Unscheduled'
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? '—'
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date as short string (e.g., "Jan 15").
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format date range as short string (e.g., "Jan 15 - Jan 21").
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const start = formatDateShort(startDate)
  const end = formatDateShort(endDate)
  if (!start && !end) return ''
  if (!start) return end
  if (!end) return start
  return `${start} - ${end}`
}

// ============================================================================
// AI Context Info (for prompts)
// ============================================================================

interface AIContextInfo {
  level: AIContextLevel
  weekId: number | null
  weekName: string | null
  weekNumber: number | null
  sessionId: string | null
  sessionName: string | null
  sessionDay: number | null
  exerciseId: string | null
}

/**
 * Build AI context info for use in prompts.
 */
export function buildAIContextInfo(params: {
  aiContextLevel: AIContextLevel
  selectedWeekId: number | null
  selectedWeek: MicrocycleWithDetails | null
  weekNumber: number | null
  selectedSessionId: string | null
  selectedSession: SessionPlanWithDetails | null
  selectedExerciseId: string | null
}): AIContextInfo {
  return {
    level: params.aiContextLevel,
    weekId: params.selectedWeekId,
    weekName: params.selectedWeek?.name ?? null,
    weekNumber: params.weekNumber,
    sessionId: params.selectedSessionId,
    sessionName: params.selectedSession?.name ?? null,
    sessionDay: params.selectedSession?.day ?? null,
    exerciseId: params.selectedExerciseId,
  }
}
