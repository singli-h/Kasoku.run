"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { verifyAthleteAccess, logAuthFailure } from "@/lib/auth-utils"
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

    // Verify user has access to this athlete's data
    const { authorized } = await verifyAthleteAccess(dbUserId, athleteId)
    if (!authorized) {
      logAuthFailure("getAthletePBsAction", {
        userId: dbUserId,
        resourceType: "athlete",
        resourceId: athleteId,
        reason: "User does not own this athlete and is not their coach"
      })
      return { isSuccess: false, message: "Not authorized to access this athlete's data" }
    }

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

    // Verify user has access to this athlete's data
    const { authorized } = await verifyAthleteAccess(dbUserId, athleteId)
    if (!authorized) {
      logAuthFailure("getSpecificPBAction", {
        userId: dbUserId,
        resourceType: "athlete",
        resourceId: athleteId,
        reason: "User does not own this athlete and is not their coach"
      })
      return { isSuccess: false, message: "Not authorized to access this athlete's data" }
    }

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
  sessionId: string,
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
 * Auto-detect PBs for sprint data from Freelap metadata
 * Called when processing Freelap CSV upload or session completion
 */
export async function autoDetectSprintPBAction(
  sessionId: string,
  athleteId: number,
  distanceMeters: number,
  timeSeconds: number,
  metadata?: Record<string, unknown>
): Promise<ActionState<PersonalBest | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    // Look up or create a sprint exercise for this distance
    // For sprints, we use distance-based exercise IDs (e.g., "40m Sprint")
    const exerciseName = `${distanceMeters}m Sprint`

    // Try to find existing sprint exercise for this distance
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("id")
      .ilike("name", exerciseName)
      .maybeSingle()

    if (exerciseError) {
      console.error("[autoDetectSprintPBAction] Exercise lookup error:", exerciseError)
      return { isSuccess: false, message: "Failed to lookup sprint exercise" }
    }

    if (!exercise) {
      // No exercise found for this sprint distance - skip PB detection
      console.log(`[autoDetectSprintPBAction] No exercise found for ${exerciseName}`)
      return {
        isSuccess: true,
        message: `No exercise found for ${exerciseName}`,
        data: null,
      }
    }

    // Get existing PB for this athlete-exercise (distance)
    const { data: existingPB, error: pbError } = await supabase
      .from("athlete_personal_bests")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("exercise_id", exercise.id)
      .maybeSingle()

    if (pbError) {
      console.error("[autoDetectSprintPBAction] PB lookup error:", pbError)
      return { isSuccess: false, message: "Failed to lookup existing PB" }
    }

    // If no existing PB or new time is better (lower), create/update PB
    if (!existingPB || timeSeconds < existingPB.value) {
      const pbData = {
        athlete_id: athleteId,
        exercise_id: exercise.id,
        value: timeSeconds,
        unit_id: 5, // seconds (from units table)
        achieved_date: new Date().toISOString().split("T")[0],
        session_id: sessionId,
        verified: false, // Auto-detected PBs start unverified
        notes: `Auto-detected ${distanceMeters}m sprint from session`,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      }

      if (!existingPB) {
        // Create new PB
        const { data, error } = await supabase
          .from("athlete_personal_bests")
          .insert(pbData)
          .select()
          .single()

        if (error) {
          console.error("[autoDetectSprintPBAction] Create error:", error)
          return { isSuccess: false, message: "Failed to create PB" }
        }

        revalidatePath("/performance")
        revalidatePath(`/athletes/${athleteId}`)

        return {
          isSuccess: true,
          message: `New PB! ${distanceMeters}m in ${timeSeconds.toFixed(2)}s`,
          data,
        }
      } else {
        // Update existing PB
        const { data, error } = await supabase
          .from("athlete_personal_bests")
          .update({
            value: timeSeconds,
            unit_id: 5,
            achieved_date: new Date().toISOString().split("T")[0],
            session_id: sessionId,
            verified: false,
            notes: `Auto-detected ${distanceMeters}m sprint (previous: ${existingPB.value}s)`,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
          })
          .eq("id", existingPB.id)
          .select()
          .single()

        if (error) {
          console.error("[autoDetectSprintPBAction] Update error:", error)
          return { isSuccess: false, message: "Failed to update PB" }
        }

        revalidatePath("/performance")
        revalidatePath(`/athletes/${athleteId}`)

        return {
          isSuccess: true,
          message: `PB updated! ${distanceMeters}m improved from ${existingPB.value.toFixed(2)}s to ${timeSeconds.toFixed(2)}s`,
          data,
        }
      }
    }

    // No new PB
    return {
      isSuccess: true,
      message: "No new personal best",
      data: null,
    }
  } catch (error) {
    console.error("[autoDetectSprintPBAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Helper to detect if metadata contains sprint timing data
 * Sprint data is identified by presence of time, speed, or splits fields
 */
function isSprintMetadata(metadata: unknown): metadata is {
  time?: number
  speed?: number
  splits?: Array<{ distance: number; time: number; speed?: number }>
  frequency?: number
  stride_length?: number
  reaction_time?: number
  steps?: number
} {
  if (!metadata || typeof metadata !== "object") return false
  const m = metadata as Record<string, unknown>
  // Sprint data has time OR (speed AND splits)
  return (
    typeof m.time === "number" ||
    (typeof m.speed === "number" && Array.isArray(m.splits)) ||
    Array.isArray(m.splits)
  )
}

/**
 * Process all sprint sets in a session and detect PBs
 * Call this when a session is completed
 * Detects sprint data by presence of time/speed/splits in metadata
 */
export async function processSessionForPBsAction(
  sessionId: string
): Promise<ActionState<{ detected: number; updated: number }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete for this user
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // Get workout_log_sets for this specific session only (filtered in DB, not JS)
    // This is much more efficient than fetching all sets and filtering
    const { data: sets, error } = await supabase
      .from("workout_log_sets")
      .select(`
        id,
        distance,
        performing_time,
        metadata,
        workout_log_exercise:workout_log_exercises!inner(
          id,
          exercise_id,
          exercise:exercises(id, name),
          workout_log:workout_logs!inner(
            id,
            athlete_id
          )
        )
      `)
      .not("metadata", "is", null)
      .eq("workout_log_exercise.workout_log.id", sessionId)
      .eq("workout_log_exercise.workout_log.athlete_id", athlete.id)

    if (error) {
      console.error("[processSessionForPBsAction] Query error:", error)
      return { isSuccess: false, message: "Failed to fetch session sets" }
    }

    // Filter to sprint sets (metadata shape check only - session filtering done in DB)
    interface SetWithDetails {
      id: string
      distance: number | null
      performing_time: number | null
      metadata: Record<string, unknown> | null
      workout_log_exercise: {
        id: string
        exercise_id: number | null
        exercise: { id: number; name: string } | null
        workout_log: { id: string; athlete_id: number | null } | null
      } | null
    }

    const sprintSets = ((sets || []) as SetWithDetails[]).filter((set) => {
      // Only check metadata shape - session/athlete filtering already done in query
      return isSprintMetadata(set.metadata)
    })

    console.log(`[processSessionForPBsAction] Found ${sprintSets.length} sprint sets for session ${sessionId}`)

    let detected = 0
    let updated = 0

    // Process each sprint set
    for (const set of sprintSets) {
      const metadata = set.metadata as {
        time?: number
        speed?: number
        splits?: Array<{ distance: number; time: number }>
      }

      // Get distance from set column, or sum of splits (splits have segment distances, not cumulative)
      const distance = set.distance ||
        (metadata?.splits?.length
          ? metadata.splits.reduce((sum, s) => sum + s.distance, 0)
          : null)

      // Get time from metadata.time or performing_time
      const time = metadata?.time || set.performing_time

      if (!distance || !time) {
        console.log(`[processSessionForPBsAction] Skipping set ${set.id} - missing distance (${distance}) or time (${time})`)
        continue
      }

      // Use the actual exercise from the workout_log_exercise
      const exerciseId = set.workout_log_exercise?.exercise_id
      if (!exerciseId) {
        console.log(`[processSessionForPBsAction] Skipping set ${set.id} - no exercise_id`)
        continue
      }

      // Use internal helper to avoid redundant auth() calls in loop
      const result = await detectSprintPBInternal(
        sessionId,
        athlete.id,
        exerciseId,
        distance,
        time,
        set.metadata as Record<string, unknown>
      )

      if (result.isSuccess && result.data) {
        detected++
        if (result.message.includes("updated")) {
          updated++
        }
      }
    }

    revalidatePath("/performance")

    return {
      isSuccess: true,
      message: `Processed ${sprintSets.length} sprint records. Found ${detected} PBs (${updated} updates).`,
      data: { detected, updated },
    }
  } catch (error) {
    console.error("[processSessionForPBsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Internal helper for PB detection - no auth check (caller must verify)
 * This avoids redundant auth() calls when processing multiple sets in a loop
 */
async function detectSprintPBInternal(
  sessionId: string,
  athleteId: number,
  exerciseId: number,
  distanceMeters: number,
  timeSeconds: number,
  metadata?: Record<string, unknown>
): Promise<ActionState<PersonalBest | null>> {
  // Get existing PB for this athlete-exercise combination
  const { data: existingPB, error: pbError } = await supabase
    .from("athlete_personal_bests")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("exercise_id", exerciseId)
    .maybeSingle()

  if (pbError) {
    console.error("[detectSprintPBInternal] PB lookup error:", pbError)
    return { isSuccess: false, message: "Failed to lookup existing PB" }
  }

  // Store distance in metadata for reference
  const enrichedMetadata = {
    ...(metadata || {}),
    distance_meters: distanceMeters,
  }

  // If no existing PB or new time is better (lower), create/update PB
  if (!existingPB || timeSeconds < existingPB.value) {
    const pbData = {
      athlete_id: athleteId,
      exercise_id: exerciseId,
      value: timeSeconds,
      unit_id: 5, // seconds (from units table)
      achieved_date: new Date().toISOString().split("T")[0],
      session_id: sessionId,
      verified: false, // Auto-detected PBs start unverified
      notes: `Auto-detected ${distanceMeters}m sprint from session`,
      metadata: JSON.parse(JSON.stringify(enrichedMetadata)),
    }

    if (!existingPB) {
      // Create new PB
      const { data, error } = await supabase
        .from("athlete_personal_bests")
        .insert(pbData)
        .select()
        .single()

      if (error) {
        console.error("[detectSprintPBInternal] Create error:", error)
        return { isSuccess: false, message: "Failed to create PB" }
      }

      console.log(`[detectSprintPBInternal] Created new PB: ${distanceMeters}m in ${timeSeconds.toFixed(2)}s`)
      return {
        isSuccess: true,
        message: `New PB! ${distanceMeters}m in ${timeSeconds.toFixed(2)}s`,
        data,
      }
    } else {
      // Update existing PB
      const { data, error } = await supabase
        .from("athlete_personal_bests")
        .update({
          value: timeSeconds,
          unit_id: 5,
          achieved_date: new Date().toISOString().split("T")[0],
          session_id: sessionId,
          verified: false,
          notes: `Auto-detected ${distanceMeters}m sprint (previous: ${existingPB.value}s)`,
          metadata: JSON.parse(JSON.stringify(enrichedMetadata)),
        })
        .eq("id", existingPB.id)
        .select()
        .single()

      if (error) {
        console.error("[detectSprintPBInternal] Update error:", error)
        return { isSuccess: false, message: "Failed to update PB" }
      }

      console.log(`[detectSprintPBInternal] Updated PB: ${distanceMeters}m improved from ${existingPB.value}s to ${timeSeconds.toFixed(2)}s`)
      return {
        isSuccess: true,
        message: `PB updated! ${distanceMeters}m improved from ${existingPB.value}s to ${timeSeconds.toFixed(2)}s`,
        data,
      }
    }
  }

  // No new PB
  return {
    isSuccess: true,
    message: "No new personal best",
    data: null,
  }
}

/**
 * Auto-detect PBs for sprint data using the actual exercise
 * Uses exercise_id from workout_log_exercise instead of looking up by distance name
 * Public action with auth check - use detectSprintPBInternal for batch operations
 */
export async function autoDetectSprintPBWithExerciseAction(
  sessionId: string,
  athleteId: number,
  exerciseId: number,
  distanceMeters: number,
  timeSeconds: number,
  metadata?: Record<string, unknown>
): Promise<ActionState<PersonalBest | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const result = await detectSprintPBInternal(
      sessionId, athleteId, exerciseId, distanceMeters, timeSeconds, metadata
    )

    if (result.isSuccess && result.data) {
      revalidatePath("/performance")
      revalidatePath(`/athletes/${athleteId}`)
    }

    return result
  } catch (error) {
    console.error("[autoDetectSprintPBWithExerciseAction]:", error)
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
