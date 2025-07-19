/*
<ai_context>
Server actions for athlete and athlete group management.
Handles athlete profiles, group assignments, and coach-athlete relationships.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { 
  Athlete, AthleteInsert, AthleteUpdate,
  AthleteGroup, AthleteGroupInsert, AthleteGroupUpdate,
  ExperienceLevel
} from "@/types/training"
import { User } from "@/types/database"

// ============================================================================
// ATHLETE ACTIONS
// ============================================================================

/**
 * Get the current user's athlete profile
 */
export async function getCurrentAthleteProfileAction(): Promise<ActionState<Athlete | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID from cache (avoids repeated DB lookup)
    const dbUserId = await getDbUserId(userId)

    const { data: athlete, error } = await supabase
      .from('athletes')
      .select(`
        *,
        athlete_group:athlete_groups(*)
      `)
      .eq('user_id', dbUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching athlete profile:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch athlete profile: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: athlete ? "Athlete profile retrieved successfully" : "No athlete profile found",
      data: athlete || null
    }
  } catch (error) {
    console.error('Error in getCurrentAthleteProfileAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create or update athlete profile
 */
export async function createOrUpdateAthleteProfileAction(
  athleteData: Partial<AthleteInsert>
): Promise<ActionState<Athlete>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID from cache
    const dbUserId = await getDbUserId(userId)

    // Check if athlete profile already exists
    const { data: existingAthlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    const completeAthleteData = {
      ...athleteData,
      user_id: dbUserId
    }

    let result
    if (existingAthlete) {
      // Update existing profile
      result = await supabase
        .from('athletes')
        .update(completeAthleteData)
        .eq('user_id', dbUserId)
        .select()
        .single()
    } else {
      // Create new profile
      result = await supabase
        .from('athletes')
        .insert(completeAthleteData)
        .select()
        .single()
    }

    const { data: athlete, error } = result

    if (error) {
      console.error('Error creating/updating athlete profile:', error)
      return {
        isSuccess: false,
        message: `Failed to ${existingAthlete ? 'update' : 'create'} athlete profile: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: `Athlete profile ${existingAthlete ? 'updated' : 'created'} successfully`,
      data: athlete
    }
  } catch (error) {
    console.error('Error in createOrUpdateAthleteProfileAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get athletes in a specific group
 */
export async function getAthletesByGroupAction(groupId: number): Promise<ActionState<Athlete[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const { data: athletes, error } = await supabase
      .from('athletes')
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        athlete_group:athlete_groups(*)
      `)
      .eq('athlete_group_id', groupId)

    if (error) {
      console.error('Error fetching athletes by group:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch athletes: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athletes retrieved successfully",
      data: athletes || []
    }
  } catch (error) {
    console.error('Error in getAthletesByGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get athlete by ID (for coaches to view athlete details)
 */
export async function getAthleteByIdAction(athleteId: number): Promise<ActionState<Athlete>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    const { data: athlete, error } = await supabase
      .from('athletes')
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          birthdate,
          sex
        ),
        athlete_group:athlete_groups(*)
      `)
      .eq('id', athleteId)
      .single()

    if (error) {
      console.error('Error fetching athlete:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Athlete not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch athlete: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete retrieved successfully",
      data: athlete
    }
  } catch (error) {
    console.error('Error in getAthleteByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update athlete profile information
 */
export async function updateAthleteProfileAction(
  userId: number,
  updates: AthleteUpdate
): Promise<ActionState<Athlete>> {
  try {
    // Using singleton supabase client
    
    // First check if athlete profile exists
    const { data: existingAthlete, error: checkError } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    let result
    
    if (existingAthlete) {
      // Update existing athlete profile
      const { data, error } = await supabase
        .from('athletes')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new athlete profile
      const { data, error } = await supabase
        .from('athletes')
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
      message: "Athlete profile updated successfully",
      data: result
    }
  } catch (error) {
    console.error('Error updating athlete profile:', error)
    return {
      isSuccess: false,
      message: `Failed to update athlete profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get athlete profile by user ID
 */
export async function getAthleteProfileAction(userId: number): Promise<ActionState<Athlete | null>> {
  try {
    // Using singleton supabase client
    
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return {
      isSuccess: true,
      message: data ? "Athlete profile found" : "No athlete profile found",
      data: data || null
    }
  } catch (error) {
    console.error('Error getting athlete profile:', error)
    return {
      isSuccess: false,
      message: `Failed to get athlete profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// ATHLETE GROUP ACTIONS
// ============================================================================

/**
 * Get athlete groups for the current coach
 */
export async function getCoachAthleteGroupsAction(): Promise<ActionState<AthleteGroup[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Get current user's database ID and check if they're a coach
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    if (user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    const { data: groups, error } = await supabase
      .from('athlete_groups')
      .select(`
        *,
        coach:coaches(
          user:users(
            first_name,
            last_name,
            email
          )
        ),
        athletes(
          *,
          user:users(
            first_name,
            last_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('coach_id', user.coach.id)

    if (error) {
      console.error('Error fetching coach athlete groups:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch athlete groups: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete groups retrieved successfully",
      data: groups || []
    }
  } catch (error) {
    console.error('Error in getCoachAthleteGroupsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new athlete group
 */
export async function createAthleteGroupAction(
  groupName: string
): Promise<ActionState<AthleteGroup>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    if (user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    const groupData: AthleteGroupInsert = {
      group_name: groupName,
      coach_id: user.coach.id
    }

    const { data: group, error } = await supabase
      .from('athlete_groups')
      .insert(groupData)
      .select()
      .single()

    if (error) {
      console.error('Error creating athlete group:', error)
      return {
        isSuccess: false,
        message: `Failed to create athlete group: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete group created successfully",
      data: group
    }
  } catch (error) {
    console.error('Error in createAthleteGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update an athlete group
 */
export async function updateAthleteGroupAction(
  groupId: number,
  updates: Partial<AthleteGroupUpdate>
): Promise<ActionState<AthleteGroup>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    if (user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    const { data: group, error } = await supabase
      .from('athlete_groups')
      .update(updates)
      .eq('id', groupId)
      .eq('coach_id', user.coach.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating athlete group:', error)
      return {
        isSuccess: false,
        message: `Failed to update athlete group: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete group updated successfully",
      data: group
    }
  } catch (error) {
    console.error('Error in updateAthleteGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Assign an athlete to a group
 */
export async function assignAthleteToGroupAction(
  athleteId: number,
  groupId: number
): Promise<ActionState<Athlete>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Get current user's coach ID to verify permission
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    if (user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    // Verify the group belongs to this coach
    const { data: group, error: groupError } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('id', groupId)
      .eq('coach_id', user.coach.id)
      .single()

    if (groupError || !group) {
      return {
        isSuccess: false,
        message: "Athlete group not found or you don't have permission"
      }
    }

    // Update the athlete's group assignment
    const { data: athlete, error } = await supabase
      .from('athletes')
      .update({ athlete_group_id: groupId })
      .eq('id', athleteId)
      .select()
      .single()

    if (error) {
      console.error('Error assigning athlete to group:', error)
      return {
        isSuccess: false,
        message: `Failed to assign athlete to group: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete assigned to group successfully",
      data: athlete
    }
  } catch (error) {
    console.error('Error in assignAthleteToGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Remove an athlete from a group
 */
export async function removeAthleteFromGroupAction(
  athleteId: number
): Promise<ActionState<Athlete>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client

    // Remove the athlete's group assignment
    const { data: athlete, error } = await supabase
      .from('athletes')
      .update({ athlete_group_id: null })
      .eq('id', athleteId)
      .select()
      .single()

    if (error) {
      console.error('Error removing athlete from group:', error)
      return {
        isSuccess: false,
        message: `Failed to remove athlete from group: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete removed from group successfully",
      data: athlete
    }
  } catch (error) {
    console.error('Error in removeAthleteFromGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete an athlete group
 */
export async function deleteAthleteGroupAction(groupId: number): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    if (user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    // First, remove all athletes from this group
    await supabase
      .from('athletes')
      .update({ athlete_group_id: null })
      .eq('athlete_group_id', groupId)

    // Then delete the group
    const { error } = await supabase
      .from('athlete_groups')
      .delete()
      .eq('id', groupId)
      .eq('coach_id', user.coach.id)

    if (error) {
      console.error('Error deleting athlete group:', error)
      return {
        isSuccess: false,
        message: `Failed to delete athlete group: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Athlete group deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteAthleteGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 