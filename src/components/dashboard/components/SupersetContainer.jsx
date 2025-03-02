"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import ExerciseCard from "./ExerciseCard"

/**
 * SupersetContainer Component
 * Groups related exercises into a superset
 * Simplified version without the toggle all button
 */
const SupersetContainer = ({ exercises, onToggleAll, onExerciseUpdate }) => {
  const handleExerciseComplete = (id, completed) => {
    // Individual exercise completion is tracked and passed to parent
    const exerciseIds = [id];
    onToggleAll(exerciseIds, completed);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 mb-8 relative"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-blue-800">
          Superset
        </h3>
      </div>

      <AnimatePresence>
        {exercises.map((exercise) => (
          <ExerciseCard 
            key={exercise.id} 
            exercise={exercise} 
            onComplete={handleExerciseComplete} 
            onExerciseUpdate={onExerciseUpdate} 
            isSessionCompleted={false} // Always pass false to remove disabled feature
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default SupersetContainer 