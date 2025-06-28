/*
<ai_context>
Server actions for coach profile management.
Handles coach profiles, experience, philosophy, and specializations.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { 
  Coach, 
  CoachInsert, 
  CoachUpdate,
  CoachWithDetails
} from "@/types/database"

// ============================================================================
// COACH ACTIONS
// ============================================================================

/**
 * Get the current user's coach profile
 */
export async function getCurrentCoachProfileAction(): Promise<ActionState<Coach | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    // Get current user's database ID from cache
    const dbUserId = await getDbUserId(userId)

    const { data: coach, error } = await supabase
      .from('coaches')
      .select(`
        *,
        athlete_groups:athlete_groups(*),
        user:users(*)
      `)
      .eq('user_id', dbUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching coach profile:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch coach profile: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: coach ? "Coach profile retrieved successfully" : "No coach profile found",
      data: coach || null
    }
  } catch (error) {
    console.error('Error in getCurrentCoachProfileAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create or update coach profile
 */
export async function createOrUpdateCoachProfileAction(
  coachData: Partial<CoachInsert>
): Promise<ActionState<Coach>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    // Get current user's database ID from cache
    const dbUserId = await getDbUserId(userId)

    // Check if coach profile already exists
    const { data: existingCoach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    const completeCoachData = {
      ...coachData,
      user_id: dbUserId
    }

    let result
    if (existingCoach) {
      // Update existing profile
      result = await supabase
        .from('coaches')
        .update(completeCoachData)
        .eq('user_id', dbUserId)
        .select()
        .single()
    } else {
      // Create new profile
      result = await supabase
        .from('coaches')
        .insert(completeCoachData)
        .select()
        .single()
    }

    const { data: coach, error } = result

    if (error) {
      console.error('Error creating/updating coach profile:', error)
      return {
        isSuccess: false,
        message: `Failed to ${existingCoach ? 'update' : 'create'} coach profile: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: `Coach profile ${existingCoach ? 'updated' : 'created'} successfully`,
      data: coach
    }
  } catch (error) {
    console.error('Error in createOrUpdateCoachProfileAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update coach profile information
 */
export async function updateCoachProfileAction(
  userId: number,
  updates: CoachUpdate
): Promise<ActionState<Coach>> {
  try {
    // Using singleton supabase client
    
    // First check if coach profile exists
    const { data: existingCoach, error: checkError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    let result
    
    if (existingCoach) {
      // Update existing coach profile
      const { data, error } = await supabase
        .from('coaches')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new coach profile
      const { data, error } = await supabase
        .from('coaches')
        .insert({
          user_id: userId,
          ...updates
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    return {
      isSuccess: true,
      message: "Coach profile updated successfully",
      data: result
    }
  } catch (error) {
    console.error('Error updating coach profile:', error)
    return {
      isSuccess: false,
      message: `Failed to update coach profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get coach profile by user ID
 */
export async function getCoachProfileAction(userId: number): Promise<ActionState<Coach | null>> {
  try {
    // Using singleton supabase client
    
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return {
      isSuccess: true,
      message: data ? "Coach profile found" : "No coach profile found",
      data: data || null
    }
  } catch (error) {
    console.error('Error getting coach profile:', error)
    return {
      isSuccess: false,
      message: `Failed to get coach profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get coach profile with detailed athlete group information
 */
export async function getCoachProfileWithDetailsAction(userId: number): Promise<ActionState<CoachWithDetails | null>> {
  try {
    // Using singleton supabase client
    
    const { data, error } = await supabase
      .from('coaches')
      .select(`
        *,
        user:users(*),
        athlete_groups:athlete_groups(
          *,
          athletes:athletes(
            *,
            user:users(
              id,
              first_name,
              last_name,
              email,
              avatar_url
            )
          )
        )
      `)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return {
      isSuccess: true,
      message: data ? "Coach profile with details found" : "No coach profile found",
      data: data || null
    }
  } catch (error) {
    console.error('Error getting coach profile with details:', error)
    return {
      isSuccess: false,
      message: `Failed to get coach profile details: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update coach specializations and focus areas
 */
export async function updateCoachSpecializationAction(
  speciality: string | null,
  sportFocus: string | null,
  philosophy: string | null
): Promise<ActionState<Coach>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    // Get current user's database ID from cache
    const dbUserId = await getDbUserId(userId)

    const updates: CoachUpdate = {
      speciality,
      sport_focus: sportFocus,
      philosophy
    }

    const { data: coach, error } = await supabase
      .from('coaches')
      .update(updates)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating coach specialization:', error)
      return {
        isSuccess: false,
        message: `Failed to update specialization: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Coach specialization updated successfully",
      data: coach
    }
  } catch (error) {
    console.error('Error in updateCoachSpecializationAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 