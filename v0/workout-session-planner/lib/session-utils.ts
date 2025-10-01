// Utility functions for session planning

import {
  type ExerciseInSession,
  type SupersetGroup,
  type SetData,
  type ExerciseType,
  EXERCISE_TYPE_DEFAULTS,
} from "@/types/session"

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createDefaultSets(type: ExerciseType, count = 3): SetData[] {
  const defaults = EXERCISE_TYPE_DEFAULTS[type]
  return Array.from({ length: count }, (_, i) => {
    const set: SetData = { setIndex: i }
    defaults.forEach((field) => {
      set[field.key] = null
    })
    return set
  })
}

export function createExerciseInSession(
  exerciseId: number,
  name: string,
  type: ExerciseType,
  order: number,
): ExerciseInSession {
  return {
    id: generateId(),
    exerciseId,
    name,
    type,
    order,
    sets: createDefaultSets(type),
    notes: null,
  }
}

export function groupIntoSupersets(exercises: ExerciseInSession[]): (ExerciseInSession | SupersetGroup)[] {
  const result: (ExerciseInSession | SupersetGroup)[] = []
  const supersetMap = new Map<string, ExerciseInSession[]>()
  const processedIds = new Set<string>()

  exercises.forEach((ex) => {
    if (ex.supersetId) {
      if (!supersetMap.has(ex.supersetId)) {
        supersetMap.set(ex.supersetId, [])
      }
      supersetMap.get(ex.supersetId)!.push(ex)
      processedIds.add(ex.id)
    }
  })

  exercises.forEach((ex) => {
    if (processedIds.has(ex.id)) {
      if (ex.supersetId) {
        const supersetExercises = supersetMap.get(ex.supersetId)!
        const isFirst = supersetExercises[0].id === ex.id

        if (isFirst) {
          const superset: SupersetGroup = {
            id: ex.supersetId,
            exercises: supersetExercises.sort((a, b) => a.order - b.order),
          }
          result.push(superset)
        }
      }
    } else {
      result.push(ex)
    }
  })

  return result
}

export function reorderExercises(exercises: ExerciseInSession[]): ExerciseInSession[] {
  return exercises.map((ex, index) => ({ ...ex, order: index + 1 }))
}

export function validateSession(exercises: ExerciseInSession[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (exercises.length === 0) {
    errors.push("Session must contain at least one exercise")
  }

  exercises.forEach((ex, index) => {
    if (!ex.name || ex.name.trim() === "") {
      errors.push(`Exercise ${index + 1}: Name is required`)
    }
    if (ex.sets.length === 0) {
      errors.push(`Exercise ${index + 1}: Must have at least one set`)
    }
  })

  return { valid: errors.length === 0, errors }
}

export function estimateDuration(exercises: ExerciseInSession[]): number {
  let total = 0
  exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      const workTime = set.duration || set.performing_time || (set.reps || 0) * 3
      const restTime = set.rest_time || 60
      total += workTime + restTime
    })
  })
  return Math.round(total / 60)
}

export function createSuperset(allExercises: ExerciseInSession[], selectedIds: Set<string>): ExerciseInSession[] {
  const selectedExercises = allExercises.filter((ex) => selectedIds.has(ex.id))

  if (selectedExercises.length < 2) {
    return allExercises
  }

  const supersetId = generateId()

  return allExercises.map((ex) => {
    if (selectedIds.has(ex.id)) {
      return { ...ex, supersetId }
    }
    return ex
  })
}

export function ungroupSuperset(exercises: ExerciseInSession[], supersetId: string): ExerciseInSession[] {
  return exercises.map((ex) => (ex.supersetId === supersetId ? { ...ex, supersetId: null } : ex))
}

export function canCreateSuperset(exercises: ExerciseInSession[], selectedIds: Set<string>): boolean {
  if (selectedIds.size < 2) return false

  const selected = exercises.filter((ex) => selectedIds.has(ex.id))
  const supersetIds = new Set(selected.map((ex) => ex.supersetId).filter(Boolean))

  return supersetIds.size <= 1
}

export function canUngroupSuperset(exercises: ExerciseInSession[], selectedIds: Set<string>): boolean {
  if (selectedIds.size === 0) return false

  const selected = exercises.filter((ex) => selectedIds.has(ex.id))
  const supersetIds = new Set(selected.map((ex) => ex.supersetId).filter(Boolean))

  return supersetIds.size === 1 && !supersetIds.has(undefined)
}
