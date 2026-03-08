/**
 * Types for the First Experience Plan Review UI
 *
 * These types represent the AI-generated plan proposal
 * before it's saved to the database.
 */

export interface ProposedSet {
  reps: number
  weight?: number | null
  restSeconds: number
  rpe?: number | null
}

export interface ProposedExercise {
  exerciseId: number
  exerciseName: string
  sets: ProposedSet[]
  notes?: string
}

export interface ProposedSession {
  id: string
  name: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  exercises: ProposedExercise[]
  estimatedDuration: number // minutes
}

export interface ProposedWeek {
  id: string
  weekNumber: number
  name: string
  sessions: ProposedSession[]
  isDeload?: boolean
}

export interface ProposedBlock {
  name: string
  description: string
  durationWeeks: number
  focus: string
  weeks: ProposedWeek[]
}
