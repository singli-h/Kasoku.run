/*
<ai_context>
Server actions for training plan management (macrocycles, mesocycles, microcycles).
Follows the established action pattern with ActionState return types and proper error handling.
Includes hierarchical operations for the periodization model.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Macrocycle, MacrocycleInsert, MacrocycleUpdate,
  Mesocycle, MesocycleInsert, MesocycleUpdate,
  Microcycle, MicrocycleInsert, MicrocycleUpdate,
  MacrocycleWithDetails, MesocycleWithDetails, MicrocycleWithDetails,
  CreateMacrocycleForm, CreateMesocycleForm, CreateMicrocycleForm
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

    const macrocycleData: MacrocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      athlete_group_id: formData.athlete_group_id || null,
      user_id: user.id
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

    const { data: macrocycles, error } = await supabase
      .from('macrocycles')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        mesocycles(
          *,
          microcycles(*)
        )
      `)
      .eq('user_id', user.id)
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

    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .select(`
        *,
        athlete_group:athlete_groups(*),
        mesocycles(
          *,
          microcycles(
            *,
            exercise_preset_groups(*)
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
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

    const { data: macrocycle, error } = await supabase
      .from('macrocycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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

    const { error } = await supabase
      .from('macrocycles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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

    const mesocycleData: MesocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      macrocycle_id: formData.macrocycle_id || null,
      metadata: formData.metadata || null,
      user_id: user.id
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

    const { data: mesocycles, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        macrocycle:macrocycles(*),
        microcycles(*)
      `)
      .eq('macrocycle_id', macrocycleId)
      .eq('user_id', user.id)
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
      data: mesocycles || []
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

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .select(`
        *,
        macrocycle:macrocycles(*),
        microcycles(
          *,
          exercise_preset_groups(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
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

    const { data: mesocycle, error } = await supabase
      .from('mesocycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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
      .eq('user_id', user.id)

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
 */
export async function createMicrocycleAction(
  formData: CreateMicrocycleForm
): Promise<ActionState<Microcycle>> {
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

    const microcycleData: MicrocycleInsert = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      mesocycle_id: formData.mesocycle_id || null,
      user_id: user.id
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

    return {
      isSuccess: true,
      message: "Microcycle created successfully",
      data: microcycle
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

    const { data: microcycles, error } = await supabase
      .from('microcycles')
      .select(`
        *,
        mesocycle:mesocycles(*),
        exercise_preset_groups(*)
      `)
      .eq('mesocycle_id', mesocycleId)
      .eq('user_id', user.id)
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
      data: microcycles || []
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

    const { data: microcycle, error } = await supabase
      .from('microcycles')
      .select(`
        *,
        mesocycle:mesocycles(*),
        exercise_preset_groups(
          *,
          exercise_presets(
            *,
            exercise:exercises(*)
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
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
      data: microcycle
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

    const { data: microcycle, error } = await supabase
      .from('microcycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
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
      data: microcycle
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

    // Check if microcycle has any exercise preset groups
    const { data: presetGroups, error: checkError } = await supabase
      .from('exercise_preset_groups')
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
      .eq('user_id', user.id)

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

    // Get the original macrocycle with all its nested data
    const { data: originalMacrocycle, error: fetchError } = await supabase
      .from('macrocycles')
      .select(`
        *,
        mesocycles(
          *,
          microcycles(
            *,
            exercise_preset_groups(
              *,
              exercise_presets(
                *,
                exercise_preset_details(*)
              )
            )
          )
        )
      `)
      .eq('id', macrocycleId)
      .eq('user_id', user.id)
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
      user_id: user.id
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
    const originalStart = new Date(originalMacrocycle.start_date)
    const newStart = new Date(newStartDate)
    const daysDiff = Math.floor((newStart.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24))

    // Copy mesocycles
    if (originalMacrocycle.mesocycles && originalMacrocycle.mesocycles.length > 0) {
      for (const mesocycle of originalMacrocycle.mesocycles) {
        const mesoStartDate = new Date(mesocycle.start_date)
        mesoStartDate.setDate(mesoStartDate.getDate() + daysDiff)
        
        const mesoEndDate = new Date(mesocycle.end_date)
        mesoEndDate.setDate(mesoEndDate.getDate() + daysDiff)

        const newMesocycleData: MesocycleInsert = {
          name: mesocycle.name,
          description: mesocycle.description,
          start_date: mesoStartDate.toISOString().split('T')[0],
          end_date: mesoEndDate.toISOString().split('T')[0],
          macrocycle_id: newMacrocycle.id,
          user_id: user.id,
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
            const microStartDate = new Date(microcycle.start_date)
            microStartDate.setDate(microStartDate.getDate() + daysDiff)
            
            const microEndDate = new Date(microcycle.end_date)
            microEndDate.setDate(microEndDate.getDate() + daysDiff)

            const newMicrocycleData: MicrocycleInsert = {
              name: microcycle.name,
              description: microcycle.description,
              start_date: microStartDate.toISOString().split('T')[0],
              end_date: microEndDate.toISOString().split('T')[0],
              mesocycle_id: newMesocycle.id,
              user_id: user.id
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
            if (microcycle.exercise_preset_groups && microcycle.exercise_preset_groups.length > 0) {
              for (const presetGroup of microcycle.exercise_preset_groups) {
                const presetDate = new Date(presetGroup.date)
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
                  user_id: user.id
                }

                const { data: newPresetGroup, error: presetError } = await supabase
                  .from('exercise_preset_groups')
                  .insert(newPresetGroupData)
                  .select()
                  .single()

                if (presetError || !newPresetGroup) {
                  console.error('Error copying preset group:', presetError)
                  continue
                }

                // Copy exercise presets and their details
                if (presetGroup.exercise_presets && presetGroup.exercise_presets.length > 0) {
                  for (const preset of presetGroup.exercise_presets) {
                    const newPresetData = {
                      exercise_id: preset.exercise_id,
                      exercise_preset_group_id: newPresetGroup.id,
                      preset_order: preset.preset_order,
                      notes: preset.notes,
                      superset_id: preset.superset_id
                    }

                    const { data: newPreset, error: presetInsertError } = await supabase
                      .from('exercise_presets')
                      .insert(newPresetData)
                      .select()
                      .single()

                    if (presetInsertError || !newPreset) {
                      console.error('Error copying exercise preset:', presetInsertError)
                      continue
                    }

                    // Copy preset details
                    if (preset.exercise_preset_details && preset.exercise_preset_details.length > 0) {
                      const detailsData = preset.exercise_preset_details.map(detail => ({
                        exercise_preset_id: newPreset.id,
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
                        .from('exercise_preset_details')
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