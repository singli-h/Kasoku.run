/*
<ai_context>
Granular CRUD server actions for session_plan_sets.
Used by IndividualPlanPage for inline set editing (update field values,
add/remove sets per exercise). Ownership is verified by joining through
session_plan_exercises -> session_plans -> user_id.

Effort conversion: UI uses 0-100, DB stores 0-1.
Field name conversion: camelCase (UI) -> snake_case (DB).
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

type SessionPlanSetRow = Database['public']['Tables']['session_plan_sets']['Row']

// Mapping from camelCase UI field names to snake_case DB column names
const FIELD_NAME_MAP: Record<string, string> = {
  performingTime: 'performing_time',
  restTime: 'rest_time',
  resistanceUnitId: 'resistance_unit_id',
  setIndex: 'set_index',
}

/**
 * Convert UI field names (camelCase) to DB column names (snake_case)
 * and handle effort conversion (0-100 -> 0-1)
 */
function normalizeUpdates(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(raw)) {
    const dbKey = FIELD_NAME_MAP[key] ?? key
    if (dbKey === 'effort' && value != null) {
      normalized[dbKey] = (value as number) / 100
    } else {
      normalized[dbKey] = value
    }
  }

  return normalized
}

/**
 * Verify a session_plan_set belongs to the authenticated user.
 * Joins through session_plan_exercises -> session_plans -> user_id.
 * Returns true if owned, false otherwise.
 */
async function verifySetOwnership(setId: string, dbUserId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('session_plan_sets')
    .select('id, session_plan_exercises!inner(id, session_plans!inner(user_id))')
    .eq('id', setId)
    .single()

  if (error || !data) return false

  const exercise = data.session_plan_exercises as unknown as {
    session_plans: { user_id: number | null }
  }
  return exercise.session_plans.user_id === dbUserId
}

/**
 * Verify a session_plan_exercise belongs to the authenticated user.
 * Joins through session_plan_exercises -> session_plans -> user_id.
 * Returns true if owned, false otherwise.
 */
async function verifyExerciseOwnership(exerciseId: string, dbUserId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('session_plan_exercises')
    .select('id, session_plans!inner(user_id)')
    .eq('id', exerciseId)
    .single()

  if (error || !data) return false

  const plan = data.session_plans as unknown as { user_id: number | null }
  return plan.user_id === dbUserId
}

// ============================================================================
// UPDATE SET
// ============================================================================

/**
 * Update a single session_plan_set by ID.
 * Handles camelCase -> snake_case field name conversion and effort 0-100 -> 0-1.
 */
export async function updateSessionPlanSetAction(
  setId: string,
  updates: Record<string, unknown>
): Promise<ActionState<SessionPlanSetRow>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership
    const isOwner = await verifySetOwnership(setId, dbUserId)
    if (!isOwner) {
      return { isSuccess: false, message: "Set not found or access denied" }
    }

    const dbUpdates = normalizeUpdates(updates)

    const { data: updatedSet, error } = await supabase
      .from('session_plan_sets')
      .update(dbUpdates)
      .eq('id', setId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session plan set:', error)
      return {
        isSuccess: false,
        message: `Failed to update set: ${error.message}`
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Set updated successfully",
      data: updatedSet
    }
  } catch (error) {
    console.error('Error in updateSessionPlanSetAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// DELETE SET
// ============================================================================

/**
 * Delete a single session_plan_set by ID.
 */
export async function deleteSessionPlanSetAction(
  setId: string
): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership
    const isOwner = await verifySetOwnership(setId, dbUserId)
    if (!isOwner) {
      return { isSuccess: false, message: "Set not found or access denied" }
    }

    const { error } = await supabase
      .from('session_plan_sets')
      .delete()
      .eq('id', setId)

    if (error) {
      console.error('Error deleting session plan set:', error)
      return {
        isSuccess: false,
        message: `Failed to delete set: ${error.message}`
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Set deleted successfully",
      data: true
    }
  } catch (error) {
    console.error('Error in deleteSessionPlanSetAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// ============================================================================
// ADD SET
// ============================================================================

/**
 * Add a new session_plan_set to an exercise.
 * Automatically assigns set_index = max existing + 1.
 * Handles camelCase -> snake_case and effort conversion like update.
 */
export async function addSessionPlanSetAction(
  sessionPlanExerciseId: string,
  setData?: Record<string, unknown>
): Promise<ActionState<SessionPlanSetRow>> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify the exercise belongs to the user
    const isOwner = await verifyExerciseOwnership(sessionPlanExerciseId, dbUserId)
    if (!isOwner) {
      return { isSuccess: false, message: "Exercise not found or access denied" }
    }

    // Get current max set_index for this exercise
    const { data: existingSets, error: fetchError } = await supabase
      .from('session_plan_sets')
      .select('set_index')
      .eq('session_plan_exercise_id', sessionPlanExerciseId)
      .order('set_index', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing sets:', fetchError)
      return {
        isSuccess: false,
        message: `Failed to determine set index: ${fetchError.message}`
      }
    }

    const maxIndex = existingSets && existingSets.length > 0
      ? (existingSets[0].set_index ?? 0)
      : 0
    const newSetIndex = maxIndex + 1

    // Build insert data
    const normalizedData = setData ? normalizeUpdates(setData) : {}

    const insertData = {
      session_plan_exercise_id: sessionPlanExerciseId,
      set_index: newSetIndex,
      ...normalizedData,
    }

    const { data: newSet, error } = await supabase
      .from('session_plan_sets')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error adding session plan set:', error)
      return {
        isSuccess: false,
        message: `Failed to add set: ${error.message}`
      }
    }

    revalidatePath('/plans/[id]', 'page')

    return {
      isSuccess: true,
      message: "Set added successfully",
      data: newSet
    }
  } catch (error) {
    console.error('Error in addSessionPlanSetAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
