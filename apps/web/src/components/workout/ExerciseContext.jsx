/**
 * Exercise Context Provider
 * Manages global state for exercise data and video display preferences
 * Provides a centralized way to manage and update exercise states across components
 */

"use client"

import { createContext, useContext, useState } from "react"

// Create context with null initial value
const ExerciseContext = createContext(null)

/**
 * Custom hook to access exercise context
 * Ensures the hook is used within the provider and provides type-safe access
 * @returns {Object} Context object containing exercises state and update functions
 * @throws {Error} If used outside of ExerciseProvider
 */
export const useExerciseContext = () => {
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
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @param {Array} [props.initialData=[]] - Initial exercise data
 */
export const ExerciseProvider = ({ children, initialData = [] }) => {
  // State for managing exercises and video display
  const [exercises, setExercises] = useState(initialData)
  const [showVideo, setShowVideo] = useState(false)

  /**
   * Updates a specific exercise's data
   * @param {number} id - Exercise ID to update
   * @param {Object} updates - New properties to merge with existing exercise data
   */
  const updateExercise = (id, updates) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => (exercise.id === id ? { ...exercise, ...updates } : exercise))
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
  return (
    <ExerciseContext.Provider 
      value={{ 
        exercises, 
        updateExercise, 
        showVideo, 
        toggleVideo 
      }}
    >
      {children}
    </ExerciseContext.Provider>
  )
}

