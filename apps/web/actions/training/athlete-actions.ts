/*
<ai_context>
Server actions for athlete and athlete group management.
Handles athlete profiles, group assignments, and coach-athlete relationships.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Athlete, AthleteInsert, AthleteUpdate,
  AthleteGroup, AthleteGroupInsert, AthleteGroupUpdate,
  User,
  ExperienceLevel
} from "@/types/training"

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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    const { data: athlete, error } = await supabase
      .from('athletes')
      .select(`
        *,
        athlete_group:athlete_groups(*)
      `)
      .eq('user_id', user.id)
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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Check if athlete profile already exists
    const { data: existingAthlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const completeAthleteData = {
      ...athleteData,
      user_id: user.id
    }

    let result
    if (existingAthlete) {
      // Update existing profile
      result = await supabase
        .from('athletes')
        .update(completeAthleteData)
        .eq('user_id', user.id)
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

    const supabase = createServerSupabaseClient()

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

    const supabase = createServerSupabaseClient()

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

    const supabase = createServerSupabaseClient()

    // Get current user's database ID and check if they're a coach
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('clerk_id', userId)
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

    const supabase = createServerSupabaseClient()

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('clerk_id', userId)
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

    const supabase = createServerSupabaseClient()

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('clerk_id', userId)
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

    const supabase = createServerSupabaseClient()

    // Get current user's coach ID to verify permission
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('clerk_id', userId)
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

    const supabase = createServerSupabaseClient()

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

    const supabase = createServerSupabaseClient()

    // Get current user's coach ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('clerk_id', userId)
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