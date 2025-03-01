"use client"

import { createContext, useContext, useState } from "react"

const ExerciseContext = createContext(null)

export const useExerciseContext = () => {
  const context = useContext(ExerciseContext)
  if (!context) {
    throw new Error("useExerciseContext must be used within an ExerciseProvider")
  }
  return context
}

export const ExerciseProvider = ({ children, initialData = [] }) => {
  const [exercises, setExercises] = useState(initialData)
  const [showVideo, setShowVideo] = useState(false)

  const updateExercise = (id, updates) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => (exercise.id === id ? { ...exercise, ...updates } : exercise))
    )
  }

  const toggleVideo = () => {
    setShowVideo(prev => !prev)
  }

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

