"use client"

import React, { useCallback } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Play } from "lucide-react"
import { useExerciseContext } from "../ExerciseContext"
import VideoPlayer from "./VideoPlayer"
import SetRow from "./SetRow"

/**
 * ExerciseCard Component
 * Displays an individual exercise with its training details and input fields
 * in a compact, table-based layout
 */
const ExerciseCard = ({ exercise, onComplete, onExerciseUpdate }) => {
  const { showVideo } = useExerciseContext()

  // Calculate completion status based on all training details
  const isCompleted = exercise.exercise_training_details.every((detail) => detail.completed)

  const handleComplete = useCallback(() => {
    const newCompleted = !isCompleted
    
    // Create a new array of updated training details
    const updatedTrainingDetails = exercise.exercise_training_details.map((detail) => ({
      ...detail,
      completed: newCompleted,
    }))

    // Create the update object with all necessary properties
    const updateObject = {
      ...exercise,
      id: exercise.id,
      completed: newCompleted,
      exercise_training_details: updatedTrainingDetails,
    }

    // Update the exercise and notify parent components
    onExerciseUpdate(exercise.id, updateObject)
    onComplete(exercise.id, newCompleted)
  }, [exercise, isCompleted, onComplete, onExerciseUpdate])

  const handleInputChange = useCallback(
    (detailId, field, value) => {
      // Update only the specific training detail that changed
      const updatedDetails = exercise.exercise_training_details.map((detail) =>
        detail.id === detailId ? { ...detail, [field]: value } : detail
      )

      // Create the update object with all necessary properties
      const updateObject = {
        ...exercise,
        id: exercise.id,
        exercise_training_details: updatedDetails,
      }

      // Update the exercise
      onExerciseUpdate(exercise.id, updateObject)
    },
    [exercise, onExerciseUpdate]
  )

  // Calculate the number of visible columns for consistent layout
  const getVisibleColumnsCount = () => {
    if (!exercise.exercise_training_details.length) return 0;
    
    const detail = exercise.exercise_training_details[0];
    let count = 2; // Set and Reps are always visible
    
    if (detail.weight !== null) count++;
    if (detail.resistance_value !== null) count++;
    if (detail.power !== null) count++;
    if (detail.velocity !== null) count++;
    if (detail.rest_time !== null) count++;
    
    return count;
  }

  const visibleColumnsCount = getVisibleColumnsCount();
  const tableClass = visibleColumnsCount <= 4 ? "table-fixed" : "table-auto";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
        isCompleted ? "border-l-4 border-green-500" : "border-l-4 border-transparent"
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="mr-2">{exercise.preset_order}.</span>
            {exercise.exercises.name}
          </h3>
          <button
            onClick={handleComplete}
            className="w-8 h-8 flex items-center justify-center focus:outline-none transition-transform duration-300 transform hover:scale-110"
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {isCompleted ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Circle className="w-8 h-8 text-gray-400" />
            )}
          </button>
        </div>

        {showVideo ? (
          <VideoPlayer url={exercise.exercises.video_url} />
        ) : (
          exercise.exercises.video_url && (
            <a
              href={exercise.exercises.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300 mb-4"
            >
              <Play className="w-4 h-8 mr-1" />
              Watch Demo
            </a>
          )
        )}

        {exercise.notes && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
            <p className="text-sm text-gray-700">{exercise.notes}</p>
          </div>
        )}

        {exercise.exercise_training_details.length > 0 && (
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${tableClass}`}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left font-medium text-gray-500 w-10">Set</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Reps</th>
                  {exercise.exercise_training_details[0].weight !== null && (
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Weight</th>
                  )}
                  {exercise.exercise_training_details[0].resistance_value !== null && (
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Resistance</th>
                  )}
                  {exercise.exercise_training_details[0].power !== null && (
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Power</th>
                  )}
                  {exercise.exercise_training_details[0].velocity !== null && (
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Velocity</th>
                  )}
                  {exercise.exercise_training_details[0].rest_time !== null && (
                    <th className="px-2 py-2 text-left font-medium text-gray-500 w-20">Rest</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {exercise.exercise_training_details.map((detail, index) => (
                  <SetRow key={detail.id} detail={detail} index={index} onInputChange={handleInputChange} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ExerciseCard 