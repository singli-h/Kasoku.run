/**
 * Init Pipeline Schemas
 *
 * Simple, flat Zod schemas for generateObject structured output.
 * Designed to be easy for AI to generate - no nested set arrays.
 * Scaffolding step transforms this to full in-memory state.
 */

import { z } from 'zod'

// ============================================================================
// Exercise Schema (FLAT - no nested sets)
// ============================================================================

export const SimpleExerciseSchema = z.object({
  exercise_id: z.number().describe('Exercise ID from library'),
  sets: z.number().int().min(1).max(10).describe('Number of sets'),
  reps: z.number().int().min(1).max(50).describe('Reps per set'),
  weight: z.number().nullable().describe('Weight in kg, null for bodyweight'),
  rpe: z.number().min(1).max(10).describe('Target RPE (1-10)'),
  rest_time: z.number().int().min(0).max(600).describe('Rest time in seconds'),
})

export type SimpleExercise = z.infer<typeof SimpleExerciseSchema>

// ============================================================================
// Session Schema
// ============================================================================

export const SimpleSessionSchema = z.object({
  day: z.number().int().min(0).max(6).describe('Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)'),
  name: z.string().describe('Session name (e.g., "Upper Body", "Leg Day")'),
  description: z.string().describe('Why this session - explain the purpose and focus'),
  exercises: z.array(SimpleExerciseSchema).min(1).describe('Exercises in this session'),
})

export type SimpleSession = z.infer<typeof SimpleSessionSchema>

// ============================================================================
// Microcycle (Week) Schema
// ============================================================================

export const SimpleMicrocycleSchema = z.object({
  name: z.string().describe('Week name (e.g., "Week 1 - Foundation", "Week 4 - Deload")'),
  sessions: z.array(SimpleSessionSchema).min(1).describe('Training sessions for this week'),
})

export type SimpleMicrocycle = z.infer<typeof SimpleMicrocycleSchema>

// ============================================================================
// Generated Plan Schema (Top Level)
// ============================================================================

export const SimpleGeneratedPlanSchema = z.object({
  plan_name: z.string().describe('Name for the training plan'),
  plan_description: z.string().describe('Brief description of the plan goals and approach'),
  microcycles: z.array(SimpleMicrocycleSchema).min(1).max(12).describe('Weeks in the training plan'),
})

export type SimpleGeneratedPlan = z.infer<typeof SimpleGeneratedPlanSchema>
