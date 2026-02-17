/*
<ai_context>
Server actions for athlete and athlete group management.
Handles athlete profiles, group assignments, and coach-athlete relationships.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId, getUserInfo } from "@/lib/user-cache"
import { ActionState } from "@/types"
import {
  Athlete, AthleteInsert, AthleteUpdate,
  AthleteGroup, AthleteGroupInsert, AthleteGroupUpdate
} from "@/types/training"
import { addDays, parseISO, startOfWeek } from "date-fns"
// (no direct Database type usage in this file)

// (removed unused User type alias)

// Event type for track & field events
export interface Event {
  id: number
  name: string | null
  category: string | null
  type: string | null
  created_at: string | null
  updated_at: string | null
}

// ============================================================================
// EVENTS ACTIONS
// ============================================================================

/**
 * Get all available track & field events
 */
export async function getEventsAction(): Promise<ActionState<Event[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch events: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Events retrieved successfully",
      data: events || []
    }
  } catch (error) {
    console.error('Error in getEventsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

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

    // Get caller's DB ID and verify coach ownership
    const dbUserId = await getDbUserId(userId)

    const { data: user } = await supabase
      .from('users')
      .select('role, coach:coaches(id)')
      .eq('id', dbUserId)
      .single()

    if (!user || user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "Access denied: only coaches can view group athletes"
      }
    }

    // Verify the group belongs to this coach
    const { data: group } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('id', groupId)
      .eq('coach_id', (user.coach as { id: number }).id)
      .single()

    if (!group) {
      return {
        isSuccess: false,
        message: "Access denied: you don't have permission to view this group's athletes"
      }
    }

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

    // Get caller's DB ID and role for ownership verification
    const { id: dbUserId, role } = await getUserInfo(userId)

    // Role-based access control
    if (role === 'individual') {
      return {
        isSuccess: false,
        message: "Access denied: you don't have permission to view this athlete"
      }
    }

    if (role === 'athlete') {
      // Athletes can only view their own record
      const { data: ownAthlete } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (!ownAthlete || ownAthlete.id !== athleteId) {
        return {
          isSuccess: false,
          message: "Access denied: you don't have permission to view this athlete"
        }
      }
    }

    if (role === 'coach') {
      // Coaches can only view athletes in their own groups
      const { data: coachRecord } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (!coachRecord) {
        return {
          isSuccess: false,
          message: "Access denied: coach record not found"
        }
      }

      // Verify this athlete belongs to one of the coach's groups
      const { data: athleteRecord } = await supabase
        .from('athletes')
        .select('athlete_group_id')
        .eq('id', athleteId)
        .single()

      if (!athleteRecord) {
        return {
          isSuccess: false,
          message: "Athlete not found"
        }
      }

      if (athleteRecord.athlete_group_id) {
        const { data: group } = await supabase
          .from('athlete_groups')
          .select('id')
          .eq('id', athleteRecord.athlete_group_id)
          .eq('coach_id', coachRecord.id)
          .single()

        if (!group) {
          return {
            isSuccess: false,
            message: "Access denied: you don't have permission to view this athlete"
          }
        }
      } else {
        // Athlete has no group — coach can't access unassigned athletes they don't own
        return {
          isSuccess: false,
          message: "Access denied: you don't have permission to view this athlete"
        }
      }
    }

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
      .eq('coach_id', (user.coach as { id: number }).id)

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
      coach_id: (user.coach as { id: number }).id
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
      .eq('coach_id', (user.coach as { id: number }).id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating athlete group:', error)
      return {
        isSuccess: false,
        message: `Failed to update athlete group: ${error.message}`
      }
    }

    // When no row matched (e.g., wrong id or not owned by coach), PostgREST returns 0 rows.
    // maybeSingle() avoids throwing PGRST116; we handle the not-found case explicitly.
    if (!group) {
      return {
        isSuccess: false,
        message: "Athlete group not found or you don't have permission to modify it",
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
      .eq('coach_id', (user.coach as { id: number }).id)
      .single()

    if (groupError || !group) {
      return {
        isSuccess: false,
        message: "Athlete group not found or you don't have permission"
      }
    }

    // Get current athlete group before updating
    const { data: currentAthlete, error: currentError } = await supabase
      .from('athletes')
      .select('athlete_group_id')
      .eq('id', athleteId)
      .single()

    if (currentError) {
      console.error('Error fetching current athlete group:', currentError)
      return {
        isSuccess: false,
        message: `Failed to fetch athlete information: ${currentError.message}`
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

    // Log the group change in history
    const historyResult = await createGroupHistoryEntryAction(
      athleteId,
      currentAthlete.athlete_group_id,
      groupId,
      `Assigned to group by coach`
    )

    if (!historyResult.isSuccess) {
      console.warn('Failed to log group history:', historyResult.message)
      // Don't fail the main operation if history logging fails
    }

    // P1: Retroactive assignment - assign existing group workouts to new athlete
    const retroactiveResult = await assignExistingGroupWorkoutsToAthleteAction(athleteId, groupId)
    if (!retroactiveResult.isSuccess) {
      console.warn('Failed to assign existing group workouts:', retroactiveResult.message)
      // Don't fail the main operation - athlete is in group, just missing some workouts
    }

    const workoutsAssigned = retroactiveResult.data?.sessionsCreated || 0
    const message = workoutsAssigned > 0
      ? `Athlete assigned to group successfully with ${workoutsAssigned} existing workouts`
      : "Athlete assigned to group successfully"

    return {
      isSuccess: true,
      message,
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
 * P1: Assign existing group workouts to a newly added athlete
 * When an athlete joins a group, they should receive all workout_logs
 * that other athletes in the group already have
 */
async function assignExistingGroupWorkoutsToAthleteAction(
  athleteId: number,
  groupId: number
): Promise<ActionState<{ sessionsCreated: number }>> {
  try {
    // 1. Find all macrocycles assigned to this group
    const { data: macrocycles, error: macroError } = await supabase
      .from('macrocycles')
      .select('id, start_date')
      .eq('athlete_group_id', groupId)

    if (macroError) {
      console.error('[assignExistingGroupWorkoutsToAthleteAction] Error fetching macrocycles:', macroError)
      return { isSuccess: false, message: 'Failed to fetch group macrocycles' }
    }

    if (!macrocycles || macrocycles.length === 0) {
      // No macrocycles assigned to this group yet - nothing to do
      return { isSuccess: true, message: 'No existing plans to assign', data: { sessionsCreated: 0 } }
    }

    // 2. Get all session_plans from these macrocycles
    const macrocycleIds = macrocycles.map(m => m.id)

    const { data: mesocycles } = await supabase
      .from('mesocycles')
      .select('id')
      .in('macrocycle_id', macrocycleIds)

    if (!mesocycles || mesocycles.length === 0) {
      return { isSuccess: true, message: 'No mesocycles found', data: { sessionsCreated: 0 } }
    }

    const mesocycleIds = mesocycles.map(m => m.id)

    const { data: microcycles } = await supabase
      .from('microcycles')
      .select('id')
      .in('mesocycle_id', mesocycleIds)

    if (!microcycles || microcycles.length === 0) {
      return { isSuccess: true, message: 'No microcycles found', data: { sessionsCreated: 0 } }
    }

    const microcycleIds = microcycles.map(m => m.id)

    const { data: sessionPlans, error: plansError } = await supabase
      .from('session_plans')
      .select('id, date, week, day, description')
      .in('microcycle_id', microcycleIds)
      .eq('deleted', false)

    if (plansError || !sessionPlans || sessionPlans.length === 0) {
      return { isSuccess: true, message: 'No session plans found', data: { sessionsCreated: 0 } }
    }

    // 3. Check which workout_logs this athlete already has (idempotency)
    const sessionPlanIds = sessionPlans.map(sp => sp.id)

    const { data: existingLogs } = await supabase
      .from('workout_logs')
      .select('session_plan_id')
      .eq('athlete_id', athleteId)
      .in('session_plan_id', sessionPlanIds)

    const existingPlanIds = new Set(existingLogs?.map(l => l.session_plan_id) || [])

    // 4. Create workout_logs for sessions the athlete doesn't have
    // Get the macrocycle start dates for calculating session dates
    const macrocycleStartDates = new Map(macrocycles.map(m => [m.id, m.start_date]))

    const sessionsToCreate = sessionPlans
      .filter(sp => !existingPlanIds.has(sp.id))
      .map(sp => {
        // Calculate session date (simplified - use date if available, else current date)
        const sessionDate = sp.date
          ? parseISO(sp.date)
          : new Date()

        return {
          athlete_id: athleteId,
          session_plan_id: sp.id,
          date_time: sessionDate.toISOString(),
          session_status: 'assigned' as const,
          session_mode: 'individual' as const,
          description: sp.description || '',
        }
      })

    if (sessionsToCreate.length === 0) {
      return { isSuccess: true, message: 'Athlete already has all workouts', data: { sessionsCreated: 0 } }
    }

    // 5. Batch insert
    const { error: insertError } = await supabase
      .from('workout_logs')
      .insert(sessionsToCreate)

    if (insertError) {
      console.error('[assignExistingGroupWorkoutsToAthleteAction] Insert error:', insertError)
      return { isSuccess: false, message: 'Failed to create workout logs' }
    }

    return {
      isSuccess: true,
      message: `Created ${sessionsToCreate.length} workout logs`,
      data: { sessionsCreated: sessionsToCreate.length }
    }
  } catch (error) {
    console.error('[assignExistingGroupWorkoutsToAthleteAction] Error:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Remove an athlete from a group
 * Also cancels any assigned (not started) workouts that came from group assignment
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

    // Get current athlete info before updating (for history logging and workout cancellation)
    const { data: currentAthlete, error: currentError } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .eq('id', athleteId)
      .single()

    if (currentError) {
      console.error('Error fetching current athlete:', currentError)
      return {
        isSuccess: false,
        message: `Failed to fetch athlete information: ${currentError.message}`
      }
    }

    const previousGroupId = currentAthlete.athlete_group_id

    if (!previousGroupId) {
      return {
        isSuccess: false,
        message: "Athlete is not in any group"
      }
    }

    // Step 1: Handle assigned workouts from this group
    // Strategy: Cancel PAST workouts (audit trail), DELETE FUTURE workouts (avoid bloat)
    // This prevents database bloat when coach has a year-long plan
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // 1a: Cancel past/overdue workouts (scheduled before today) - keeps audit trail
    const { error: cancelError, count: cancelledCount } = await supabase
      .from('workout_logs')
      .update({
        session_status: 'cancelled',
        notes: 'Cancelled: Athlete removed from group'
      })
      .eq('athlete_id', athleteId)
      .eq('athlete_group_id', previousGroupId)
      .eq('session_status', 'assigned')
      .lt('date_time', todayISO) // Only past/overdue workouts

    if (cancelError) {
      console.warn('Failed to cancel past group workouts:', cancelError)
    }

    // 1b: Delete future workouts (scheduled today or later) - avoids bloat
    // No need to keep cancelled records for workouts that never came due
    const { error: deleteError, count: deletedCount } = await supabase
      .from('workout_logs')
      .delete()
      .eq('athlete_id', athleteId)
      .eq('athlete_group_id', previousGroupId)
      .eq('session_status', 'assigned')
      .gte('date_time', todayISO) // Future workouts (including today)

    if (deleteError) {
      console.warn('Failed to delete future group workouts:', deleteError)
    }

    console.log(`[removeAthleteFromGroupAction] Athlete ${athleteId}: cancelled ${cancelledCount || 0} past workouts, deleted ${deletedCount || 0} future workouts`)

    // Step 2: Remove athlete from group
    const { error: updateError } = await supabase
      .from('athletes')
      .update({ athlete_group_id: null })
      .eq('id', athleteId)

    if (updateError) {
      console.error('Error removing athlete from group:', updateError)
      return {
        isSuccess: false,
        message: `Failed to remove athlete from group: ${updateError.message}`
      }
    }

    // Step 3: Fetch the updated athlete data to return
    const { data: updatedAthlete, error: fetchError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single()

    if (fetchError) {
      // The removal succeeded, but we couldn't fetch the updated data
      console.warn('Removal succeeded but could not fetch updated athlete:', fetchError)
      return {
        isSuccess: true,
        message: "Athlete removed from group successfully",
        data: { ...currentAthlete, athlete_group_id: null } as Athlete
      }
    }

    // Step 4: Log the group change in history
    const historyResult = await createGroupHistoryEntryAction(
      athleteId,
      previousGroupId,
      null,
      `Removed from group by coach`
    )

    if (!historyResult.isSuccess) {
      console.warn('Failed to log group history:', historyResult.message)
      // Don't fail the main operation if history logging fails
    }

    // Build cleanup summary message
    const cleanupParts: string[] = []
    if (cancelledCount && cancelledCount > 0) {
      cleanupParts.push(`${cancelledCount} overdue workout${cancelledCount > 1 ? 's' : ''} cancelled`)
    }
    if (deletedCount && deletedCount > 0) {
      cleanupParts.push(`${deletedCount} future workout${deletedCount > 1 ? 's' : ''} removed`)
    }
    const cleanupMessage = cleanupParts.length > 0 ? ` (${cleanupParts.join(', ')})` : ''

    return {
      isSuccess: true,
      message: `Athlete removed from group successfully${cleanupMessage}`,
      data: updatedAthlete
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

    // Step 1: Handle assigned workouts for this group
    // Strategy: Cancel PAST workouts (audit trail), DELETE FUTURE workouts (avoid bloat)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // 1a: Cancel past/overdue workouts - keeps audit trail for athletes
    const { error: cancelError, count: cancelledCount } = await supabase
      .from('workout_logs')
      .update({
        session_status: 'cancelled',
        notes: 'Cancelled: Group was deleted'
      })
      .eq('athlete_group_id', groupId)
      .eq('session_status', 'assigned')
      .lt('date_time', todayISO)

    if (cancelError) {
      console.warn('Failed to cancel past group workouts:', cancelError)
    }

    // 1b: Delete future workouts - no need to keep cancelled records
    const { error: deleteError, count: deletedCount } = await supabase
      .from('workout_logs')
      .delete()
      .eq('athlete_group_id', groupId)
      .eq('session_status', 'assigned')
      .gte('date_time', todayISO)

    if (deleteError) {
      console.warn('Failed to delete future group workouts:', deleteError)
    }

    console.log(`[deleteAthleteGroupAction] Group ${groupId}: cancelled ${cancelledCount || 0} past workouts, deleted ${deletedCount || 0} future workouts`)

    // Step 2: Remove all athletes from this group
    const { error: removeError } = await supabase
      .from('athletes')
      .update({ athlete_group_id: null })
      .eq('athlete_group_id', groupId)

    if (removeError) {
      console.warn('Failed to remove athletes from group:', removeError)
      // Don't fail - continue with deletion
    }

    // Step 3: Delete the group
    const { error } = await supabase
      .from('athlete_groups')
      .delete()
      .eq('id', groupId)
      .eq('coach_id', (user.coach as { id: number }).id)

    if (error) {
      console.error('Error deleting athlete group:', error)
      return {
        isSuccess: false,
        message: `Failed to delete athlete group: ${error.message}`
      }
    }

    // Build cleanup summary message
    const cleanupParts: string[] = []
    if (cancelledCount && cancelledCount > 0) {
      cleanupParts.push(`${cancelledCount} overdue workout${cancelledCount > 1 ? 's' : ''} cancelled`)
    }
    if (deletedCount && deletedCount > 0) {
      cleanupParts.push(`${deletedCount} future workout${deletedCount > 1 ? 's' : ''} removed`)
    }
    const cleanupMessage = cleanupParts.length > 0 ? ` (${cleanupParts.join(', ')})` : ''

    return {
      isSuccess: true,
      message: `Athlete group deleted successfully${cleanupMessage}`,
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

// ============================================================================
// COACH ATHLETE MANAGEMENT ACTIONS (LEAN MVP)
// ============================================================================

/**
 * Invite or attach an athlete to a group by email
 * Checks if user exists, creates athlete profile if needed, or invites via Clerk
 */
export async function inviteOrAttachAthleteAction(
  email: string,
  groupId: number
): Promise<ActionState<{ type: 'attached' | 'invited', athlete?: Athlete }>> {
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

    // Verify current user is a coach and owns the group
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
      .eq('coach_id', (user.coach as { id: number }).id)
      .single()

    if (groupError || !group) {
      return {
        isSuccess: false,
        message: "Group not found or you don't have permission"
      }
    }

    // Use secure function for email lookup (prevents user enumeration)
    // This function only returns user_id, athlete_id, current_group_id - no email data
    const { data: lookupResult, error: lookupError } = await supabase
      .rpc('lookup_user_for_invite', { email_input: email })
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up user:', lookupError)
      return {
        isSuccess: false,
        message: "Failed to check if user exists"
      }
    }

    if (lookupResult) {
      // User exists - ensure they have an athlete profile and assign to group
      const { user_id, athlete_id, current_group_id } = lookupResult

      if (!athlete_id) {
        // Create athlete profile
        const { data: newAthlete, error: athleteError } = await supabase
          .from('athletes')
          .insert({
            user_id: user_id,
            athlete_group_id: groupId
          })
          .select()
          .single()

        if (athleteError) {
          console.error('Error creating athlete profile:', athleteError)
          return {
            isSuccess: false,
            message: "Failed to create athlete profile"
          }
        }

        // Log the group assignment in history
        const historyResult = await createGroupHistoryEntryAction(
          newAthlete.id,
          null, // No previous group for new athlete
          groupId,
          `Invited and assigned to group by coach`
        )

        if (!historyResult.isSuccess) {
          console.warn('Failed to log group history for new athlete:', historyResult.message)
        }

        return {
          isSuccess: true,
          message: "Athlete profile created and assigned to group successfully",
          data: { type: 'attached', athlete: newAthlete }
        }
      } else {
        // Athlete profile exists - update group assignment
        const { data: updatedAthlete, error: updateError } = await supabase
          .from('athletes')
          .update({ athlete_group_id: groupId })
          .eq('id', athlete_id)
          .select()
          .single()

        if (updateError) {
          console.error('Error assigning athlete to group:', updateError)
          return {
            isSuccess: false,
            message: "Failed to assign athlete to group"
          }
        }

        // Log the group change in history
        const historyResult = await createGroupHistoryEntryAction(
          athlete_id,
          current_group_id,
          groupId,
          `Invited and assigned to group by coach`
        )

        if (!historyResult.isSuccess) {
          console.warn('Failed to log group history for existing athlete:', historyResult.message)
        }

        return {
          isSuccess: true,
          message: current_group_id
            ? "Athlete moved to new group successfully"
            : "Athlete re-added to group successfully",
          data: { type: 'attached', athlete: updatedAthlete }
        }
      }
    } else {
      // User doesn't exist - send Clerk invitation
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        
        const invitation = await clerkClient.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: `${process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/onboarding'}?groupId=${groupId}`,
          notify: true
        })

        // Create a pending athlete record linked to the invitation
        const { data: pendingAthlete, error: pendingError } = await supabase
          .from('athletes')
          .insert({
            // Note: user_id is required, so this athlete record will be created
            // when the user completes signup, not during invitation
            athlete_group_id: groupId,
            // Store invitation ID in metadata for later linking
            training_goals: `Invited via ${invitation.id}`
          } as any) // Temporary workaround - invitation flow needs refactoring
          .select()
          .single()

        if (pendingError) {
          console.error('Error creating pending athlete record:', pendingError)
          // Don't fail the whole operation if we can't create pending record
        }

        return {
          isSuccess: true,
          message: "Invitation sent successfully",
          data: { type: 'invited', athlete: pendingAthlete ?? undefined }
        }
      } catch (clerkError) {
        console.error('Error sending Clerk invitation:', clerkError)
        return {
          isSuccess: false,
          message: `Failed to send invitation: ${clerkError instanceof Error ? clerkError.message : 'Unknown error'}`
        }
      }
    }
  } catch (error) {
    console.error('Error in inviteOrAttachAthleteAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Bulk assign athletes to a group (only unassigned athletes)
 */
export async function bulkAssignAthletesAction(
  athleteIds: number[],
  groupId: number
): Promise<ActionState<{ assigned: number[], skipped: number[], errors: string[] }>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    if (athleteIds.length === 0) {
      return {
        isSuccess: false,
        message: "No athletes selected"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Verify current user is a coach and owns the group
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user || user.role !== 'coach' || !user.coach) {
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
      .eq('coach_id', (user.coach as { id: number }).id)
      .single()

    if (groupError || !group) {
      return {
        isSuccess: false,
        message: "Group not found or you don't have permission"
      }
    }

    // Get current status of all selected athletes
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .in('id', athleteIds)

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return {
        isSuccess: false,
        message: "Failed to fetch athlete information"
      }
    }

    const skipped: number[] = []
    const errors: string[] = []

    // Separate athletes into those to assign and those to skip
    const athletesToAssign = (athletes || []).filter(athlete => {
      if (athlete.athlete_group_id !== null) {
        skipped.push(athlete.id)
        return false
      }
      return true
    })

    // If no athletes to assign, return early
    if (athletesToAssign.length === 0) {
      if (skipped.length > 0) {
        return {
          isSuccess: true,
          message: "All selected athletes are already assigned to groups",
          data: { assigned: [], skipped, errors }
        }
      }
      return {
        isSuccess: false,
        message: "No athletes could be assigned"
      }
    }

    // Batch update all athletes at once
    const athleteIdsToAssign = athletesToAssign.map(a => a.id)
    const { error: batchUpdateError } = await supabase
      .from('athletes')
      .update({ athlete_group_id: groupId })
      .in('id', athleteIdsToAssign)

    if (batchUpdateError) {
      console.error('Error batch assigning athletes:', batchUpdateError)
      return {
        isSuccess: false,
        message: `Failed to assign athletes: ${batchUpdateError.message}`
      }
    }

    const assigned = athleteIdsToAssign

    // Create history entries in parallel (non-blocking, don't fail main operation)
    Promise.all(
      athletesToAssign.map(athlete =>
        createGroupHistoryEntryAction(
          athlete.id,
          athlete.athlete_group_id,
          groupId,
          `Assigned to group by coach (bulk operation)`
        ).catch(err => {
          console.warn(`Failed to log group history for athlete ${athlete.id}:`, err)
        })
      )
    ).catch(err => {
      console.warn('Some history entries failed:', err)
    })

    const success = assigned.length > 0
    const message = success 
      ? `${assigned.length} athletes assigned, ${skipped.length} skipped, ${errors.length} errors`
      : skipped.length > 0 
        ? "All selected athletes are already assigned to groups"
        : "No athletes could be assigned"

    return {
      isSuccess: (success || skipped.length > 0) as true,
      message,
      data: { assigned, skipped, errors }
    }
  } catch (error) {
    console.error('Error in bulkAssignAthletesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Bulk move athletes to a different group
 */
export async function bulkMoveAthletesAction(
  athleteIds: number[],
  targetGroupId: number
): Promise<ActionState<{ moved: number[], skipped: number[], errors: string[] }>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    if (athleteIds.length === 0) {
      return {
        isSuccess: false,
        message: "No athletes selected"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Verify current user is a coach
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user || user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    const coachId = (user.coach as { id: number }).id

    // Verify the target group belongs to this coach
    const { data: targetGroup, error: groupError } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('id', targetGroupId)
      .eq('coach_id', coachId)
      .single()

    if (groupError || !targetGroup) {
      return {
        isSuccess: false,
        message: "Target group not found or you don't have permission"
      }
    }

    // Get current status of all selected athletes and verify they belong to coach's groups
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select(`
        id,
        athlete_group_id,
        athlete_group:athlete_groups(coach_id)
      `)
      .in('id', athleteIds)

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return {
        isSuccess: false,
        message: "Failed to fetch athlete information"
      }
    }

    const skipped: number[] = []
    const errors: string[] = []

    // Separate athletes into categories
    const athletesToMove: typeof athletes = []
    for (const athlete of athletes || []) {
      // Verify athlete belongs to coach's group (or has no group)
      if (athlete.athlete_group?.coach_id && athlete.athlete_group.coach_id !== coachId) {
        errors.push(`Athlete ${athlete.id} belongs to another coach`)
        continue
      }

      if (athlete.athlete_group_id === targetGroupId) {
        // Already in target group, skip
        skipped.push(athlete.id)
        continue
      }

      athletesToMove.push(athlete)
    }

    // If no athletes to move, return early
    if (athletesToMove.length === 0) {
      if (skipped.length > 0) {
        return {
          isSuccess: true,
          message: "All selected athletes are already in the target group",
          data: { moved: [], skipped, errors }
        }
      }
      return {
        isSuccess: false,
        message: errors.length > 0
          ? `No athletes could be moved: ${errors.join(', ')}`
          : "No athletes could be moved"
      }
    }

    // Batch update all athletes at once
    const athleteIdsToMove = athletesToMove.map(a => a.id)
    const { error: batchMoveError } = await supabase
      .from('athletes')
      .update({ athlete_group_id: targetGroupId })
      .in('id', athleteIdsToMove)

    if (batchMoveError) {
      console.error('Error batch moving athletes:', batchMoveError)
      return {
        isSuccess: false,
        message: `Failed to move athletes: ${batchMoveError.message}`
      }
    }

    const moved = athleteIdsToMove

    // Create history entries in parallel (non-blocking, don't fail main operation)
    Promise.all(
      athletesToMove.map(athlete =>
        createGroupHistoryEntryAction(
          athlete.id,
          athlete.athlete_group_id,
          targetGroupId,
          `Moved to group by coach (bulk operation)`
        ).catch(err => {
          console.warn(`Failed to log group history for athlete ${athlete.id}:`, err)
        })
      )
    ).catch(err => {
      console.warn('Some history entries failed:', err)
    })

    const success = moved.length > 0
    const message = success 
      ? `${moved.length} athletes moved, ${skipped.length} skipped, ${errors.length} errors`
      : skipped.length > 0 
        ? "All selected athletes are already in the target group"
        : "No athletes could be moved"

    return {
      isSuccess: (success || skipped.length > 0) as true,
      message,
      data: { moved, skipped, errors }
    }
  } catch (error) {
    console.error('Error in bulkMoveAthletesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Bulk remove athletes from their groups
 */
export async function bulkRemoveAthletesAction(
  athleteIds: number[]
): Promise<ActionState<{ removed: number[], skipped: number[], errors: string[] }>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    if (athleteIds.length === 0) {
      return {
        isSuccess: false,
        message: "No athletes selected"
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)

    // Verify current user is a coach
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user || user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    const coachId = (user.coach as { id: number }).id

    // Get athletes and verify they belong to coach's groups
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select(`
        id,
        athlete_group_id,
        athlete_group:athlete_groups(coach_id)
      `)
      .in('id', athleteIds)

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return {
        isSuccess: false,
        message: "Failed to fetch athlete information"
      }
    }

    const skipped: number[] = []
    const errors: string[] = []

    // Separate athletes into categories
    const athletesToRemove: typeof athletes = []
    for (const athlete of athletes || []) {
      // Verify athlete belongs to coach's group
      if (athlete.athlete_group?.coach_id && athlete.athlete_group.coach_id !== coachId) {
        errors.push(`Athlete ${athlete.id} belongs to another coach`)
        continue
      }

      if (athlete.athlete_group_id === null) {
        // Already not in any group, skip
        skipped.push(athlete.id)
        continue
      }

      athletesToRemove.push(athlete)
    }

    // If no athletes to remove, return early
    if (athletesToRemove.length === 0) {
      if (skipped.length > 0) {
        return {
          isSuccess: true,
          message: "All selected athletes are already not in any group",
          data: { removed: [], skipped, errors }
        }
      }
      return {
        isSuccess: false,
        message: errors.length > 0
          ? `No athletes could be removed: ${errors.join(', ')}`
          : "No athletes could be removed"
      }
    }

    // Execute all RPC calls in parallel
    const removeResults = await Promise.all(
      athletesToRemove.map(async (athlete) => {
        try {
          const { data: removeResult, error: removeError } = await supabase
            .rpc('remove_athlete_from_group', { athlete_id_param: athlete.id })

          const result = removeResult as { success: boolean; error?: string; athlete_id?: number; previous_group_id?: number } | null

          if (removeError) {
            return { athleteId: athlete.id, success: false, error: removeError.message, previousGroupId: athlete.athlete_group_id }
          } else if (!result?.success) {
            return { athleteId: athlete.id, success: false, error: result?.error || 'Unknown error', previousGroupId: athlete.athlete_group_id }
          } else {
            return { athleteId: athlete.id, success: true, previousGroupId: athlete.athlete_group_id }
          }
        } catch (error) {
          return { athleteId: athlete.id, success: false, error: error instanceof Error ? error.message : 'Unknown error', previousGroupId: athlete.athlete_group_id }
        }
      })
    )

    // Process results
    const removed: number[] = []
    const successfulRemovals: { athleteId: number; previousGroupId: number | null }[] = []

    for (const result of removeResults) {
      if (result.success) {
        removed.push(result.athleteId)
        successfulRemovals.push({ athleteId: result.athleteId, previousGroupId: result.previousGroupId })
      } else {
        errors.push(`Failed to remove athlete ${result.athleteId}: ${result.error}`)
      }
    }

    // Create history entries in parallel (non-blocking, don't fail main operation)
    Promise.all(
      successfulRemovals.map(({ athleteId, previousGroupId }) =>
        createGroupHistoryEntryAction(
          athleteId,
          previousGroupId,
          null,
          `Removed from group by coach (bulk operation)`
        ).catch(err => {
          console.warn(`Failed to log group history for athlete ${athleteId}:`, err)
        })
      )
    ).catch(err => {
      console.warn('Some history entries failed:', err)
    })

    const success = removed.length > 0
    const message = success 
      ? `${removed.length} athletes removed from groups, ${skipped.length} skipped, ${errors.length} errors`
      : skipped.length > 0 
        ? "All selected athletes are already not in any group"
        : "No athletes could be removed"

    return {
      isSuccess: (success || skipped.length > 0) as true,
      message,
      data: { removed, skipped, errors }
    }
  } catch (error) {
    console.error('Error in bulkRemoveAthletesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get roster with group counts for efficient data loading
 */
export async function getRosterWithGroupCountsAction(): Promise<ActionState<{
  athletes: Array<Athlete & {
    user?: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      avatar_url: string | null
      birthdate: string | null
      sex: string | null
    }
    athlete_group?: AthleteGroup | null
  }>
  groups: Array<AthleteGroup & { athlete_count: number }>
}>> {
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

    // Verify current user is a coach
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

    const coachId = (user.coach as { id: number }).id

    // Parallelize both queries - they both depend on coachId but not on each other
    const [groupsResult, athletesResult] = await Promise.all([
      // Get coach's groups with athlete counts
      supabase
        .from('athlete_groups')
        .select(`
          *,
          athletes(count)
        `)
        .eq('coach_id', coachId),

      // Get all athletes in coach's groups
      supabase
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
          athlete_group:athlete_groups!inner(
            *,
            coach_id
          )
        `)
        .eq('athlete_group.coach_id', coachId)
    ])

    const { data: groups, error: groupsError } = groupsResult
    const { data: athletes, error: athletesError } = athletesResult

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return {
        isSuccess: false,
        message: `Failed to fetch groups: ${groupsError.message}`
      }
    }

    if (athletesError) {
      console.error('Error fetching athletes:', athletesError)
      return {
        isSuccess: false,
        message: `Failed to fetch athletes: ${athletesError.message}`
      }
    }

    // Transform groups data to include athlete_count
    const groupsWithCounts = groups?.map(group => ({
      ...group,
      athlete_count: group.athletes?.[0]?.count || 0
    })) || []

    // Transform athletes to convert null to undefined for TypeScript compatibility
    const transformedAthletes = (athletes || []).map(athlete => ({
      ...athlete,
      user: athlete.user ?? undefined,
      athlete_group: athlete.athlete_group ?? undefined
    }))

    return {
      isSuccess: true,
      message: "Roster and groups retrieved successfully",
      data: {
        athletes: transformedAthletes,
        groups: groupsWithCounts
      }
    }
  } catch (error) {
    console.error('Error in getRosterWithGroupCountsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// ATHLETE GROUP HISTORY ACTIONS
// ============================================================================

/**
 * Create a history entry for athlete group changes
 * @param athleteId - The athlete being moved
 * @param fromGroupId - The group they're leaving (null if unassigned)
 * @param toGroupId - The group they're joining (null if being unassigned)
 * @param notes - Optional notes about the change
 */
export async function createGroupHistoryEntryAction(
  athleteId: number,
  fromGroupId: number | null,
  toGroupId: number | null,
  notes?: string
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID (the coach making the change)
    const dbUserId = await getDbUserId(userId)

    // Determine the group_id for the history entry
    // If moving to a group, use that group_id
    // If removing from group, use the fromGroupId
    const groupId = toGroupId || fromGroupId

    if (!groupId) {
      return {
        isSuccess: false,
        message: "Cannot create history entry without a group reference"
      }
    }

    // Create the history entry
    const { error } = await supabase
      .from('athlete_group_histories')
      .insert({
        athlete_id: athleteId,
        group_id: groupId,
        created_by: dbUserId,
        notes: notes || null
      })

    if (error) {
      console.error('Error creating group history entry:', error)
      return {
        isSuccess: false,
        message: `Failed to create history entry: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "History entry created successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in createGroupHistoryEntryAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get group history for a specific athlete
 * @param athleteId - The athlete to get history for
 */
export async function getAthleteGroupHistoryAction(
  athleteId: number
): Promise<ActionState<Array<{
  id: number
  athlete_id: number | null
  group_id: number | null
  created_by: number | null
  created_at: string | null
  notes: string | null
  group_name: string | null
  coach_name: string | null
}>>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID
    const dbUserId = await getDbUserId(userId)

    // Verify user is a coach and has access to this athlete
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user || user.role !== 'coach' || !user.coach) {
      return {
        isSuccess: false,
        message: "User is not a coach"
      }
    }

    // Get history with group and coach information
    const { data: history, error } = await supabase
      .from('athlete_group_histories')
      .select(`
        id,
        athlete_id,
        group_id,
        created_by,
        created_at,
        notes,
        athlete_groups!inner(
          group_name,
          coach_id,
          coaches!inner(
            user_id,
            users!inner(
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('athlete_id', athleteId)
      .eq('athlete_groups.coach_id', (user.coach as { id: number }).id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching athlete group history:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch history: ${error.message}`
      }
    }

    // Transform the data to include group and coach names
    const transformedHistory = history?.map(entry => ({
      id: entry.id,
      athlete_id: entry.athlete_id,
      group_id: entry.group_id,
      created_by: entry.created_by,
      created_at: entry.created_at,
      notes: entry.notes,
      group_name: entry.athlete_groups?.group_name || null,
      coach_name: entry.athlete_groups?.coaches?.users 
        ? `${entry.athlete_groups.coaches.users.first_name || ''} ${entry.athlete_groups.coaches.users.last_name || ''}`.trim()
        : null
    })) || []

    return {
      isSuccess: true,
      message: "Athlete group history retrieved successfully",
      data: transformedHistory
    }
  } catch (error) {
    console.error('Error in getAthleteGroupHistoryAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get group history for a specific group
 * @param groupId - The group to get history for
 */
export async function getGroupHistoryAction(
  groupId: number
): Promise<ActionState<Array<{
  id: number
  athlete_id: number | null
  group_id: number | null
  created_by: number | null
  created_at: string | null
  notes: string | null
  athlete_name: string | null
  coach_name: string | null
}>>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID
    const dbUserId = await getDbUserId(userId)

    // Verify user is a coach and owns this group
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        coach:coaches(id)
      `)
      .eq('id', dbUserId)
      .single()

    if (userError || !user || user.role !== 'coach' || !user.coach) {
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
      .eq('coach_id', (user.coach as { id: number }).id)
      .single()

    if (groupError || !group) {
      return {
        isSuccess: false,
        message: "Group not found or you don't have permission"
      }
    }

    // Get history with athlete information
    const { data: history, error } = await supabase
      .from('athlete_group_histories')
      .select(`
        id,
        athlete_id,
        group_id,
        created_by,
        created_at,
        notes,
        athletes!inner(
          user_id,
          users!inner(
            first_name,
            last_name
          )
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching group history:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch history: ${error.message}`
      }
    }

    // Transform the data to include athlete names
    const transformedHistory = history?.map(entry => ({
      id: entry.id,
      athlete_id: entry.athlete_id,
      group_id: entry.group_id,
      created_by: entry.created_by,
      created_at: entry.created_at,
      notes: entry.notes,
      athlete_name: entry.athletes?.users 
        ? `${entry.athletes.users.first_name || ''} ${entry.athletes.users.last_name || ''}`.trim()
        : null,
      coach_name: null // Coach name not available without additional join
    })) || []

    return {
      isSuccess: true,
      message: "Group history retrieved successfully",
      data: transformedHistory
    }
  } catch (error) {
    console.error('Error in getGroupHistoryAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 