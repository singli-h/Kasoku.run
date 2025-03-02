"use client"

import React, { useCallback } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Play, Lock } from "lucide-react"
import { useExerciseContext } from "../ExerciseContext"
import VideoPlayer from "./VideoPlayer"
import InputWithUnit from "./InputWithUnit"
import RestTimeInput from "./RestTimeInput"

/**
 * ExerciseCard Component
 * Displays an individual exercise with its training details and input fields
 */
const ExerciseCard = ({ exercise, onComplete, onExerciseUpdate, isSessionCompleted = false }) => {
  const { updateExercise } = useExerciseContext()
  const { showVideo } = useExerciseContext()

  // Calculate completion status based on all training details
  const isCompleted = exercise.exercise_training_details.every((detail) => detail.completed)

  const handleComplete = useCallback(() => {
    // If session is completed, don't allow changes
    if (isSessionCompleted) return;
    
    const newCompleted = !isCompleted
    
    // Create a new array of updated training details
    const updatedTrainingDetails = exercise.exercise_training_details.map(detail => ({
      ...detail,
      id: detail.id,
      set_index: detail.set_index,
      reps: detail.reps,
      weight: detail.weight,
      power: detail.power,
      velocity: detail.velocity,
      rest_time: detail.rest_time,
      resistance_value: detail.resistance_value,
      completed: newCompleted
    }))

    // Create the complete update object
    const updateObject = {
      ...exercise,
      id: exercise.id,
      completed: newCompleted,
      exercise_training_details: updatedTrainingDetails
    }

    // Update both context and session state
    onExerciseUpdate(exercise.id, updateObject)

    // Notify parent component of completion status change
    onComplete(exercise.id, newCompleted)
  }, [exercise, isCompleted, onComplete, onExerciseUpdate, isSessionCompleted])

  const handleInputChange = useCallback((detailId, field, value) => {
    // If session is completed, don't allow changes
    if (isSessionCompleted) return;
    
    // Find the detail being updated
    const updatedDetails = exercise.exercise_training_details.map(detail =>
      detail.id === detailId
        ? { 
            ...detail, 
            [field]: value,
            // Ensure we preserve all the necessary fields
            id: detail.id,
            set_index: detail.set_index,
            reps: field === 'reps' ? value : detail.reps,
            weight: field === 'weight' ? value : detail.weight,
            power: field === 'power' ? value : detail.power,
            velocity: field === 'velocity' ? value : detail.velocity,
            rest_time: field === 'rest_time' ? value : detail.rest_time,
            resistance_value: field === 'resistance_value' ? value : detail.resistance_value,
            completed: detail.completed
          }
        : detail
    )

    // Create the complete update object with all necessary fields
    const updateObject = {
      ...exercise,
      id: exercise.id,
      exercise_training_details: updatedDetails
    }

    // Update both context and session state
    onExerciseUpdate(exercise.id, updateObject)
  }, [exercise, onExerciseUpdate, isSessionCompleted])

  const getGridColumns = (detail) => {
    // Count visible fields
    const visibleFields = [
      true, // Reps always shown
      detail.weight !== null,
      detail.power !== null,
      detail.velocity !== null,
      detail.rest_time !== null,
      detail.resistance_value !== null
    ].filter(Boolean).length;

    if (visibleFields <= 4) return 'grid-cols-4';
    if (visibleFields <= 5) return 'grid-cols-5';
    return 'grid-cols-5 md:grid-cols-6 lg:grid-cols-6';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-md p-6 mb-4 transition-all duration-300 ${
        isCompleted ? "border-l-4 border-r-4 border-green-500" : "border-l-4 border-r-4 border-transparent"
      } ${isSessionCompleted ? "bg-gray-50" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${isSessionCompleted ? "text-gray-600" : "text-gray-800"}`}>
          {exercise.preset_order}. {exercise.exercises.name}
          {isSessionCompleted && (
            <span className="ml-2 inline-flex items-center text-sm text-gray-500">
              <Lock className="w-4 h-4 mr-1" /> Locked
            </span>
          )}
        </h3>
        <button
          onClick={handleComplete}
          disabled={isSessionCompleted}
          className={`w-10 h-10 flex items-center justify-center focus:outline-none transition-transform duration-300 transform ${
            isSessionCompleted ? "cursor-not-allowed opacity-60" : "hover:scale-110" 
          }`}
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
          <a
            href={exercise.exercises.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 mb-4 ${
              isSessionCompleted ? "bg-blue-400 text-white" : "bg-blue-500 text-white"
            }`}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Demo
          </a>
      )}
      
      {exercise.notes !== null && exercise.notes !== "" && (
        <div className="pb-4">
            <div className="relative p-4 border border-gray-300 rounded shadow-sm bg-yellow-50">
              <div className="absolute top-0 left-0 h-full w-1 bg-yellow-400 rounded-r"></div>
              <p className="ml-4 text-gray-800 whitespace-pre-wrap">
                {exercise.notes}
              </p>
            </div>
        </div>
      )}

      <div className="space-y-4">
        {exercise.exercise_training_details.map((detail, index) => (
          <div key={detail.id} className="border-t pt-4 first:border-t-0 first:pt-0">
            <h4 className="font-medium text-gray-700 mb-2">Set {index + 1}</h4>
            <div className={`grid ${getGridColumns(detail)} gap-3 w-full`}>
              {/* Reps (always shown) */}
              <InputWithUnit
                label="Reps"
                value={detail.reps}
                onChange={(value) => handleInputChange(detail.id, 'reps', value)}
                disabled={isSessionCompleted}
              />

              {/* Weight (if applicable) */}
              {detail.weight !== null && (
                <InputWithUnit
                  label="Weight"
                  value={detail.weight}
                  unit="kg"
                  onChange={(value) => handleInputChange(detail.id, 'weight', value)}
                  disabled={isSessionCompleted}
                />
              )}

               {/* Resistance (if applicable) */}
               {detail.resistance_value !== null && (
                <InputWithUnit
                  label="Resistance"
                  value={detail.resistance_value}
                  unit="kg"
                  onChange={(value) => handleInputChange(detail.id, 'resistance_value', value)}
                  disabled={isSessionCompleted}
                />
              )}

              {/* Power (if applicable) */}
              {detail.power !== null && (
                <InputWithUnit
                  label="Power"
                  value={detail.power}
                  unit="W"
                  onChange={(value) => handleInputChange(detail.id, 'power', value)}
                  step={10}
                  disabled={isSessionCompleted}
                />
              )}

              {/* Velocity (if applicable) */}
              {detail.velocity !== null && (
                <InputWithUnit
                  label="Velocity"
                  value={detail.velocity}
                  unit="m/s"
                  onChange={(value) => handleInputChange(detail.id, 'velocity', value)}
                  step={0.1}
                  disabled={isSessionCompleted}
                />
              )}

              {/* Rest Time (if applicable) */}
              {detail.rest_time !== null && (
                <div>
                  <RestTimeInput
                    value={detail.rest_time}
                    onChange={(newValue) => handleInputChange(detail.id, 'rest_time', newValue)}
                    disabled={isSessionCompleted}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default ExerciseCard 