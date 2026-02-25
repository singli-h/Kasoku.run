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
import type { Database } from "@/types/database"

// Define coach types from database
type Coach = Database['public']['Tables']['coaches']['Row']
type CoachInsert = Database['public']['Tables']['coaches']['Insert']
type CoachUpdate = Database['public']['Tables']['coaches']['Update']
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