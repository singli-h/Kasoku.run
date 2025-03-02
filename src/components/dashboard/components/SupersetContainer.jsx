"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ExerciseCard from "./ExerciseCard"

/**
 * SupersetContainer Component
 * Groups related exercises into a superset
 */
const SupersetContainer = ({ exercises, onToggleAll, onExerciseUpdate, isSessionCompleted = false }) => {
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    setAllCompleted(
      exercises.every((exercise) => exercise.exercise_training_details.every((detail) => detail.completed)),
    )
  }, [exercises])

  const handleToggleAll = () => {
    const newCompleted = !allCompleted
    setAllCompleted(newCompleted)
    onToggleAll(
      exercises.map((e) => e.id),
      newCompleted,
    )
  }

  const handleExerciseComplete = (id, completed) => {
    setAllCompleted(
      exercises.every((exercise) =>
        exercise.id === id ? completed : exercise.exercise_training_details.every((detail) => detail.completed),
      ),
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-blue-800">Superset</h3>
        <button
          onClick={handleToggleAll}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            allCompleted ? "bg-green-500 text-white" : "bg-blue-500 text-white"
          }`}
          disabled={isSessionCompleted}
        >
          {allCompleted ? "Unmark All" : "Mark All"}
        </button>
      </div>
      <AnimatePresence>
        {exercises.map((exercise) => (
          <ExerciseCard 
            key={exercise.id} 
            exercise={exercise} 
            onComplete={handleExerciseComplete} 
            onExerciseUpdate={onExerciseUpdate} 
            isSessionCompleted={isSessionCompleted}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default SupersetContainer 