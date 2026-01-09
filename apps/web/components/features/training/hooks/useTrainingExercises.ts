"use client"

import { useState, useCallback, useMemo } from "react"
import type { TrainingExercise, TrainingSet, ExerciseLibraryItem } from "../types"
import { getSectionOrder, getCompletedCount } from "../types"

interface UseTrainingExercisesOptions {
  initialExercises: TrainingExercise[]
  isAthlete: boolean
}

interface UseTrainingExercisesReturn {
  exercises: TrainingExercise[]
  setExercises: React.Dispatch<React.SetStateAction<TrainingExercise[]>>

  // Exercise operations
  toggleExpand: (exerciseId: string | number) => void
  addExerciseFromLibrary: (exercise: ExerciseLibraryItem, section: string) => void
  removeExercise: (exerciseId: string | number) => void
  updateExerciseName: (exerciseId: string | number, name: string) => void
  reorderExercises: (fromId: string | number, toId: string | number) => void

  // Set operations
  completeSet: (exerciseId: string | number, setId: string | number) => void
  completeAllSets: (exerciseId: string | number) => void
  updateSet: (exerciseId: string | number, setId: string | number, field: keyof TrainingSet, value: number | string | null) => void
  addSet: (exerciseId: string | number) => void
  removeSet: (exerciseId: string | number, setId: string | number) => void
  reorderSets: (exerciseId: string | number, fromIndex: number, toIndex: number) => void

  // Computed values
  sections: string[]
  totalSets: number
  completedSets: number
  overallProgress: number
  completedExercisesCount: number
}

/**
 * useTrainingExercises - Hook for managing training exercise state
 *
 * Provides all CRUD operations for exercises and sets in a unified way
 * that works for both coach planning and athlete execution.
 */
export function useTrainingExercises({
  initialExercises,
  isAthlete
}: UseTrainingExercisesOptions): UseTrainingExercisesReturn {
  const [exercises, setExercises] = useState<TrainingExercise[]>(initialExercises)

  // Exercise operations
  const toggleExpand = useCallback((exerciseId: string | number) => {
    setExercises(prev =>
      prev.map(e => e.id === exerciseId ? { ...e, expanded: !e.expanded } : e)
    )
  }, [])

  const addExerciseFromLibrary = useCallback((exercise: ExerciseLibraryItem, section: string) => {
    // Parse exercise ID - expect either numeric string or string with numeric prefix
    // exercise.id could be: "123", "ex-123", "new-123", or just a numeric ID
    const rawId = exercise.id
    let exerciseId: number

    if (typeof rawId === 'number') {
      exerciseId = rawId
    } else {
      // Try to parse as number first
      const parsed = parseInt(rawId, 10)
      if (!isNaN(parsed) && parsed > 0) {
        exerciseId = parsed
      } else {
        // Try to extract numeric portion (e.g., from "ex-123" get 123)
        const numericMatch = rawId.match(/(\d+)/)
        if (numericMatch) {
          exerciseId = parseInt(numericMatch[1], 10)
        } else {
          // Cannot extract valid exercise ID - log error and reject
          console.error('[useTrainingExercises] Cannot extract valid exercise ID from:', rawId)
          return // Don't add exercise with invalid ID
        }
      }
    }

    if (isNaN(exerciseId) || exerciseId <= 0) {
      console.error('[useTrainingExercises] Invalid exercise ID extracted:', { rawId, exerciseId })
      return
    }

    const newId = `new-${Date.now()}`
    const sectionExercises = exercises.filter(e => e.section === section)
    const maxOrder = Math.max(0, ...sectionExercises.map(e => e.exerciseOrder))

    const newExercise: TrainingExercise = {
      id: newId,
      exerciseId,
      name: exercise.name,
      section,
      exerciseOrder: maxOrder + 1,
      sets: [{
        id: `${newId}-s1`,
        setIndex: 1,
        completed: false
      }],
      expanded: true
    }

    setExercises(prev => [...prev, newExercise])
  }, [exercises])

  const removeExercise = useCallback((exerciseId: string | number) => {
    setExercises(prev => prev.filter(e => e.id !== exerciseId))
  }, [])

  const updateExerciseName = useCallback((exerciseId: string | number, name: string) => {
    setExercises(prev =>
      prev.map(e => e.id === exerciseId ? { ...e, name } : e)
    )
  }, [])

  const reorderExercises = useCallback((fromId: string | number, toId: string | number) => {
    setExercises(prev => {
      const fromIndex = prev.findIndex(e => e.id === fromId)
      const toIndex = prev.findIndex(e => e.id === toId)
      if (fromIndex === -1 || toIndex === -1) return prev

      const newExercises = [...prev]
      const [moved] = newExercises.splice(fromIndex, 1)
      newExercises.splice(toIndex, 0, moved)
      return newExercises
    })
  }, [])

  // Set operations
  const completeSet = useCallback((exerciseId: string | number, setId: string | number) => {
    if (!isAthlete) return // Only athletes can mark sets complete

    setExercises(prev =>
      prev.map(e =>
        e.id === exerciseId
          ? {
              ...e,
              sets: e.sets.map(s =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              )
            }
          : e
      )
    )
  }, [isAthlete])

  const completeAllSets = useCallback((exerciseId: string | number) => {
    if (!isAthlete) return

    setExercises(prev =>
      prev.map(e =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map(s => ({ ...s, completed: true })) }
          : e
      )
    )
  }, [isAthlete])

  const updateSet = useCallback((
    exerciseId: string | number,
    setId: string | number,
    field: keyof TrainingSet,
    value: number | string | null
  ) => {
    setExercises(prev =>
      prev.map(e =>
        e.id === exerciseId
          ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
          : e
      )
    )
  }, [])

  const addSet = useCallback((exerciseId: string | number) => {
    setExercises(prev =>
      prev.map(e => {
        if (e.id !== exerciseId) return e
        const newSetIndex = e.sets.length + 1
        const lastSet = e.sets[e.sets.length - 1]

        // Copy relevant values from last set (if exists)
        const newSet: TrainingSet = {
          id: `${exerciseId}-s${newSetIndex}`,
          setIndex: newSetIndex,
          reps: lastSet?.reps,
          weight: lastSet?.weight,
          distance: lastSet?.distance,
          performingTime: lastSet?.performingTime,
          restTime: lastSet?.restTime,
          completed: false
        }

        return { ...e, sets: [...e.sets, newSet] }
      })
    )
  }, [])

  const removeSet = useCallback((exerciseId: string | number, setId: string | number) => {
    setExercises(prev =>
      prev.map(e => {
        if (e.id !== exerciseId) return e
        const newSets = e.sets
          .filter(s => s.id !== setId)
          .map((s, i) => ({ ...s, setIndex: i + 1 }))
        return { ...e, sets: newSets }
      })
    )
  }, [])

  const reorderSets = useCallback((exerciseId: string | number, fromIndex: number, toIndex: number) => {
    setExercises(prev =>
      prev.map(e => {
        if (e.id !== exerciseId) return e
        const newSets = [...e.sets]
        const [moved] = newSets.splice(fromIndex, 1)
        newSets.splice(toIndex, 0, moved)
        return {
          ...e,
          sets: newSets.map((s, i) => ({ ...s, setIndex: i + 1 }))
        }
      })
    )
  }, [])

  // Computed values
  const sections = useMemo(() => {
    return [...new Set(exercises.map(e => e.section))].sort(
      (a, b) => getSectionOrder(a) - getSectionOrder(b)
    )
  }, [exercises])

  const totalSets = useMemo(() => {
    return exercises.reduce((acc, e) => acc + e.sets.length, 0)
  }, [exercises])

  const completedSets = useMemo(() => {
    return exercises.reduce((acc, e) => acc + getCompletedCount(e), 0)
  }, [exercises])

  const overallProgress = useMemo(() => {
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  }, [totalSets, completedSets])

  const completedExercisesCount = useMemo(() => {
    return exercises.filter(e => e.sets.every(s => s.completed)).length
  }, [exercises])

  return {
    exercises,
    setExercises,
    toggleExpand,
    addExerciseFromLibrary,
    removeExercise,
    updateExerciseName,
    reorderExercises,
    completeSet,
    completeAllSets,
    updateSet,
    addSet,
    removeSet,
    reorderSets,
    sections,
    totalSets,
    completedSets,
    overallProgress,
    completedExercisesCount
  }
}
