/*
<ai_context>
Server actions for session plan CRUD operations in MesoWizard.
Uses the existing exercise_preset_groups table structure to store session plans
with their associated exercise_presets and exercise_preset_details.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { 
  ExercisePresetGroup, ExercisePresetGroupInsert, ExercisePresetGroupUpdate,
  ExercisePreset, ExercisePresetInsert,
  ExercisePresetDetail
} from "@/types/database"

// Types for MesoWizard session plans
export interface SessionPlanData {
  id: string
  name: string
  description: string
  day: number // 1-7 (Monday to Sunday)
  week: number // Week number in the plan
  exercises: SessionExerciseData[]
  estimatedDuration: number // minutes
  focus: string[]
  notes: string
}

export interface SessionExerciseData {
  id: string
  exerciseId: number
  order: number
  supersetId?: string
  sets: SessionSetData[]
  notes: string
  restTime: number // seconds
}

export interface SessionSetData {
  setIndex: number
  // Basic parameters
  reps?: number
  weight?: number
  rpe?: number
  restTime?: number
  
  // Advanced parameters from database
  distance?: number
  duration?: number // seconds
  power?: number
  velocity?: number
  effort?: number
  height?: number
  resistance?: number
  resistance_unit_id?: number
  tempo?: string
  metadata?: any
  notes?: string
  
  // UI-specific fields
  completed?: boolean
}

export interface CreateSessionPlanForm {
  name: string
  description?: string
  microcycleId?: number
  athleteGroupId?: number
  sessions: SessionPlanData[]
}

// ============================================================================
// SESSION PLAN CRUD ACTIONS
// ============================================================================

/**
 * Save a complete session plan (multiple sessions) to the database
 */
export async function saveSessionPlanAction(
  planData: CreateSessionPlanForm
): Promise<ActionState<ExercisePresetGroup[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const savedSessions: ExercisePresetGroup[] = []

    // Save each session as an exercise_preset_group
    for (const session of planData.sessions) {
      // Create the session (exercise_preset_group)
      const sessionData: ExercisePresetGroupInsert = {
        name: session.name,
        description: session.description,
        date: new Date().toISOString().split('T')[0], // Current date, can be updated later
        day: session.day,
        week: session.week,
        session_mode: planData.athleteGroupId ? 'group' : 'individual',
        microcycle_id: planData.microcycleId || null,
        athlete_group_id: planData.athleteGroupId || null,
        user_id: dbUserId
      }

      const { data: savedSession, error: sessionError } = await supabase
        .from('exercise_preset_groups')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError || !savedSession) {
        console.error('Error saving session:', sessionError)
        return {
          isSuccess: false,
          message: `Failed to save session "${session.name}": ${sessionError?.message}`
        }
      }

      // Save exercises for this session
      for (const exercise of session.exercises) {
        // Create the exercise preset
        const exercisePresetData: ExercisePresetInsert = {
          exercise_preset_group_id: savedSession.id,
          exercise_id: exercise.exerciseId,
          preset_order: exercise.order,
          notes: exercise.notes,
          superset_id: exercise.supersetId ? parseInt(exercise.supersetId.replace('superset-', '')) : null
        }

        const { data: savedExercisePreset, error: exerciseError } = await supabase
          .from('exercise_presets')
          .insert(exercisePresetData)
          .select()
          .single()

        if (exerciseError || !savedExercisePreset) {
          console.error('Error saving exercise preset:', exerciseError)
          continue // Continue with other exercises
        }

        // Save exercise preset details (sets)
        for (const set of exercise.sets) {
                     const setDetailData = {
             exercise_preset_id: savedExercisePreset.id,
             set_index: set.setIndex,
             reps: set.reps || null,
             weight: set.weight || null,
             distance: set.distance || null,
             performing_time: set.duration || null, // Use correct database field name
             power: set.power || null,
             velocity: set.velocity || null,
             resistance: set.resistance || null,
             resistance_unit_id: set.resistance_unit_id || null,
             tempo: set.tempo || null,
             effort: set.rpe || null, // Map RPE to effort field
             height: set.height || null,
             metadata: set.metadata ? JSON.stringify(set.metadata) : null
           }

          const { error: detailError } = await supabase
            .from('exercise_preset_details')
            .insert(setDetailData)

          if (detailError) {
            console.error('Error saving exercise preset detail:', detailError)
            // Continue with other sets
          }
        }
      }

      savedSessions.push(savedSession)
    }

    return {
      isSuccess: true,
      message: `Successfully saved ${savedSessions.length} sessions`,
      data: savedSessions
    }
  } catch (error) {
    console.error('Error in saveSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Load session plans for a specific microcycle
 */
export async function getSessionPlansByMicrocycleAction(
  microcycleId: number
): Promise<ActionState<SessionPlanData[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const { data: presetGroups, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        exercise_presets(
          *,
          exercise:exercises(*),
          exercise_preset_details(*)
        )
      `)
      .eq('microcycle_id', microcycleId)
      .eq('user_id', dbUserId)
      .order('week', { ascending: true })
      .order('day', { ascending: true })

    if (error) {
      console.error('Error fetching session plans:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch session plans: ${error.message}`
      }
    }

    // Convert database format to MesoWizard format
    const sessionPlans: SessionPlanData[] = (presetGroups || []).map(group => ({
      id: `session-${group.week}-${group.day}`,
      name: group.name,
      description: group.description || '',
      day: group.day || 1,
      week: group.week || 1,
      exercises: (group.exercise_presets || []).map((preset: any, index: number) => ({
        id: `exercise-${preset.id}`,
        exerciseId: preset.exercise_id,
        order: preset.preset_order || index + 1,
        supersetId: preset.superset_id ? `superset-${preset.superset_id}` : undefined,
                 sets: (preset.exercise_preset_details || []).map((detail: any) => ({
           setIndex: detail.set_index,
           reps: detail.reps,
           weight: detail.weight,
           rpe: detail.effort, // Map effort back to RPE
           restTime: 90, // Default rest time
           distance: detail.distance,
           duration: detail.performing_time, // Use correct database field name
           power: detail.power,
           velocity: detail.velocity,
           effort: detail.effort,
           height: detail.height,
           resistance: detail.resistance,
           resistance_unit_id: detail.resistance_unit_id,
           tempo: detail.tempo,
           metadata: detail.metadata ? JSON.parse(detail.metadata) : null,
           completed: false
         })),
        notes: preset.notes || '',
        restTime: 90 // Default rest time
      })),
      estimatedDuration: 60, // Default duration
      focus: [], // Could be stored in metadata
      notes: group.description || ''
    }))

    return {
      isSuccess: true,
      message: "Session plans retrieved successfully",
      data: sessionPlans
    }
  } catch (error) {
    console.error('Error in getSessionPlansByMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update a specific session plan
 */
export async function updateSessionPlanAction(
  sessionId: number,
  sessionData: Partial<SessionPlanData>
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

    // Update the exercise_preset_group
    const updateData: Partial<ExercisePresetGroupUpdate> = {
      name: sessionData.name,
      description: sessionData.description,
      day: sessionData.day,
      week: sessionData.week
    }

    const { data: updatedSession, error } = await supabase
      .from('exercise_preset_groups')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session plan:', error)
      return {
        isSuccess: false,
        message: `Failed to update session plan: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Session plan updated successfully",
      data: updatedSession
    }
  } catch (error) {
    console.error('Error in updateSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a session plan
 */
export async function deleteSessionPlanAction(
  sessionId: number
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Soft delete by setting deleted flag
    const { error } = await supabase
      .from('exercise_preset_groups')
      .update({ deleted: true })
      .eq('id', sessionId)
      .eq('user_id', dbUserId)

    if (error) {
      console.error('Error deleting session plan:', error)
      return {
        isSuccess: false,
        message: `Failed to delete session plan: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Session plan deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteSessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Copy a session plan with optional modifications
 */
export async function copySessionPlanAction(
  sourceSessionId: number,
  newName: string,
  newDate?: string,
  modifications?: {
    weightIncrease?: number
    repIncrease?: number
    volumeIncrease?: number
    restTimeDecrease?: number
  }
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

    // Get the source session with all details
    const { data: sourceSession, error: fetchError } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        exercise_presets(
          *,
          exercise_preset_details(*)
        )
      `)
      .eq('id', sourceSessionId)
      .eq('user_id', dbUserId)
      .single()

    if (fetchError || !sourceSession) {
      return {
        isSuccess: false,
        message: "Source session not found"
      }
    }

    // Create new session
    const newSessionData: ExercisePresetGroupInsert = {
      name: newName,
      description: sourceSession.description,
      date: newDate || sourceSession.date,
      day: sourceSession.day,
      week: sourceSession.week,
      session_mode: sourceSession.session_mode,
      microcycle_id: sourceSession.microcycle_id,
      athlete_group_id: sourceSession.athlete_group_id,
      user_id: dbUserId
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('exercise_preset_groups')
      .insert(newSessionData)
      .select()
      .single()

    if (sessionError || !newSession) {
      return {
        isSuccess: false,
        message: `Failed to create new session: ${sessionError?.message}`
      }
    }

    // Copy exercises with modifications
    if (sourceSession.exercise_presets) {
      for (const preset of sourceSession.exercise_presets) {
        // Create new preset
        const newPresetData: ExercisePresetInsert = {
          exercise_id: preset.exercise_id,
          exercise_preset_group_id: newSession.id,
          preset_order: preset.preset_order,
          notes: preset.notes,
          superset_id: preset.superset_id
        }

        const { data: newPreset, error: presetError } = await supabase
          .from('exercise_presets')
          .insert(newPresetData)
          .select()
          .single()

        if (presetError || !newPreset) {
          console.error('Error copying preset:', presetError)
          continue
        }

        // Copy preset details with modifications
        if (preset.exercise_preset_details) {
          for (const detail of preset.exercise_preset_details) {
            const newDetailData = {
              exercise_preset_id: newPreset.id,
              set_index: detail.set_index,
              reps: detail.reps ? detail.reps + (modifications?.repIncrease || 0) : detail.reps,
              weight: detail.weight ? detail.weight + (modifications?.weightIncrease || 0) : detail.weight,
              distance: detail.distance,
              performing_time: detail.performing_time, // Use correct database field name
              power: detail.power,
              velocity: detail.velocity,
              resistance: detail.resistance,
              resistance_unit_id: detail.resistance_unit_id,
              tempo: detail.tempo,
              effort: detail.effort,
              height: detail.height,
              metadata: detail.metadata
            }

            const { error: detailError } = await supabase
              .from('exercise_preset_details')
              .insert(newDetailData)

            if (detailError) {
              console.error('Error copying preset detail:', detailError)
            }
          }
        }
      }
    }

    return {
      isSuccess: true,
      message: "Session plan copied successfully",
      data: newSession
    }
  } catch (error) {
    console.error('Error in copySessionPlanAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 