/*
<ai_context>
Server actions for personal record (PR) management during workouts.
Handles fetching existing PRs for exercises in a session and upserting
new PR values entered by athletes during their workout.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/api"
import type { Database } from "@/types/database"

type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]

/**
 * Fetch PRs for a list of exercise IDs for the current athlete.
 * Returns a map of exercise_id -> PersonalBest for quick lookup.
 */
export async function getExercisePRsAction(
  exerciseIds: number[]
): Promise<ActionState<PersonalBest[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID for this user
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    if (exerciseIds.length === 0) {
      return { isSuccess: true, message: "No exercises", data: [] }
    }

    // Fetch all PRs for this athlete + these exercises in one query
    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .select("*")
      .eq("athlete_id", athlete.id)
      .in("exercise_id", exerciseIds)

    if (error) {
      console.error("[getExercisePRsAction] DB error:", error)
      return { isSuccess: false, message: "Failed to fetch PRs" }
    }

    return {
      isSuccess: true,
      message: "PRs retrieved",
      data: data || [],
    }
  } catch (error) {
    console.error("[getExercisePRsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Upsert a PR for the current athlete.
 * If a PR already exists for the athlete+exercise combo (with matching unit_id and null distance for gym),
 * it updates the value. Otherwise it creates a new record.
 *
 * @param exerciseId - The exercise ID
 * @param value - The PR value (kg for gym, seconds for sprint)
 * @param unitId - Unit ID (3=kg for gym, 5=seconds for sprint)
 * @param distance - Distance in meters (for sprint PRs only, null for gym)
 */
export async function upsertExercisePRAction(
  exerciseId: number,
  value: number,
  unitId: number,
  distance?: number | null
): Promise<ActionState<PersonalBest>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // Find existing PR for this athlete+exercise+unit combo
    let query = supabase
      .from("athlete_personal_bests")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("exercise_id", exerciseId)
      .eq("unit_id", unitId)

    // For gym (no distance), filter to null distance
    // For sprint, match on specific distance
    if (distance != null) {
      query = query.eq("distance", distance)
    } else {
      query = query.is("distance", null)
    }

    const { data: existing, error: lookupError } = await query.limit(1)

    if (lookupError) {
      console.error("[upsertExercisePRAction] Lookup error:", lookupError)
      return { isSuccess: false, message: "Failed to check existing PR" }
    }

    const existingPB = existing?.[0]
    const today = new Date().toISOString().split("T")[0]

    if (existingPB) {
      // Update existing PR
      const { data, error } = await supabase
        .from("athlete_personal_bests")
        .update({
          value,
          achieved_date: today,
          verified: false,
          notes: "Manually entered during workout",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPB.id)
        .select()
        .single()

      if (error) {
        console.error("[upsertExercisePRAction] Update error:", error)
        return { isSuccess: false, message: "Failed to update PR" }
      }

      revalidatePath("/workout")

      return {
        isSuccess: true,
        message: "PR updated",
        data,
      }
    } else {
      // Create new PR
      const insertData: Database["public"]["Tables"]["athlete_personal_bests"]["Insert"] = {
        athlete_id: athlete.id,
        exercise_id: exerciseId,
        value,
        unit_id: unitId,
        achieved_date: today,
        verified: false,
        notes: "Manually entered during workout",
        ...(distance != null ? { distance } : {}),
      }

      const { data, error } = await supabase
        .from("athlete_personal_bests")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error("[upsertExercisePRAction] Insert error:", error)
        return { isSuccess: false, message: "Failed to create PR" }
      }

      revalidatePath("/workout")

      return {
        isSuccess: true,
        message: "PR created",
        data,
      }
    }
  } catch (error) {
    console.error("[upsertExercisePRAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
