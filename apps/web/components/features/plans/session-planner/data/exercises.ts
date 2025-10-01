/**
 * Demo Exercise Library
 * Sample exercises matching the database schema for session planning
 */

import type { ExerciseLibraryItem } from "../types"

/**
 * Demo exercise library
 * Maps to exercises table structure with exercise_type_id
 */
export const DEMO_EXERCISES: ExerciseLibraryItem[] = [
  // Gym Exercises (Type 2)
  {
    id: 101,
    name: "Back Squat",
    description: "Barbell back squat - primary lower body strength exercise",
    exercise_type_id: 2,
    type: "gym",
    category: "Lower Body",
    isFavorite: true,
  },
  {
    id: 102,
    name: "Front Squat",
    description: "Barbell front squat - quad dominant",
    exercise_type_id: 2,
    type: "gym",
    category: "Lower Body",
  },
  {
    id: 103,
    name: "Romanian Deadlift",
    description: "Hip hinge movement targeting hamstrings and glutes",
    exercise_type_id: 2,
    type: "gym",
    category: "Lower Body",
    isFavorite: true,
  },
  {
    id: 104,
    name: "Bench Press",
    description: "Barbell bench press - primary upper body push",
    exercise_type_id: 2,
    type: "gym",
    category: "Upper Body",
    isFavorite: true,
  },
  {
    id: 105,
    name: "Pull-ups",
    description: "Bodyweight vertical pull",
    exercise_type_id: 2,
    type: "gym",
    category: "Upper Body",
  },
  {
    id: 106,
    name: "Overhead Press",
    description: "Barbell or dumbbell shoulder press",
    exercise_type_id: 2,
    type: "gym",
    category: "Upper Body",
  },
  {
    id: 107,
    name: "Bulgarian Split Squat",
    description: "Single leg squat variation",
    exercise_type_id: 2,
    type: "gym",
    category: "Lower Body",
  },
  {
    id: 108,
    name: "Hamstring Curl",
    description: "Isolation exercise for hamstrings",
    exercise_type_id: 2,
    type: "gym",
    category: "Lower Body",
  },

  // Plyometric Exercises (Type 5)
  {
    id: 201,
    name: "Box Jump",
    description: "Vertical jump onto box - explosive power",
    exercise_type_id: 5,
    type: "plyometric",
    category: "Power",
    isFavorite: true,
  },
  {
    id: 202,
    name: "Depth Jump",
    description: "Drop from box and immediate jump - reactive strength",
    exercise_type_id: 5,
    type: "plyometric",
    category: "Power",
  },
  {
    id: 203,
    name: "Broad Jump",
    description: "Horizontal jump for distance",
    exercise_type_id: 5,
    type: "plyometric",
    category: "Power",
  },
  {
    id: 204,
    name: "Hurdle Hops",
    description: "Continuous hurdle jumps - elastic power",
    exercise_type_id: 5,
    type: "plyometric",
    category: "Power",
  },

  // Sprint Exercises (Type 6)
  {
    id: 301,
    name: "30m Sprint",
    description: "Short acceleration sprint",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed",
    isFavorite: true,
  },
  {
    id: 302,
    name: "60m Sprint",
    description: "Maximum velocity sprint",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed",
    isFavorite: true,
  },
  {
    id: 303,
    name: "100m Sprint",
    description: "Full race distance",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed",
  },
  {
    id: 304,
    name: "200m Sprint",
    description: "Speed endurance",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed Endurance",
  },
  {
    id: 305,
    name: "Flying 30m",
    description: "Max velocity sprint with run-in",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed",
  },
  {
    id: 306,
    name: "Sled Push 20m",
    description: "Resisted sprint pushing sled",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed Strength",
  },
  {
    id: 307,
    name: "Sled Pull 20m",
    description: "Resisted sprint pulling sled",
    exercise_type_id: 6,
    type: "sprint",
    category: "Speed Strength",
  },

  // Drill Exercises (Type 7)
  {
    id: 401,
    name: "A-Skip",
    description: "Sprint mechanics drill - high knees with skip",
    exercise_type_id: 7,
    type: "drill",
    category: "Technical",
  },
  {
    id: 402,
    name: "B-Skip",
    description: "Sprint mechanics drill - leg cycling",
    exercise_type_id: 7,
    type: "drill",
    category: "Technical",
  },
  {
    id: 403,
    name: "Wicket Runs",
    description: "Stride length and frequency drill",
    exercise_type_id: 7,
    type: "drill",
    category: "Technical",
  },
  {
    id: 404,
    name: "Wall Drill",
    description: "Sprint mechanics against wall",
    exercise_type_id: 7,
    type: "drill",
    category: "Technical",
  },

  // Warm-up Exercises (Type 1)
  {
    id: 501,
    name: "Dynamic Stretching",
    description: "Movement-based warm-up",
    exercise_type_id: 1,
    type: "warmup",
    category: "Mobility",
  },
  {
    id: 502,
    name: "Jogging",
    description: "Easy jog for general warm-up",
    exercise_type_id: 1,
    type: "warmup",
    category: "Cardio",
  },

  // Circuit Exercises (Type 3)
  {
    id: 601,
    name: "Med Ball Throw",
    description: "Explosive medicine ball chest pass",
    exercise_type_id: 3,
    type: "circuit",
    category: "Power",
  },
  {
    id: 602,
    name: "Battle Ropes",
    description: "High intensity upper body conditioning",
    exercise_type_id: 3,
    type: "circuit",
    category: "Conditioning",
  },
  {
    id: 603,
    name: "Burpees",
    description: "Full body conditioning exercise",
    exercise_type_id: 3,
    type: "circuit",
    category: "Conditioning",
  },

  // Isometric Exercises (Type 4)
  {
    id: 701,
    name: "Plank",
    description: "Core stabilization hold",
    exercise_type_id: 4,
    type: "isometric",
    category: "Core",
  },
  {
    id: 702,
    name: "Wall Sit",
    description: "Isometric squat hold",
    exercise_type_id: 4,
    type: "isometric",
    category: "Lower Body",
  },
]

/**
 * Get exercises filtered by type
 */
export function getExercisesByType(
  type: ExerciseLibraryItem["type"],
): ExerciseLibraryItem[] {
  return DEMO_EXERCISES.filter((ex) => ex.type === type)
}

/**
 * Get favorite exercises
 */
export function getFavoriteExercises(): ExerciseLibraryItem[] {
  return DEMO_EXERCISES.filter((ex) => ex.isFavorite)
}

/**
 * Search exercises by name
 */
export function searchExercises(query: string): ExerciseLibraryItem[] {
  const lowerQuery = query.toLowerCase()
  return DEMO_EXERCISES.filter((ex) => ex.name.toLowerCase().includes(lowerQuery))
}
