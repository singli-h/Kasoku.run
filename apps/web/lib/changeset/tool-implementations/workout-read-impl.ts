/**
 * ChangeSet Pattern: Workout Read Tool Implementations
 *
 * Server-side implementations for athlete workout read tools.
 * These fetch workout log data from Supabase and format it for AI consumption.
 *
 * Key difference from coach domain:
 * - Works with workout_log_* tables (actual performance)
 * - Includes prescribed data from session_plan_* for comparison
 * - Tracks progress (completed/skipped sets)
 *
 * @see specs/005-ai-athlete-workout/contracts/athlete-tools.yaml
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// Reuse searchExercises from coach domain (same exercise library)
import { executeSearchExercises } from './read-impl'
import type { SearchExercisesInput } from '../tools'

// ============================================================================
// Types
// ============================================================================

/**
 * Set parameters (used for both prescribed and actual).
 */
export interface SetParameters {
  reps: number | null
  weight: number | null
  rpe: number | null
  distance?: number | null
  performingTime?: number | null
  power?: number | null
  velocity?: number | null
  height?: number | null
  resistance?: number | null
}

/**
 * Actual set data with completion status.
 */
export interface ActualSetData extends SetParameters {
  completed: boolean
}

/**
 * Individual set in the workout context.
 */
export interface WorkoutSet {
  id: string
  setIndex: number
  prescribed: SetParameters
  actual: ActualSetData | null
}

/**
 * Exercise in the workout context.
 */
export interface WorkoutExercise {
  id: string
  workoutLogExerciseId: string
  exerciseId: string
  exerciseName: string
  exerciseOrder: number
  notes: string | null
  sets: WorkoutSet[]
}

/**
 * Progress summary for the workout.
 */
export interface WorkoutProgress {
  totalSets: number
  completedSets: number
  skippedSets: number
}

/**
 * Workout context returned to the AI.
 *
 * Includes session info, exercises with prescribed vs actual data,
 * and overall progress tracking.
 */
export interface WorkoutContext {
  session: {
    id: string
    name: string
    sessionStatus: 'assigned' | 'ongoing' | 'completed'
    dateTime: string | null
    notes: string | null
  }
  exercises: WorkoutExercise[]
  progress: WorkoutProgress
}

/**
 * Input parameters for getWorkoutContext tool.
 */
export interface GetWorkoutContextInput {
  workoutLogId: string
  includeHistory?: boolean
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Executes the getWorkoutContext read tool.
 *
 * Fetches the workout log with all exercises and sets,
 * including prescribed data from the linked session plan.
 *
 * @param input - Tool input parameters
 * @param supabase - Supabase client
 * @returns Workout context for AI
 */
export async function executeGetWorkoutContext(
  input: GetWorkoutContextInput,
  supabase: SupabaseClient
): Promise<WorkoutContext> {
  const { workoutLogId } = input

  // Fetch workout log with session plan name
  const { data: workoutLog, error: workoutError } = await supabase
    .from('workout_logs')
    .select(
      `
      id,
      session_status,
      date_time,
      notes,
      session_plans (
        id,
        name
      )
    `
    )
    .eq('id', workoutLogId)
    .single()

  if (workoutError || !workoutLog) {
    throw new Error(`Workout not found: ${workoutLogId}`)
  }

  // Type assertion for nested join
  const sessionPlan = workoutLog.session_plans as unknown as {
    id: string
    name: string
  } | null

  // Fetch workout exercises with linked session plan exercises
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from('workout_log_exercises')
    .select(
      `
      id,
      exercise_id,
      exercise_order,
      notes,
      session_plan_exercise_id,
      exercises!inner (
        id,
        name
      )
    `
    )
    .eq('workout_log_id', workoutLogId)
    .order('exercise_order', { ascending: true })

  if (exercisesError) {
    console.error('[executeGetWorkoutContext] Error fetching exercises:', exercisesError)
    throw new Error('Failed to fetch workout exercises')
  }

  // Get all session_plan_exercise_ids to fetch prescribed sets
  const sessionPlanExerciseIds = (workoutExercises ?? [])
    .map((e) => e.session_plan_exercise_id)
    .filter((id): id is string => id !== null)

  // Fetch prescribed sets from session_plan_sets
  let prescribedSetsMap = new Map<
    string,
    Array<{
      set_index: number
      reps: number | null
      weight: number | null
      rpe: number | null
      distance: number | null
      performing_time: number | null
      power: number | null
      velocity: number | null
      height: number | null
      resistance: number | null
    }>
  >()

  if (sessionPlanExerciseIds.length > 0) {
    const { data: prescribedSets, error: prescribedError } = await supabase
      .from('session_plan_sets')
      .select(
        `
        session_plan_exercise_id,
        set_index,
        reps,
        weight,
        rpe,
        distance,
        performing_time,
        power,
        velocity,
        height,
        resistance
      `
      )
      .in('session_plan_exercise_id', sessionPlanExerciseIds)
      .order('set_index', { ascending: true })

    if (!prescribedError && prescribedSets) {
      // Group by session_plan_exercise_id
      for (const set of prescribedSets) {
        const exerciseId = set.session_plan_exercise_id
        if (exerciseId !== null) {
          if (!prescribedSetsMap.has(exerciseId)) {
            prescribedSetsMap.set(exerciseId, [])
          }
          prescribedSetsMap.get(exerciseId)!.push(set)
        }
      }
    }
  }

  // Fetch actual sets from workout_log_sets
  const workoutExerciseIds = (workoutExercises ?? []).map((e) => e.id)

  let actualSetsMap = new Map<
    string,
    Array<{
      id: string
      set_index: number | null
      reps: number | null
      weight: number | null
      rpe: number | null
      completed: boolean | null
      distance: number | null
      performing_time: number | null
      power: number | null
      velocity: number | null
      height: number | null
      resistance: number | null
    }>
  >()

  if (workoutExerciseIds.length > 0) {
    const { data: actualSets, error: actualError } = await supabase
      .from('workout_log_sets')
      .select(
        `
        id,
        workout_log_exercise_id,
        set_index,
        reps,
        weight,
        rpe,
        completed,
        distance,
        performing_time,
        power,
        velocity,
        height,
        resistance
      `
      )
      .in('workout_log_exercise_id', workoutExerciseIds)
      .order('set_index', { ascending: true })

    if (!actualError && actualSets) {
      // Group by workout_log_exercise_id
      for (const set of actualSets) {
        const exerciseId = set.workout_log_exercise_id
        if (exerciseId !== null) {
          if (!actualSetsMap.has(exerciseId)) {
            actualSetsMap.set(exerciseId, [])
          }
          actualSetsMap.get(exerciseId)!.push(set)
        }
      }
    }
  }

  // Build exercises with sets
  let totalSets = 0
  let completedSets = 0
  let skippedSets = 0

  const exercises: WorkoutExercise[] = (workoutExercises ?? []).map((wle) => {
    // Type assertion for nested exercise
    const exercise = wle.exercises as unknown as { id: number; name: string }

    // Get prescribed sets for this exercise
    const prescribedSets = wle.session_plan_exercise_id
      ? prescribedSetsMap.get(wle.session_plan_exercise_id) ?? []
      : []

    // Get actual sets for this exercise
    const actualSets = actualSetsMap.get(wle.id) ?? []

    // Create a map of actual sets by set_index for easy lookup
    const actualByIndex = new Map(actualSets.map((s) => [s.set_index, s]))

    // Determine total sets (max of prescribed or actual)
    const maxSetIndex = Math.max(
      prescribedSets.length > 0 ? Math.max(...prescribedSets.map((s) => s.set_index ?? 0)) : 0,
      actualSets.length > 0 ? Math.max(...actualSets.map((s) => s.set_index ?? 0)) : 0
    )

    // Build sets array
    const sets: WorkoutSet[] = []
    for (let i = 1; i <= maxSetIndex; i++) {
      const prescribed = prescribedSets.find((s) => s.set_index === i)
      const actual = actualByIndex.get(i)

      totalSets++

      if (actual?.completed === true) {
        completedSets++
      } else if (actual?.completed === false) {
        skippedSets++
      }

      sets.push({
        id: actual ? String(actual.id) : `prescribed-${wle.id}-${i}`,
        setIndex: i,
        prescribed: {
          reps: prescribed?.reps ?? null,
          weight: prescribed?.weight ?? null,
          rpe: prescribed?.rpe ?? null,
          distance: prescribed?.distance ?? null,
          performingTime: prescribed?.performing_time ?? null,
          power: prescribed?.power ?? null,
          velocity: prescribed?.velocity ?? null,
          height: prescribed?.height ?? null,
          resistance: prescribed?.resistance ?? null,
        },
        actual: actual
          ? {
              reps: actual.reps,
              weight: actual.weight,
              rpe: actual.rpe,
              completed: actual.completed ?? false,
              distance: actual.distance,
              performingTime: actual.performing_time,
              power: actual.power,
              velocity: actual.velocity,
              height: actual.height,
              resistance: actual.resistance,
            }
          : null,
      })
    }

    return {
      id: String(exercise.id),
      workoutLogExerciseId: String(wle.id),
      exerciseId: String(wle.exercise_id),
      exerciseName: exercise.name ?? 'Unknown Exercise',
      exerciseOrder: wle.exercise_order,
      notes: wle.notes,
      sets,
    }
  })

  return {
    session: {
      id: String(workoutLog.id),
      name: sessionPlan?.name ?? 'Workout',
      sessionStatus: workoutLog.session_status as 'assigned' | 'ongoing' | 'completed',
      dateTime: workoutLog.date_time,
      notes: workoutLog.notes,
    },
    exercises,
    progress: {
      totalSets,
      completedSets,
      skippedSets,
    },
  }
}

/**
 * Execute an athlete read tool by name.
 *
 * @param toolName - The name of the read tool
 * @param args - Tool arguments
 * @param supabase - Supabase client
 * @returns Tool result
 */
export async function executeAthleteReadTool(
  toolName: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (toolName) {
    case 'getWorkoutContext': {
      // Validate required field
      const workoutLogId = args.workoutLogId
      if (typeof workoutLogId !== 'string') {
        throw new Error('getWorkoutContext requires workoutLogId as string')
      }
      const input: GetWorkoutContextInput = {
        workoutLogId,
        includeHistory: typeof args.includeHistory === 'boolean' ? args.includeHistory : undefined,
      }
      return executeGetWorkoutContext(input, supabase)
    }

    case 'searchExercises':
      // Reuse the same exercise search from coach domain
      return executeSearchExercises(args as SearchExercisesInput, supabase)

    default:
      throw new Error(`Unknown athlete read tool: ${toolName}`)
  }
}
