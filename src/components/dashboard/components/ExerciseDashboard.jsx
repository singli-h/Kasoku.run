"use client"

import React, { useCallback } from "react"
import { Video, VideoOff, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { useExerciseContext } from "../ExerciseContext"
import ExerciseTypeSection from "./ExerciseTypeSection"
import SupersetContainer from "./SupersetContainer"
import { ExerciseType } from "../../../types/exercise"

/**
 * Main Dashboard Component
 * Integrates all exercise components and handles overall session management
 */
const ExerciseDashboard = ({ 
  session, 
  onSave, 
  onComplete, 
  updateExerciseDetails,
  updateExerciseTrainingDetails
}) => {
  const { exercises, updateExercise, showVideo, toggleVideo } = useExerciseContext()

  // Get session status
  const sessionStatus = session?.details?.status || 'unknown';

  // Status display configuration
  const statusConfig = {
    assigned: {
      color: 'bg-blue-100 text-blue-800',
      border: 'border-blue-500',
      icon: <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />,
      label: 'Assigned'
    },
    ongoing: {
      color: 'bg-amber-100 text-amber-800',
      border: 'border-amber-500',
      icon: <Clock className="w-5 h-5 text-amber-500 mr-2" />,
      label: 'In Progress'
    },
    completed: {
      color: 'bg-green-100 text-green-800',
      border: 'border-green-500',
      icon: <CheckCircle className="w-5 h-5 text-green-500 mr-2" />,
      label: 'Completed'
    },
    unknown: {
      color: 'bg-gray-100 text-gray-800',
      border: 'border-gray-500',
      icon: <AlertCircle className="w-5 h-5 text-gray-500 mr-2" />,
      label: 'Unknown Status'
    }
  };

  const currentStatus = statusConfig[sessionStatus];

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

  const handleSectionToggle = useCallback((exerciseIds, completed) => {
    const updatedExercises = exerciseIds.map(id => {
      const exercise = exercises.find(e => e.id === id);
      const updatedExercise = {
        ...exercise,
        exercise_training_details: exercise.exercise_training_details.map(detail => ({
          ...detail,
          completed
        }))
      };
      
      // Update in ExerciseContext
      updateExercise(id, updatedExercise);
      
      return updatedExercise;
    });

    // Update in session state
    updateExerciseDetails("", updatedExercises);
  }, [exercises, updateExercise, updateExerciseDetails]);

  const handleExerciseUpdate = useCallback((exerciseId, updatedExercise) => {
    // Update in ExerciseContext
    updateExercise(exerciseId, updatedExercise);
    
    // Update in flat training details array for saving
    updateExerciseTrainingDetails(exerciseId, updatedExercise.exercise_training_details);
  }, [updateExercise, updateExerciseTrainingDetails]);

  const handleSave = async () => {
    try {
      // Save the session without notifications
      const result = await onSave();
      return result;
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  }
  
  const handleComplete = async () => {
    try {
      // Complete or amend the session without notifications
      const result = await onComplete();
      return result;
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen relative">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-800">{session.details.exercise_preset_groups.name}</h1>
          <div className="flex items-center gap-4">
            <p className="text-xl text-gray-600">
              Week {session.details.exercise_preset_groups.week}, Day {session.details.exercise_preset_groups.day}
            </p>
            {/* Session Status Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${currentStatus.color} ${currentStatus.border} border text-sm font-medium`}>
              {currentStatus.icon}
              {currentStatus.label}
            </div>
          </div>
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
          // const supersets = group.exercises
          //   .filter(ex => ex.supersetId)
          //   .reduce((acc, ex) => {
          //     // Add to existing superset or create new one
          //     const existingSuperset = acc.find(s => s.id === ex.supersetId)
          //     if (existingSuperset) {
          //       existingSuperset.exercises.push(ex)
          //     } else {
          //       acc.push({
          //         id: ex.supersetId,
          //         exercises: [ex],
          //         type: "superset"
          //       })
          //     }
          //     return acc
          //   }, [])

          return (
            <ExerciseTypeSection
              key={`gym-merged-${index}`}
              type="Gym"
              exercises={gymExercises}
              onToggleAll={handleSectionToggle}
              onExerciseUpdate={handleExerciseUpdate}
              isSessionCompleted={false} // Always set to false to remove disabled feature
            />
          )
        } else if (group.type === "superset") {
          return (
            <SupersetContainer
              key={`superset-${group.id}`}
              exercises={group.exercises}
              onToggleAll={handleSectionToggle}
              onExerciseUpdate={handleExerciseUpdate}
              isSessionCompleted={false} // Always set to false to remove disabled feature
            />
          )
        } else {
          // Render the leftover sections that weren't merged
          if (group.type === "warmup") {
            return (
              <ExerciseTypeSection
                key={`warmup-${index}`}
                type="Warmup"
                exercises={group.exercises}
                onToggleAll={handleSectionToggle}
                onExerciseUpdate={handleExerciseUpdate}
                isSessionCompleted={false} // Always set to false to remove disabled feature
              />
            )
          } else {
            return (
              <ExerciseTypeSection
                key={`${group.type}-${index}`}
                type={group.type}
                exercises={group.exercises}
                onToggleAll={handleSectionToggle}
                onExerciseUpdate={handleExerciseUpdate}
                isSessionCompleted={false} // Always set to false to remove disabled feature
              />
            )
          }
        }
      })}


        <div className="mt-12 flex justify-end space-x-4">
          {sessionStatus !== 'completed' && (
            <button 
              onClick={handleSave}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Save Progress
            </button>
          )}
          <button 
            onClick={handleComplete}
            className="bg-green-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-green-600 transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {sessionStatus === 'completed' ? 'Amend Session' : 'Complete Session'}
          </button>
        </div>
    </div>
  )
}

export default ExerciseDashboard