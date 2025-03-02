"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import ExerciseCard from "./ExerciseCard"
import SupersetContainer from "./SupersetContainer"

/**
 * ExerciseTypeSection Component
 * Groups exercises by their type (warmup, gym, etc.)
 */
const ExerciseTypeSection = ({ type, exercises, supersets, onToggleAll, onExerciseUpdate, isSessionCompleted = false }) => {
  const [isOpen, setIsOpen] = useState(true)
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    setAllCompleted(
      exercises.every((exercise) => exercise.exercise_training_details.every((detail) => detail.completed)) &&
        supersets.every((superset) =>
          superset.exercises.every((exercise) =>
            exercise.exercise_training_details.every((detail) => detail.completed),
          ),
        ),
    )
  }, [exercises, supersets])

  const handleToggleAll = (e) => {
    e.stopPropagation()
    const newCompleted = !allCompleted
    setAllCompleted(newCompleted)
    const allExerciseIds = [...exercises.map((e) => e.id), ...supersets.flatMap((s) => s.exercises.map((e) => e.id))]
    onToggleAll(allExerciseIds, newCompleted)
  }

  const handleExerciseComplete = (id, completed) => {
    setAllCompleted(
      exercises.every((exercise) =>
        exercise.id === id ? completed : exercise.exercise_training_details.every((detail) => detail.completed),
      ) &&
        supersets.every((superset) =>
          superset.exercises.every((exercise) =>
            exercise.id === id ? completed : exercise.exercise_training_details.every((detail) => detail.completed),
          ),
        ),
    )
  }

  // Compute a combined list of items with an order property
  const combinedItems = [
    ...exercises.map((ex) => ({ ...ex, itemType: "exercise" })),
    ...supersets.map((superset) => ({
      ...superset,
      itemType: "superset",
      order: Math.min(...superset.exercises.map((e) => e.preset_order)),
    })),
  ]

  // Sort the combined list by order
  combinedItems.sort((a, b) => a.preset_order - b.preset_order)

  return (
    <div className="mb-8">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-xl mb-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-shadow duration-300"
      >
        <h2 className="text-2xl font-bold capitalize text-gray-800">{type}</h2>
        <div className="flex items-center">
          <button
            onClick={handleToggleAll}
            className={`mr-4 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
              allCompleted ? "bg-green-500 text-white" : "bg-blue-500 text-white"
            }`}
          >
            {allCompleted ? "Unmark All" : "Mark All"}
          </button>
          {isOpen ? <ChevronUp className="w-8 h-8 text-gray-600" /> : <ChevronDown className="w-8 h-8 text-gray-600" />}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {combinedItems.map((item) => {
              if (item.itemType === "exercise") {
                return (
                  <ExerciseCard 
                    key={item.id} 
                    exercise={item} 
                    onComplete={handleExerciseComplete} 
                    onExerciseUpdate={onExerciseUpdate} 
                    isSessionCompleted={isSessionCompleted}
                  />
                )
              } else if (item.itemType === "superset") {
                return (
                  <SupersetContainer
                    key={`superset-${item.id}`}
                    exercises={item.exercises}
                    onToggleAll={(exerciseIds, completed) => {
                      exerciseIds.forEach((id) => handleExerciseComplete(id, completed))
                    }}
                    onExerciseUpdate={onExerciseUpdate}
                  />
                )
              }
              return null
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExerciseTypeSection 