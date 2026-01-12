/**
 * Server Action Contracts: Plan Page Improvements
 *
 * Feature: 008-plan-workout-sync
 * Date: 2026-01-08
 *
 * This file defines the TypeScript interfaces for all server actions
 * in this feature. These are contracts - the actual implementation
 * must match these signatures.
 */

import type { ActionState } from '@/types/api'

// =============================================================================
// PART A: SYNC ACTIONS (actions/workout/workout-sync-actions.ts)
// =============================================================================

/**
 * Sync session plan changes to all assigned (not started) workouts.
 * Called automatically after saveSessionWithExercisesAction().
 *
 * @param sessionPlanId - The session plan that was updated
 * @returns Number of workouts updated and any errors
 */
export interface SyncPlanToAssignedWorkoutsAction {
  (sessionPlanId: string): Promise<ActionState<SyncResult>>
}

/**
 * Manual sync for athlete to pull coach updates to ongoing workout.
 * Preserves athlete's logged data while adding new exercises/sets.
 *
 * @param workoutLogId - The athlete's workout to sync
 * @returns Sync result with details of what changed
 */
export interface AthletePullSyncAction {
  (workoutLogId: string): Promise<ActionState<SyncResult>>
}

/**
 * Check if a workout has available updates from coach.
 * Used to show "Updates available" badge.
 *
 * @param workoutLogId - The workout to check
 * @returns Sync status with timestamps
 */
export interface GetSyncStatusAction {
  (workoutLogId: string): Promise<ActionState<SyncStatus>>
}

// =============================================================================
// PART B: UX ACTIONS (actions/plans/*)
// =============================================================================

/**
 * Update mesocycle (training block) for individual users.
 * Already exists: updateMesocycleAction in plan-actions.ts
 *
 * @param id - Mesocycle ID
 * @param data - Fields to update
 */
export interface UpdateMesocycleInput {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  metadata?: {
    focus?: string
    phase?: string
    color?: string
  }
}

/**
 * Create a new session plan (workout) in a microcycle.
 * For individual users to add workouts to their weeks.
 *
 * @param data - Session plan data
 */
export interface CreateSessionPlanInput {
  microcycle_id: number
  name: string
  day: number  // 0-6 (Sunday-Saturday)
  session_mode?: string
  description?: string
}

export interface CreateSessionPlanAction {
  (data: CreateSessionPlanInput): Promise<ActionState<SessionPlan>>
}

/**
 * Get today's workout for an individual user.
 * Used by TodayWorkoutCTA component.
 *
 * @returns Today's session plan or null if rest day
 */
export interface GetTodayWorkoutAction {
  (): Promise<ActionState<TodayWorkout | null>>
}

// =============================================================================
// TYPES
// =============================================================================

export interface SyncResult {
  workoutsUpdated: number
  exercisesAdded: number
  exercisesRemoved: number
  setsUpdated: number
  preservedExercises: number  // Exercises kept due to logged data
  preservedSets: number       // Sets kept due to logged data
  errors: string[]
}

export interface SyncStatus {
  isOutOfSync: boolean
  planUpdatedAt: string | null
  lastSyncedAt: string | null
  changesSummary?: string  // e.g., "2 exercises added, 1 removed"
}

export interface TodayWorkout {
  id: string
  name: string
  day: number
  exerciseCount: number
  blockId: number
  blockName: string
  weekNumber: number
}

export interface SessionPlan {
  id: string
  microcycle_id: number
  name: string | null
  day: number | null
  session_mode: string | null
  description: string | null
  created_at: string
}

// =============================================================================
// COMPONENT PROPS CONTRACTS
// =============================================================================

/**
 * EditBlockDialog props
 */
export interface EditBlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mesocycle: {
    id: number
    name: string | null
    description: string | null
    start_date: string | null
    end_date: string | null
    metadata: {
      focus?: string
    } | null
  }
  onSuccess?: () => void
}

/**
 * AddWorkoutDialog props
 */
export interface AddWorkoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  microcycleId: number
  weekNumber: number
  existingDays: number[]  // Days that already have workouts
  onSuccess?: () => void
}

/**
 * TodayWorkoutCTA props
 */
export interface TodayWorkoutCTAProps {
  workout: TodayWorkout | null
  blockId: number
}

/**
 * AssignedToSection props (coach workspace)
 */
export interface AssignedToSectionProps {
  macrocycleId: number
  assignments: {
    groupId: number
    groupName: string
    athleteCount: number
    startedAt: string
    currentWeek: number
    completionPercentage: number
  }[]
}

// =============================================================================
// ZOD SCHEMAS (for form validation)
// =============================================================================

/**
 * These schemas will be implemented in the actual components.
 * Defined here as contracts.
 */

/*
export const editBlockSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  focus: z.enum(['strength', 'endurance', 'power', 'general']).optional(),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export const addWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  day: z.number().min(0).max(6),
  session_mode: z.enum(['individual', 'group']).optional(),
})
*/
