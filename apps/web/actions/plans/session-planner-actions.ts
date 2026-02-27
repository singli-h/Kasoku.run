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
import type { SessionPlannerExercise } from "@/components/features/training/adapters/session-adapter"

/**
 * Session metadata for updates
 * Matches the fields that can be updated on session_plans
 */
interface SessionUpdate {
  name?: string | null
  description?: string | null
  date?: string | null
  notes?: string | null
  week?: number | null
  day?: number | null
  session_mode?: string | null
}

/**
 * Convert superset_id from string | null to number | null for database
 * Handles both string numbers ("123") and null values
 */
function toSupersetIdNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

// Database types - using new schema naming
type SessionPlan = Database['public']['Tables']['session_plans']['Row']
type SessionPlanUpdate = Database['public']['Tables']['session_plans']['Update']
type SessionPlanExerciseInsert = Database['public']['Tables']['session_plan_exercises']['Insert']
type SessionPlanSetInsert = Database['public']['Tables']['session_plan_sets']['Insert']

// ============================================================================
// SESSION PLANNER - COMPREHENSIVE SAVE ACTION
// ============================================================================

// Debug logging - set to false in production
const DEBUG_SAVE = process.env.NODE_ENV === 'development'

/**
 * Rollback helper: restore deleted exercises/sets and clean up newly created ones.
 * Best-effort — logs errors but does not throw.
 *
 * Strategy:
 * 1. Delete newly created exercises (CASCADE removes their sets)
 * 2. Re-insert deleted exercises (needed before sets due to FK constraints)
 * 3. Upsert snapshotted sets with original IDs
 */
async function rollbackChanges(
  exercisesSnapshot: Array<Record<string, unknown>>,
  setsSnapshot: Array<Record<string, unknown>>,
  createdExerciseIds: string[],
  deletedExerciseIds: string[]
): Promise<void> {
  try {
    // Step 1: Clean up newly created exercises (CASCADE will remove their sets)
    if (createdExerciseIds.length > 0) {
      const { error: cleanupError } = await supabase
        .from('session_plan_exercises')
        .delete()
        .in('id', createdExerciseIds)
      if (cleanupError) {
        console.error('[saveSession:rollback] Failed to clean up new exercises:', cleanupError)
      }
    }

    // Step 2: Re-insert deleted exercises (must happen before sets due to FK)
    if (deletedExerciseIds.length > 0) {
      const exercisesToRestore = exercisesSnapshot.filter(
        ex => deletedExerciseIds.includes(String(ex.id))
      )
      if (exercisesToRestore.length > 0) {
        const { error: restoreExError } = await supabase
          .from('session_plan_exercises')
          .upsert(exercisesToRestore as SessionPlanExerciseInsert[], { onConflict: 'id' })
        if (restoreExError) {
          console.error('[saveSession:rollback] Failed to restore exercises:', restoreExError)
        }
      }
    }

    // Step 3: Upsert snapshotted sets with original IDs
    if (setsSnapshot.length > 0) {
      const { error: restoreError } = await supabase
        .from('session_plan_sets')
        .upsert(setsSnapshot as SessionPlanSetInsert[], { onConflict: 'id' })
      if (restoreError) {
        console.error('[saveSession:rollback] Failed to restore sets snapshot:', restoreError)
      }
    }
  } catch (rollbackError) {
    console.error('[saveSession:rollback] Unexpected error during rollback:', rollbackError)
  }
}

/**
 * Maps SessionPlannerExercise sets to database insert format
 */
function mapSetsToInsert(
  sets: SessionPlannerExercise['sets'],
  exerciseId: string
): SessionPlanSetInsert[] {
  return sets.map((set, idx) => ({
    session_plan_exercise_id: exerciseId,
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
    // Convert effort from 0-100 (UI percentage) to 0-1 (database)
    effort: set.effort != null ? set.effort / 100 : null,
    height: set.height,
    resistance: set.resistance
  }))
}

/**
 * Save complete session with all exercises and sets
 * Handles: session metadata, exercise order, supersets, and all set parameters
 *
 * ID Format Convention:
 * - Existing records: Numeric ID as string (e.g., "123") - will be updated
 * - New items: "new_" or "temp_" prefix - will be inserted
 *
 * Uses a snapshot-and-rollback strategy for data integrity:
 * 1. Before modifying, snapshots existing sets data
 * 2. On any failure after deletion, restores from snapshot
 * 3. Tracks newly created exercise IDs for cleanup on rollback
 */
export async function saveSessionWithExercisesAction(
  sessionId: string,
  sessionUpdates: Partial<SessionUpdate>,
  exercises: SessionPlannerExercise[]
): Promise<ActionState<SessionPlan>> {
  // Track newly created exercise IDs for rollback cleanup
  const createdExerciseIds: string[] = []

  try {
    if (DEBUG_SAVE) {
      console.log(`[saveSession] sessionId: ${sessionId}, exercises: ${exercises.length}`)
    }

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
      console.error('[saveSession] Session not found:', fetchError)
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
        console.error('[saveSession] Error updating session metadata:', updateError)
        return {
          isSuccess: false,
          message: `Failed to update session: ${updateError.message}`
        }
      }
    }

    // Step 3: Get existing session_plan_exercises with full sets data for snapshot
    const { data: existingExercises, error: exercisesError } = await supabase
      .from('session_plan_exercises')
      .select('id, exercise_id, exercise_order, superset_id, notes')
      .eq('session_plan_id', sessionId)

    if (exercisesError) {
      console.error('[saveSession] Error fetching existing exercises:', exercisesError)
      return {
        isSuccess: false,
        message: `Failed to fetch existing exercises: ${exercisesError.message}`
      }
    }

    // Snapshot existing exercises and sets before any modifications (for rollback)
    const exercisesSnapshot = (existingExercises || []) as Array<Record<string, unknown>>
    const { data: existingSets } = await supabase
      .from('session_plan_sets')
      .select('*')
      .in('session_plan_exercise_id', (existingExercises || []).map(ex => ex.id))

    const setsSnapshot = existingSets || []

    // Create a map of existing exercises by ID for quick lookup
    const existingExerciseMap = new Map(
      (existingExercises || []).map(ex => [ex.id, ex])
    )

    // Separate exercises into: existing (to update) vs new (to insert)
    // ID Convention: "new_" or "temp_" prefix = new item, UUID string = existing item
    const exercisesToUpdate: SessionPlannerExercise[] = []
    const exercisesToInsert: SessionPlannerExercise[] = []
    const exerciseIdsToKeep = new Set<string>()

    for (const exercise of exercises) {
      const idStr = String(exercise.id)
      // ID Convention:
      // - "new_" or "temp_" prefix = new item from client/AI
      // - UUID string matching existing DB ID = update
      // - Anything else = treat as new (safe fallback)
      const isNewExercise = idStr.startsWith('new_') || idStr.startsWith('new-') || idStr.startsWith('temp_') || idStr.startsWith('temp-')

      if (isNewExercise) {
        exercisesToInsert.push(exercise)
      } else {
        // Check if ID exists in database (UUID format)
        if (existingExerciseMap.has(idStr)) {
          exercisesToUpdate.push(exercise)
          exerciseIdsToKeep.add(idStr)
        } else {
          exercisesToInsert.push(exercise)
        }
      }
    }

    // Step 4: Delete session_plan_exercises that are no longer in the list
    const idsToDelete = Array.from(existingExerciseMap.keys()).filter(id => !exerciseIdsToKeep.has(String(id)))
    // Track deleted exercise IDs for rollback (need to restore exercises before sets due to FK)
    const deletedExerciseIds: string[] = [...idsToDelete]

    if (idsToDelete.length > 0) {
      // First delete session_plan_sets for these exercises (CASCADE should handle but be explicit)
      const { error: deleteSetsError } = await supabase
        .from('session_plan_sets')
        .delete()
        .in('session_plan_exercise_id', idsToDelete)

      if (deleteSetsError) {
        console.error('[saveSession] Error deleting sets:', deleteSetsError)
        // Continue - CASCADE might handle this
      }

      // Then delete the session_plan_exercises
      const { error: deleteExercisesError } = await supabase
        .from('session_plan_exercises')
        .delete()
        .in('id', idsToDelete)

      if (deleteExercisesError) {
        console.error('[saveSession] Error deleting exercises:', deleteExercisesError)
        return {
          isSuccess: false,
          message: `Failed to delete removed exercises: ${deleteExercisesError.message}`
        }
      }
    }

    // Step 5: Update existing session_plan_exercises
    for (const exercise of exercisesToUpdate) {
      const dbId = String(exercise.id)

      // Update the exercise record
      const { error: updateExerciseError } = await supabase
        .from('session_plan_exercises')
        .update({
          exercise_id: exercise.exercise_id,
          exercise_order: exercise.exercise_order,
          superset_id: toSupersetIdNumber(exercise.superset_id),
          notes: exercise.notes
        })
        .eq('id', dbId)

      if (updateExerciseError) {
        console.error(`[saveSession] Error updating exercise ${dbId}:`, updateExerciseError)
        await rollbackChanges(exercisesSnapshot, setsSnapshot, createdExerciseIds, deletedExerciseIds)
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
        console.error(`[saveSession] Error deleting old sets for exercise ${dbId}:`, deleteOldSetsError)
        // Continue anyway - sets may already be deleted
      }

      // Insert updated session_plan_sets
      if (exercise.sets && exercise.sets.length > 0) {
        const { error: insertSetsError } = await supabase
          .from('session_plan_sets')
          .insert(mapSetsToInsert(exercise.sets, dbId))

        if (insertSetsError) {
          console.error(`[saveSession] Error inserting sets for exercise ${dbId}:`, insertSetsError)
          await rollbackChanges(exercisesSnapshot, setsSnapshot, createdExerciseIds, deletedExerciseIds)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertSetsError.message}`
          }
        }
      }
    }

    // Step 6: Insert new session_plan_exercises
    for (const exercise of exercisesToInsert) {
      if (DEBUG_SAVE) {
        console.log(`[saveSession] New exercise: ${exercise.exercise?.name}, sets: ${exercise.sets?.length ?? 0}`)
      }

      // Insert the exercise record
      const exerciseData: SessionPlanExerciseInsert = {
        session_plan_id: sessionId,
        exercise_id: exercise.exercise_id,
        exercise_order: exercise.exercise_order,
        superset_id: toSupersetIdNumber(exercise.superset_id),
        notes: exercise.notes
      }

      const { data: newExercise, error: insertExerciseError } = await supabase
        .from('session_plan_exercises')
        .insert(exerciseData)
        .select('id')
        .single()

      if (insertExerciseError || !newExercise) {
        console.error('[saveSession] Error inserting exercise:', insertExerciseError)
        await rollbackChanges(exercisesSnapshot, setsSnapshot, createdExerciseIds, deletedExerciseIds)
        return {
          isSuccess: false,
          message: `Failed to add exercise: ${insertExerciseError?.message}`
        }
      }

      // Track for potential rollback
      createdExerciseIds.push(newExercise.id)

      // Insert session_plan_sets for the new exercise
      if (exercise.sets && exercise.sets.length > 0) {
        const { error: insertSetsError } = await supabase
          .from('session_plan_sets')
          .insert(mapSetsToInsert(exercise.sets, newExercise.id))

        if (insertSetsError) {
          console.error('[saveSession] Error inserting sets for new exercise:', insertSetsError)
          await rollbackChanges(exercisesSnapshot, setsSnapshot, createdExerciseIds, deletedExerciseIds)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertSetsError.message}`
          }
        }
      } else if (DEBUG_SAVE) {
        console.warn(`[saveSession] No sets for new exercise ${newExercise.id}`)
      }
    }

    // Step 7: Fetch and return the updated session
    const { data: updatedSession, error: finalFetchError } = await supabase
      .from('session_plans')
      .select('id, athlete_group_id, user_id, microcycle_id, name, description, session_mode, week, day, date, updated_at, created_at, deleted, is_template')
      .eq('id', sessionId)
      .single()

    if (finalFetchError || !updatedSession) {
      console.error('[saveSession] Error fetching updated session:', finalFetchError)
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
    console.error('[saveSession] Unexpected error:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
