"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"
import type { ActionState } from "@/actions/auth/user-actions"

/**
 * Get athlete profile for the current user
 */
export async function getAthleteProfileAction(): Promise<ActionState<Tables<'athletes'> | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // First get the user record to get the user.id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    // Get athlete profile
    const { data, error } = await supabase
      .from('athletes')
      .select(`
        *,
        athlete_group_id (
          id,
          group_name,
          coach_id
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return {
      isSuccess: true,
      message: data ? "Athlete profile found" : "Athlete profile not found",
      data: data || null
    }
  } catch (error) {
    console.error("Error getting athlete profile:", error)
    return { isSuccess: false, message: "Failed to get athlete profile" }
  }
}

/**
 * Create athlete profile for the current user
 */
export async function createAthleteProfileAction(
  athleteData: Omit<TablesInsert<'athletes'>, 'user_id'>
): Promise<ActionState<Tables<'athletes'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // First get the user record to get the user.id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    // Create athlete profile
    const { data, error } = await supabase
      .from('athletes')
      .insert({
        ...athleteData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athlete profile created successfully",
      data
    }
  } catch (error) {
    console.error("Error creating athlete profile:", error)
    return { isSuccess: false, message: "Failed to create athlete profile" }
  }
}

/**
 * Update athlete profile
 */
export async function updateAthleteProfileAction(
  updates: TablesUpdate<'athletes'>
): Promise<ActionState<Tables<'athletes'>>> {
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

    // Update athlete profile
    const { data, error } = await supabase
      .from('athletes')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athlete profile updated successfully",
      data
    }
  } catch (error) {
    console.error("Error updating athlete profile:", error)
    return { isSuccess: false, message: "Failed to update athlete profile" }
  }
}

/**
 * Get athletes in a specific group (for coaches)
 */
export async function getAthletesByGroupAction(
  groupId: number
): Promise<ActionState<Tables<'athletes'>[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // TODO: Add authorization check - ensure user is coach of this group
    
    const { data, error } = await supabase
      .from('athletes')
      .select(`
        *,
        user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('athlete_group_id', groupId)

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athletes retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting athletes by group:", error)
    return { isSuccess: false, message: "Failed to get athletes" }
  }
}

/**
 * Get athlete's training history summary
 */
export async function getAthleteTrainingHistoryAction(): Promise<ActionState<any>> {
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

    // Get athlete record
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // Get recent training sessions
    const { data, error } = await supabase
      .from('exercise_training_sessions')
      .select(`
        *,
        exercise_preset_group_id (
          name,
          description
        )
      `)
      .eq('athlete_id', athlete.id)
      .order('date_time', { ascending: false })
      .limit(10)

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training history retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting training history:", error)
    return { isSuccess: false, message: "Failed to get training history" }
  }
} 