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

// Mock data for the prototype
export const MOCK_PROPOSED_PLAN: ProposedBlock = {
  name: "Strength Foundation",
  description: "A progressive strength program focusing on compound movements to build a solid foundation. Each week gradually increases intensity while maintaining proper form and recovery.",
  durationWeeks: 4,
  focus: "Build Strength",
  weeks: [
    {
      id: "week-1",
      weekNumber: 1,
      name: "Week 1",
      sessions: [
        {
          id: "session-1",
          name: "Upper Body Push",
          dayOfWeek: 1, // Monday
          estimatedDuration: 45,
          exercises: [
            {
              exerciseId: 1,
              exerciseName: "Bench Press",
              sets: [
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
              ]
            },
            {
              exerciseId: 2,
              exerciseName: "Overhead Press",
              sets: [
                { reps: 8, restSeconds: 60 },
                { reps: 8, restSeconds: 60 },
                { reps: 8, restSeconds: 60 },
              ]
            },
            {
              exerciseId: 3,
              exerciseName: "Incline Dumbbell Press",
              sets: [
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
              ]
            },
            {
              exerciseId: 4,
              exerciseName: "Tricep Pushdowns",
              sets: [
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
              ]
            },
          ]
        },
        {
          id: "session-2",
          name: "Lower Body",
          dayOfWeek: 3, // Wednesday
          estimatedDuration: 45,
          exercises: [
            {
              exerciseId: 5,
              exerciseName: "Barbell Squat",
              sets: [
                { reps: 6, restSeconds: 120 },
                { reps: 6, restSeconds: 120 },
                { reps: 6, restSeconds: 120 },
                { reps: 6, restSeconds: 120 },
              ]
            },
            {
              exerciseId: 6,
              exerciseName: "Romanian Deadlift",
              sets: [
                { reps: 8, restSeconds: 90 },
                { reps: 8, restSeconds: 90 },
                { reps: 8, restSeconds: 90 },
              ]
            },
            {
              exerciseId: 7,
              exerciseName: "Leg Press",
              sets: [
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
              ]
            },
            {
              exerciseId: 8,
              exerciseName: "Leg Curls",
              sets: [
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
              ]
            },
          ]
        },
        {
          id: "session-3",
          name: "Upper Body Pull",
          dayOfWeek: 5, // Friday
          estimatedDuration: 45,
          exercises: [
            {
              exerciseId: 9,
              exerciseName: "Barbell Row",
              sets: [
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
                { reps: 6, restSeconds: 90 },
              ]
            },
            {
              exerciseId: 10,
              exerciseName: "Pull-ups",
              sets: [
                { reps: 8, restSeconds: 60 },
                { reps: 8, restSeconds: 60 },
                { reps: 8, restSeconds: 60 },
              ]
            },
            {
              exerciseId: 11,
              exerciseName: "Face Pulls",
              sets: [
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
              ]
            },
            {
              exerciseId: 12,
              exerciseName: "Bicep Curls",
              sets: [
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
                { reps: 12, restSeconds: 45 },
              ]
            },
          ]
        },
      ]
    },
    {
      id: "week-2",
      weekNumber: 2,
      name: "Week 2",
      sessions: [
        {
          id: "session-4",
          name: "Upper Body Push",
          dayOfWeek: 1,
          estimatedDuration: 45,
          exercises: [
            { exerciseId: 1, exerciseName: "Bench Press", sets: [{ reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }] },
            { exerciseId: 2, exerciseName: "Overhead Press", sets: [{ reps: 7, restSeconds: 60 }, { reps: 7, restSeconds: 60 }, { reps: 7, restSeconds: 60 }] },
            { exerciseId: 3, exerciseName: "Incline Dumbbell Press", sets: [{ reps: 9, restSeconds: 60 }, { reps: 9, restSeconds: 60 }, { reps: 9, restSeconds: 60 }] },
            { exerciseId: 4, exerciseName: "Tricep Pushdowns", sets: [{ reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }] },
          ]
        },
        {
          id: "session-5",
          name: "Lower Body",
          dayOfWeek: 3,
          estimatedDuration: 45,
          exercises: [
            { exerciseId: 5, exerciseName: "Barbell Squat", sets: [{ reps: 5, restSeconds: 120 }, { reps: 5, restSeconds: 120 }, { reps: 5, restSeconds: 120 }, { reps: 5, restSeconds: 120 }] },
            { exerciseId: 6, exerciseName: "Romanian Deadlift", sets: [{ reps: 7, restSeconds: 90 }, { reps: 7, restSeconds: 90 }, { reps: 7, restSeconds: 90 }] },
            { exerciseId: 7, exerciseName: "Leg Press", sets: [{ reps: 9, restSeconds: 60 }, { reps: 9, restSeconds: 60 }, { reps: 9, restSeconds: 60 }] },
            { exerciseId: 8, exerciseName: "Leg Curls", sets: [{ reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }] },
          ]
        },
        {
          id: "session-6",
          name: "Upper Body Pull",
          dayOfWeek: 5,
          estimatedDuration: 45,
          exercises: [
            { exerciseId: 9, exerciseName: "Barbell Row", sets: [{ reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }, { reps: 5, restSeconds: 90 }] },
            { exerciseId: 10, exerciseName: "Pull-ups", sets: [{ reps: 7, restSeconds: 60 }, { reps: 7, restSeconds: 60 }, { reps: 7, restSeconds: 60 }] },
            { exerciseId: 11, exerciseName: "Face Pulls", sets: [{ reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }] },
            { exerciseId: 12, exerciseName: "Bicep Curls", sets: [{ reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }, { reps: 11, restSeconds: 45 }] },
          ]
        },
      ]
    },
    {
      id: "week-3",
      weekNumber: 3,
      name: "Week 3",
      sessions: [
        {
          id: "session-7",
          name: "Upper Body Push",
          dayOfWeek: 1,
          estimatedDuration: 50,
          exercises: [
            { exerciseId: 1, exerciseName: "Bench Press", sets: [{ reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }] },
            { exerciseId: 2, exerciseName: "Overhead Press", sets: [{ reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }] },
            { exerciseId: 3, exerciseName: "Incline Dumbbell Press", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 4, exerciseName: "Tricep Pushdowns", sets: [{ reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }] },
          ]
        },
        {
          id: "session-8",
          name: "Lower Body",
          dayOfWeek: 3,
          estimatedDuration: 50,
          exercises: [
            { exerciseId: 5, exerciseName: "Barbell Squat", sets: [{ reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }] },
            { exerciseId: 6, exerciseName: "Romanian Deadlift", sets: [{ reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }] },
            { exerciseId: 7, exerciseName: "Leg Press", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 8, exerciseName: "Leg Curls", sets: [{ reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }] },
          ]
        },
        {
          id: "session-9",
          name: "Upper Body Pull",
          dayOfWeek: 5,
          estimatedDuration: 50,
          exercises: [
            { exerciseId: 9, exerciseName: "Barbell Row", sets: [{ reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }, { reps: 4, restSeconds: 120 }] },
            { exerciseId: 10, exerciseName: "Pull-ups", sets: [{ reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }, { reps: 6, restSeconds: 90 }] },
            { exerciseId: 11, exerciseName: "Face Pulls", sets: [{ reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }] },
            { exerciseId: 12, exerciseName: "Bicep Curls", sets: [{ reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }, { reps: 10, restSeconds: 45 }] },
          ]
        },
      ]
    },
    {
      id: "week-4",
      weekNumber: 4,
      name: "Week 4",
      isDeload: true,
      sessions: [
        {
          id: "session-10",
          name: "Full Body A",
          dayOfWeek: 1,
          estimatedDuration: 35,
          exercises: [
            { exerciseId: 1, exerciseName: "Bench Press", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 5, exerciseName: "Barbell Squat", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 9, exerciseName: "Barbell Row", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
          ]
        },
        {
          id: "session-11",
          name: "Full Body B",
          dayOfWeek: 4,
          estimatedDuration: 35,
          exercises: [
            { exerciseId: 2, exerciseName: "Overhead Press", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 6, exerciseName: "Romanian Deadlift", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
            { exerciseId: 10, exerciseName: "Pull-ups", sets: [{ reps: 8, restSeconds: 60 }, { reps: 8, restSeconds: 60 }] },
          ]
        },
      ]
    },
  ]
}
