"use client"

import { useState } from "react"
import { Minus, Dumbbell, X, Plus, Search, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * SupersetContainer Component
 * 
 * Manages a group of exercises as a superset with horizontal layout
 * 
 * @param {Object} props - Component props
 * @param {string} props.supersetId - Unique identifier for this superset
 * @param {Array} props.exercises - Array of exercises in this superset
 * @param {Function} props.onRemoveFromSuperset - Function to remove an exercise from the superset
 * @param {Function} props.onExitSuperset - Function to break up the superset
 * @param {Function} props.handleRemoveExercise - Function to completely remove an exercise
 * @param {Function} props.onAddExerciseToSuperset - Function to add a new exercise to the superset
 * @param {Array} props.availableExercises - Array of exercises that can be added to the superset
 * @param {boolean} props.isDraggable - Whether the superset is draggable
 */
const SupersetContainer = ({
  supersetId,
  exercises,
  onRemoveFromSuperset,
  onExitSuperset,
  handleRemoveExercise,
  sessionId,
  sectionId,
  onAddExerciseToSuperset,
  availableExercises = [],
  isDraggable = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle remove exercise safely
  const handleRemove = (exerciseId, sessionId, sectionId) => {
    if (handleRemoveExercise && typeof handleRemoveExercise === 'function') {
      handleRemoveExercise(exerciseId, sessionId, sectionId);
    }
  };

  // Handle remove from superset safely
  const handleRemoveFromSuperset = (supersetId, exerciseId) => {
    if (onRemoveFromSuperset && typeof onRemoveFromSuperset === 'function') {
      onRemoveFromSuperset(supersetId, exerciseId);
    }
  };

  // Filter available exercises based on search term
  const filteredAvailableExercises = availableExercises.filter(
    exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.category && exercise.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exercise.type && exercise.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div 
      className={cn(
        "border-2 border-blue-400 rounded-lg p-3 mt-2 mb-4 relative bg-gradient-to-r from-blue-50/40 to-indigo-50/40 transition-all duration-200",
        isHovered && "border-blue-500 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 shadow-md",
        isDraggable && "cursor-grab active:cursor-grabbing"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Superset Header with Badge */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200">
        <div className="flex items-center gap-2">
          {isDraggable && (
            <GripVertical className="h-5 w-5 text-blue-400" />
          )}
          <Dumbbell className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-blue-700">Superset</span>
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-semibold">
            {exercises.length} exercises
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {exercises.length < 6 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => setShowAddExercise(!showAddExercise)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-xs">Add Exercise</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={() => onExitSuperset(supersetId)}
          >
            <X className="h-4 w-4 mr-1" />
            <span className="text-xs">Exit Superset</span>
          </Button>
        </div>
      </div>

      {/* Add Exercise Panel */}
      {showAddExercise && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="w-4 h-4 text-blue-500" />
            <Input
              type="text"
              placeholder="Search exercises to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto">
            {filteredAvailableExercises.slice(0, 12).map(exercise => (
              <div 
                key={exercise.id}
                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 cursor-pointer"
                onClick={() => {
                  onAddExerciseToSuperset(exercise, supersetId);
                  setShowAddExercise(false);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium text-xs truncate">{exercise.name}</div>
                  <div className="flex items-center mt-1 gap-1">
                    {exercise.type !== sectionId && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-blue-100 text-blue-700">
                        {exercise.type}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                      {exercise.category}
                    </Badge>
                  </div>
                </div>
                <Plus className="h-3 w-3 text-blue-500 ml-1 flex-shrink-0" />
              </div>
            ))}
            
            {filteredAvailableExercises.length === 0 && (
              <div className="col-span-3 text-center py-2 text-sm text-gray-500">
                No matching exercises found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add a visual indicator for grouped exercises */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 h-[calc(100%-20px)] w-1 bg-blue-400 rounded-full"></div>

      {/* Superset Exercises (Horizontal Layout) */}
      <div className="flex flex-wrap gap-2">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className="flex-1 min-w-[200px] border rounded-md p-3 bg-white relative group hover:border-blue-300 hover:shadow-sm transition-all"
          >
            {/* Add order indicator */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-5 w-5 bg-blue-400 rounded-full flex items-center justify-center text-xs text-white font-bold">
              {index + 1}
            </div>
            
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium truncate">{exercise.name}</p>
                <Minus
                  className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  onClick={() => handleRemove(exercise.id, sessionId, sectionId)}
                />
              </div>
              
              <Badge variant="outline" className="self-start mb-2">
                {exercise.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      {/* Hints for the user */}
      {isHovered && exercises.length < 6 && !showAddExercise && (
        <div className="mt-2 text-xs text-blue-600 italic text-center">
          You can add up to {6 - exercises.length} more exercise{exercises.length < 5 ? 's' : ''} to this superset
        </div>
      )}
    </div>
  );
};

export default SupersetContainer; 