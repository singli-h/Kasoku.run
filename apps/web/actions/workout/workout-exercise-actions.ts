'use server'

/**
 * Workout Exercise Actions
 *
 * Server actions for modifying workout exercises.
 * Used by the AI Workout Assistant for athlete workout modifications.
 *
 * @see specs/005-ai-athlete-workout/spec.md
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import type { ActionState } from '@/types'
import type { Database } from '@/types/database'

type WorkoutLogExercise = Database['public']['Tables']['workout_log_exercises']['Row']
type WorkoutLog = Database['public']['Tables']['workout_logs']['Row']

/**
 * Add a new exercise to a workout.
 *
 * @param workoutLogId - The workout log ID
 * @param exerciseData - The exercise data to add
 * @param exerciseData.id - Optional pre-generated UUID for the exercise. If provided,
 *                          this ID will be used instead of letting the database generate one.
 *                          Used by ChangeSet execution to maintain ID consistency.
 * @returns The created workout log exercise
 */
export async function addWorkoutExerciseAction(
  workoutLogId: string,
  exerciseData: {
    id?: string
    exercise_id: number
    exercise_order?: number
    notes?: string
  }
): Promise<ActionState<WorkoutLogExercise>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: 'User not authenticated',
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify workout ownership
    const { data: workout, error: workoutError } = await supabase
      .from('workout_logs')
      .select('id, athlete_id')
      .eq('id', workoutLogId)
      .single()

    if (workoutError || !workout) {
      return {
        isSuccess: false,
        message: 'Workout not found',
      }
    }

    // Verify athlete ownership
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete || workout.athlete_id !== athlete.id) {
      return {
        isSuccess: false,
        message: 'Unauthorized',
      }
    }

    // Get max exercise order if not provided
    let exerciseOrder = exerciseData.exercise_order
    if (exerciseOrder === undefined) {
      const { data: maxOrder } = await supabase
        .from('workout_log_exercises')
        .select('exercise_order')
        .eq('workout_log_id', workoutLogId)
        .order('exercise_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      exerciseOrder = (maxOrder?.exercise_order ?? 0) + 1
    }

    // Insert the new exercise
    // If id is provided (from ChangeSet execution), use it; otherwise let DB generate
    const { data: exercise, error: insertError } = await supabase
      .from('workout_log_exercises')
      .insert({
        ...(exerciseData.id ? { id: exerciseData.id } : {}),
        workout_log_id: workoutLogId,
        exercise_id: exerciseData.exercise_id,
        exercise_order: exerciseOrder,
        notes: exerciseData.notes ?? null,
      })
      .select()
      .single()

    if (insertError || !exercise) {
      console.error('[addWorkoutExerciseAction] Error:', insertError)
      return {
        isSuccess: false,
        message: 'Failed to add exercise',
      }
    }

    revalidatePath(`/workout/${workoutLogId}`)

    return {
      isSuccess: true,
      message: 'Exercise added successfully',
      data: exercise,
    }
  } catch (error) {
    console.error('[addWorkoutExerciseAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update a workout exercise (swap, reorder, or update notes).
 *
 * @param workoutLogExerciseId - The workout log exercise ID
 * @param updates - The fields to update
 * @returns The updated workout log exercise
 */
export async function updateWorkoutExerciseAction(
  workoutLogExerciseId: string,
  updates: {
    exercise_id?: number
    exercise_order?: number
    notes?: string | null
  }
): Promise<ActionState<WorkoutLogExercise>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: 'User not authenticated',
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get the exercise with workout info for ownership verification
    const { data: existingExercise, error: fetchError } = await supabase
      .from('workout_log_exercises')
      .select(`
        id,
        workout_log_id,
        workout_logs!inner (
          athlete_id
        )
      `)
      .eq('id', workoutLogExerciseId)
      .single()

    if (fetchError || !existingExercise) {
      return {
        isSuccess: false,
        message: 'Exercise not found',
      }
    }

    // Verify athlete ownership
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    const workoutLog = existingExercise.workout_logs as unknown as { athlete_id: number }
    if (!athlete || workoutLog.athlete_id !== athlete.id) {
      return {
        isSuccess: false,
        message: 'Unauthorized',
      }
    }

    // Update the exercise
    const { data: exercise, error: updateError } = await supabase
      .from('workout_log_exercises')
      .update(updates)
      .eq('id', workoutLogExerciseId)
      .select()
      .single()

    if (updateError || !exercise) {
      console.error('[updateWorkoutExerciseAction] Error:', updateError)
      return {
        isSuccess: false,
        message: 'Failed to update exercise',
      }
    }

    revalidatePath(`/workout/${existingExercise.workout_log_id}`)

    return {
      isSuccess: true,
      message: 'Exercise updated successfully',
      data: exercise,
    }
  } catch (error) {
    console.error('[updateWorkoutExerciseAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update workout session notes.
 *
 * @param workoutLogId - The workout log ID
 * @param notes - The notes to set
 * @returns The updated workout log
 */
export async function updateWorkoutNotesAction(
  workoutLogId: string,
  notes: string
): Promise<ActionState<WorkoutLog>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: 'User not authenticated',
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Get workout for ownership verification
    const { data: workout, error: fetchError } = await supabase
      .from('workout_logs')
      .select('id, athlete_id')
      .eq('id', workoutLogId)
      .single()

    if (fetchError || !workout) {
      return {
        isSuccess: false,
        message: 'Workout not found',
      }
    }

    // Verify athlete ownership
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (!athlete || workout.athlete_id !== athlete.id) {
      return {
        isSuccess: false,
        message: 'Unauthorized',
      }
    }

    // Update the notes
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workout_logs')
      .update({ notes })
      .eq('id', workoutLogId)
      .select()
      .single()

    if (updateError || !updatedWorkout) {
      console.error('[updateWorkoutNotesAction] Error:', updateError)
      return {
        isSuccess: false,
        message: 'Failed to update notes',
      }
    }

    revalidatePath(`/workout/${workoutLogId}`)

    return {
      isSuccess: true,
      message: 'Notes updated successfully',
      data: updatedWorkout,
    }
  } catch (error) {
    console.error('[updateWorkoutNotesAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
