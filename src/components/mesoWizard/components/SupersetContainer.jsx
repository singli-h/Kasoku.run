"use client"

import { useState, useEffect, useRef, memo } from "react"
import { ChevronRight, ChevronDown, X, Plus, GripVertical, Minus, MoreHorizontal, MoveDown, MoveUp } from "lucide-react"
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
 * @param {Object} props.dragHandleProps - Drag handle props
 * @param {Function} props.onMoveSuperset - Function to move the superset up or down
 * @param {boolean} props.disableMoveUp - Whether the move up option should be disabled
 * @param {boolean} props.disableMoveDown - Whether the move down option should be disabled
 */
const SupersetContainer = memo(({
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
  dragHandleProps = {},
  onMoveSuperset,
  disableMoveUp = false,
  disableMoveDown = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showExerciseSelector, setShowExerciseSelector] = useState(needsMoreExercises) // Auto-open selector if needs more exercises
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  
  // Show the exercise selector if the needsMoreExercises prop changes
  useEffect(() => {
    if (needsMoreExercises) {
      setShowExerciseSelector(true);
    }
  }, [needsMoreExercises]);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target) && 
          !buttonRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleMenuItemClick = (callback) => {
    return (e) => {
      e.stopPropagation();
      callback();
      setIsMenuOpen(false);
    };
  };

  // Optimize by not applying unnecessary styles during drag
  const containerClassName = cn(
    "border-2 rounded-md mb-2 overflow-visible relative",
    "border-blue-300 bg-blue-50/80",
    isExpanded ? "bg-opacity-100" : "bg-opacity-0",
    "transition-colors", // Only transition colors, not all properties
    isDraggable ? "hover:shadow-md" : "",
    isDragging ? "shadow-xl" : ""
  );

  // Only use necessary style properties for drag
  const containerStyle = {
    zIndex: isDraggable ? (isDragging ? 99 : 5) : 'auto',
    // Improve performance by applying hardware acceleration during drag
    ...(isDragging ? {
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden'
    } : {})
  };

  return (
    <Card 
      className={containerClassName}
      style={containerStyle}
      data-superset="true"
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-3 border-b",
        "bg-blue-100/80 border-blue-300"
      )}>
        <div className="flex items-center gap-2">
          {isDraggable && (
            <div className="cursor-grab" {...dragHandleProps}>
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
              Superset {displayNumber} ({exercises.length} exercises)
              {needsMoreExercises && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                  Add more exercises
                </span>
              )}
            </span>
          </button>
        </div>
        
        {/* Options Menu */}
        <div className="relative">
          <Button 
            ref={buttonRef}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-blue-600 hover:bg-blue-100"
            onClick={toggleMenu}
          >
            <MoreHorizontal className="h-4 w-4 mr-1" />
            <span className="text-xs">Options</span>
          </Button>
          
          {isMenuOpen && (
            <div 
              ref={menuRef}
              className="absolute right-0 mt-1 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000] animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* Superset Options Header */}
              <div className="px-4 py-2 text-sm font-semibold">
                Superset Options
              </div>
              
              {/* Main Actions */}
              <div className="px-1 py-1">
                <button
                  className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={handleMenuItemClick(() => setShowExerciseSelector(true))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exercise
                </button>
              </div>
              
              {/* Move Options */}
              {onMoveSuperset && (
                <div className="px-1 py-1">
                  <button
                    className={`group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                      disableMoveUp 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    onClick={disableMoveUp ? undefined : handleMenuItemClick(() => onMoveSuperset(supersetId, 'up'))}
                  >
                    <MoveUp className="mr-2 h-4 w-4" />
                    Move Up
                  </button>
                  
                  <button
                    className={`group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                      disableMoveDown 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    onClick={disableMoveDown ? undefined : handleMenuItemClick(() => onMoveSuperset(supersetId, 'down'))}
                  >
                    <MoveDown className="mr-2 h-4 w-4" />
                    Move Down
                  </button>
                </div>
              )}
              
              {/* Remove Action */}
              <div className="px-1 py-1">
                <button
                  className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-red-50 hover:text-red-700"
                  onClick={handleMenuItemClick(() => onExitSuperset(supersetId))}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Superset
                </button>
              </div>
            </div>
          )}
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
          
          {/* Exercises in this superset */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div 
                  key={exercise.id}
                  className="border rounded-md p-2 bg-white flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <span className="text-xs text-gray-500">{exercise.category}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-500"
                    onClick={() => onRemoveFromSuperset(supersetId, exercise.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {exercises.length === 0 && (
            <div className="text-center p-4">
              <p className="text-sm text-gray-500">No exercises in this superset yet</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

SupersetContainer.displayName = "SupersetContainer";

export default SupersetContainer; 