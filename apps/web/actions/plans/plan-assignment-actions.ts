/**
 * Plan Assignment Server Actions
 * Handles assigning training plans to athletes and groups
 */

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/api"
import { startOfWeek, addDays, parseISO } from "date-fns"

interface AssignPlanInput {
  macrocycleId: number
  athleteIds?: number[]
  groupIds?: number[]
  startAlignment: 'anchor' | 'monday' | 'custom'
  customStartDate?: string
}

interface AssignmentResult {
  sessionsCreated: number
  athletesAssigned: number[]
}

/**
 * Assigns a training plan (macrocycle) to athletes or groups
 * Creates workout_logs for each athlete
 */
export async function assignPlanToAthletesAction(
  input: AssignPlanInput
): Promise<ActionState<AssignmentResult>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: 'Not authenticated' }
    }

    const dbUserId = await getDbUserId(userId)

    // Validate input
    if (!input.macrocycleId) {
      return { isSuccess: false, message: 'Macrocycle ID is required' }
    }

    if ((!input.athleteIds || input.athleteIds.length === 0) &&
        (!input.groupIds || input.groupIds.length === 0)) {
      return { isSuccess: false, message: 'Must select at least one athlete or group' }
    }

    // Get macrocycle to verify ownership and dates
    const { data: macrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .select('id, user_id, start_date, end_date')
      .eq('id', input.macrocycleId)
      .single()

    if (macroError || !macrocycle) {
      console.error('[assignPlanToAthletesAction] Macrocycle not found:', macroError)
      return { isSuccess: false, message: 'Training plan not found' }
    }

    if (macrocycle.user_id !== dbUserId) {
      return { isSuccess: false, message: 'Unauthorized - not your plan' }
    }

    // Calculate start date based on alignment
    let calculatedStartDate: Date

    if (input.startAlignment === 'custom' && input.customStartDate) {
      calculatedStartDate = parseISO(input.customStartDate)
    } else if (input.startAlignment === 'monday') {
      // Next Monday
      const today = new Date()
      calculatedStartDate = startOfWeek(addDays(today, 7), { weekStartsOn: 1 })
    } else {
      // Race anchor - use macrocycle start date (simplified for MVP)
      if (!macrocycle.start_date) {
        return { isSuccess: false, message: 'Macrocycle has no start date' }
      }
      calculatedStartDate = parseISO(macrocycle.start_date)
    }

    // Get all athletes to assign to
    let targetAthleteIds: number[] = []
    // Map athlete ID → group ID for setting athlete_group_id on workout_logs (needed for RLS)
    const athleteGroupMap = new Map<number, number>()

    // If individual athletes selected, use those and look up their groups
    if (input.athleteIds && input.athleteIds.length > 0) {
      targetAthleteIds = input.athleteIds

      // Look up group membership for individual athletes (needed for RLS on workout_logs)
      const { data: athleteRows } = await supabase
        .from('athletes')
        .select('id, athlete_group_id')
        .in('id', input.athleteIds)

      if (athleteRows) {
        for (const a of athleteRows) {
          if (a.athlete_group_id) {
            athleteGroupMap.set(a.id, a.athlete_group_id)
          }
        }
      }
    }

    // If groups selected, verify ownership then get all athletes in those groups
    if (input.groupIds && input.groupIds.length > 0) {
      // Get the coach record for the current user
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', dbUserId)
        .single()

      if (!coach) {
        return { isSuccess: false, message: 'Coach profile not found' }
      }

      // Verify coach owns all specified groups
      const { data: ownedGroups } = await supabase
        .from('athlete_groups')
        .select('id')
        .in('id', input.groupIds)
        .eq('coach_id', coach.id)

      const ownedGroupIds = ownedGroups?.map(g => g.id) || []
      const unauthorizedGroups = input.groupIds.filter(id => !ownedGroupIds.includes(id))

      if (unauthorizedGroups.length > 0) {
        return { isSuccess: false, message: 'Unauthorized: you do not own all specified groups' }
      }

      const { data: groupAthletes, error: groupError } = await supabase
        .from('athletes')
        .select('id, athlete_group_id')
        .in('athlete_group_id', input.groupIds)

      if (groupError) {
        console.error('[assignPlanToAthletesAction] Failed to load group athletes:', groupError)
        return { isSuccess: false, message: 'Failed to load athletes from groups' }
      }

      if (groupAthletes) {
        for (const ga of groupAthletes) {
          targetAthleteIds.push(ga.id)
          if (ga.athlete_group_id) {
            athleteGroupMap.set(ga.id, ga.athlete_group_id)
          }
        }
      }
    }

    // Remove duplicates
    targetAthleteIds = [...new Set(targetAthleteIds)]

    if (targetAthleteIds.length === 0) {
      return { isSuccess: false, message: 'No athletes found to assign' }
    }

    // Get all session_plans in this macrocycle hierarchy
    const { data: mesocycles } = await supabase
      .from('mesocycles')
      .select('id')
      .eq('macrocycle_id', input.macrocycleId)

    if (!mesocycles || mesocycles.length === 0) {
      return { isSuccess: false, message: 'No training phases found in this plan. Add mesocycles first.' }
    }

    const mesocycleIds = mesocycles.map(m => m.id)

    const { data: microcycles } = await supabase
      .from('microcycles')
      .select('id')
      .in('mesocycle_id', mesocycleIds)

    if (!microcycles || microcycles.length === 0) {
      return { isSuccess: false, message: 'No training weeks found in this plan. Add microcycles first.' }
    }

    const microcycleIds = microcycles.map(m => m.id)

    const { data: presetGroups, error: presetError } = await supabase
      .from('session_plans')
      .select('id, name, description, date, week, day')
      .in('microcycle_id', microcycleIds)
      .order('date', { ascending: true })

    if (presetError || !presetGroups || presetGroups.length === 0) {
      console.error('[assignPlanToAthletesAction] No sessions found:', presetError)
      return { isSuccess: false, message: 'No training sessions found in this plan. Add sessions first.' }
    }

    // Check for existing sessions to prevent duplicate assignments (idempotency)
    const { data: existingSessions } = await supabase
      .from('workout_logs')
      .select('athlete_id, session_plan_id')
      .in('athlete_id', targetAthleteIds)
      .in('session_plan_id', presetGroups.map(p => p.id))

    // Create a Set of existing combinations for fast lookup
    const existingCombos = new Set(
      existingSessions?.map(s => `${s.athlete_id}-${s.session_plan_id}`) || []
    )

    // Create workout_logs for each athlete × each preset group
    const sessionsToCreate = []

    for (const athleteId of targetAthleteIds) {
      for (const presetGroup of presetGroups) {
        // Skip if session already exists
        const comboKey = `${athleteId}-${presetGroup.id}`
        if (existingCombos.has(comboKey)) {
          continue
        }

        // Calculate session date relative to start date
        const sessionDate = presetGroup.date
          ? parseISO(presetGroup.date)
          : addDays(calculatedStartDate, (presetGroup.week || 0) * 7 + (presetGroup.day || 0))

        sessionsToCreate.push({
          athlete_id: athleteId,
          session_plan_id: presetGroup.id,
          date_time: sessionDate.toISOString(),
          session_status: 'assigned' as const,
          session_mode: 'individual' as const,
          description: presetGroup.description || '',
          // Set athlete_group_id so RLS policies (wl_coach_delete, wl_coach_update) work
          athlete_group_id: athleteGroupMap.get(athleteId) ?? null,
        })
      }
    }

    // Check if any sessions would be created
    if (sessionsToCreate.length === 0) {
      return {
        isSuccess: false,
        message: 'All selected athletes already have this plan assigned. Please unassign first if you want to reassign.',
      }
    }

    // P2: Batch insert sessions (atomic operation - all or nothing)
    // If this fails, no workout_logs are created, so it's safe to retry
    console.log(`[assignPlanToAthletesAction] Creating ${sessionsToCreate.length} workout_logs for ${targetAthleteIds.length} athletes`)

    const { error: insertError } = await supabase
      .from('workout_logs')
      .insert(sessionsToCreate)

    if (insertError) {
      console.error('[assignPlanToAthletesAction] Failed to create sessions:', insertError)
      // Provide more specific error message for debugging
      const errorDetail = insertError.code === '23505'
        ? 'Some workouts already exist (duplicate key). Try refreshing and reassigning.'
        : insertError.code === '23503'
        ? 'Referenced athlete or session plan not found.'
        : 'Database error occurred.'
      return { isSuccess: false, message: `Failed to assign plan: ${errorDetail}` }
    }

    // When assigning to groups, set athlete_group_id on microcycles
    // This enables: (1) session planner subgroup filtering, (2) athlete /program page, (3) RLS policies
    if (input.groupIds && input.groupIds.length > 0) {
      // For MVP, set all microcycles to the first group
      // TODO: Multi-group per-microcycle assignment is a future feature
      // (e.g., different microcycles assigned to different groups within the same plan)
      const primaryGroupId = input.groupIds[0]

      const { error: microUpdateError } = await supabase
        .from('microcycles')
        .update({ athlete_group_id: primaryGroupId })
        .in('id', microcycleIds)

      if (microUpdateError) {
        console.warn('[assignPlanToAthletesAction] Failed to set athlete_group_id on microcycles:', microUpdateError)
        // Non-fatal: workout_logs were already created successfully
      }
    }

    // Revalidate relevant paths
    revalidatePath('/plans')
    revalidatePath(`/plans/${input.macrocycleId}`)
    revalidatePath('/workout') // Athletes will see new sessions

    console.log(`[assignPlanToAthletesAction] Successfully assigned ${sessionsToCreate.length} workouts`)

    return {
      isSuccess: true,
      message: `Plan assigned successfully to ${targetAthleteIds.length} athlete(s) with ${presetGroups.length} sessions each`,
      data: {
        sessionsCreated: sessionsToCreate.length,
        athletesAssigned: targetAthleteIds,
      },
    }
  } catch (error) {
    console.error('[assignPlanToAthletesAction] Unexpected error:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Failed to assign plan',
    }
  }
}

// ---

interface UnassignPlanInput {
  macrocycleId: number
  athleteIds?: number[]
  groupIds?: number[]
}

interface UnassignResult {
  sessionsRemoved: number
}

/**
 * Unassigns a training plan from athletes or groups.
 * Deletes workout_logs with session_status='assigned' only (preserves ongoing/completed).
 * If neither athleteIds nor groupIds provided, unassigns ALL athletes from the plan.
 */
export async function unassignPlanFromAthletesAction(
  input: UnassignPlanInput
): Promise<ActionState<UnassignResult>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: 'Not authenticated' }
    }

    const dbUserId = await getDbUserId(userId)

    if (!input.macrocycleId) {
      return { isSuccess: false, message: 'Macrocycle ID is required' }
    }

    // Verify ownership
    const { data: macrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .select('id, user_id')
      .eq('id', input.macrocycleId)
      .single()

    if (macroError || !macrocycle) {
      console.error('[unassignPlanFromAthletesAction] Macrocycle not found:', macroError)
      return { isSuccess: false, message: 'Training plan not found' }
    }

    if (macrocycle.user_id !== dbUserId) {
      return { isSuccess: false, message: 'Unauthorized - not your plan' }
    }

    // Resolve target athlete IDs (empty = all)
    const unassignAll =
      (!input.athleteIds || input.athleteIds.length === 0) &&
      (!input.groupIds || input.groupIds.length === 0)

    let targetAthleteIds: number[] = []

    if (!unassignAll) {
      if (input.athleteIds && input.athleteIds.length > 0) {
        targetAthleteIds = input.athleteIds
      }

      if (input.groupIds && input.groupIds.length > 0) {
        const { data: coach } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', dbUserId)
          .single()

        if (!coach) {
          return { isSuccess: false, message: 'Coach profile not found' }
        }

        const { data: ownedGroups } = await supabase
          .from('athlete_groups')
          .select('id')
          .in('id', input.groupIds)
          .eq('coach_id', coach.id)

        const ownedGroupIds = ownedGroups?.map(g => g.id) || []
        const unauthorizedGroups = input.groupIds.filter(id => !ownedGroupIds.includes(id))

        if (unauthorizedGroups.length > 0) {
          return { isSuccess: false, message: 'Unauthorized: you do not own all specified groups' }
        }

        const { data: groupAthletes, error: groupError } = await supabase
          .from('athletes')
          .select('id')
          .in('athlete_group_id', input.groupIds)

        if (groupError) {
          console.error('[unassignPlanFromAthletesAction] Failed to load group athletes:', groupError)
          return { isSuccess: false, message: 'Failed to load athletes from groups' }
        }

        if (groupAthletes) {
          targetAthleteIds = [...targetAthleteIds, ...groupAthletes.map(a => a.id)]
        }
      }

      targetAthleteIds = [...new Set(targetAthleteIds)]

      if (targetAthleteIds.length === 0) {
        return { isSuccess: false, message: 'No athletes found to unassign' }
      }
    }

    // Get all session_plan IDs in this macrocycle
    const { data: mesocycles } = await supabase
      .from('mesocycles')
      .select('id')
      .eq('macrocycle_id', input.macrocycleId)

    if (!mesocycles || mesocycles.length === 0) {
      return { isSuccess: true, message: 'No phases in plan - nothing to unassign', data: { sessionsRemoved: 0 } }
    }

    const { data: microcycles } = await supabase
      .from('microcycles')
      .select('id')
      .in('mesocycle_id', mesocycles.map(m => m.id))

    if (!microcycles || microcycles.length === 0) {
      return { isSuccess: true, message: 'No weeks in plan - nothing to unassign', data: { sessionsRemoved: 0 } }
    }

    const { data: sessionPlans } = await supabase
      .from('session_plans')
      .select('id')
      .in('microcycle_id', microcycles.map(m => m.id))

    if (!sessionPlans || sessionPlans.length === 0) {
      return { isSuccess: true, message: 'No sessions in plan - nothing to unassign', data: { sessionsRemoved: 0 } }
    }

    const sessionPlanIds = sessionPlans.map(s => s.id)

    // Count first, then delete (Supabase delete doesn't return count reliably with .select)
    let countQuery = supabase
      .from('workout_logs')
      .select('id', { count: 'exact', head: true })
      .in('session_plan_id', sessionPlanIds)
      .eq('session_status', 'assigned')

    if (!unassignAll) {
      countQuery = countQuery.in('athlete_id', targetAthleteIds)
    }

    const { count } = await countQuery

    if (!count || count === 0) {
      return { isSuccess: true, message: 'No assigned sessions found to remove', data: { sessionsRemoved: 0 } }
    }

    // Delete assigned workout_logs only
    let deleteQuery = supabase
      .from('workout_logs')
      .delete()
      .in('session_plan_id', sessionPlanIds)
      .eq('session_status', 'assigned')

    if (!unassignAll) {
      deleteQuery = deleteQuery.in('athlete_id', targetAthleteIds)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('[unassignPlanFromAthletesAction] Failed to delete sessions:', deleteError)
      return { isSuccess: false, message: 'Failed to unassign plan' }
    }

    console.log(`[unassignPlanFromAthletesAction] Removed ${count} assigned workout_logs`)

    // Revalidate relevant paths
    revalidatePath('/plans')
    revalidatePath(`/plans/${input.macrocycleId}`)
    revalidatePath('/workout')

    return {
      isSuccess: true,
      message: `Unassigned ${count} session(s) successfully`,
      data: { sessionsRemoved: count },
    }
  } catch (error) {
    console.error('[unassignPlanFromAthletesAction] Unexpected error:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Failed to unassign plan',
    }
  }
}
