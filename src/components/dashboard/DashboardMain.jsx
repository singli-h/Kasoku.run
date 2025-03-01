"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Play, CheckCircle, Circle, Video, VideoOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ExerciseProvider, useExerciseContext } from "./ExerciseContext"
import { ExerciseType } from "../../types/exercise"

// Video Player Component
const VideoPlayer = ({ url }) => {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
      <video
        className="w-full h-full"
        controls
        preload="none"
        poster="/video-placeholder.jpg"
      >
        <source src={url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

// Exercise Card Component
const ExerciseCard = ({ exercise, onComplete }) => {
  const { updateExercise } = useExerciseContext()
  const [completed, setCompleted] = useState(exercise.exercise_training_details.every((detail) => detail.completed))
  const { showVideo } = useExerciseContext()

  useEffect(() => {
    setCompleted(exercise.exercise_training_details.every((detail) => detail.completed))
  }, [exercise])

  const handleComplete = () => {
    const newCompleted = !completed
    setCompleted(newCompleted)
    updateExercise(exercise.id, {
      exercise_training_details: exercise.exercise_training_details.map((detail) => ({
        ...detail,
        completed: newCompleted,
      })),
    })
    onComplete(exercise.id, newCompleted)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-md p-6 mb-4 transition-all duration-300 ${
        completed ? "bg-green-50 border-l-4 border-green-500" : "border-l-4 border-transparent"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          {exercise.preset_order}. {exercise.exercises.name}
        </h3>
        <button
          onClick={handleComplete}
          className="w-10 h-10 flex items-center justify-center focus:outline-none transition-transform duration-300 transform hover:scale-110"
        >
          {completed ? (
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
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 mb-4"
        >
          <Play className="w-4 h-4 mr-2" />
          Watch Demo
        </a>
      )}
      <div className="space-y-4">
        {exercise.exercise_training_details.map((detail, index) => (
          <div key={detail.id} className="border-t pt-4 first:border-t-0 first:pt-0">
            <h4 className="font-medium text-gray-700 mb-2">Set {index + 1}</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Reps (always shown) */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Reps</label>
                <input
                  type="number"
                  defaultValue={detail.reps}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg h-12 px-3"
                />
              </div>

              {/* Weight (if applicable) */}
              {detail.weight !== null && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <input
                    type="number"
                    defaultValue={detail.weight}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg h-12 px-3"
                  />
                </div>
              )}

              {/* Power (if applicable) */}
              {detail.power !== null && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Power</label>
                  <input
                    type="number"
                    defaultValue={detail.power}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg h-12 px-3"
                  />
                </div>
              )}

              {/* Velocity (if applicable) */}
              {detail.velocity !== null && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Velocity</label>
                  <input
                    type="number"
                    defaultValue={detail.velocity}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg h-12 px-3"
                  />
                </div>
              )}

              {/* Rest Time (if applicable) */}
              {detail.rest_time !== null && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Rest (s)</label>
                  <input
                    type="number"
                    defaultValue={detail.rest_time}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg h-12 px-3"
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

// Superset Container Component
const SupersetContainer = ({ exercises, onToggleAll }) => {
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
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
            allCompleted ? "bg-green-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {allCompleted ? "Unmark All" : "Mark All"}
        </button>
      </div>
      <AnimatePresence>
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} onComplete={handleExerciseComplete} />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

// Exercise Type Section Component
const ExerciseTypeSection = ({ type, exercises, supersets, onToggleAll }) => {
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
                return <ExerciseCard key={item.id} exercise={item} onComplete={handleExerciseComplete} />
              } else if (item.itemType === "superset") {
                return (
                  <SupersetContainer
                    key={`superset-${item.id}`}
                    exercises={item.exercises}
                    onToggleAll={(exerciseIds, completed) => {
                      exerciseIds.forEach((id) => handleExerciseComplete(id, completed))
                    }}
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

// Main Dashboard Component
const ExerciseDashboard = ({ session, onSave, onComplete, isReadOnly }) => {
  const { exercises, updateExercise, showVideo, toggleVideo } = useExerciseContext()

  // 1. Sort exercises by order
  const sortedExercises = [...exercises].sort((a, b) => a.preset_order - b.preset_order)

  // 2. Group exercises and supersets while preserving order
  const groupExercises = (sortedExercises) => {
    const groups = []
    let currentGroup = null
    let currentSuperset = null

    sortedExercises.forEach((exercise) => {
      const exerciseType = exercise.exercises.exercise_type_id
      const type = (() => {
        switch (exerciseType) {
          case ExerciseType.WarmUp:
            return "warm up"
          case ExerciseType.Gym:
            return "gym"
          case ExerciseType.Circuit:
            return "circuit"
          case ExerciseType.Isometric:
            return "isometric"
          case ExerciseType.Plyometric:
            return "plyometric"
          case ExerciseType.Sprint:
            return "sprint"
          case ExerciseType.Drill:
            return "drill"
          default:
            return "other"
        }
      })()

      if (exercise.superset_id) {
        if (currentSuperset && currentSuperset.id === exercise.superset_id) {
          // Add to existing superset
          currentSuperset.exercises.push(exercise)
        } else {
          // Start a new superset
          currentSuperset = { type: "superset", id: exercise.superset_id, exercises: [exercise] }
          groups.push(currentSuperset)
        }
        currentGroup = null
      } else {
        if (currentGroup && currentGroup.type === type) {
          // Add to existing group of the same type
          currentGroup.exercises.push(exercise)
        } else {
          // Start a new group
          currentGroup = { type, exercises: [exercise] }
          groups.push(currentGroup)
        }
        currentSuperset = null
      }
    })

    return groups
  }

  // 3. Merge adjacent gym and superset groups
  const mergeGymGroups = (groups) => {
    const finalGroups = []
    let currentGymGroup = null

    groups.forEach((group, index) => {
      if (group.type === "gym") {
        if (currentGymGroup) {
          // Merge with existing gym group
          currentGymGroup.exercises.push(...group.exercises)
        } else {
          // Start a new gym group
          currentGymGroup = { type: "gymMerged", exercises: [...group.exercises] }
          finalGroups.push(currentGymGroup)
        }
      } else if (group.type === "superset") {
        const prevGroup = groups[index - 1]
        const nextGroup = groups[index + 1]
        const isAdjacentToGym =
          (prevGroup && prevGroup.type === "gym") ||
          (nextGroup && nextGroup.type === "gym") ||
          (currentGymGroup &&
            Math.abs(
              currentGymGroup.exercises[currentGymGroup.exercises.length - 1].preset_order - group.exercises[0].preset_order,
            ) === 1)

        if (isAdjacentToGym) {
          // Merge entire superset with the adjacent gym group
          if (currentGymGroup) {
            const insertIndex = currentGymGroup.exercises.findIndex((ex) => ex.preset_order > group.exercises[0].preset_order)
            if (insertIndex === -1) {
              currentGymGroup.exercises.push(...group.exercises)
            } else {
              currentGymGroup.exercises.splice(insertIndex, 0, ...group.exercises)
            }
          } else {
            // This shouldn't happen, but just in case
            currentGymGroup = { type: "gymMerged", exercises: [...group.exercises] }
            finalGroups.push(currentGymGroup)
          }
        } else {
          // Standalone superset
          finalGroups.push(group)
          currentGymGroup = null
        }
      } else {
        // Other exercise types
        finalGroups.push(group)
        currentGymGroup = null
      }
    })

    // Sort exercises within each group
    finalGroups.forEach((group) => {
      group.exercises.sort((a, b) => a.preset_order - b.preset_order)
    })

    return finalGroups
  }

  const initialGroups = groupExercises(sortedExercises)
  const finalGroups = mergeGymGroups(initialGroups)

  const handleSectionToggle = (exerciseIds, completed) => {
    exerciseIds.forEach((id) => {
      updateExercise(id, {
        exercise_training_details: exercises
          .find((e) => e.id === id)
          .exercise_training_details.map((detail) => ({
            ...detail,
            completed,
          })),
      })
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-800">{session.details.exercise_preset_groups.name}</h1>
          <p className="text-xl text-gray-600">
            Week {session.details.exercise_preset_groups.week}, Day {session.details.exercise_preset_groups.day}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 mr-2">Show Videos</span>
          <button
            onClick={toggleVideo}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              showVideo
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {showVideo ? (
              <Video className="w-8 h-8" />
            ) : (
              <VideoOff className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      {finalGroups.map((group, index) => {
        if (group.type === "gymMerged") {
          const gymExercises = group.exercises.filter((e) => !e.superset_id)
          const supersets = group.exercises
            .filter((e) => e.superset_id)
            .reduce((acc, exercise) => {
              const existingSuperset = acc.find((s) => s.id === exercise.superset_id)
              if (existingSuperset) {
                existingSuperset.exercises.push(exercise)
              } else {
                acc.push({ id: exercise.superset_id, exercises: [exercise] })
              }
              return acc
            }, [])

          return (
            <ExerciseTypeSection
              key={`gym-merged-${index}`}
              type="Gym"
              exercises={gymExercises}
              supersets={supersets}
              onToggleAll={(exerciseIds, completed) => handleSectionToggle(exerciseIds, completed)}
            />
          )
        } else if (group.type === "superset") {
          return (
            <SupersetContainer
              key={`superset-${group.id}`}
              exercises={group.exercises}
              onToggleAll={(exerciseIds, completed) => handleSectionToggle(exerciseIds, completed)}
            />
          )
        } else {
          return (
            <ExerciseTypeSection
              key={`${group.type}-${index}`}
              type={group.type}
              exercises={group.exercises}
              supersets={[]}
              onToggleAll={(exerciseIds, completed) => handleSectionToggle(exerciseIds, completed)}
            />
          )
        }
      })}

      {!isReadOnly && session.details.status === 'ongoing' && (
        <div className="mt-12 flex justify-end space-x-4">
          <button 
            onClick={onSave}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Save Progress
          </button>
          <button 
            onClick={onComplete}
            className="bg-green-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-green-600 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Complete Session
          </button>
        </div>
      )}
    </div>
  )
}

const WrappedExerciseDashboard = ({ session, onSave, onComplete, isReadOnly }) => (
  <ExerciseProvider initialData={session?.details?.exercise_preset_groups?.exercise_presets}>
    <ExerciseDashboard 
      session={session}
      onSave={onSave}
      onComplete={onComplete}
      isReadOnly={isReadOnly}
    />
  </ExerciseProvider>
)

export default WrappedExerciseDashboard

