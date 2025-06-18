/**
 * Exercise Grouping Algorithm
 * Intelligent exercise organization system that groups exercises by type 
 * and merges gym exercises with adjacent supersets
 * 
 * Based on the brilliant grouping algorithm from the original Kasoku workout system
 */

import type { WorkoutExercise } from "../context/exercise-context"

// Exercise type mapping - matches the old system's ExerciseType enum
export enum ExerciseTypeId {
  WarmUp = 1,
  Gym = 2,
  Circuit = 3,
  Isometric = 4,
  Plyometric = 5,
  Sprint = 6,
  Drill = 7
}

// Exercise group types
export type ExerciseGroupType = "warm up" | "gym" | "circuit" | "isometric" | "plyometric" | "sprint" | "drill" | "other" | "gymMerged" | "superset"

// Exercise group interface
export interface ExerciseGroup {
  type: ExerciseGroupType
  exercises: WorkoutExercise[]
  id?: number // For supersets
}

/**
 * Maps exercise type ID to group type string
 * @param exerciseTypeId - The exercise type ID from the database
 * @returns The corresponding group type string
 */
export const getExerciseGroupType = (exerciseTypeId: number): ExerciseGroupType => {
  switch (exerciseTypeId) {
    case ExerciseTypeId.WarmUp:
      return "warm up"
    case ExerciseTypeId.Gym:
      return "gym"
    case ExerciseTypeId.Circuit:
      return "circuit"
    case ExerciseTypeId.Isometric:
      return "isometric"
    case ExerciseTypeId.Plyometric:
      return "plyometric"
    case ExerciseTypeId.Sprint:
      return "sprint"
    case ExerciseTypeId.Drill:
      return "drill"
    default:
      return "other"
  }
}

/**
 * Groups exercises by their type while preserving order
 * This is the first step of the brilliant grouping algorithm
 * @param sortedExercises - Exercises sorted by preset_order
 * @returns Array of exercise groups
 */
export const groupExercisesByType = (sortedExercises: WorkoutExercise[]): ExerciseGroup[] => {
  const groups: ExerciseGroup[] = []
  let currentGroup: ExerciseGroup | null = null
  let currentSuperset: ExerciseGroup | null = null

  sortedExercises.forEach((exercise) => {
    // Get the exercise type from the exercise data
    // WorkoutExercise extends ExercisePreset, so we need to access the exercise via the relationship
    const exerciseTypeId = exercise.exercise?.exercise_type_id || 0
    const type = getExerciseGroupType(exerciseTypeId)

    if (exercise.superset_id) {
      if (currentSuperset && currentSuperset.id === exercise.superset_id) {
        // Add to existing superset
        currentSuperset.exercises.push(exercise)
      } else {
        // Start a new superset
        currentSuperset = { 
          type: "superset", 
          id: exercise.superset_id, 
          exercises: [exercise] 
        }
        groups.push(currentSuperset)
      }
      currentGroup = null
    } else {
      if (currentGroup && currentGroup.type === type) {
        // Add to existing group of the same type
        currentGroup.exercises.push(exercise)
      } else {
        // Start a new group
        currentGroup = { type, exercises: [exercise] }
        groups.push(currentGroup)
      }
      currentSuperset = null
    }
  })

  return groups
}

/**
 * Merges adjacent gym groups with supersets
 * This is the second step that creates the intelligent merged groups
 * @param groups - Initial exercise groups
 * @returns Final groups with gym exercises and supersets merged
 */
export const mergeGymGroups = (groups: ExerciseGroup[]): ExerciseGroup[] => {
  const finalGroups: ExerciseGroup[] = []
  let currentGymGroup: ExerciseGroup | null = null

  groups.forEach((group, index) => {
    if (group.type === "gym") {
      if (currentGymGroup) {
        // Merge with existing gym group
        currentGymGroup.exercises.push(...group.exercises)
      } else {
        // Start a new gym group
        currentGymGroup = { 
          type: "gymMerged", 
          exercises: [...group.exercises] 
        }
        finalGroups.push(currentGymGroup)
      }
    } else if (group.type === "superset") {
      const prevGroup = groups[index - 1]
      const nextGroup = groups[index + 1]
      
      // Check if superset is adjacent to gym exercises
      const isAdjacentToGym =
        (prevGroup && prevGroup.type === "gym") ||
        (nextGroup && nextGroup.type === "gym") ||
        (currentGymGroup &&
          Math.abs(
            currentGymGroup.exercises[currentGymGroup.exercises.length - 1].preset_order - 
            group.exercises[0].preset_order
          ) === 1)

      if (isAdjacentToGym) {
        // Merge entire superset with the adjacent gym group
        if (currentGymGroup) {
          const insertIndex = currentGymGroup.exercises.findIndex(
            (ex) => ex.preset_order > group.exercises[0].preset_order
          )
          if (insertIndex === -1) {
            currentGymGroup.exercises.push(...group.exercises)
          } else {
            currentGymGroup.exercises.splice(insertIndex, 0, ...group.exercises)
          }
        } else {
          // This shouldn't happen, but just in case
          currentGymGroup = { 
            type: "gymMerged", 
            exercises: [...group.exercises] 
          }
          finalGroups.push(currentGymGroup)
        }
      } else {
        // Standalone superset
        finalGroups.push(group)
        currentGymGroup = null
      }
    } else {
      // Other exercise types
      finalGroups.push(group)
      currentGymGroup = null
    }
  })

  // Sort exercises within each group to maintain order
  finalGroups.forEach((group) => {
    group.exercises.sort((a, b) => a.preset_order - b.preset_order)
  })

  return finalGroups
}

/**
 * Main exercise grouping function
 * Combines the two-step grouping algorithm from the old system
 * @param exercises - Array of workout exercises
 * @returns Intelligently grouped exercises ready for rendering
 */
export const groupExercises = (exercises: WorkoutExercise[]): ExerciseGroup[] => {
  // Step 1: Sort exercises by order
  const sortedExercises = [...exercises].sort((a, b) => a.preset_order - b.preset_order)

  // Step 2: Group exercises and supersets while preserving order
  const initialGroups = groupExercisesByType(sortedExercises)

  // Step 3: Merge adjacent gym and superset groups
  const finalGroups = mergeGymGroups(initialGroups)

  return finalGroups
}

/**
 * Helper function to get exercises for a specific group type
 * Useful for section-level operations
 * @param groups - Exercise groups
 * @param groupType - The group type to filter by
 * @returns Exercises belonging to the specified group type
 */
export const getExercisesForGroupType = (
  groups: ExerciseGroup[], 
  groupType: ExerciseGroupType
): WorkoutExercise[] => {
  return groups
    .filter(group => group.type === groupType)
    .flatMap(group => group.exercises)
}

/**
 * Helper function to check if a group contains supersets
 * @param group - Exercise group to check
 * @returns True if the group contains exercises with superset_id
 */
export const groupContainsSupersets = (group: ExerciseGroup): boolean => {
  return group.exercises.some(exercise => exercise.superset_id)
}

/**
 * Helper function to get superset exercises from a merged gym group
 * @param group - Exercise group (should be gymMerged type)
 * @returns Object with gym exercises and grouped supersets
 */
export const separateGymAndSupersets = (group: ExerciseGroup) => {
  const gymExercises = group.exercises.filter((e) => !e.superset_id)
  
  // Group superset exercises by superset_id
  const supersetMap = new Map<number, WorkoutExercise[]>()
  group.exercises
    .filter(e => e.superset_id)
    .forEach(exercise => {
      const supersetId = exercise.superset_id!
      if (!supersetMap.has(supersetId)) {
        supersetMap.set(supersetId, [])
      }
      supersetMap.get(supersetId)!.push(exercise)
    })

  const supersets = Array.from(supersetMap.entries()).map(([id, exercises]) => ({
    id,
    exercises: exercises.sort((a, b) => a.preset_order - b.preset_order),
    type: "superset" as const
  }))

  return {
    gymExercises: gymExercises.sort((a, b) => a.preset_order - b.preset_order),
    supersets
  }
}

/**
 * Alternative grouping method that separates supersets completely
 * This creates a flattened structure where supersets are individual groups
 * @param exercises - Array of workout exercises
 * @returns Groups with supersets as separate entities
 */
export const groupExercisesWithSeparateSupersets = (exercises: WorkoutExercise[]): ExerciseGroup[] => {
  // Step 1: Sort exercises by order
  const sortedExercises = [...exercises].sort((a, b) => a.preset_order - b.preset_order)

  // Step 2: Group exercises and supersets
  const initialGroups = groupExercisesByType(sortedExercises)

  // Step 3: Merge gym groups but keep supersets separate
  const mergedGroups = mergeGymGroups(initialGroups)

  // Step 4: Extract supersets from merged groups
  const finalGroups: ExerciseGroup[] = []

  mergedGroups.forEach(group => {
    if (group.type === "gymMerged") {
      const { gymExercises, supersets } = separateGymAndSupersets(group)
      
      // Add gym exercises as a regular gym group if any exist
      if (gymExercises.length > 0) {
        finalGroups.push({
          type: "gym",
          exercises: gymExercises
        })
      }

      // Add each superset as a separate group
      supersets.forEach(superset => {
        finalGroups.push({
          type: "superset",
          exercises: superset.exercises,
          id: superset.id
        })
      })
    } else {
      finalGroups.push(group)
    }
  })

  return finalGroups
} 