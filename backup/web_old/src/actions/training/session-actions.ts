"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"
import type { ActionState } from "@/actions/auth/user-actions"

/**
 * Create a new exercise preset group (planned training session)
 */
export async function createExercisePresetGroupAction(
  sessionData: Omit<TablesInsert<'exercise_preset_groups'>, 'user_id'>
): Promise<ActionState<Tables<'exercise_preset_groups'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user.id from clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data, error } = await supabase
      .from('exercise_preset_groups')
      .insert({
        ...sessionData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training session created successfully",
      data
    }
  } catch (error) {
    console.error("Error creating exercise preset group:", error)
    return { isSuccess: false, message: "Failed to create training session" }
  }
}

/**
 * Get exercise preset groups (planned sessions) for current user
 */
export async function getExercisePresetGroupsAction(): Promise<ActionState<Tables<'exercise_preset_groups'>[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user.id from clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data, error } = await supabase
      .from('exercise_preset_groups')
      .select(`
        *,
        microcycle_id (
          id,
          name,
          start_date,
          end_date
        ),
        athlete_group_id (
          id,
          group_name
        )
      `)
      .eq('user_id', user.id)
      .eq('deleted', false)
      .order('date', { ascending: true })

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training sessions retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting exercise preset groups:", error)
    return { isSuccess: false, message: "Failed to get training sessions" }
  }
}

/**
 * Create a training session (actual performed session)
 */
export async function createTrainingSessionAction(
  sessionData: Omit<TablesInsert<'exercise_training_sessions'>, 'athlete_id'>,
  exercisePresetGroupId?: number
): Promise<ActionState<Tables<'exercise_training_sessions'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user and athlete records
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    const { data, error } = await supabase
      .from('exercise_training_sessions')
      .insert({
        ...sessionData,
        athlete_id: athlete.id,
        exercise_preset_group_id: exercisePresetGroupId || null
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training session recorded successfully",
      data
    }
  } catch (error) {
    console.error("Error creating training session:", error)
    return { isSuccess: false, message: "Failed to record training session" }
  }
}

/**
 * Get training sessions for the current athlete
 */
export async function getTrainingSessionsAction(
  limit: number = 10
): Promise<ActionState<Tables<'exercise_training_sessions'>[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user and athlete records
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    const { data, error } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        exercise_preset_group_id (
          id,
          name,
          description,
          date
        ),
        athlete_group_id (
          id,
          group_name
        )
      `)
      .eq('athlete_id', athlete.id)
      .order('date_time', { ascending: false })
      .limit(limit)

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training sessions retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting training sessions:", error)
    return { isSuccess: false, message: "Failed to get training sessions" }
  }
}

/**
 * Update training session
 */
export async function updateTrainingSessionAction(
  sessionId: number,
  updates: TablesUpdate<'exercise_training_sessions'>
): Promise<ActionState<Tables<'exercise_training_sessions'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user and athlete records for authorization
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    const { data, error } = await supabase
      .from('exercise_training_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('athlete_id', athlete.id) // Ensure user can only update their own sessions
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training session updated successfully",
      data
    }
  } catch (error) {
    console.error("Error updating training session:", error)
    return { isSuccess: false, message: "Failed to update training session" }
  }
}

/**
 * Get exercises for a specific training session
 */
export async function getSessionExercisesAction(
  sessionId: number
): Promise<ActionState<any[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('exercise_training_details')
      .select(`
        *,
        exercise_preset_id (
          id,
          exercise_id (
            id,
            name,
            description,
            exercise_type_id (
              type,
              description
            )
          ),
          preset_order,
          notes
        )
      `)
      .eq('exercise_training_session_id', sessionId)
      .order('set_index', { ascending: true })

    if (error) throw error

    return {
      isSuccess: true,
      message: "Session exercises retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting session exercises:", error)
    return { isSuccess: false, message: "Failed to get session exercises" }
  }
} 