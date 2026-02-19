/*
<ai_context>
Server actions for training plan management (macrocycles, mesocycles, microcycles).
Follows the established action pattern with ActionState return types and proper error handling.
Includes hierarchical operations for the periodization model.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { type Json } from "@/types/database"
import {
  Macrocycle, MacrocycleInsert, MacrocycleUpdate,
  Mesocycle, MesocycleInsert, MesocycleUpdate,
  Microcycle, MicrocycleInsert, MicrocycleUpdate,
  MacrocycleWithDetails, MesocycleWithDetails, MicrocycleWithDetails,
  CreateMacrocycleForm, CreateMesocycleForm, CreateMicrocycleForm,
  SessionPlanInsert,
  createMesocycleMetadata,
  type MesocycleMetadata,
  type EquipmentCategory
} from "@/types/training"

// ============================================================================
// DATE VALIDATION UTILITIES
// ============================================================================

/**
 * Validates that start_date is before end_date
 * Returns error message if invalid, null if valid
 */
function validateDateRange(startDate: string | null | undefined, endDate: string | null | undefined): string | null {
  if (!startDate || !endDate) return null // Allow null dates (optional)

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) return "Invalid start date format"
  if (isNaN(end.getTime())) return "Invalid end date format"
  if (start >= end) return "Start date must be before end date"

  return null
}

/**
 * Validates that child dates fall within parent date boundaries
 * Returns error message if invalid, null if valid
 */
function validateDateBoundaries(
  childStart: string | null | undefined,
  childEnd: string | null | undefined,
  parentStart: string | null | undefined,
  parentEnd: string | null | undefined,
  childName: string = "Child",
  parentName: string = "parent"
): string | null {
  // Skip if any dates are missing
  if (!childStart || !childEnd || !parentStart || !parentEnd) return null

  const cStart = new Date(childStart)
  const cEnd = new Date(childEnd)
  const pStart = new Date(parentStart)
  const pEnd = new Date(parentEnd)

  if (cStart < pStart) {
    return `${childName} start date cannot be before ${parentName} start date`
  }
  if (cEnd > pEnd) {
    return `${childName} end date cannot be after ${parentName} end date`
  }

  return null
}

/**
 * Validates that a new cycle doesn't overlap with existing sibling cycles
 * Two date ranges overlap if: start1 <= end2 AND end1 >= start2
 * Returns error message if overlap found, null if no overlap
 */
async function validateNoSiblingOverlap(
  tableName: 'mesocycles' | 'microcycles',
  parentColumn: 'macrocycle_id' | 'mesocycle_id',
  parentId: number,
  startDate: string,
  endDate: string,
  excludeId?: number // For updates, exclude the current cycle being edited
): Promise<string | null> {
  // Skip if dates are missing
  if (!startDate || !endDate) return null

  // Query for siblings that might overlap
  // Overlap condition: existing.start_date <= newEndDate AND existing.end_date >= newStartDate
  let query = supabase
    .from(tableName)
    .select('id, name, start_date, end_date')
    .eq(parentColumn, parentId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  // Exclude current cycle when updating
  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: overlapping, error } = await query

  if (error) {
    console.error(`Error checking for sibling overlap in ${tableName}:`, error)
    // Don't block on query errors, but log them
    return null
  }

  if (overlapping && overlapping.length > 0) {
    const cycleType = tableName === 'mesocycles' ? 'mesocycle' : 'microcycle'
    const sibling = overlapping[0]
    return `Date range overlaps with existing ${cycleType}: "${sibling.name}" (${sibling.start_date} to ${sibling.end_date})`
  }

  return null
}

// ============================================================================
// MACROCYCLE ACTIONS
// ============================================================================

/**
 * Create a new macrocycle (long-term training plan)
 */
export async function createMacrocycleAction(
  formData: CreateMacrocycleForm
): Promise<ActionState<Macrocycle>> {
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

    // Validate date range
    const dateError = validateDateRange(formData.start_date, formData.end_date)
    if (dateError) {
      return { isSuccess: false, message: dateError }
    }

    const macrocycleData: MacrocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      athlete_group_id: formData.athlete_group_id || null,
      user_id: dbUserId
    }

    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .insert(macrocycleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating macrocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to create macrocycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Macrocycle created successfully",
      data: macrocycle
    }
  } catch (error) {
    console.error('Error in createMacrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get all macrocycles for the current user
 */
export async function getMacrocyclesAction(): Promise<ActionState<MacrocycleWithDetails[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Get database user ID using the cache utility
    const dbUserId = await getDbUserId(userId)

    const { data: macrocycles, error } = await supabase
      .from('macrocycles')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        mesocycles(
          *,
          microcycles(
            *,
            session_plans(*)
          )
        ),
        races(
          id,
          name,
          date,
          type
        )
      `)
      .eq('user_id', dbUserId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching macrocycles:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch macrocycles: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Macrocycles retrieved successfully",
      data: macrocycles || []
    }
  } catch (error) {
    console.error('Error in getMacrocyclesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific macrocycle by ID
 */
export async function getMacrocycleByIdAction(id: number): Promise<ActionState<MacrocycleWithDetails>> {
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

    // Optimized query: removed !inner (allows empty mesocycles/microcycles),
    // and selected only required exercise fields instead of exercises(*)
    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        races(
          id,
          name,
          date,
          type
        ),
        mesocycles(
          *,
          microcycles(
            *,
            session_plans(
              *,
              session_plan_exercises(
                id,
                exercise_order,
                notes,
                exercise_id,
                superset_id,
                exercise:exercises(
                  id,
                  name,
                  description,
                  video_url
                )
              )
            )
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .order('start_date', { referencedTable: 'mesocycles', ascending: true })
      .order('start_date', { referencedTable: 'mesocycles.microcycles', ascending: true })
      .single()

    if (error) {
      console.error('Error fetching macrocycle:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Macrocycle not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch macrocycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Macrocycle retrieved successfully",
      data: macrocycle
    }
  } catch (error) {
    console.error('Error in getMacrocycleByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update an existing macrocycle
 */
export async function updateMacrocycleAction(
  id: number,
  updates: Partial<MacrocycleUpdate>
): Promise<ActionState<Macrocycle>> {
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

    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating macrocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to update macrocycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Macrocycle updated successfully",
      data: macrocycle
    }
  } catch (error) {
    console.error('Error in updateMacrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a macrocycle
 */
export async function deleteMacrocycleAction(id: number): Promise<ActionState<boolean>> {
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

    const { error } = await supabase
      .from('macrocycles')
      .delete()
      .eq('id', id)
      .eq('user_id', dbUserId)

    if (error) {
      console.error('Error deleting macrocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to delete macrocycle: ${error.message}`
      }
    }

    revalidatePath('/plans', 'page')

    return {
      isSuccess: true,
      message: "Macrocycle deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteMacrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// MESOCYCLE ACTIONS
// ============================================================================

/**
 * Create a new mesocycle (training block within a macrocycle)
 */
export async function createMesocycleAction(
  formData: CreateMesocycleForm
): Promise<ActionState<Mesocycle>> {
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

    // Validate date range
    const dateError = validateDateRange(formData.start_date, formData.end_date)
    if (dateError) {
      return { isSuccess: false, message: dateError }
    }

    // Validate dates are within parent macrocycle if specified
    if (formData.macrocycle_id) {
      const { data: parentMacrocycle } = await supabase
        .from('macrocycles')
        .select('start_date, end_date')
        .eq('id', formData.macrocycle_id)
        .single()

      if (parentMacrocycle) {
        const boundaryError = validateDateBoundaries(
          formData.start_date, formData.end_date,
          parentMacrocycle.start_date, parentMacrocycle.end_date,
          "Mesocycle", "macrocycle"
        )
        if (boundaryError) {
          return { isSuccess: false, message: boundaryError }
        }
      }

      // Check for overlapping sibling mesocycles within the same macrocycle
      if (formData.start_date && formData.end_date) {
        const overlapError = await validateNoSiblingOverlap(
          'mesocycles',
          'macrocycle_id',
          formData.macrocycle_id,
          formData.start_date,
          formData.end_date
        )
        if (overlapError) {
          return { isSuccess: false, message: overlapError }
        }
      }
    }

    const mesocycleData: MesocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      macrocycle_id: formData.macrocycle_id || null,
      metadata: formData.metadata || null,
      user_id: dbUserId
    }

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .insert(mesocycleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating mesocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to create mesocycle: ${error.message}`
      }
    }

    revalidatePath('/plans', 'page')

    return {
      isSuccess: true,
      message: "Mesocycle created successfully",
      data: mesocycle
    }
  } catch (error) {
    console.error('Error in createMesocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get mesocycles for a specific macrocycle
 */
export async function getMesocyclesByMacrocycleAction(macrocycleId: number): Promise<ActionState<MesocycleWithDetails[]>> {
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

    const { data: mesocycles, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        macrocycle:macrocycles(*),
        microcycles(
          *,
          session_plans(
            *,
            session_plan_exercises(
              *,
              exercise:exercises(*),
              session_plan_sets(*)
            )
          )
        )
      `)
      .eq('macrocycle_id', macrocycleId)
      .eq('user_id', dbUserId)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching mesocycles:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch mesocycles: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Mesocycles retrieved successfully",
      data: (mesocycles || []) as unknown as MesocycleWithDetails[]
    }
  } catch (error) {
    console.error('Error in getMesocyclesByMacrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific mesocycle by ID
 */
export async function getMesocycleByIdAction(id: number): Promise<ActionState<MesocycleWithDetails>> {
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

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        macrocycle:macrocycles(*),
        microcycles(
          *,
          session_plans(
            *,
            session_plan_exercises(
              *,
              exercise:exercises(*),
              session_plan_sets(*)
            ),
            workout_logs(id, session_status)
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .single()

    if (error) {
      console.error('Error fetching mesocycle:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Mesocycle not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch mesocycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Mesocycle retrieved successfully",
      data: mesocycle
    }
  } catch (error) {
    console.error('Error in getMesocycleByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update a mesocycle
 */
export async function updateMesocycleAction(
  id: number,
  updates: Partial<MesocycleUpdate>
): Promise<ActionState<Mesocycle>> {
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

    // If dates are being updated, validate for sibling overlap
    if (updates.start_date || updates.end_date) {
      // Fetch current mesocycle to get existing dates and parent
      const { data: currentMeso } = await supabase
        .from('mesocycles')
        .select('start_date, end_date, macrocycle_id')
        .eq('id', id)
        .eq('user_id', dbUserId)
        .single()

      if (currentMeso && currentMeso.macrocycle_id) {
        const newStart = updates.start_date || currentMeso.start_date
        const newEnd = updates.end_date || currentMeso.end_date

        // Validate date range
        const dateError = validateDateRange(newStart, newEnd)
        if (dateError) {
          return { isSuccess: false, message: dateError }
        }

        // Check for sibling overlap, excluding the current mesocycle
        if (newStart && newEnd) {
          const overlapError = await validateNoSiblingOverlap(
            'mesocycles',
            'macrocycle_id',
            currentMeso.macrocycle_id,
            newStart,
            newEnd,
            id // Exclude current mesocycle
          )
          if (overlapError) {
            return { isSuccess: false, message: overlapError }
          }
        }
      }
    }

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating mesocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to update mesocycle: ${error.message}`
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Mesocycle updated successfully",
      data: mesocycle
    }
  } catch (error) {
    console.error('Error in updateMesocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a mesocycle
 */
export async function deleteMesocycleAction(id: number): Promise<ActionState<boolean>> {
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

    // Gather dependent item counts for logging
    const { data: microcycles } = await supabase
      .from('microcycles')
      .select('id')
      .eq('mesocycle_id', id)

    const microcycleIds = microcycles?.map(m => m.id) ?? []

    let sessionPlanIds: string[] = []
    let exerciseIds: string[] = []

    if (microcycleIds.length > 0) {
      const { data: sessionPlans } = await supabase
        .from('session_plans')
        .select('id')
        .in('microcycle_id', microcycleIds as any)

      sessionPlanIds = sessionPlans?.map(s => s.id) ?? []

      if (sessionPlanIds.length > 0) {
        const { data: exercises } = await supabase
          .from('session_plan_exercises')
          .select('id')
          .in('session_plan_id', sessionPlanIds as any)

        exerciseIds = exercises?.map(e => e.id) ?? []
      }

      console.log(
        `Cascade deleting mesocycle ${id}: ${microcycleIds.length} microcycles, ` +
        `${sessionPlanIds.length} session_plans, ${exerciseIds.length} exercises`
      )
    }

    // Delete in reverse dependency order
    if (exerciseIds.length > 0) {
      const { error: setsError } = await supabase
        .from('session_plan_sets')
        .delete()
        .in('session_plan_exercise_id', exerciseIds as any)

      if (setsError) {
        console.error('Error deleting session_plan_sets:', setsError)
      }
    }

    if (sessionPlanIds.length > 0) {
      const { error: exercisesError } = await supabase
        .from('session_plan_exercises')
        .delete()
        .in('session_plan_id', sessionPlanIds as any)

      if (exercisesError) {
        console.error('Error deleting session_plan_exercises:', exercisesError)
      }
    }

    if (microcycleIds.length > 0) {
      const { error: sessionsError } = await supabase
        .from('session_plans')
        .delete()
        .in('microcycle_id', microcycleIds as any)

      if (sessionsError) {
        console.error('Error deleting session_plans:', sessionsError)
      }

      const { error: microcyclesError } = await supabase
        .from('microcycles')
        .delete()
        .eq('mesocycle_id', id)

      if (microcyclesError) {
        console.error('Error deleting microcycles:', microcyclesError)
      }
    }

    // Delete the mesocycle itself
    const { error } = await supabase
      .from('mesocycles')
      .delete()
      .eq('id', id)
      .eq('user_id', dbUserId)

    if (error) {
      console.error('Error deleting mesocycle:', error)
      return {
        isSuccess: false,
        message: `Failed to delete mesocycle: ${error.message}`
      }
    }

    revalidatePath('/plans', 'page')

    return {
      isSuccess: true,
      message: "Mesocycle deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteMesocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// MICROCYCLE ACTIONS
// ============================================================================

/**
 * Create a new microcycle (weekly training plan)
 * Optionally creates initial preset groups if provided
 */
export async function createMicrocycleAction(
  formData: CreateMicrocycleForm,
  initialSessions?: Array<{
    name: string
    description?: string
    day: number
    week: number
    exercises?: Array<{
      exerciseId: number
      order: number
      supersetId?: string
      sets: Array<{
        setIndex: number
        reps?: number
        weight?: number
        rpe?: number
        restTime?: number
        distance?: number
        performing_time?: number
        power?: number
        velocity?: number
        effort?: number
        height?: number
        resistance?: number
        resistance_unit_id?: number
        tempo?: string
        metadata?: any
        notes?: string
      }>
      notes?: string
    }>
  }>
): Promise<ActionState<Microcycle>> {
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

    // Validate date range
    const dateError = validateDateRange(formData.start_date, formData.end_date)
    if (dateError) {
      return { isSuccess: false, message: dateError }
    }

    // Validate dates are within parent mesocycle if specified
    if (formData.mesocycle_id) {
      const { data: parentMesocycle } = await supabase
        .from('mesocycles')
        .select('start_date, end_date')
        .eq('id', formData.mesocycle_id)
        .single()

      if (parentMesocycle) {
        const boundaryError = validateDateBoundaries(
          formData.start_date, formData.end_date,
          parentMesocycle.start_date, parentMesocycle.end_date,
          "Microcycle", "mesocycle"
        )
        if (boundaryError) {
          return { isSuccess: false, message: boundaryError }
        }
      }

      // Check for overlapping sibling microcycles within the same mesocycle
      if (formData.start_date && formData.end_date) {
        const overlapError = await validateNoSiblingOverlap(
          'microcycles',
          'mesocycle_id',
          formData.mesocycle_id,
          formData.start_date,
          formData.end_date
        )
        if (overlapError) {
          return { isSuccess: false, message: overlapError }
        }
      }
    }

    const microcycleData: MicrocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      mesocycle_id: formData.mesocycle_id || null,
      user_id: dbUserId
    }

    const { data: microcycle, error } = await supabase
      .from('microcycles')
      .insert(microcycleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating microcycle:', error)
      return {
        isSuccess: false,
        message: `Failed to create microcycle: ${error.message}`
      }
    }

    // If initial sessions are provided, create them
    if (initialSessions && initialSessions.length > 0) {
      const sessionPlanData = {
        name: formData.name,
        description: formData.description || '',
        microcycleId: microcycle.id,
        athleteGroupId: undefined,
        athleteIds: undefined,
        isTemplate: false,
        sessions: initialSessions.map((session, index) => ({
          id: `session-${microcycle.id}-${session.week}-${session.day}`,
          name: session.name,
          description: session.description || '',
          day: session.day,
          week: session.week,
          exercises: (session.exercises || []).map((exercise, exerciseIndex) => ({
            id: `exercise-${exerciseIndex}`,
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            supersetId: exercise.supersetId,
            sets: exercise.sets,
            notes: exercise.notes || '',
            restTime: 60 // Default 60 seconds
          })),
          estimatedDuration: 60, // Default 60 minutes
          focus: ['training'], // Default focus
          notes: ''
        }))
      }

      // Import the saveSessionPlanAction function
      const { saveSessionPlanAction } = await import('./session-plan-actions')
      const sessionResult = await saveSessionPlanAction(sessionPlanData)
      
      if (!sessionResult.isSuccess) {
        console.error('Failed to create initial sessions:', sessionResult.message)
        // Don't fail the microcycle creation, but log the issue
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Microcycle created successfully",
      data: microcycle as MicrocycleWithDetails
    }
  } catch (error) {
    console.error('Error in createMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get microcycles for a specific mesocycle
 */
export async function getMicrocyclesByMesocycleAction(mesocycleId: number): Promise<ActionState<MicrocycleWithDetails[]>> {
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

    const { data: microcycles, error } = await supabase
      .from('microcycles')
      .select(`
        *,
        mesocycle:mesocycles(*),
        session_plans(
          *,
          session_plan_exercises(
            *,
            exercise:exercises(*),
            session_plan_sets(*)
          ),
          athlete_groups(*)
        )
      `)
      .eq('mesocycle_id', mesocycleId)
      .eq('user_id', dbUserId)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching microcycles:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch microcycles: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Microcycles retrieved successfully",
      data: (microcycles || []) as MicrocycleWithDetails[]
    }
  } catch (error) {
    console.error('Error in getMicrocyclesByMesocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a specific microcycle by ID
 */
export async function getMicrocycleByIdAction(id: number): Promise<ActionState<MicrocycleWithDetails>> {
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

    const { data: microcycle, error } = await supabase
      .from('microcycles')
      .select(`
        *,
        mesocycle:mesocycles(*),
        session_plans(
          *,
          session_plan_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .single()

    if (error) {
      console.error('Error fetching microcycle:', error)
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Microcycle not found"
        }
      }
      return {
        isSuccess: false,
        message: `Failed to fetch microcycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Microcycle retrieved successfully",
      data: microcycle as MicrocycleWithDetails
    }
  } catch (error) {
    console.error('Error in getMicrocycleByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update a microcycle
 */
export async function updateMicrocycleAction(
  id: number,
  updates: Partial<MicrocycleUpdate>
): Promise<ActionState<Microcycle>> {
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

    // If dates are being updated, validate for sibling overlap
    if (updates.start_date || updates.end_date) {
      // Fetch current microcycle to get existing dates and parent
      const { data: currentMicro } = await supabase
        .from('microcycles')
        .select('start_date, end_date, mesocycle_id')
        .eq('id', id)
        .eq('user_id', dbUserId)
        .single()

      if (currentMicro && currentMicro.mesocycle_id) {
        const newStart = updates.start_date || currentMicro.start_date
        const newEnd = updates.end_date || currentMicro.end_date

        // Validate date range
        const dateError = validateDateRange(newStart, newEnd)
        if (dateError) {
          return { isSuccess: false, message: dateError }
        }

        // Check for sibling overlap, excluding the current microcycle
        if (newStart && newEnd) {
          const overlapError = await validateNoSiblingOverlap(
            'microcycles',
            'mesocycle_id',
            currentMicro.mesocycle_id,
            newStart,
            newEnd,
            id // Exclude current microcycle
          )
          if (overlapError) {
            return { isSuccess: false, message: overlapError }
          }
        }
      }
    }

    const { data: microcycle, error } = await supabase
      .from('microcycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating microcycle:', error)
      return {
        isSuccess: false,
        message: `Failed to update microcycle: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Microcycle updated successfully",
      data: microcycle as MicrocycleWithDetails
    }
  } catch (error) {
    console.error('Error in updateMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a microcycle
 */
export async function deleteMicrocycleAction(id: number): Promise<ActionState<boolean>> {
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

    // Check if microcycle has any exercise preset groups
    const { data: presetGroups, error: checkError } = await supabase
      .from('session_plans')
      .select('id')
      .eq('microcycle_id', id)
      .limit(1)

    if (checkError) {
      console.error('Error checking for dependent preset groups:', checkError)
      return {
        isSuccess: false,
        message: `Failed to check dependencies: ${checkError.message}`
      }
    }

    if (presetGroups && presetGroups.length > 0) {
      return {
        isSuccess: false,
        message: "Cannot delete microcycle that contains training sessions. Please delete the sessions first."
      }
    }

    const { error } = await supabase
      .from('microcycles')
      .delete()
      .eq('id', id)
      .eq('user_id', dbUserId)

    if (error) {
      console.error('Error deleting microcycle:', error)
      return {
        isSuccess: false,
        message: `Failed to delete microcycle: ${error.message}`
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Microcycle deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteMicrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// PERIODIZATION TEMPLATE ACTIONS
// ============================================================================

/**
 * Copy a macrocycle as a template for reuse
 */
export async function copyMacrocycleAsTemplateAction(
  macrocycleId: number,
  newName: string,
  newStartDate: string,
  newEndDate: string,
  athleteGroupId?: number
): Promise<ActionState<Macrocycle>> {
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

    // Get the original macrocycle with all its nested data
    const { data: originalMacrocycle, error: fetchError } = await supabase
      .from('macrocycles')
      .select(`
        *,
        mesocycles(
          *,
          microcycles(
            *,
            session_plans(
              *,
              session_plan_exercises(
                *,
                session_plan_sets(*)
              )
            )
          )
        )
      `)
      .eq('id', macrocycleId)
      .eq('user_id', dbUserId)
      .single()

    if (fetchError || !originalMacrocycle) {
      return {
        isSuccess: false,
        message: "Original macrocycle not found"
      }
    }

    // Create new macrocycle
    const newMacrocycleData: MacrocycleInsert = {
      name: newName,
      description: originalMacrocycle.description,
      start_date: newStartDate,
      end_date: newEndDate,
      athlete_group_id: athleteGroupId || null,
      user_id: dbUserId
    }

    const { data: newMacrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .insert(newMacrocycleData)
      .select()
      .single()

    if (macroError || !newMacrocycle) {
      return {
        isSuccess: false,
        message: `Failed to create new macrocycle: ${macroError?.message}`
      }
    }

    // Calculate date offset for adjusting nested cycles
    const originalStart = new Date(originalMacrocycle.start_date || new Date())
    const newStart = new Date(newStartDate)
    const daysDiff = Math.floor((newStart.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24))

    // Copy mesocycles
    if (originalMacrocycle.mesocycles && originalMacrocycle.mesocycles.length > 0) {
      for (const mesocycle of originalMacrocycle.mesocycles) {
        const mesoStartDate = new Date(mesocycle.start_date || new Date())
        mesoStartDate.setDate(mesoStartDate.getDate() + daysDiff)

        const mesoEndDate = new Date(mesocycle.end_date || new Date())
        mesoEndDate.setDate(mesoEndDate.getDate() + daysDiff)

        const newMesocycleData: MesocycleInsert = {
          name: mesocycle.name,
          description: mesocycle.description,
          start_date: mesoStartDate.toISOString().split('T')[0],
          end_date: mesoEndDate.toISOString().split('T')[0],
          macrocycle_id: newMacrocycle.id,
          user_id: dbUserId,
          metadata: mesocycle.metadata
        }

        const { data: newMesocycle, error: mesoError } = await supabase
          .from('mesocycles')
          .insert(newMesocycleData)
          .select()
          .single()

        if (mesoError || !newMesocycle) {
          console.error('Error copying mesocycle:', mesoError)
          continue
        }

        // Copy microcycles for this mesocycle
        if (mesocycle.microcycles && mesocycle.microcycles.length > 0) {
          for (const microcycle of mesocycle.microcycles) {
            const microStartDate = new Date(microcycle.start_date || new Date())
            microStartDate.setDate(microStartDate.getDate() + daysDiff)
            
            const microEndDate = new Date(microcycle.end_date || new Date())
            microEndDate.setDate(microEndDate.getDate() + daysDiff)

            const newMicrocycleData: MicrocycleInsert = {
              name: microcycle.name,
              description: microcycle.description,
              start_date: microStartDate.toISOString().split('T')[0],
              end_date: microEndDate.toISOString().split('T')[0],
              mesocycle_id: newMesocycle.id,
              user_id: dbUserId
            }

            const { data: newMicrocycle, error: microError } = await supabase
              .from('microcycles')
              .insert(newMicrocycleData)
              .select()
              .single()

            if (microError || !newMicrocycle) {
              console.error('Error copying microcycle:', microError)
              continue
            }

            // Copy exercise preset groups for this microcycle
            if (microcycle.session_plans && microcycle.session_plans.length > 0) {
              for (const presetGroup of microcycle.session_plans) {
                const presetDate = new Date(presetGroup.date || new Date())
                presetDate.setDate(presetDate.getDate() + daysDiff)

                const newPresetGroupData = {
                  name: presetGroup.name,
                  description: presetGroup.description,
                  date: presetDate.toISOString().split('T')[0],
                  session_mode: presetGroup.session_mode,
                  week: presetGroup.week,
                  day: presetGroup.day,
                  microcycle_id: newMicrocycle.id,
                  athlete_group_id: athleteGroupId || null,
                  user_id: dbUserId
                }

                const { data: newPresetGroup, error: presetError } = await supabase
                  .from('session_plans')
                  .insert(newPresetGroupData)
                  .select()
                  .single()

                if (presetError || !newPresetGroup) {
                  console.error('Error copying preset group:', presetError)
                  continue
                }

                // Copy exercise presets and their details
                if (presetGroup.session_plan_exercises && presetGroup.session_plan_exercises.length > 0) {
                  for (const preset of presetGroup.session_plan_exercises) {
                    const newPresetData = {
                      exercise_id: preset.exercise_id,
                      session_plan_id: newPresetGroup.id,
                      exercise_order: preset.exercise_order,
                      notes: preset.notes,
                      superset_id: preset.superset_id
                    }

                    const { data: newPreset, error: presetInsertError } = await supabase
                      .from('session_plan_exercises')
                      .insert(newPresetData)
                      .select()
                      .single()

                    if (presetInsertError || !newPreset) {
                      console.error('Error copying exercise preset:', presetInsertError)
                      continue
                    }

                    // Copy preset details
                    if (preset.session_plan_sets && preset.session_plan_sets.length > 0) {
                      const detailsData = preset.session_plan_sets.map(detail => ({
                        session_plan_exercise_id: newPreset.id,
                        set_index: detail.set_index,
                        reps: detail.reps,
                        weight: detail.weight,
                        distance: detail.distance,
                        performing_time: detail.performing_time,
                        rest_time: detail.rest_time,
                        rpe: detail.rpe,
                        effort: detail.effort,
                        power: detail.power,
                        velocity: detail.velocity,
                        resistance: detail.resistance,
                        resistance_unit_id: detail.resistance_unit_id,
                        height: detail.height,
                        tempo: detail.tempo,
                        metadata: detail.metadata
                      }))

                      await supabase
                        .from('session_plan_sets')
                        .insert(detailsData)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      isSuccess: true,
      message: "Macrocycle template copied successfully",
      data: newMacrocycle
    }
  } catch (error) {
    console.error('Error in copyMacrocycleAsTemplateAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// MACROCYCLE ASSIGNMENT ACTIONS
// ============================================================================

/**
 * Get the count of active assignments (workout_logs) linked to a macrocycle.
 * Uses a single query with nested !inner joins to avoid waterfall queries.
 * Only counts workout_logs with session_status IN ('assigned', 'ongoing').
 */
export async function getAssignmentCountForMacrocycle(
  macrocycleId: number
): Promise<ActionState<{ count: number; athleteNames: string[] }>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership
    const { data: macrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .select('id')
      .eq('id', macrocycleId)
      .eq('user_id', dbUserId)
      .single()

    if (macroError || !macrocycle) {
      return { isSuccess: false, message: "Macrocycle not found" }
    }

    // Single query: get all session_plan IDs via nested inner joins
    const { data: sessionPlans, error: spError } = await supabase
      .from('session_plans')
      .select('id, microcycles!inner(mesocycles!inner(macrocycle_id))')
      .eq('microcycles.mesocycles.macrocycle_id', macrocycleId)

    if (spError) {
      console.error('Error fetching session plans for assignment count:', spError)
      return { isSuccess: false, message: `Failed to fetch assignments: ${spError.message}` }
    }

    if (!sessionPlans || sessionPlans.length === 0) {
      return { isSuccess: true, message: "No assignments found", data: { count: 0, athleteNames: [] } }
    }

    const sessionPlanIds = sessionPlans.map(sp => sp.id)

    // Get workout_logs with active statuses + athlete names in one query
    const { data: workoutLogs, error: wlError } = await supabase
      .from('workout_logs')
      .select('athlete_id, athletes!inner(user_id, users!inner(first_name, last_name))')
      .in('session_plan_id', sessionPlanIds)
      .in('session_status', ['assigned', 'ongoing'])

    if (wlError) {
      console.error('Error fetching workout logs for assignment count:', wlError)
      return { isSuccess: false, message: `Failed to fetch assignments: ${wlError.message}` }
    }

    if (!workoutLogs || workoutLogs.length === 0) {
      return { isSuccess: true, message: "No assignments found", data: { count: 0, athleteNames: [] } }
    }

    // Deduplicate athletes
    const seen = new Set<number>()
    const athleteNames: string[] = []
    for (const wl of workoutLogs) {
      if (wl.athlete_id && !seen.has(wl.athlete_id)) {
        seen.add(wl.athlete_id)
        const athlete = wl.athletes as unknown as { user_id: number; users: { first_name: string | null; last_name: string | null } }
        if (athlete?.users) {
          athleteNames.push(
            [athlete.users.first_name, athlete.users.last_name].filter(Boolean).join(' ') || 'Unknown'
          )
        }
      }
    }

    return {
      isSuccess: true,
      message: "Assignment count retrieved",
      data: { count: seen.size, athleteNames }
    }
  } catch (error) {
    console.error('Error in getAssignmentCountForMacrocycle:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Bulk cancel all 'assigned' workout_logs linked to a macrocycle.
 * Uses nested !inner joins to collect session_plan IDs in a single query.
 * Only cancels workout_logs with session_status = 'assigned' (NOT ongoing or completed).
 * Reports actual rows affected from the update operation.
 */
export async function bulkCancelAssignmentsForMacrocycle(
  macrocycleId: number
): Promise<ActionState<{ cancelled: number }>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership
    const { data: macrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .select('id')
      .eq('id', macrocycleId)
      .eq('user_id', dbUserId)
      .single()

    if (macroError || !macrocycle) {
      return { isSuccess: false, message: "Macrocycle not found" }
    }

    // Single query: get all session_plan IDs via nested inner joins
    const { data: sessionPlans, error: spError } = await supabase
      .from('session_plans')
      .select('id, microcycles!inner(mesocycles!inner(macrocycle_id))')
      .eq('microcycles.mesocycles.macrocycle_id', macrocycleId)

    if (spError) {
      console.error('Error fetching session plans for bulk cancel:', spError)
      return { isSuccess: false, message: `Failed to cancel assignments: ${spError.message}` }
    }

    if (!sessionPlans || sessionPlans.length === 0) {
      return { isSuccess: true, message: "No assignments to cancel", data: { cancelled: 0 } }
    }

    const sessionPlanIds = sessionPlans.map(sp => sp.id)

    // Update all 'assigned' workout_logs to 'cancelled' and return actual count
    const { data: updated, error: updateError } = await supabase
      .from('workout_logs')
      .update({ session_status: 'cancelled' })
      .in('session_plan_id', sessionPlanIds)
      .eq('session_status', 'assigned')
      .select('id')

    if (updateError) {
      console.error('Error cancelling workout logs:', updateError)
      return { isSuccess: false, message: `Failed to cancel assignments: ${updateError.message}` }
    }

    const cancelCount = updated?.length ?? 0

    return {
      isSuccess: true,
      message: cancelCount > 0 ? `${cancelCount} assignment(s) cancelled` : "No assigned workouts to cancel",
      data: { cancelled: cancelCount }
    }
  } catch (error) {
    console.error('Error in bulkCancelAssignmentsForMacrocycle:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// INDIVIDUAL USER ACTIONS (Training Blocks)
// ============================================================================

/**
 * Get all mesocycles (Training Blocks) for an individual user
 * Individual users don't use macrocycles - they work directly with mesocycles
 * Filters to only return mesocycles where athlete_group_id is NULL (personal blocks)
 */
export async function getUserMesocyclesAction(): Promise<ActionState<MesocycleWithDetails[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const { data: mesocycles, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        microcycles (
          *,
          session_plans (
            id,
            name,
            description,
            day,
            week,
            session_mode,
            session_plan_exercises (
              id,
              exercise_id
            )
          )
        )
      `)
      .eq('user_id', dbUserId)
      .is('macrocycle_id', null)  // Individual's personal blocks only (no parent macrocycle)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('[getUserMesocyclesAction] DB error:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch training blocks"
      }
    }

    return {
      isSuccess: true,
      message: "Training blocks fetched successfully",
      data: (mesocycles || []) as unknown as MesocycleWithDetails[]
    }
  } catch (error) {
    console.error('[getUserMesocyclesAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch training blocks"
    }
  }
}

/**
 * Get the currently active mesocycle (Training Block) for an individual user
 * Returns the block where current date is between start_date and end_date
 */
export async function getActiveMesocycleForUserAction(): Promise<ActionState<MesocycleWithDetails | null>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)
    const today = new Date().toISOString().split('T')[0]

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        microcycles (
          *,
          session_plans (
            id,
            name,
            description,
            day,
            week,
            session_mode,
            session_plan_exercises (
              id,
              exercise_id,
              exercise_order,
              exercise:exercises (
                id,
                name
              ),
              session_plan_sets (
                id,
                set_index,
                reps,
                weight,
                performing_time,
                rest_time,
                metadata
              )
            )
          )
        )
      `)
      .eq('user_id', dbUserId)
      .is('macrocycle_id', null)  // Individual's personal blocks only
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('[getActiveMesocycleForUserAction] DB error:', JSON.stringify(error, null, 2))
      return {
        isSuccess: false,
        message: "Failed to fetch active training block"
      }
    }

    return {
      isSuccess: true,
      message: mesocycle ? "Active training block found" : "No active training block",
      data: mesocycle as unknown as MesocycleWithDetails | null
    }
  } catch (error) {
    console.error('[getActiveMesocycleForUserAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch active training block"
    }
  }
}

/**
 * Check if individual user already has an active training block
 * Used to enforce one-active-block limit for individuals
 */
export async function hasActiveTrainingBlockAction(): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)
    const today = new Date().toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('mesocycles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', dbUserId)
      .lte('start_date', today)
      .gte('end_date', today)

    if (error) {
      console.error('[hasActiveTrainingBlockAction] DB error:', error)
      return {
        isSuccess: false,
        message: "Failed to check for active training block"
      }
    }

    return {
      isSuccess: true,
      message: (count ?? 0) > 0 ? "Active training block exists" : "No active training block",
      data: (count ?? 0) > 0
    }
  } catch (error) {
    console.error('[hasActiveTrainingBlockAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to check for active training block"
    }
  }
}

/**
 * Quick create a training block for individual users
 * Creates mesocycle + microcycles (weeks) + session_plans (workouts)
 * Simplified flow from QuickStartWizard
 */
export interface QuickTrainingBlockInput {
  name: string
  startDate: string  // ISO date string
  endDate: string    // ISO date string
  focus: 'strength' | 'endurance' | 'general'
  trainingDays: number[]  // Array of day numbers (0=Sun, 1=Mon, etc.)
  equipment?: string[]  // Equipment categories (bodyweight, dumbbells, etc.)
  notes?: string  // User-provided training context/guidelines for AI
}

export async function createQuickTrainingBlockAction(
  input: QuickTrainingBlockInput
): Promise<ActionState<Mesocycle>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // P0 Fix: Enforce one-block limit (FR-007)
    const activeCheck = await hasActiveTrainingBlockAction()
    if (activeCheck.isSuccess && activeCheck.data === true) {
      return {
        isSuccess: false,
        message: "You already have an active training block. Complete or delete it before creating a new one."
      }
    }

    // 1. Create the mesocycle (Training Block)
    // Note: mesocycles don't have athlete_group_id - that's on macrocycles
    // Individual users create standalone mesocycles without parent macrocycle
    const mesocycleData: MesocycleInsert = {
      name: input.name,
      description: `${input.focus.charAt(0).toUpperCase() + input.focus.slice(1)} focused training block`,
      start_date: input.startDate,
      end_date: input.endDate,
      macrocycle_id: null,  // Individual users don't use macrocycles
      user_id: dbUserId,
      notes: input.notes || null,  // User-provided context/guidelines for AI
      // Validate and sanitize metadata before storing
      metadata: createMesocycleMetadata({
        focus: input.focus,
        equipment: input.equipment as EquipmentCategory[] | undefined,
        createdVia: 'quick-start'
      }) as unknown as Record<string, Json>
    }

    const { data: mesocycle, error: mesoError } = await supabase
      .from('mesocycles')
      .insert(mesocycleData)
      .select()
      .single()

    if (mesoError) {
      console.error('[createQuickTrainingBlockAction] Mesocycle error:', mesoError)
      return {
        isSuccess: false,
        message: "Failed to create training block"
      }
    }

    // 2. Calculate number of weeks
    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const numWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerWeek)

    // 3. Create microcycles (weeks)
    const microcycleInserts: MicrocycleInsert[] = []
    for (let week = 0; week < numWeeks; week++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (week * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      microcycleInserts.push({
        name: `Week ${week + 1}`,
        description: null,
        start_date: weekStart.toISOString().split('T')[0],
        end_date: weekEnd.toISOString().split('T')[0],
        mesocycle_id: mesocycle.id,
        user_id: dbUserId
      })
    }

    const { data: microcycles, error: microError } = await supabase
      .from('microcycles')
      .insert(microcycleInserts)
      .select()

    if (microError) {
      console.error('[createQuickTrainingBlockAction] Microcycle error:', microError)
      // P2 Fix: Rollback with error handling
      const { error: rollbackError } = await supabase.from('mesocycles').delete().eq('id', mesocycle.id)
      if (rollbackError) {
        console.error('[createQuickTrainingBlockAction] Rollback failed:', rollbackError)
      }
      return {
        isSuccess: false,
        message: "Failed to create training weeks"
      }
    }

    // 4. Create session_plans (workouts) for each training day in each week
    const sessionPlanInserts: SessionPlanInsert[] = []
    const workoutNames = ['Workout A', 'Workout B', 'Workout C', 'Workout D', 'Workout E', 'Workout F', 'Workout G']
    // P0 Fix: Don't mutate original array - create sorted copy
    const sortedTrainingDays = [...input.trainingDays].sort((a, b) => a - b)

    for (const microcycle of microcycles || []) {
      let workoutIndex = 0
      for (const dayNum of sortedTrainingDays) {
        sessionPlanInserts.push({
          name: workoutNames[workoutIndex % workoutNames.length],
          description: null,
          day: dayNum,
          week: microcycles.indexOf(microcycle) + 1,
          microcycle_id: microcycle.id,
          user_id: dbUserId,
          session_mode: 'individual',
          is_template: false,
          deleted: false
        })
        workoutIndex++
      }
    }

    if (sessionPlanInserts.length > 0) {
      const { error: sessionError } = await supabase
        .from('session_plans')
        .insert(sessionPlanInserts)

      if (sessionError) {
        console.error('[createQuickTrainingBlockAction] Session plans error:', sessionError)
        // P2 Fix: Rollback with error handling - delete microcycles and mesocycle
        const { error: microRollbackError } = await supabase.from('microcycles').delete().eq('mesocycle_id', mesocycle.id)
        if (microRollbackError) {
          console.error('[createQuickTrainingBlockAction] Microcycle rollback failed:', microRollbackError)
        }
        const { error: mesoRollbackError } = await supabase.from('mesocycles').delete().eq('id', mesocycle.id)
        if (mesoRollbackError) {
          console.error('[createQuickTrainingBlockAction] Mesocycle rollback failed:', mesoRollbackError)
        }
        return {
          isSuccess: false,
          message: "Failed to create workouts"
        }
      }
    }

    // P0 Fix: Revalidate cache after successful creation
    revalidatePath('/plans')

    return {
      isSuccess: true,
      message: "Training block created successfully",
      data: mesocycle
    }
  } catch (error) {
    console.error('[createQuickTrainingBlockAction]:', error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to create training block"
    }
  }
}

// ============================================================================
// ATHLETE PROGRAM VIEW
// ============================================================================

interface AthleteSessionView {
  id: string | number
  name: string | null
  day: number | null
  week: number | null
  status: 'completed' | 'assigned' | 'ongoing' | 'upcoming'
}

interface AthleteAssignedPlan {
  planName: string
  currentWeek: number
  totalWeeks: number
  sessions: AthleteSessionView[]
}

/**
 * Get the plan assigned to the current athlete via their athlete_group_id.
 * Returns current + next week's sessions with completion status from workout_logs.
 */
export async function getAthleteAssignedPlanAction(): Promise<ActionState<AthleteAssignedPlan | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // 1. Get athlete record with group assignment
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, athlete_group_id')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    if (!athlete.athlete_group_id) {
      return { isSuccess: true, message: "No group assigned", data: null }
    }

    // 2. Get the most recent macrocycle assigned to this group
    const { data: macrocycle, error: macroError } = await supabase
      .from('macrocycles')
      .select(`
        id,
        name,
        mesocycles (
          id,
          name,
          start_date,
          end_date,
          microcycles (
            id,
            name,
            start_date,
            end_date,
            session_plans (
              id,
              name,
              day,
              week
            )
          )
        )
      `)
      .eq('athlete_group_id', athlete.athlete_group_id)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (macroError) {
      console.error('[getAthleteAssignedPlanAction] Macrocycle error:', macroError)
      return { isSuccess: false, message: "Failed to fetch assigned plan" }
    }

    if (!macrocycle) {
      return { isSuccess: true, message: "No plan assigned to your group", data: null }
    }

    // 3. Flatten all session plan IDs and determine current week
    const today = new Date().toISOString().split('T')[0]
    const allMicrocycles = (macrocycle.mesocycles ?? [])
      .flatMap(meso => meso.microcycles ?? [])
      .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))

    const totalWeeks = allMicrocycles.length

    // Find the current week index (0-based) by checking which microcycle contains today
    let currentWeekIndex = 0
    for (let i = 0; i < allMicrocycles.length; i++) {
      const micro = allMicrocycles[i]
      if (micro.start_date && micro.end_date) {
        if (today >= micro.start_date && today <= micro.end_date) {
          currentWeekIndex = i
          break
        }
        // If today is past this microcycle, advance
        if (today > micro.end_date) {
          currentWeekIndex = i + 1
        }
      }
    }
    // Clamp to valid range
    currentWeekIndex = Math.min(currentWeekIndex, totalWeeks - 1)
    currentWeekIndex = Math.max(currentWeekIndex, 0)

    // 4. Get sessions for current + next week
    const relevantMicrocycles = allMicrocycles.slice(
      currentWeekIndex,
      Math.min(currentWeekIndex + 2, totalWeeks)
    )

    const relevantSessions = relevantMicrocycles.flatMap(micro =>
      (micro.session_plans ?? []).map(sp => ({
        ...sp,
        microIndex: allMicrocycles.indexOf(micro)
      }))
    )

    const sessionPlanIds = relevantSessions.map(sp => sp.id)

    // 5. Query workout_logs for this athlete to get completion status
    let logsBySessionPlanId: Record<string, string> = {}
    if (sessionPlanIds.length > 0) {
      const { data: logs, error: logError } = await supabase
        .from('workout_logs')
        .select('session_plan_id, session_status')
        .eq('athlete_id', athlete.id)
        .in('session_plan_id', sessionPlanIds)

      if (logError) {
        console.error('[getAthleteAssignedPlanAction] Workout log error:', logError)
        // Non-fatal — we can still show sessions without status
      }

      if (logs) {
        for (const log of logs) {
          if (log.session_plan_id) {
            logsBySessionPlanId[log.session_plan_id] = log.session_status
          }
        }
      }
    }

    // 6. Build the response
    const sessions: AthleteSessionView[] = relevantSessions.map(sp => {
      const logStatus = logsBySessionPlanId[sp.id]
      let status: AthleteSessionView['status']
      if (logStatus === 'completed') {
        status = 'completed'
      } else if (logStatus === 'ongoing') {
        status = 'ongoing'
      } else if (logStatus === 'assigned') {
        status = 'assigned'
      } else {
        // No workout_log → session is upcoming (not yet assigned/started)
        status = 'upcoming'
      }

      return {
        id: sp.id,
        name: sp.name,
        day: sp.day,
        week: sp.microIndex + 1, // 1-based week number
        status,
      }
    })

    return {
      isSuccess: true,
      message: "Assigned plan retrieved",
      data: {
        planName: macrocycle.name || 'Training Plan',
        currentWeek: currentWeekIndex + 1, // 1-based
        totalWeeks,
        sessions,
      }
    }
  } catch (error) {
    console.error('[getAthleteAssignedPlanAction]:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 