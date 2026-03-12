"use server"

/**
 * AI Parse Session Action
 *
 * Server action that uses AI structured output to parse free-form training
 * program text into structured exercise data. Uses the Vercel AI SDK
 * generateObject for reliable structured extraction.
 */

import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/types/api"

// ============================================================================
// Types
// ============================================================================

export interface ParsedSet {
  reps: number | null
  weight: number | null
  distance: number | null
  performing_time: number | null
  rest_time: number | null
  rpe: number | null
}

export interface ParsedExercise {
  exerciseName: string
  sets: ParsedSet[]
  targetEventGroups: string[] | null
  notes: string | null
  unparseable: boolean
  originalText: string | null
}

// ============================================================================
// Zod Schema for structured output
// ============================================================================

const ParsedSetSchema = z.object({
  reps: z.number().nullable().describe("Number of repetitions"),
  weight: z.number().nullable().describe("Weight in kg"),
  distance: z.number().nullable().describe("Distance in meters"),
  performing_time: z.number().nullable().describe("Duration in seconds"),
  rest_time: z.number().nullable().describe("Rest time in seconds"),
  rpe: z.number().nullable().describe("Rate of Perceived Exertion (1-10)"),
})

const ParsedExerciseSchema = z.object({
  exerciseName: z.string().describe("Name of the exercise"),
  sets: z.array(ParsedSetSchema).describe("Array of set configurations"),
  targetEventGroups: z.array(z.string()).nullable()
    .describe("Subgroup tags like 'Sprints', 'Jumps' from TrainHeroic SS/MS headers. Null if none."),
  notes: z.string().nullable().describe("Any additional notes for this exercise. Null if none."),
  unparseable: z.boolean()
    .describe("True if the line could not be parsed into a structured exercise, false otherwise"),
  originalText: z.string().nullable()
    .describe("The original text line, included for unparseable entries. Null for parsed exercises."),
})

const ParseResponseSchema = z.object({
  exercises: z.array(ParsedExerciseSchema)
    .describe("Array of parsed exercises"),
})

// ============================================================================
// System Prompt
// ============================================================================

const SYSTEM_PROMPT = `You are a training program parser for track & field and strength coaches.

Your job is to parse free-form training program text into structured exercise data.

PARSING RULES:
1. Each line or logical group represents one exercise with its sets.
2. Recognize common formats:
   - "3x10 @ 80kg" → 3 sets of 10 reps at 80kg
   - "4x60m" → 4 sets of 60 meters distance
   - "3x30s" → 3 sets of 30 seconds duration
   - "Squat 5x5 @RPE 8" → 5 sets of 5 reps at RPE 8
   - "3x10 60kg rest 90s" → 3 sets, 10 reps, 60kg, 90s rest
   - "4 x 80m @ 90%" → 4 sets of 80m (note effort percentage in notes)
   - "Bench Press: 3x8 @ 100kg" → 3 sets of 8 reps at 100kg
3. When "NxM" format is found (like "3x10"), create N identical set objects with M as reps.
4. When "NxDm" format is found (like "4x60m"), create N identical set objects with D as distance.
5. When "NxTs" format is found (like "3x30s"), create N identical set objects with T as performing_time.
6. Detect TrainHeroic subgroup headers:
   - Lines like "SS -", "MS -", "## SS", "SS:", "Superset:" indicate a group
   - Tag subsequent exercises with the subgroup name in targetEventGroups until the next header
7. If a line cannot be parsed into an exercise (e.g., headers, blank lines, notes), mark it with unparseable: true and include originalText.
8. Preserve exercise names as-is (capitalize first letter of each word if not already).
9. Convert time notations: "2min" = 120s, "90sec" = 90s, "1:30" = 90s.
10. If rest time is specified after the set info, include it in rest_time.`

// ============================================================================
// Server Action
// ============================================================================

export async function aiParseSessionAction(
  rawText: string
): Promise<ActionState<ParsedExercise[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        isSuccess: false,
        message: "Please provide some text to parse",
      }
    }

    if (rawText.length > 15000) {
      return {
        isSuccess: false,
        message: "Input too long (max 15,000 characters)",
      }
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ParseResponseSchema,
      system: SYSTEM_PROMPT,
      prompt: rawText,
    })

    const exercises: ParsedExercise[] = object.exercises.map((ex) => ({
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({
        reps: s.reps ?? null,
        weight: s.weight ?? null,
        distance: s.distance ?? null,
        performing_time: s.performing_time ?? null,
        rest_time: s.rest_time ?? null,
        rpe: s.rpe ?? null,
      })),
      targetEventGroups: ex.targetEventGroups ?? null,
      notes: ex.notes ?? null,
      unparseable: ex.unparseable ?? false,
      originalText: ex.originalText,
    }))

    return {
      isSuccess: true,
      message: `Parsed ${exercises.filter((e) => !e.unparseable).length} exercises`,
      data: exercises,
    }
  } catch (error) {
    console.error("[aiParseSessionAction]:", error)
    return {
      isSuccess: false,
      message: `Failed to parse text: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
