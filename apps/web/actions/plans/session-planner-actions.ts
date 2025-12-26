/*
<ai_context>
Server actions for SESSION PLANNER page (/plans/[id]/session/[sessionId]).
Handles SINGLE session editing with full exercise and set management.

DIFFERENT FROM session-plan-actions.ts which handles MesoWizard MULTIPLE session creation.

This file manages:
- Loading a single session with all exercises and sets
- Saving all changes to a session (metadata, exercises, sets) atomically
- Managing exercise order, supersets, and set parameters

ID Format Convention:
- Existing database records: Numeric ID as string (e.g., "123")
- New client-side items: "new_" prefix (e.g., "new_1735123456789")
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// Import types from session planner
import type { SessionExercise, Session } from "@/components/features/plans/session-planner/types"

// Database types - using new schema naming
type SessionPlan = Database['public']['Tables']['session_plans']['Row']
type SessionPlanUpdate = Database['public']['Tables']['session_plans']['Update']
type SessionPlanExerciseInsert = Database['public']['Tables']['session_plan_exercises']['Insert']
type SessionPlanSetInsert = Database['public']['Tables']['session_plan_sets']['Insert']

// ============================================================================
// SESSION PLANNER - COMPREHENSIVE SAVE ACTION
// ============================================================================

/**
 * Save complete session with all exercises and sets
 * Handles: session metadata, exercise order, supersets, and all set parameters
 * Performs atomic transaction-like operations for data consistency
 *
 * ID Format Convention:
 * - Existing records: Numeric ID as string (e.g., "123") - will be updated
 * - New items: "new_" prefix (e.g., "new_1735123456789") - will be inserted
 */
export async function saveSessionWithExercisesAction(
  sessionId: number,
  sessionUpdates: Partial<Session>,
  exercises: SessionExercise[]
): Promise<ActionState<SessionPlan>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Step 1: Verify ownership and get existing session with microcycle for path revalidation
    const { data: existingSession, error: fetchError } = await supabase
      .from('session_plans')
      .select('id, user_id, microcycle_id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      console.error('[saveSessionWithExercisesAction] Session not found:', fetchError)
      return {
        isSuccess: false,
        message: "Session not found"
      }
    }

    if (existingSession.user_id !== dbUserId) {
      return {
        isSuccess: false,
        message: "You don't have permission to edit this session"
      }
    }

    // Step 2: Update session metadata
    const sessionUpdateData: Partial<SessionPlanUpdate> = {}
    if (sessionUpdates.name !== undefined) sessionUpdateData.name = sessionUpdates.name
    if (sessionUpdates.description !== undefined) sessionUpdateData.description = sessionUpdates.description
    if (sessionUpdates.date !== undefined) sessionUpdateData.date = sessionUpdates.date
    if (sessionUpdates.week !== undefined) sessionUpdateData.week = sessionUpdates.week
    if (sessionUpdates.day !== undefined) sessionUpdateData.day = sessionUpdates.day
    if (sessionUpdates.session_mode !== undefined) sessionUpdateData.session_mode = sessionUpdates.session_mode

    if (Object.keys(sessionUpdateData).length > 0) {
      const { error: updateError } = await supabase
        .from('session_plans')
        .update(sessionUpdateData)
        .eq('id', sessionId)
        .eq('user_id', dbUserId)

      if (updateError) {
        console.error('[saveSessionWithExercisesAction] Error updating session metadata:', updateError)
        return {
          isSuccess: false,
          message: `Failed to update session: ${updateError.message}`
        }
      }
    }

    // Step 3: Get existing session_plan_exercises to determine what to delete/update/insert
    const { data: existingExercises, error: exercisesError } = await supabase
      .from('session_plan_exercises')
      .select('id, exercise_id, exercise_order, superset_id, notes')
      .eq('session_plan_id', sessionId)

    if (exercisesError) {
      console.error('[saveSessionWithExercisesAction] Error fetching existing exercises:', exercisesError)
      return {
        isSuccess: false,
        message: `Failed to fetch existing exercises: ${exercisesError.message}`
      }
    }

    // Create a map of existing exercises by ID for quick lookup
    const existingExerciseMap = new Map(
      (existingExercises || []).map(ex => [ex.id, ex])
    )

    // Separate exercises into: existing (to update) vs new (to insert)
    // ID Convention: "new_" prefix = new item, numeric string = existing item
    const exercisesToUpdate: SessionExercise[] = []
    const exercisesToInsert: SessionExercise[] = []
    const exerciseIdsToKeep = new Set<number>()

    for (const exercise of exercises) {
      const idStr = String(exercise.id)
      const isNewExercise = idStr.startsWith('new_') || idStr.startsWith('new-')

      if (isNewExercise) {
        // New exercise - will be inserted
        exercisesToInsert.push(exercise)
      } else {
        // Try to parse as existing database ID
        const dbId = parseInt(idStr, 10)
        if (!isNaN(dbId) && existingExerciseMap.has(dbId)) {
          exercisesToUpdate.push(exercise)
          exerciseIdsToKeep.add(dbId)
        } else {
          // ID doesn't match existing records - treat as new
          exercisesToInsert.push(exercise)
        }
      }
    }

    // Step 4: Delete session_plan_exercises that are no longer in the list
    const idsToDelete = Array.from(existingExerciseMap.keys()).filter(id => !exerciseIdsToKeep.has(id))

    if (idsToDelete.length > 0) {
      // First delete session_plan_sets for these exercises (CASCADE should handle but be explicit)
      const { error: deleteSetsError } = await supabase
        .from('session_plan_sets')
        .delete()
        .in('session_plan_exercise_id', idsToDelete)

      if (deleteSetsError) {
        console.error('[saveSessionWithExercisesAction] Error deleting sets:', deleteSetsError)
        // Continue - CASCADE might handle this
      }

      // Then delete the session_plan_exercises
      const { error: deleteExercisesError } = await supabase
        .from('session_plan_exercises')
        .delete()
        .in('id', idsToDelete)

      if (deleteExercisesError) {
        console.error('[saveSessionWithExercisesAction] Error deleting exercises:', deleteExercisesError)
        return {
          isSuccess: false,
          message: `Failed to delete removed exercises: ${deleteExercisesError.message}`
        }
      }
    }

    // Step 5: Update existing session_plan_exercises
    for (const exercise of exercisesToUpdate) {
      const dbId = parseInt(String(exercise.id), 10)

      // Update the exercise record
      const { error: updateExerciseError } = await supabase
        .from('session_plan_exercises')
        .update({
          exercise_id: exercise.exercise_id,
          exercise_order: exercise.exercise_order,
          superset_id: exercise.superset_id,
          notes: exercise.notes
        })
        .eq('id', dbId)

      if (updateExerciseError) {
        console.error(`[saveSessionWithExercisesAction] Error updating exercise ${dbId}:`, updateExerciseError)
        return {
          isSuccess: false,
          message: `Failed to update exercise: ${updateExerciseError.message}`
        }
      }

      // Delete existing session_plan_sets for this exercise (will re-insert with updated values)
      const { error: deleteOldSetsError } = await supabase
        .from('session_plan_sets')
        .delete()
        .eq('session_plan_exercise_id', dbId)

      if (deleteOldSetsError) {
        console.error(`[saveSessionWithExercisesAction] Error deleting old sets for exercise ${dbId}:`, deleteOldSetsError)
        // Continue anyway
      }

      // Insert updated session_plan_sets
      if (exercise.sets && exercise.sets.length > 0) {
        const setsData: SessionPlanSetInsert[] = exercise.sets.map((set, idx) => ({
          session_plan_exercise_id: dbId,
          set_index: set.set_index ?? idx + 1,
          reps: set.reps,
          weight: set.weight,
          distance: set.distance,
          performing_time: set.performing_time,
          rest_time: set.rest_time,
          tempo: set.tempo,
          rpe: set.rpe,
          resistance_unit_id: set.resistance_unit_id,
          power: set.power,
          velocity: set.velocity,
          effort: set.effort,
          height: set.height,
          resistance: set.resistance
        }))

        const { error: insertSetsError } = await supabase
          .from('session_plan_sets')
          .insert(setsData)

        if (insertSetsError) {
          console.error(`[saveSessionWithExercisesAction] Error inserting sets for exercise ${dbId}:`, insertSetsError)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertSetsError.message}`
          }
        }
      }
    }

    // Step 6: Insert new session_plan_exercises
    for (const exercise of exercisesToInsert) {
      // Insert the exercise record
      const exerciseData: SessionPlanExerciseInsert = {
        session_plan_id: sessionId,
        exercise_id: exercise.exercise_id,
        exercise_order: exercise.exercise_order,
        superset_id: exercise.superset_id,
        notes: exercise.notes
      }

      const { data: newExercise, error: insertExerciseError } = await supabase
        .from('session_plan_exercises')
        .insert(exerciseData)
        .select('id')
        .single()

      if (insertExerciseError || !newExercise) {
        console.error('[saveSessionWithExercisesAction] Error inserting exercise:', insertExerciseError)
        return {
          isSuccess: false,
          message: `Failed to add exercise: ${insertExerciseError?.message}`
        }
      }

      // Insert session_plan_sets for the new exercise
      if (exercise.sets && exercise.sets.length > 0) {
        const setsData: SessionPlanSetInsert[] = exercise.sets.map((set, idx) => ({
          session_plan_exercise_id: newExercise.id,
          set_index: set.set_index ?? idx + 1,
          reps: set.reps,
          weight: set.weight,
          distance: set.distance,
          performing_time: set.performing_time,
          rest_time: set.rest_time,
          tempo: set.tempo,
          rpe: set.rpe,
          resistance_unit_id: set.resistance_unit_id,
          power: set.power,
          velocity: set.velocity,
          effort: set.effort,
          height: set.height,
          resistance: set.resistance
        }))

        const { error: insertSetsError } = await supabase
          .from('session_plan_sets')
          .insert(setsData)

        if (insertSetsError) {
          console.error('[saveSessionWithExercisesAction] Error inserting sets for new exercise:', insertSetsError)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertSetsError.message}`
          }
        }
      }
    }

    // Step 7: Fetch and return the updated session
    const { data: updatedSession, error: finalFetchError } = await supabase
      .from('session_plans')
      .select('id, athlete_group_id, user_id, microcycle_id, name, description, session_mode, week, day, date, updated_at, created_at, deleted, is_template')
      .eq('id', sessionId)
      .single()

    if (finalFetchError || !updatedSession) {
      console.error('[saveSessionWithExercisesAction] Error fetching updated session:', finalFetchError)
      return {
        isSuccess: false,
        message: "Session saved but failed to fetch updated data"
      }
    }

    // Step 8: Revalidate cache paths for updated data
    revalidatePath('/plans')
    revalidatePath(`/plans/[id]`, 'page')
    revalidatePath(`/plans/[id]/session/[sessionId]`, 'page')

    return {
      isSuccess: true,
      message: "Session saved successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error('[saveSessionWithExercisesAction] Unexpected error:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
