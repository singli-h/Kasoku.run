/**
 * Exercise Context Provider
 * Manages global state for exercise data and video display preferences
 * Provides a centralized way to manage and update exercise states across components
 * 
 * Based on the successful pattern from the original Kasoku workout system
 */

"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { ExercisePresetWithDetails, ExerciseTrainingDetail } from "@/types/training"

// Extended exercise type with training details for workout execution
export interface WorkoutExercise extends ExercisePresetWithDetails {
  exercise_training_details: ExerciseTrainingDetail[]
  completed?: boolean
}

// Context value interface
interface ExerciseContextValue {
  exercises: WorkoutExercise[]
  showVideo: boolean
  updateExercise: (id: number, updates: Partial<WorkoutExercise>) => void
  toggleVideo: () => void
  setExercises: (exercises: WorkoutExercise[]) => void
}

// Create context with null initial value
const ExerciseContext = createContext<ExerciseContextValue | null>(null)

/**
 * Custom hook to access exercise context
 * Ensures the hook is used within the provider and provides type-safe access
 * @returns {ExerciseContextValue} Context object containing exercises state and update functions
 * @throws {Error} If used outside of ExerciseProvider
 */
export const useExerciseContext = (): ExerciseContextValue => {
  const context = useContext(ExerciseContext)
  if (!context) {
    throw new Error("useExerciseContext must be used within an ExerciseProvider")
  }
  return context
}

/**
 * Exercise Provider Component
 * Wraps the application with exercise context and provides state management
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped
 * @param {WorkoutExercise[]} [props.initialData=[]] - Initial exercise data
 */
interface ExerciseProviderProps {
  children: ReactNode
  initialData?: WorkoutExercise[]
}

export const ExerciseProvider = ({ children, initialData = [] }: ExerciseProviderProps) => {
  // State for managing exercises and video display
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialData)
  const [showVideo, setShowVideo] = useState(false)

  /**
   * Updates a specific exercise's data
   * @param {number} id - Exercise ID to update
   * @param {Partial<WorkoutExercise>} updates - New properties to merge with existing exercise data
   */
  const updateExercise = (id: number, updates: Partial<WorkoutExercise>) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => 
        exercise.id === id ? { ...exercise, ...updates } : exercise
      )
    )
  }

  /**
   * Toggles video display state
   * Controls whether exercise videos are shown or hidden
   */
  const toggleVideo = () => {
    setShowVideo(prev => !prev)
  }

  // Provide context value to children
  const value: ExerciseContextValue = {
    exercises,
    showVideo,
    updateExercise,
    toggleVideo,
    setExercises
  }

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  )
} 