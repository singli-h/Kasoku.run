/*
<ai_context>
Server actions for coach-configurable event groups.
Handles CRUD for event group definitions that coaches create to categorize athletes.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { EventGroup } from "@/components/features/athletes/types"

// ============================================================================
// EVENT GROUP ACTIONS (Coach)
// ============================================================================

/**
 * Get all event groups for the current coach
 */
export async function getEventGroupsAction(): Promise<ActionState<EventGroup[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get coach record
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (coachError || !coach) {
      return { isSuccess: false, message: "User is not a coach" }
    }

    const { data: eventGroups, error } = await supabase
      .from('event_groups')
      .select('*')
      .eq('coach_id', coach.id)
      .order('abbreviation', { ascending: true })

    if (error) {
      console.error('Error fetching event groups:', error)
      return { isSuccess: false, message: `Failed to fetch event groups: ${error.message}` }
    }

    return {
      isSuccess: true,
      message: "Event groups retrieved successfully",
      data: eventGroups || []
    }
  } catch (error) {
    console.error('Error in getEventGroupsAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new event group for the current coach
 */
export async function createEventGroupAction(
  name: string,
  abbreviation: string
): Promise<ActionState<EventGroup>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    // Validate inputs
    const trimmedName = name.trim()
    const trimmedAbbrev = abbreviation.trim().toUpperCase()

    if (!trimmedName) {
      return { isSuccess: false, message: "Name is required" }
    }

    if (!trimmedAbbrev || trimmedAbbrev.length > 3) {
      return { isSuccess: false, message: "Abbreviation must be 1-3 characters" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get coach record
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (coachError || !coach) {
      return { isSuccess: false, message: "User is not a coach" }
    }

    const { data: eventGroup, error } = await supabase
      .from('event_groups')
      .insert({
        coach_id: coach.id,
        name: trimmedName,
        abbreviation: trimmedAbbrev
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { isSuccess: false, message: `Abbreviation "${trimmedAbbrev}" already exists` }
      }
      console.error('Error creating event group:', error)
      return { isSuccess: false, message: `Failed to create event group: ${error.message}` }
    }

    return {
      isSuccess: true,
      message: "Event group created successfully",
      data: eventGroup
    }
  } catch (error) {
    console.error('Error in createEventGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete an event group. Returns a warning if athletes are using it.
 */
export async function deleteEventGroupAction(
  id: number
): Promise<ActionState<{ deletedId: number; orphanedAthleteCount: number }>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get coach record
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (coachError || !coach) {
      return { isSuccess: false, message: "User is not a coach" }
    }

    // Fetch the event group to get abbreviation (and verify ownership via RLS)
    const { data: eventGroup, error: fetchError } = await supabase
      .from('event_groups')
      .select('abbreviation')
      .eq('id', id)
      .eq('coach_id', coach.id)
      .single()

    if (fetchError || !eventGroup) {
      return { isSuccess: false, message: "Event group not found or access denied" }
    }

    // Check how many athletes use this abbreviation
    const { data: groupIds } = await supabase
      .from('athlete_groups')
      .select('id')
      .eq('coach_id', coach.id)

    let orphanedCount = 0
    if (groupIds && groupIds.length > 0) {
      const { count } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: true })
        .in('athlete_group_id', groupIds.map(g => g.id))
        .contains('event_groups', [eventGroup.abbreviation])

      orphanedCount = count || 0
    }

    // Delete the event group
    const { error: deleteError } = await supabase
      .from('event_groups')
      .delete()
      .eq('id', id)
      .eq('coach_id', coach.id)

    if (deleteError) {
      console.error('Error deleting event group:', deleteError)
      return { isSuccess: false, message: `Failed to delete event group: ${deleteError.message}` }
    }

    const message = orphanedCount > 0
      ? `Event group deleted. ${orphanedCount} athlete${orphanedCount !== 1 ? 's' : ''} still have this abbreviation assigned.`
      : "Event group deleted successfully"

    return {
      isSuccess: true,
      message,
      data: { deletedId: id, orphanedAthleteCount: orphanedCount }
    }
  } catch (error) {
    console.error('Error in deleteEventGroupAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// EVENT GROUP ACTIONS (Athlete)
// ============================================================================

/**
 * Get event groups defined by the coach of the athlete's group.
 * Used by athlete-role users to see event group names in their UI.
 */
export async function getEventGroupsForCoachOfAthleteAction(): Promise<ActionState<EventGroup[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete's group and the group's coach_id
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('athlete_group_id')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete?.athlete_group_id) {
      return {
        isSuccess: true,
        message: "No group assigned",
        data: []
      }
    }

    const { data: group, error: groupError } = await supabase
      .from('athlete_groups')
      .select('coach_id')
      .eq('id', athlete.athlete_group_id)
      .single()

    if (groupError || !group?.coach_id) {
      return {
        isSuccess: true,
        message: "No coach found for group",
        data: []
      }
    }

    // RLS eg_athlete_read policy allows this query
    const { data: eventGroups, error } = await supabase
      .from('event_groups')
      .select('*')
      .eq('coach_id', group.coach_id)
      .order('abbreviation', { ascending: true })

    if (error) {
      console.error('Error fetching event groups for athlete:', error)
      return { isSuccess: false, message: `Failed to fetch event groups: ${error.message}` }
    }

    return {
      isSuccess: true,
      message: "Event groups retrieved successfully",
      data: eventGroups || []
    }
  } catch (error) {
    console.error('Error in getEventGroupsForCoachOfAthleteAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
