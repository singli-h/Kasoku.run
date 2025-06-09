"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"
import type { ActionState } from "@/actions/auth/user-actions"

/**
 * Get coach profile for the current user
 */
export async function getCoachProfileAction(): Promise<ActionState<Tables<'coaches'> | null>> {
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

    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return {
      isSuccess: true,
      message: data ? "Coach profile retrieved successfully" : "No coach profile found",
      data: data || null
    }
  } catch (error) {
    console.error("Error getting coach profile:", error)
    return { isSuccess: false, message: "Failed to get coach profile" }
  }
}

/**
 * Create or update coach profile
 */
export async function upsertCoachProfileAction(
  coachData: Omit<TablesInsert<'coaches'>, 'user_id'>
): Promise<ActionState<Tables<'coaches'>>> {
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
      .from('coaches')
      .upsert({
        ...coachData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Coach profile updated successfully",
      data
    }
  } catch (error) {
    console.error("Error upserting coach profile:", error)
    return { isSuccess: false, message: "Failed to update coach profile" }
  }
}

/**
 * Get athlete groups managed by the current coach
 */
export async function getCoachAthleteGroupsAction(): Promise<ActionState<Tables<'athlete_groups'>[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user record first
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    // Get coach record for current user
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!coach) {
      return { isSuccess: false, message: "Coach profile not found" }
    }

    const { data, error } = await supabase
      .from('athlete_groups')
      .select(`
        *,
        athletes!athletes_athlete_group_id_fkey (
          id,
          user_id (
            id,
            first_name,
            last_name,
            username,
            email
          )
        )
      `)
      .eq('coach_id', coach.id)
      .order('group_name', { ascending: true })

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athlete groups retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting coach athlete groups:", error)
    return { isSuccess: false, message: "Failed to get athlete groups" }
  }
}

/**
 * Create a new athlete group
 */
export async function createAthleteGroupAction(
  groupData: Omit<TablesInsert<'athlete_groups'>, 'coach_id'>
): Promise<ActionState<Tables<'athlete_groups'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get coach record for current user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!coach) {
      return { isSuccess: false, message: "Coach profile not found" }
    }

    const { data, error } = await supabase
      .from('athlete_groups')
      .insert({
        ...groupData,
        coach_id: coach.id
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athlete group created successfully",
      data
    }
  } catch (error) {
    console.error("Error creating athlete group:", error)
    return { isSuccess: false, message: "Failed to create athlete group" }
  }
}

/**
 * Update an athlete group
 */
export async function updateAthleteGroupAction(
  groupId: number,
  updates: TablesUpdate<'athlete_groups'>
): Promise<ActionState<Tables<'athlete_groups'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Get coach record for authorization
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!coach) {
      return { isSuccess: false, message: "Coach profile not found" }
    }

    const { data, error } = await supabase
      .from('athlete_groups')
      .update(updates)
      .eq('id', groupId)
      .eq('coach_id', coach.id) // Ensure coach can only update their own groups
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Athlete group updated successfully",
      data
    }
  } catch (error) {
    console.error("Error updating athlete group:", error)
    return { isSuccess: false, message: "Failed to update athlete group" }
  }
}

/**
 * Get training plans (macrocycles) created by the current coach
 */
export async function getCoachMacrocyclesAction(): Promise<ActionState<Tables<'macrocycles'>[]>> {
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
      .from('macrocycles')
      .select(`
        *,
        athlete_group_id (
          id,
          group_name
        ),
        mesocycles (
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training plans retrieved successfully",
      data: data || []
    }
  } catch (error) {
    console.error("Error getting coach macrocycles:", error)
    return { isSuccess: false, message: "Failed to get training plans" }
  }
}

/**
 * Create a new macrocycle (training plan)
 */
export async function createMacrocycleAction(
  macrocycleData: Omit<TablesInsert<'macrocycles'>, 'user_id'>
): Promise<ActionState<Tables<'macrocycles'>>> {
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
      .from('macrocycles')
      .insert({
        ...macrocycleData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Training plan created successfully",
      data
    }
  } catch (error) {
    console.error("Error creating macrocycle:", error)
    return { isSuccess: false, message: "Failed to create training plan" }
  }
} 