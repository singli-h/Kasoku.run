/*
<ai_context>
Server actions for race/event management within training macrocycles.
Handles race CRUD operations with proper authentication and RLS enforcement.
Follows the established action pattern with ActionState return types.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import { Database } from "@/types/database"
import { RaceSchema, type RaceFormData } from "@/lib/validation/training-schemas"
import { ZodError } from "zod"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Race = Database['public']['Tables']['races']['Row']
export type RaceInsert = Database['public']['Tables']['races']['Insert']
export type RaceUpdate = Database['public']['Tables']['races']['Update']

export interface CreateRaceForm {
  name: string
  type: string
  date: string
  location?: string
  notes?: string
  macrocycle_id?: number
}

export interface UpdateRaceForm {
  name?: string
  type?: string
  date?: string
  location?: string
  notes?: string
  macrocycle_id?: number
}

// ============================================================================
// RACE CRUD ACTIONS
// ============================================================================

/**
 * Get all races for a specific macrocycle
 * Sorted by date ascending (earliest first)
 */
export async function getRacesByMacrocycleAction(
  macrocycleId: number
): Promise<ActionState<Race[]>> {
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

    // Performance monitoring
    const startTime = Date.now()

    const { data: races, error } = await supabase
      .from('races')
      .select('id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at')
      .eq('macrocycle_id', macrocycleId)
      .eq('user_id', dbUserId)
      .order('date', { ascending: true })

    const queryTime = Date.now() - startTime
    if (queryTime > 500) {
      console.warn(`[PERFORMANCE] getRacesByMacrocycleAction took ${queryTime}ms`)
    }

    if (error) {
      console.error('Error fetching races:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch races: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Races retrieved successfully",
      data: races || []
    }
  } catch (error) {
    console.error('Error in getRacesByMacrocycleAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get all races for the current user (across all macrocycles)
 */
export async function getRacesAction(): Promise<ActionState<Race[]>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const startTime = Date.now()

    const { data: races, error } = await supabase
      .from('races')
      .select('id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at')
      .eq('user_id', dbUserId)
      .order('date', { ascending: true })
      .limit(100) // Add pagination limit

    const queryTime = Date.now() - startTime
    if (queryTime > 500) {
      console.warn(`[PERFORMANCE] getRacesAction took ${queryTime}ms`)
    }

    if (error) {
      console.error('Error fetching races:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch races: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Races retrieved successfully",
      data: races || []
    }
  } catch (error) {
    console.error('Error in getRacesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get a single race by ID
 */
export async function getRaceByIdAction(
  id: number
): Promise<ActionState<Race>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    const { data: race, error } = await supabase
      .from('races')
      .select('id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', dbUserId)
      .single()

    if (error) {
      console.error('Error fetching race:', error)
      return {
        isSuccess: false,
        message: error.code === 'PGRST116'
          ? 'Race not found'
          : `Failed to fetch race: ${error.message}`
      }
    }

    if (!race) {
      return {
        isSuccess: false,
        message: "Race not found"
      }
    }

    return {
      isSuccess: true,
      message: "Race retrieved successfully",
      data: race
    }
  } catch (error) {
    console.error('Error in getRaceByIdAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Create a new race
 */
export async function createRaceAction(
  formData: CreateRaceForm
): Promise<ActionState<Race>> {
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

    // Validate input with Zod schema
    const validationResult = RaceSchema.safeParse(formData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        isSuccess: false,
        message: firstError.message
      }
    }

    const validatedData = validationResult.data

    const raceData: RaceInsert = {
      name: validatedData.name,
      type: validatedData.type,
      date: validatedData.date,
      location: validatedData.location || null,
      notes: validatedData.notes || null,
      macrocycle_id: validatedData.macrocycle_id || null,
      user_id: dbUserId
    }

    const startTime = Date.now()

    const { data: race, error } = await supabase
      .from('races')
      .insert(raceData)
      .select()
      .single()

    const queryTime = Date.now() - startTime
    if (queryTime > 500) {
      console.warn(`[PERFORMANCE] createRaceAction took ${queryTime}ms`)
    }

    if (error) {
      console.error('Error creating race:', error)
      return {
        isSuccess: false,
        message: `Failed to create race: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Race created successfully",
      data: race
    }
  } catch (error) {
    console.error('Error in createRaceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Update an existing race
 */
export async function updateRaceAction(
  id: number,
  formData: UpdateRaceForm
): Promise<ActionState<Race>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Validate partial update data (all fields optional)
    const validationResult = RaceSchema.partial().safeParse(formData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        isSuccess: false,
        message: firstError.message
      }
    }

    const validatedData = validationResult.data

    const updateData: RaceUpdate = {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.type !== undefined && { type: validatedData.type }),
      ...(validatedData.date !== undefined && { date: validatedData.date }),
      ...(validatedData.location !== undefined && { location: validatedData.location || null }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
      ...(validatedData.macrocycle_id !== undefined && { macrocycle_id: validatedData.macrocycle_id || null }),
      updated_at: new Date().toISOString()
    }

    // Ownership check via the update itself (no pre-fetch needed)
    const { data: race, error } = await supabase
      .from('races')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating race:', error)
      return {
        isSuccess: false,
        message: `Failed to update race: ${error.message}`
      }
    }

    if (!race) {
      return {
        isSuccess: false,
        message: "Race not found or you don't have permission to update it"
      }
    }

    return {
      isSuccess: true,
      message: "Race updated successfully",
      data: race
    }
  } catch (error) {
    console.error('Error in updateRaceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Delete a race
 */
export async function deleteRaceAction(
  id: number
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Ownership check via the delete itself (no pre-fetch needed)
    const { data: deleted, error } = await supabase
      .from('races')
      .delete()
      .eq('id', id)
      .eq('user_id', dbUserId)
      .select('id')
      .maybeSingle()

    if (!deleted && !error) {
      return {
        isSuccess: false,
        message: "Race not found or you don't have permission to delete it"
      }
    }

    if (error) {
      console.error('Error deleting race:', error)
      return {
        isSuccess: false,
        message: `Failed to delete race: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Race deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteRaceAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get upcoming races (future dates) for the current user
 */
export async function getUpcomingRacesAction(): Promise<ActionState<Race[]>> {
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

    const { data: races, error } = await supabase
      .from('races')
      .select('id, macrocycle_id, user_id, name, date, type, location, notes, created_at, updated_at')
      .eq('user_id', dbUserId)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(10) // Limit upcoming races to 10

    if (error) {
      console.error('Error fetching upcoming races:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch upcoming races: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Upcoming races retrieved successfully",
      data: races || []
    }
  } catch (error) {
    console.error('Error in getUpcomingRacesAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
