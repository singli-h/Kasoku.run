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

export type ExerciseTypeName = 'isometric' | 'plyometric' | 'gym' | 'warmup' | 'circuit' | 'sprint' | 'drill' | 'mobility' | 'recovery' | 'other'

export interface ParsedExercise {
  exerciseName: string
  /** AI-generated concise description of the exercise (one sentence) */
  description: string | null
  /** AI-inferred exercise type based on exercise nature */
  exerciseType: ExerciseTypeName
  sets: ParsedSet[]
  targetSubgroups: string[] | null
  notes: string | null
  unparseable: boolean
  originalText: string | null
  /** Section/group header this exercise belongs to — AI infers from context even without explicit headers */
  sectionName: string | null
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
  description: z.string().nullable()
    .describe("Concise one-sentence description of the exercise for coaches who may not know it. Null for unparseable lines."),
  exerciseType: z.enum(['isometric', 'plyometric', 'gym', 'warmup', 'circuit', 'sprint', 'drill', 'mobility', 'recovery', 'other'])
    .describe("Exercise type classification: isometric (holds/planks), plyometric (jumps/bounds), gym (barbell/dumbbell strength), warmup (dynamic stretches/jogging), circuit (AMRAP/station-based), sprint (running speed work), drill (technique/A-skips/hurdle drills), mobility (ROM/flexibility), recovery (cool down/light cardio), other (unclassifiable)"),
  sets: z.array(ParsedSetSchema).describe("Array of set configurations"),
  targetSubgroups: z.array(z.string()).nullable()
    .describe("Subgroup tags like 'Sprints', 'Jumps' from TrainHeroic SS/MS headers. Null if none."),
  notes: z.string().nullable().describe("Any additional notes for this exercise. Null if none."),
  unparseable: z.boolean()
    .describe("True if the line could not be parsed into a structured exercise, false otherwise"),
  originalText: z.string().nullable()
    .describe("The original text line, included for unparseable entries. Null for parsed exercises."),
  sectionName: z.string().nullable()
    .describe("Section/group this exercise belongs to. Inferred from explicit headers OR from exercise nature/context when no headers exist."),
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
   - Tag subsequent exercises with the subgroup name in targetSubgroups until the next header
7. If a line cannot be parsed into an exercise (e.g., headers, blank lines, notes), mark it with unparseable: true and include originalText.
8. Preserve exercise names as-is (capitalize first letter of each word if not already).
9. Convert time notations: "2min" = 120s, "90sec" = 90s, "1:30" = 90s.
10. If rest time is specified after the set info, include it in rest_time.

SECTION INFERENCE (CRITICAL):
11. ALWAYS assign sectionName to every exercise — even when no explicit headers exist.
    - If explicit headers exist ("Warm Up:", "# Drills", "A) Main Set"), use them directly.
    - If NO explicit headers exist, INFER sections from exercise nature, context, and order:
      * Jogging, stretching, mobility work at the start → "Warm Up"
      * Technical drills (A-skips, B-skips, minihurdles, form work) → "Drills"
      * High-intensity sprint work (30m, 60m, flying sprints, block starts) → "Sprint Work"
      * Heavy compound lifts (squat, bench, deadlift, clean) → "Strength"
      * Accessory/isolation work (curls, lateral raises, leg curls) → "Accessories"
      * Plyometric work (box jumps, bounds, depth jumps) → "Plyometrics"
      * Circuit/conditioning work (AMRAP, timed stations) → "Conditioning"
      * Light jogging, static stretching, foam rolling at the end → "Cool Down"
    - Use common coaching terminology for inferred section names.
    - A single exercise type cluster should share one sectionName.
    - Section headers themselves should be marked unparseable with the originalText.

EXERCISE TYPE CLASSIFICATION:
12. Classify every exercise into one of these types based on its nature:
    - isometric: Holds, planks, wall sits, static positions
    - plyometric: Box jumps, bounds, depth jumps, hurdle hops
    - gym: Barbell/dumbbell strength (squat, bench, deadlift, press, row, curl)
    - warmup: Dynamic stretches, jogging, general warm-up movements
    - circuit: AMRAP, station-based, timed rounds
    - sprint: Running speed work (30m, 60m, 100m, flying sprints, block starts, tempo runs)
    - drill: Technique work (A-skips, B-skips, minihurdle drills, wicket runs, form drills)
    - mobility: Flexibility, ROM, yoga-based, stretch-specific
    - recovery: Cool down jogs, foam rolling, light stretching
    - other: Cannot classify

EXERCISE DESCRIPTIONS:
13. Generate a concise one-sentence description for each parsed exercise.
    - Focus on what the exercise is and its training purpose.
    - Keep it under 15 words. Be specific, not generic.
    - Examples:
      * "A-Skip Drills" → "Dynamic running drill emphasizing knee drive and ankle dorsiflexion"
      * "Block Starts" → "Explosive acceleration practice from starting blocks"
      * "Back Squat" → "Bilateral lower-body compound lift targeting quads and posterior chain"
      * "Foam Rolling" → "Self-myofascial release for muscle recovery and tissue quality"
    - Set to null for unparseable lines.`

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
      description: ex.description ?? null,
      exerciseType: ex.exerciseType ?? 'other',
      sets: ex.sets.map((s) => ({
        reps: s.reps ?? null,
        weight: s.weight ?? null,
        distance: s.distance ?? null,
        performing_time: s.performing_time ?? null,
        rest_time: s.rest_time ?? null,
        rpe: s.rpe ?? null,
      })),
      targetSubgroups: ex.targetSubgroups ?? null,
      notes: ex.notes ?? null,
      unparseable: ex.unparseable ?? false,
      originalText: ex.originalText,
      sectionName: ex.sectionName ?? null,
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
