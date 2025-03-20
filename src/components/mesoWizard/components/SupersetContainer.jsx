"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, X, Plus, GripVertical, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import ExerciseSelector from "./ExerciseSelector"

/**
 * SupersetContainer Component
 * 
 * Displays a superset of exercises with the ability to add/remove exercises
 * 
 * @param {Object} props - Component props
 * @param {string} props.supersetId - ID of the superset
 * @param {Array} props.exercises - Exercises in the superset
 * @param {Function} props.onRemoveFromSuperset - Function to remove an exercise from the superset
 * @param {Function} props.onExitSuperset - Function to completely exit the superset
 * @param {Function} props.onAddExerciseToSuperset - Function to add an exercise to the superset
 * @param {Array} props.availableExercises - Available exercises to add
 * @param {boolean} props.isDraggable - Whether the superset is draggable
 * @param {number} props.displayNumber - The display number for the superset
 * @param {boolean} props.needsMoreExercises - Whether the superset needs more exercises
 * @param {boolean} props.isDragging - Whether the superset is being dragged
 */
const SupersetContainer = ({
  supersetId,
  exercises = [],
  onRemoveFromSuperset,
  onExitSuperset,
  sectionId,
  onAddExerciseToSuperset,
  availableExercises = [],
  isDraggable = false,
  displayNumber = 1,
  needsMoreExercises = exercises.length < 2,
  isDragging = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showExerciseSelector, setShowExerciseSelector] = useState(needsMoreExercises) // Auto-open selector if needs more exercises
  
  // Show the exercise selector if the needsMoreExercises prop changes
  useEffect(() => {
    if (needsMoreExercises) {
      setShowExerciseSelector(true);
    }
  }, [needsMoreExercises]);

  return (
    <Card className={cn(
      "border-2 rounded-md mb-2 overflow-visible relative",
      "border-blue-300 bg-blue-50/80",
      isExpanded ? "bg-opacity-100" : "bg-opacity-0",
      "transition-all duration-200",
      isDraggable ? "hover:shadow-md" : "",
      isDragging ? "shadow-xl" : ""
    )}
    style={{
      zIndex: isDraggable ? (isDragging ? 9999 : 5) : 'auto',
      position: 'relative'
    }}
    data-superset="true"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b",
        "bg-blue-100/80 border-blue-300"
      )}>
        <div className="flex items-center gap-2">
          {isDraggable && (
            <div className="cursor-grab">
              <GripVertical className="h-4 w-4 text-blue-500" />
            </div>
          )}
          <button
            type="button"
            className="flex items-center gap-1 text-blue-700 font-medium"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="flex items-center">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-300 w-5 h-5 text-xs text-blue-800 mr-1.5">
                {displayNumber}
              </span>
              Superset ({exercises.length} exercises)
              {needsMoreExercises && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                  Add more exercises
                </span>
              )}
            </span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 hover:bg-blue-100 text-blue-600 hover:text-blue-800"
            onClick={() => setShowExerciseSelector(!showExerciseSelector)}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs">Add</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-red-600 hover:text-red-800 hover:bg-red-100"
            onClick={() => onExitSuperset(supersetId)}
          >
            <X className="h-4 w-4 mr-1" />
            <span className="text-xs">Exit Superset</span>
          </Button>
        </div>
      </div>
      
      {/* Body - only show when expanded */}
      {isExpanded && (
        <div className="p-2 space-y-2">
          {/* Inline exercise selector */}
          {showExerciseSelector && (
            <div className="mb-4 bg-white p-3 rounded-md border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-700">
                  {needsMoreExercises 
                    ? "Add at least one more exercise to complete the superset"
                    : "Add Exercise to Superset"
                  }
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowExerciseSelector(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ExerciseSelector
                sectionId={sectionId}
                exercises={exercises}
                allExercises={availableExercises}
                handleAddExercise={(exercise) => {
                  onAddExerciseToSuperset(exercise, supersetId, sectionId);
                  if (exercises.length >= 1) {
                    setShowExerciseSelector(false);
                  }
                }}
                isForSuperset={true}
              />
            </div>
          )}
          
          {/* Show "Add Exercise" button at the top when not showing the exercise selector */}
          {!showExerciseSelector && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => setShowExerciseSelector(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {needsMoreExercises 
                ? "Add More Exercises"
                : "Add Exercise to Superset"
              }
            </Button>
          )}
          
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{exercise.name}</div>
                <div className="flex mt-1 items-center">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] mr-2">
                    {exercise.part || exercise.type || "General"}
                  </span>
                  <span className="text-xs text-gray-500">{exercise.category || "General"}</span>
                </div>
              </div>
              
              <Minus 
                className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                onClick={() => onRemoveFromSuperset(supersetId, exercise.id)}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default SupersetContainer 