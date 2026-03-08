"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/api"
import type { Database, Json } from "@/types/database"

// Types
type Event = Database["public"]["Tables"]["events"]["Row"]
type PersonalBest = Database["public"]["Tables"]["athlete_personal_bests"]["Row"]
type PersonalBestInsert = Database["public"]["Tables"]["athlete_personal_bests"]["Insert"]

// Extended type with event details
export type RaceResult = PersonalBest & {
  event?: Event | null
}

// Metadata structure for race results (manual entry)
export interface RaceResultMetadata {
  source: "competition" | "import"
  is_pb: boolean              // True if this is the best WIND-LEGAL result
  is_fastest?: boolean        // True if this is the fastest result (regardless of wind)
  wind?: number
  // Import-specific fields
  indoor?: boolean
  wind_legal?: boolean        // True if wind ≤ 2.0 m/s or indoor or non-wind event
  imported_at?: string
  import_confidence?: "high" | "medium" | "low"
}

// Wind-affected event IDs (events where wind measurement applies)
// 100m (1), 200m (2), 60m (24), 60mH (25), 100mH (26), 110mH (9), LJ (16), TJ (17), 150m (27)
// Note: 300m (28), 400m+ are NOT wind-affected (run on curves)
const WIND_AFFECTED_EVENT_IDS = [1, 2, 24, 25, 26, 9, 16, 17, 27]

/**
 * Check if an event is wind-affected
 */
function isWindAffectedEvent(eventId: number): boolean {
  return WIND_AFFECTED_EVENT_IDS.includes(eventId)
}

/**
 * Determine if a result is wind-legal
 * - Indoor events: always legal (no wind)
 * - Non-wind events: always legal
 * - Wind events outdoor: legal if wind ≤ 2.0 m/s or wind not recorded
 */
function isResultWindLegal(
  eventId: number,
  indoor: boolean,
  wind: number | undefined
): boolean {
  if (indoor) return true
  if (!isWindAffectedEvent(eventId)) return true
  if (wind === undefined) return true // Unknown wind = assume legal
  return wind <= 2.0
}

// Form data for creating a race result
export interface CreateRaceResultInput {
  eventId: number
  value: number
  date: string
  indoor?: boolean
  wind?: number
}

/**
 * Extract distance from event name (e.g., "100m" -> 100, "100mH" -> 100, "1500m" -> 1500)
 * Returns Infinity for non-distance events to sort them after distance events
 */
function extractDistance(name: string | null): number {
  if (!name) return Infinity
  // Match patterns like "60m", "100m", "100mH", "110mH", "1500m", "3000m", etc.
  const match = name.match(/^(\d+)m/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return Infinity
}

/**
 * Sort events: short distance first, then alphabetically for same distance or non-distance events
 */
function sortEvents(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    const distA = extractDistance(a.name)
    const distB = extractDistance(b.name)

    // Both have distances: sort by distance
    if (distA !== Infinity && distB !== Infinity) {
      if (distA !== distB) return distA - distB
      // Same distance (e.g., "100m" vs "100mH"): sort alphabetically
      return (a.name || '').localeCompare(b.name || '')
    }

    // Only one has distance: distance first
    if (distA !== Infinity) return -1
    if (distB !== Infinity) return 1

    // Neither has distance: sort alphabetically
    return (a.name || '').localeCompare(b.name || '')
  })
}

/**
 * Get all track/field events for the dropdown
 * Returns events sorted by distance (short to long) then alphabetically
 */
export async function getEventsAction(): Promise<ActionState<Event[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")

    if (error) {
      console.error("[getEventsAction] DB error:", error)
      return { isSuccess: false, message: "Failed to fetch events" }
    }

    // Sort events by type first, then by distance/name within each type
    const events = data || []
    const trackEvents = sortEvents(events.filter(e => e.type === 'track'))
    const fieldEvents = sortEvents(events.filter(e => e.type === 'field'))
    const otherEvents = sortEvents(events.filter(e => e.type !== 'track' && e.type !== 'field'))

    return {
      isSuccess: true,
      message: "Events retrieved successfully",
      data: [...trackEvents, ...fieldEvents, ...otherEvents],
    }
  } catch (error) {
    console.error("[getEventsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get all race results for the current user (athlete)
 * Filters by metadata.source = 'competition'
 */
export async function getRaceResultsAction(): Promise<ActionState<RaceResult[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID for the current user
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (athleteError || !athlete) {
      // User might not be an athlete yet
      return {
        isSuccess: true,
        message: "No athlete profile found",
        data: [],
      }
    }

    // Get race results (filter by event_id not null and metadata.source = competition)
    const { data, error } = await supabase
      .from("athlete_personal_bests")
      .select(`
        *,
        event:events(*)
      `)
      .eq("athlete_id", athlete.id)
      .not("event_id", "is", null)
      .order("achieved_date", { ascending: false })

    if (error) {
      console.error("[getRaceResultsAction] DB error:", error)
      return { isSuccess: false, message: "Failed to fetch race results" }
    }

    // Filter for race results (source = 'competition' or 'import' in metadata)
    const raceResults = (data || []).filter((result) => {
      const metadata = result.metadata as RaceResultMetadata | null
      return metadata?.source === "competition" || metadata?.source === "import"
    })

    return {
      isSuccess: true,
      message: "Race results retrieved successfully",
      data: raceResults,
    }
  } catch (error) {
    console.error("[getRaceResultsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Create a new race result
 * Automatically determines if it's a new PB
 */
export async function createRaceResultAction(
  input: CreateRaceResultInput
): Promise<ActionState<RaceResult>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (athleteError || !athlete) {
      console.error("[createRaceResultAction] Athlete not found:", athleteError)
      return { isSuccess: false, message: "Athlete profile not found. Please create an athlete profile first." }
    }

    // Get event details to determine if lower or higher is better
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", input.eventId)
      .single()

    if (eventError || !event) {
      console.error("[createRaceResultAction] Event not found:", eventError)
      return { isSuccess: false, message: "Event not found" }
    }

    // Determine if this is a PB
    // Field events (jumps, throws): higher is better
    // Track events (sprints, distance, hurdles): lower is better
    const isFieldEvent = event.type === "field"

    // Determine unit based on event type
    // Field events use meters (unit_id: 2), track events use seconds (unit_id: 5)
    const unitId = isFieldEvent ? 2 : 5

    // Calculate wind-legal status first (needed for PB detection)
    const indoor = input.indoor ?? false
    const windLegal = isResultWindLegal(input.eventId, indoor, input.wind)

    // Check if this is a PB (considering wind-legal status)
    const { is_pb: isPB, is_fastest: isFastest } = await checkIfNewPB(
      athlete.id,
      input.eventId,
      input.value,
      isFieldEvent,
      windLegal
    )

    // Build metadata
    const metadata: RaceResultMetadata = {
      source: "competition",
      is_pb: isPB,           // Wind-legal PB
      is_fastest: isFastest, // Fastest regardless of wind
      indoor,
      wind_legal: windLegal,
      ...(input.wind !== undefined && !indoor && { wind: input.wind }),
    }

    // Insert the race result
    const insertData: PersonalBestInsert = {
      athlete_id: athlete.id,
      event_id: input.eventId,
      value: input.value,
      unit_id: unitId,
      achieved_date: input.date,
      metadata: metadata as unknown as Json,
      verified: false,
      notes: null,
    }

    const { data: result, error } = await supabase
      .from("athlete_personal_bests")
      .insert(insertData)
      .select(`
        *,
        event:events(*)
      `)
      .single()

    if (error) {
      console.error("[createRaceResultAction] DB error:", error)
      return { isSuccess: false, message: "Failed to save race result" }
    }

    revalidatePath("/performance")
    revalidatePath("/athletes")

    // Build success message based on PB/fastest status
    let message = "Race result saved successfully"
    if (isPB) {
      message = "New personal best recorded!"
    } else if (isFastest && !windLegal) {
      message = "Fastest time recorded (wind-assisted)"
    }

    return {
      isSuccess: true,
      message,
      data: result,
    }
  } catch (error) {
    console.error("[createRaceResultAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Delete a race result
 */
export async function deleteRaceResultAction(
  id: number
): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Verify ownership via athlete
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (!athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // Delete the record (RLS will enforce ownership)
    const { error } = await supabase
      .from("athlete_personal_bests")
      .delete()
      .eq("id", id)
      .eq("athlete_id", athlete.id)

    if (error) {
      console.error("[deleteRaceResultAction] DB error:", error)
      return { isSuccess: false, message: "Failed to delete race result" }
    }

    revalidatePath("/performance")

    return {
      isSuccess: true,
      message: "Race result deleted",
      data: undefined,
    }
  } catch (error) {
    console.error("[deleteRaceResultAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Form data for updating a race result
export interface UpdateRaceResultInput {
  id: number
  eventId: number
  value: number
  date: string
  indoor?: boolean
  wind?: number | null
}

/**
 * Update an existing race result
 */
export async function updateRaceResultAction(
  input: UpdateRaceResultInput
): Promise<ActionState<RaceResult>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const dbUserId = await getDbUserId(userId)

    // Get athlete ID
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", dbUserId)
      .single()

    if (athleteError || !athlete) {
      return { isSuccess: false, message: "Athlete profile not found" }
    }

    // Verify ownership of the result
    const { data: existing, error: existingError } = await supabase
      .from("athlete_personal_bests")
      .select("id, athlete_id, metadata")
      .eq("id", input.id)
      .single()

    if (existingError || !existing) {
      return { isSuccess: false, message: "Result not found" }
    }

    if (existing.athlete_id !== athlete.id) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", input.eventId)
      .single()

    if (eventError || !event) {
      return { isSuccess: false, message: "Event not found" }
    }

    // Determine if this is a PB (excluding current result from comparison)
    const isFieldEvent = event.type === "field"

    // Determine unit based on event type
    const unitId = isFieldEvent ? 2 : 5

    // Calculate wind-legal status
    const indoor = input.indoor ?? false
    const windLegal = isResultWindLegal(input.eventId, indoor, input.wind ?? undefined)

    // Check if this is a PB (considering wind-legal status)
    const { is_pb: isPB, is_fastest: isFastest } = await checkIfNewPBExcluding(
      athlete.id,
      input.eventId,
      input.value,
      isFieldEvent,
      windLegal,
      input.id
    )

    // Preserve existing metadata and update
    const existingMetadata = (existing.metadata as unknown as RaceResultMetadata) || {}
    const metadata: RaceResultMetadata = {
      ...existingMetadata,
      source: existingMetadata.source || "competition",
      is_pb: isPB,           // Wind-legal PB
      is_fastest: isFastest, // Fastest regardless of wind
      indoor,
      wind_legal: windLegal,
      ...(input.wind !== undefined && { wind: input.wind ?? undefined }),
    }

    // Update the race result
    const { data: result, error } = await supabase
      .from("athlete_personal_bests")
      .update({
        event_id: input.eventId,
        value: input.value,
        unit_id: unitId,
        achieved_date: input.date,
        metadata: metadata as unknown as Json,
      })
      .eq("id", input.id)
      .select(`
        *,
        event:events(*)
      `)
      .single()

    if (error) {
      console.error("[updateRaceResultAction] DB error:", error)
      return { isSuccess: false, message: "Failed to update race result" }
    }

    revalidatePath("/performance")
    revalidatePath("/athletes")

    return {
      isSuccess: true,
      message: isPB ? "Updated - New personal best!" : "Race result updated",
      data: result,
    }
  } catch (error) {
    console.error("[updateRaceResultAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Helper function to check if a new result is a PB (excluding a specific result)
 */
/**
 * Check if a result is a PB, excluding a specific record (for updates)
 * Same logic as checkIfNewPB but excludes the record being updated
 */
async function checkIfNewPBExcluding(
  athleteId: number,
  eventId: number,
  newValue: number,
  isHigherBetter: boolean,
  newIsWindLegal: boolean,
  excludeId: number
): Promise<{ is_pb: boolean; is_fastest: boolean }> {
  const { data: existingResults } = await supabase
    .from("athlete_personal_bests")
    .select("id, value, metadata")
    .eq("athlete_id", athleteId)
    .eq("event_id", eventId)
    .neq("id", excludeId)

  if (!existingResults || existingResults.length === 0) {
    return { is_pb: newIsWindLegal, is_fastest: true }
  }

  // Find the fastest result (regardless of wind)
  const existingFastest = existingResults.reduce((best, current) => {
    if (isHigherBetter) {
      return current.value > best ? current.value : best
    } else {
      return current.value < best ? current.value : best
    }
  }, existingResults[0].value)

  const is_fastest = isHigherBetter
    ? newValue > existingFastest
    : newValue < existingFastest

  // Filter to wind-legal results only for PB comparison
  const windLegalResults = existingResults.filter(r => {
    const meta = r.metadata as RaceResultMetadata | null
    return meta?.wind_legal === true ||
           meta?.indoor === true ||
           meta?.wind_legal !== false
  })

  if (windLegalResults.length === 0) {
    return { is_pb: newIsWindLegal, is_fastest }
  }

  const existingBestLegal = windLegalResults.reduce((best, current) => {
    if (isHigherBetter) {
      return current.value > best ? current.value : best
    } else {
      return current.value < best ? current.value : best
    }
  }, windLegalResults[0].value)

  let is_pb = false
  if (newIsWindLegal) {
    is_pb = isHigherBetter
      ? newValue > existingBestLegal
      : newValue < existingBestLegal
  }

  return { is_pb, is_fastest }
}

/**
 * Helper function to check if a new result is a wind-legal PB
 * For wind-affected events, only compares against other wind-legal results
 *
 * @returns Object with is_pb (wind-legal PB) and is_fastest (fastest overall)
 */
async function checkIfNewPB(
  athleteId: number,
  eventId: number,
  newValue: number,
  isHigherBetter: boolean,
  newIsWindLegal: boolean
): Promise<{ is_pb: boolean; is_fastest: boolean }> {
  // Get all existing results for this athlete and event with metadata
  const { data: existingResults } = await supabase
    .from("athlete_personal_bests")
    .select("value, metadata")
    .eq("athlete_id", athleteId)
    .eq("event_id", eventId)

  if (!existingResults || existingResults.length === 0) {
    // First result for this event
    // It's a PB if wind-legal, and always the fastest
    return { is_pb: newIsWindLegal, is_fastest: true }
  }

  // Find the best existing value (regardless of wind)
  const existingFastest = existingResults.reduce((best, current) => {
    if (isHigherBetter) {
      return current.value > best ? current.value : best
    } else {
      return current.value < best ? current.value : best
    }
  }, existingResults[0].value)

  // Check if this is the fastest result
  const is_fastest = isHigherBetter
    ? newValue > existingFastest
    : newValue < existingFastest

  // For wind-legal PB, only compare against other wind-legal results
  const windLegalResults = existingResults.filter(r => {
    const meta = r.metadata as RaceResultMetadata | null
    // Result is wind-legal if:
    // 1. wind_legal is explicitly true
    // 2. indoor is true (no wind indoors)
    // 3. wind_legal is not explicitly false (backwards compat for old records)
    return meta?.wind_legal === true ||
           meta?.indoor === true ||
           meta?.wind_legal !== false
  })

  if (windLegalResults.length === 0) {
    // No wind-legal results to compare against
    // This is a PB if the new result is wind-legal
    return { is_pb: newIsWindLegal, is_fastest }
  }

  // Find the best existing wind-legal value
  const existingBestLegal = windLegalResults.reduce((best, current) => {
    if (isHigherBetter) {
      return current.value > best ? current.value : best
    } else {
      return current.value < best ? current.value : best
    }
  }, windLegalResults[0].value)

  // New result is a PB if:
  // 1. It's wind-legal AND
  // 2. It beats the existing best wind-legal result
  let is_pb = false
  if (newIsWindLegal) {
    if (isHigherBetter) {
      is_pb = newValue > existingBestLegal
    } else {
      is_pb = newValue < existingBestLegal
    }
  }

  return { is_pb, is_fastest }
}
