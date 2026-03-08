"use server"

/**
 * AI-Assisted Race Results Import Actions
 *
 * Server actions for parsing pasted text and importing race results.
 * Uses OpenAI structured output for parsing.
 *
 * @see docs/features/ai-race-results-import.md
 */

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import type { ActionState } from "@/types/api"
import type { Json } from "@/types/database"
import {
  ParseResultsResponseSchema,
  PARSE_RESULTS_PROMPT,
  getEventId,
  getUnitIdForEvent,
  isWindAffectedEvent,
  isWindLegal,
  isLowerBetter,
  getResultKey,
  type ParsedResult,
  type ParseResultsResponse,
  type CompetitionResultMetadata,
} from "@/lib/ai/parse-race-results"

// ============================================
// Types
// ============================================

/**
 * Result prepared for import with resolved event ID
 */
export interface PreparedResult extends ParsedResult {
  eventId: number | null
  eventName: string
  canImport: boolean
  reason?: string
}

/**
 * Response from preparing results for import
 */
export interface PrepareImportResponse {
  results: PreparedResult[]
  unparseable: string[]
}

/**
 * Input for bulk import
 */
export interface BulkImportInput {
  results: Array<{
    eventId: number
    value: number
    date: string
    wind: number | null
    indoor: boolean
    confidence: "high" | "medium" | "low"
  }>
}

/**
 * Response from bulk import
 */
export interface BulkImportResponse {
  imported: number
  skipped: number
  newPBs: number
}

// ============================================
// Parse Results Action
// ============================================

/**
 * Parse pasted text using AI to extract race results
 *
 * @param pastedText - Raw text pasted by user
 * @returns Parsed results ready for preview
 */
export async function parseResultsAction(
  pastedText: string
): Promise<ActionState<PrepareImportResponse>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    // Validate input length (prevent abuse)
    if (!pastedText || pastedText.trim().length === 0) {
      return { isSuccess: false, message: "Please paste some text to import" }
    }

    if (pastedText.length > 10000) {
      return {
        isSuccess: false,
        message: "Input too long (max 10,000 characters)",
      }
    }

    // Call OpenAI to parse results
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ParseResultsResponseSchema,
      system: PARSE_RESULTS_PROMPT,
      prompt: pastedText,
    })

    // Resolve event IDs and prepare for import
    const preparedResults: PreparedResult[] = object.results.map((result) => {
      const eventId = getEventId(result.event)

      if (!eventId) {
        return {
          ...result,
          eventId: null,
          eventName: result.event,
          canImport: false,
          reason: `Unknown event: ${result.event}`,
        }
      }

      return {
        ...result,
        eventId,
        eventName: result.event,
        canImport: true,
      }
    })

    return {
      isSuccess: true,
      message: `Found ${preparedResults.length} results`,
      data: {
        results: preparedResults,
        unparseable: object.unparseable,
      },
    }
  } catch (error) {
    console.error("[parseResultsAction]:", error)
    return {
      isSuccess: false,
      message: "Failed to parse results. Please try again.",
    }
  }
}

// ============================================
// PB Recalculation Helper
// ============================================

/**
 * Recalculate PB flags for all results of an athlete/event combination
 * This ensures correct is_pb and is_fastest flags considering wind-legal status
 *
 * OPTIMIZED: Single pass to find best results, only update records whose flags changed
 * Typically only 1-3 updates needed (PB record, fastest record, and clearing old flags)
 *
 * @param athleteId - Athlete ID
 * @param eventId - Event ID
 */
async function recalculatePBFlagsForEvent(
  athleteId: number,
  eventId: number
): Promise<void> {
  const { data: results, error } = await supabase
    .from("athlete_personal_bests")
    .select("id, value, metadata")
    .eq("athlete_id", athleteId)
    .eq("event_id", eventId)

  if (error || !results || results.length === 0) return

  const lowerIsBetter = isLowerBetter(eventId)

  // Single pass: find fastest and best wind-legal
  let fastestId = results[0].id
  let fastestValue = results[0].value
  let bestLegalId: number | null = null
  let bestLegalValue: number | null = null

  for (const r of results) {
    // Track fastest overall
    if (lowerIsBetter ? r.value < fastestValue : r.value > fastestValue) {
      fastestValue = r.value
      fastestId = r.id
    }

    // Track best wind-legal
    const meta = r.metadata as unknown as CompetitionResultMetadata | null
    const isLegal = !isWindAffectedEvent(eventId) || meta?.indoor || meta?.wind_legal !== false

    if (isLegal && (bestLegalValue === null ||
        (lowerIsBetter ? r.value < bestLegalValue : r.value > bestLegalValue))) {
      bestLegalValue = r.value
      bestLegalId = r.id
    }
  }

  // Collect updates - only for records whose flags actually changed
  const updates: Array<{ id: number; metadata: CompetitionResultMetadata }> = []

  for (const r of results) {
    const meta = (r.metadata as unknown as CompetitionResultMetadata) || {
      source: "import" as const,
      is_pb: false,
      indoor: false,
    }
    const shouldBePB = r.id === bestLegalId
    const shouldBeFastest = r.id === fastestId

    // Only add to updates if flags changed
    if (meta.is_pb !== shouldBePB || meta.is_fastest !== shouldBeFastest) {
      updates.push({
        id: r.id,
        metadata: { ...meta, is_pb: shouldBePB, is_fastest: shouldBeFastest },
      })
    }
  }

  // Execute updates in parallel (typically 1-3 records need updating)
  if (updates.length > 0) {
    await Promise.all(
      updates.map(({ id, metadata }) =>
        supabase
          .from("athlete_personal_bests")
          .update({ metadata: metadata as unknown as Json })
          .eq("id", id)
      )
    )
  }
}

// ============================================
// Bulk Import Action
// ============================================

/**
 * Import multiple parsed results into the database
 *
 * @param input - Array of results to import
 * @returns Import summary
 */
export async function bulkImportResultsAction(
  input: BulkImportInput
): Promise<ActionState<BulkImportResponse>> {
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
      console.error("[bulkImportResultsAction] Athlete not found:", athleteError)
      return {
        isSuccess: false,
        message:
          "Athlete profile not found. Please create an athlete profile first.",
      }
    }

    // Get existing results for duplicate detection
    const { data: existingResults } = await supabase
      .from("athlete_personal_bests")
      .select("event_id, value, achieved_date")
      .eq("athlete_id", athlete.id)
      .not("event_id", "is", null)

    const existingKeys = new Set(
      (existingResults || []).map((r) =>
        getResultKey(athlete.id, r.event_id!, r.achieved_date, r.value)
      )
    )

    // Track affected events for PB recalculation
    const affectedEventIds = new Set<number>()

    let skipped = 0

    const now = new Date().toISOString()

    // Collect all valid rows for batch insert (instead of inserting one at a time)
    const rowsToInsert: Array<{
      athlete_id: number
      event_id: number
      value: number
      unit_id: number
      achieved_date: string
      metadata: Json
      verified: boolean
    }> = []

    for (const result of input.results) {
      // Check for duplicate
      const key = getResultKey(
        athlete.id,
        result.eventId,
        result.date,
        result.value
      )
      if (existingKeys.has(key)) {
        skipped++
        continue
      }

      // Build metadata (PB flags will be recalculated after all inserts)
      const metadata: CompetitionResultMetadata = {
        source: "import",
        is_pb: false, // Will be recalculated
        is_fastest: false, // Will be recalculated
        indoor: result.indoor,
        imported_at: now,
        import_confidence: result.confidence,
      }

      // Only include wind for wind-affected events
      if (isWindAffectedEvent(result.eventId) && result.wind !== null) {
        metadata.wind = result.wind
        metadata.wind_legal = isWindLegal(result.wind)
      }

      rowsToInsert.push({
        athlete_id: athlete.id,
        event_id: result.eventId,
        value: result.value,
        unit_id: getUnitIdForEvent(result.eventId),
        achieved_date: result.date,
        metadata: metadata as unknown as Json,
        verified: false,
      })

      existingKeys.add(key)
      affectedEventIds.add(result.eventId)
    }

    // Single batch insert for all rows
    let imported = 0
    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("athlete_personal_bests")
        .insert(rowsToInsert)

      if (insertError) {
        console.error("[bulkImportResultsAction] Batch insert error:", insertError)
        // If batch fails, none were imported
        imported = 0
      } else {
        imported = rowsToInsert.length
      }
    }

    // Recalculate PB flags for all affected events in parallel
    // This ensures correct is_pb and is_fastest considering wind-legal status
    let newPBs = 0
    if (imported > 0) {
      await Promise.all(
        [...affectedEventIds].map(eventId =>
          recalculatePBFlagsForEvent(athlete.id, eventId)
        )
      )
    }

    // Count actual PBs from recalculated data
    if (affectedEventIds.size > 0) {
      const { data: pbResults } = await supabase
        .from("athlete_personal_bests")
        .select("metadata")
        .eq("athlete_id", athlete.id)
        .in("event_id", Array.from(affectedEventIds))

      newPBs = (pbResults || []).filter((r) => {
        const meta = r.metadata as CompetitionResultMetadata | null
        return meta?.is_pb === true
      }).length
    }

    revalidatePath("/performance")
    revalidatePath("/athletes")

    const message =
      imported > 0
        ? `Imported ${imported} result${imported !== 1 ? "s" : ""}${
            newPBs > 0 ? ` (${newPBs} new PB${newPBs !== 1 ? "s" : ""})` : ""
          }${skipped > 0 ? `, ${skipped} skipped as duplicates` : ""}`
        : "No new results to import"

    return {
      isSuccess: true,
      message,
      data: { imported, skipped, newPBs },
    }
  } catch (error) {
    console.error("[bulkImportResultsAction]:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
