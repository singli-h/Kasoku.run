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
import {
  Macrocycle, MacrocycleInsert, MacrocycleUpdate,
  Mesocycle, MesocycleInsert, MesocycleUpdate,
  Microcycle, MicrocycleInsert, MicrocycleUpdate,
  MacrocycleWithDetails, MesocycleWithDetails, MicrocycleWithDetails,
  CreateMacrocycleForm, CreateMesocycleForm, CreateMicrocycleForm,
  SessionPlanInsert
} from "@/types/training"

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

    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        mesocycles!inner(
          *,
          microcycles!inner(
            *,
            session_plans(
              *,
              session_plan_exercises(
                *,
                exercise:exercises(*)
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
              exercises(*),
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
              exercises(*),
              session_plan_sets(*)
            )
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

    // Check if mesocycle has any microcycles
    const { data: microcycles, error: checkError } = await supabase
      .from('microcycles')
      .select('id')
      .eq('mesocycle_id', id)
      .limit(1)

    if (checkError) {
      console.error('Error checking for dependent microcycles:', checkError)
      return {
        isSuccess: false,
        message: `Failed to check dependencies: ${checkError.message}`
      }
    }

    if (microcycles && microcycles.length > 0) {
      return {
        isSuccess: false,
        message: "Cannot delete mesocycle that contains microcycles. Please delete the microcycles first."
      }
    }

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
            exercises(*),
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
              exercises (
                id,
                name
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
      console.error('[getActiveMesocycleForUserAction] DB error:', error)
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
      .is('athlete_group_id', null)
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
      metadata: { focus: input.focus, createdVia: 'quick-start' }
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