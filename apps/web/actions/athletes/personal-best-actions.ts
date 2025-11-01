"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/api"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]
type PersonalBestInsert = Database["public"]["Tables"]["athlete_personal_bests"]["Insert"]
type PersonalBestUpdate = Database["public"]["Tables"]["athlete_personal_bests"]["Update"]

/**
 * Get all personal bests for an athlete
 */
export async function getAthletePBsAction(
  athleteId: number
): Promise<ActionState<PersonalBest[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .select(`
        *,
        athlete:athletes(
          id,
          user:users(first_name, last_name)
        ),
        exercise:exercises(
          id,
          name,
          description
        )
      `)
      .eq("athlete_id", athleteId)
      .order("achieved_date", { ascending: false })

    if (error) {
      console.error("[getAthletePBsAction] DB error:", error)
      return { isSuccess: false, message: "Failed to fetch personal bests" }
    }

    return {
      isSuccess: true,
      message: "Personal bests retrieved successfully",
      data: data || [],
    }
  } catch (error) {
    console.error("[getAthletePBsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get a specific personal best for an athlete-exercise combination
 */
export async function getSpecificPBAction(
  athleteId: number,
  exerciseId: number
): Promise<ActionState<PersonalBest | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .select(`
        *,
        athlete:athletes(
          id,
          user:users(first_name, last_name)
        ),
        exercise:exercises(
          id,
          name,
          description
        )
      `)
      .eq("athlete_id", athleteId)
      .eq("exercise_id", exerciseId)
      .maybeSingle()

    if (error) {
      console.error("[getSpecificPBAction] DB error:", error)
      return { isSuccess: false, message: "Failed to fetch personal best" }
    }

    return {
      isSuccess: true,
      message: data ? "Personal best found" : "No personal best found",
      data: data || null,
    }
  } catch (error) {
    console.error("[getSpecificPBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Create a new personal best
 */
export async function createPBAction(
  pbData: Omit<PersonalBestInsert, "id" | "created_at" | "updated_at">
): Promise<ActionState<PersonalBest>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Validate the user has permission to create PB for this athlete
    // RLS policies will enforce this, but we check here for better error messages
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id, user_id")
      .eq("id", pbData.athlete_id)
      .single()

    if (athleteError || !athlete) {
      console.error("[createPBAction] Athlete not found:", athleteError)
      return { isSuccess: false, message: "Athlete not found" }
    }

    // Check if user is the athlete or a coach of the athlete
    const isOwnAthlete = athlete.user_id === dbUserId
    if (!isOwnAthlete) {
      // RLS policies will handle authorization for coaches
      // We'll let the insert attempt fail if user doesn't have permission
      // This simplifies the code and relies on our RLS policies
    }

    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .insert(pbData)
      .select()
      .single()

    if (error) {
      console.error("[createPBAction] DB error:", error)
      // Handle unique constraint violation (23505 = unique_violation)
      if (error.code === "23505") {
        return {
          isSuccess: false,
          message: "A personal best already exists for this athlete and exercise/event",
        }
      }
      return { isSuccess: false, message: "Failed to create personal best" }
    }

    revalidatePath("/athletes")
    revalidatePath(`/athletes/${pbData.athlete_id}`)
    revalidatePath("/workout")

    return {
      isSuccess: true,
      message: "Personal best created successfully",
      data,
    }
  } catch (error) {
    console.error("[createPBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Update an existing personal best
 */
export async function updatePBAction(
  id: number,
  updates: PersonalBestUpdate
): Promise<ActionState<PersonalBest>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // RLS will handle authorization, but we fetch first to ensure it exists
    const { data: existing, error: fetchError } = await supabase
      .from("athlete_personal_bests")
      .select("id, athlete_id")
      .eq("id", id)
      .single()

    if (fetchError || !existing) {
      console.error("[updatePBAction] PB not found:", fetchError)
      return { isSuccess: false, message: "Personal best not found" }
    }

    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[updatePBAction] DB error:", error)
      return { isSuccess: false, message: "Failed to update personal best" }
    }

    revalidatePath("/athletes")
    revalidatePath(`/athletes/${existing.athlete_id}`)
    revalidatePath("/workout")

    return {
      isSuccess: true,
      message: "Personal best updated successfully",
      data,
    }
  } catch (error) {
    console.error("[updatePBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Delete a personal best (coaches and athletes can delete their own PBs, enforced by RLS)
 */
export async function deletePBAction(id: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Fetch the PB to get athlete_id for revalidation
    const { data: pb, error: fetchError } = await supabase
      .from("athlete_personal_bests")
      .select("id, athlete_id")
      .eq("id", id)
      .single()

    if (fetchError || !pb) {
      console.error("[deletePBAction] PB not found:", fetchError)
      return { isSuccess: false, message: "Personal best not found" }
    }

    const { error } = await supabase
      .from("athlete_personal_bests")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[deletePBAction] DB error:", error)
      return { isSuccess: false, message: "Failed to delete personal best" }
    }

    revalidatePath("/athletes")
    revalidatePath(`/athletes/${pb.athlete_id}`)
    revalidatePath("/workout")

    return {
      isSuccess: true,
      message: "Personal best deleted successfully",
      data: undefined,
    }
  } catch (error) {
    console.error("[deletePBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Auto-detect and update personal best from session data
 * Called when a session is completed
 * @param timeSeconds - Time in seconds (e.g., 12.63 for 12.63s)
 */
export async function autoDetectPBAction(
  sessionId: number,
  athleteId: number,
  exerciseId: number,
  timeSeconds: number
): Promise<ActionState<PersonalBest | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get existing PB for this athlete-exercise combination
    const existingPBResult = await getSpecificPBAction(athleteId, exerciseId)

    if (!existingPBResult.isSuccess) {
      return existingPBResult
    }

    const existingPB = existingPBResult.data

    // If no existing PB or new time is better (lower), create/update PB
    if (!existingPB || timeSeconds < existingPB.value) {
      if (!existingPB) {
        // Create new PB
        return await createPBAction({
          athlete_id: athleteId,
          exercise_id: exerciseId,
          value: timeSeconds,
          unit_id: 5, // seconds (from units table)
          achieved_date: new Date().toISOString().split("T")[0],
          session_id: sessionId,
          verified: false, // Auto-detected PBs start unverified
          notes: "Auto-detected from session",
        })
      } else {
        // Update existing PB
        return await updatePBAction(existingPB.id, {
          value: timeSeconds,
          achieved_date: new Date().toISOString().split("T")[0],
          session_id: sessionId,
          verified: false, // Reset verification when auto-updated
          notes: `Auto-detected from session (previous: ${existingPB.value}s)`,
        })
      }
    }

    // No new PB, return null
    return {
      isSuccess: true,
      message: "No new personal best",
      data: null,
    }
  } catch (error) {
    console.error("[autoDetectPBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get all personal bests for the current authenticated user (athlete)
 */
export async function getMyPersonalBestsAction(): Promise<ActionState<PersonalBest[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID for current user
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .maybeSingle()

    if (!athlete) {
      return {
        isSuccess: true,
        message: "No athlete profile found",
        data: []
      }
    }

    // Use existing function to get PBs
    return getAthletePBsAction(athlete.id)
  } catch (error) {
    console.error("[getMyPersonalBestsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
