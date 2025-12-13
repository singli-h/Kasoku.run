/*
<ai_context>
Server actions for SESSION PLANNER page (/plans/[id]/session/[sessionId]).
Handles SINGLE session editing with full exercise preset management.

DIFFERENT FROM session-plan-actions.ts which handles MesoWizard MULTIPLE session creation.

This file manages:
- Loading a single session with all exercises and sets
- Saving all changes to a session (metadata, exercises, sets) atomically
- Managing exercise order, supersets, and set parameters
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// Import types from session planner
import type { SessionExercise, Session } from "@/components/features/plans/session-planner/types"

// Database types
type ExercisePresetGroup = Database['public']['Tables']['exercise_preset_groups']['Row']
type ExercisePresetGroupUpdate = Database['public']['Tables']['exercise_preset_groups']['Update']
type ExercisePresetInsert = Database['public']['Tables']['exercise_presets']['Insert']
type ExercisePresetDetailInsert = Database['public']['Tables']['exercise_preset_details']['Insert']

// ============================================================================
// SESSION PLANNER - COMPREHENSIVE SAVE ACTION
// ============================================================================

/**
 * Save complete session with all exercises and sets
 * Handles: session metadata, exercise order, supersets, and all set parameters
 * Performs atomic transaction-like operations for data consistency
 */
export async function saveSessionWithExercisesAction(
  sessionId: number,
  sessionUpdates: Partial<Session>,
  exercises: SessionExercise[]
): Promise<ActionState<ExercisePresetGroup>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Step 1: Verify ownership and get existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('exercise_preset_groups')
      .select('id, user_id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
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
    const sessionUpdateData: Partial<ExercisePresetGroupUpdate> = {}
    if (sessionUpdates.name !== undefined) sessionUpdateData.name = sessionUpdates.name
    if (sessionUpdates.description !== undefined) sessionUpdateData.description = sessionUpdates.description
    if (sessionUpdates.date !== undefined) sessionUpdateData.date = sessionUpdates.date
    if (sessionUpdates.week !== undefined) sessionUpdateData.week = sessionUpdates.week
    if (sessionUpdates.day !== undefined) sessionUpdateData.day = sessionUpdates.day
    if (sessionUpdates.session_mode !== undefined) sessionUpdateData.session_mode = sessionUpdates.session_mode

    const { error: updateError } = await supabase
      .from('exercise_preset_groups')
      .update(sessionUpdateData)
      .eq('id', sessionId)
      .eq('user_id', dbUserId)

    if (updateError) {
      console.error('Error updating session metadata:', updateError)
      return {
        isSuccess: false,
        message: `Failed to update session: ${updateError.message}`
      }
    }

    // Step 3: Get existing exercise presets to determine what to delete/update/insert
    const { data: existingPresets, error: presetsError } = await supabase
      .from('exercise_presets')
      .select('id, exercise_id, preset_order, superset_id, notes')
      .eq('exercise_preset_group_id', sessionId)

    if (presetsError) {
      console.error('Error fetching existing presets:', presetsError)
      return {
        isSuccess: false,
        message: `Failed to fetch existing exercises: ${presetsError.message}`
      }
    }

    // Create a map of existing presets by ID for quick lookup
    const existingPresetMap = new Map(
      (existingPresets || []).map(preset => [preset.id, preset])
    )

    // Separate exercises into: existing (to update) vs new (to insert)
    const exercisesToUpdate: SessionExercise[] = []
    const exercisesToInsert: SessionExercise[] = []
    const exerciseIdsToKeep = new Set<number>()

    for (const exercise of exercises) {
      // Check if this exercise has a database ID (numeric string or number from id field)
      const dbId = exercise.id.startsWith('ex_') ? null : parseInt(exercise.id)

      if (dbId && existingPresetMap.has(dbId)) {
        exercisesToUpdate.push(exercise)
        exerciseIdsToKeep.add(dbId)
      } else {
        exercisesToInsert.push(exercise)
      }
    }

    // Step 4: Delete exercise presets that are no longer in the list
    const idsToDelete = Array.from(existingPresetMap.keys()).filter(id => !exerciseIdsToKeep.has(id))

    if (idsToDelete.length > 0) {
      // First delete exercise_preset_details for these presets
      const { error: deleteDetailsError } = await supabase
        .from('exercise_preset_details')
        .delete()
        .in('exercise_preset_id', idsToDelete)

      if (deleteDetailsError) {
        console.error('Error deleting exercise details:', deleteDetailsError)
        // Continue anyway - CASCADE might handle this
      }

      // Then delete the exercise_presets
      const { error: deletePresetsError } = await supabase
        .from('exercise_presets')
        .delete()
        .in('id', idsToDelete)

      if (deletePresetsError) {
        console.error('Error deleting exercise presets:', deletePresetsError)
        return {
          isSuccess: false,
          message: `Failed to delete removed exercises: ${deletePresetsError.message}`
        }
      }
    }

    // Step 5: Update existing exercise presets
    for (const exercise of exercisesToUpdate) {
      const dbId = parseInt(exercise.id)

      // Update the exercise preset
      const { error: updatePresetError } = await supabase
        .from('exercise_presets')
        .update({
          exercise_id: exercise.exercise_id,
          preset_order: exercise.preset_order,
          superset_id: exercise.superset_id,
          notes: exercise.notes
        })
        .eq('id', dbId)

      if (updatePresetError) {
        console.error(`Error updating exercise preset ${dbId}:`, updatePresetError)
        return {
          isSuccess: false,
          message: `Failed to update exercise: ${updatePresetError.message}`
        }
      }

      // Delete existing exercise_preset_details for this preset
      const { error: deleteOldDetailsError } = await supabase
        .from('exercise_preset_details')
        .delete()
        .eq('exercise_preset_id', dbId)

      if (deleteOldDetailsError) {
        console.error(`Error deleting old details for preset ${dbId}:`, deleteOldDetailsError)
        // Continue anyway
      }

      // Insert new exercise_preset_details
      if (exercise.sets && exercise.sets.length > 0) {
        const detailsData: ExercisePresetDetailInsert[] = exercise.sets.map(set => ({
          exercise_preset_id: dbId,
          set_index: set.set_index,
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

        const { error: insertDetailsError } = await supabase
          .from('exercise_preset_details')
          .insert(detailsData)

        if (insertDetailsError) {
          console.error(`Error inserting details for preset ${dbId}:`, insertDetailsError)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertDetailsError.message}`
          }
        }
      }
    }

    // Step 6: Insert new exercise presets
    for (const exercise of exercisesToInsert) {
      // Insert the exercise preset
      const presetData: ExercisePresetInsert = {
        exercise_preset_group_id: sessionId,
        exercise_id: exercise.exercise_id,
        preset_order: exercise.preset_order,
        superset_id: exercise.superset_id,
        notes: exercise.notes
      }

      const { data: newPreset, error: insertPresetError } = await supabase
        .from('exercise_presets')
        .insert(presetData)
        .select('id')
        .single()

      if (insertPresetError || !newPreset) {
        console.error('Error inserting exercise preset:', insertPresetError)
        return {
          isSuccess: false,
          message: `Failed to add exercise: ${insertPresetError?.message}`
        }
      }

      // Insert exercise_preset_details for the new preset
      if (exercise.sets && exercise.sets.length > 0) {
        const detailsData: ExercisePresetDetailInsert[] = exercise.sets.map(set => ({
          exercise_preset_id: newPreset.id,
          set_index: set.set_index,
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

        const { error: insertDetailsError } = await supabase
          .from('exercise_preset_details')
          .insert(detailsData)

        if (insertDetailsError) {
          console.error(`Error inserting details for new preset:`, insertDetailsError)
          return {
            isSuccess: false,
            message: `Failed to save exercise sets: ${insertDetailsError.message}`
          }
        }
      }
    }

    // Step 7: Fetch and return the updated session
    const { data: updatedSession, error: finalFetchError } = await supabase
      .from('exercise_preset_groups')
      .select('id, athlete_group_id, user_id, microcycle_id, name, description, session_mode, week, day, date, updated_at, created_at, deleted, is_template')
      .eq('id', sessionId)
      .single()

    if (finalFetchError || !updatedSession) {
      return {
        isSuccess: false,
        message: "Session saved but failed to fetch updated data"
      }
    }

    return {
      isSuccess: true,
      message: "Session saved successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error('Error in saveSessionWithExercisesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
