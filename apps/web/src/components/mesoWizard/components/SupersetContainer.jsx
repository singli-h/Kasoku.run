"use client"

import { useState, useEffect, useRef, memo, useMemo } from "react"
import { createPortal } from "react-dom"
import { ChevronRight, ChevronDown, X, Plus, GripVertical, Minus, MoreHorizontal, MoveDown, MoveUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import ExerciseSelector from "./ExerciseSelector"
import ExerciseItemFull from "./ExerciseItemFull"
import { Badge } from "@/components/ui/badge"

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
 * @param {string} props.menuDirection - The direction in which the menu should open
 * @param {string} props.mode - The mode of the superset
 * @param {Function} props.onChangeExerciseField - Function to change an exercise field
 * @param {Function} props.onChangeSetDetail - Function to change a set detail
 * @param {Function} props.onAddSet - Function to add a set
 * @param {Function} props.onRemoveSet - Function to remove a set
 * @param {Object} props.allErrors - All errors from parent, to be filtered
 * @param {Function} props.getSectionName - Function to get the section name
 */
const SupersetContainer = memo(({
  supersetId,
  exercises = [],
  onRemoveFromSuperset,
  onExitSuperset,
  sectionId,
  onAddExerciseToSuperset,
  availableExercises = [],
  loadingAvailableExercises,
  isDraggable = false,
  displayNumber = 1,
  needsMoreExercises = exercises.length < 2,
  isDragging = false,
  dragHandleProps = {},
  onMoveSuperset,
  disableMoveUp = false,
  disableMoveDown = false,
  menuDirection = "bottom",
  mode,
  onChangeExerciseField,
  onChangeSetDetail,
  onAddSet,
  onRemoveSet,
  allErrors,
  getSectionName
}) => {
  // Extract the base section type from instance ID (e.g., 'gym' from 'gym-1234567890')
  const sectionType = sectionId && sectionId.includes('-') 
    ? sectionId.split('-')[0] 
    : sectionId;

  const [isExpanded, setIsExpanded] = useState(true)
  const [showExerciseSelector, setShowExerciseSelector] = useState(needsMoreExercises) // Auto-open selector if needs more exercises
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuStyles, setMenuStyles] = useState({})
  const menuRef = useRef(null)
  const containerRef = useRef(null)
  
  // Show the exercise selector if the needsMoreExercises prop changes
  useEffect(() => {
    if (needsMoreExercises) {
      setShowExerciseSelector(true);
    }
  }, [needsMoreExercises]);
  
  // Calculate menu position relative to the container
  useEffect(() => {
    if (isMenuOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let top, left;
      if (menuDirection === "top") {
        // Position above the button
        top = rect.top - 10;
      } else {
        // Default: position below the button
        top = rect.bottom + 10;
      }
      // Align horizontally with the button
      left = rect.left;
      setMenuStyles({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
        width: "224px", // 56px * 4
      });
      console.log("SupersetContainer menu position calculated:", { top, left, rect });
    }
  }, [isMenuOpen, menuDirection]);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          containerRef.current && !containerRef.current.contains(event.target)) {
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
    console.log("Toggling superset menu. isMenuOpen before:", isMenuOpen);
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleMenuItemClick = (callback) => {
    return (e) => {
      e.stopPropagation();
      callback();
      setIsMenuOpen(false);
    };
  };

  // Render the menu content with portal
  const menuContent = isMenuOpen && (
    <div 
      ref={menuRef}
      className="w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000] animate-in fade-in-50 zoom-in-95 duration-100"
      style={menuStyles}
      onClick={(e) => e.stopPropagation()}
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
  );

  // Optimize by not applying unnecessary styles during drag
  const containerClassName = cn(
    "border-2 rounded-md mb-2 overflow-visible relative",
    "border-blue-300 bg-blue-50/80",
    isExpanded ? "bg-opacity-100" : "bg-opacity-0",
    "transition-colors", // Only transition colors, not all properties
    isDraggable ? "hover:shadow-md" : "",
    isDragging ? "shadow-xl" : "",
    needsMoreExercises && "border-dashed border-yellow-500"
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

  const handleSelectExerciseForSuperset = (exerciseDefinition) => {
    if (onAddExerciseToSuperset) {
      onAddExerciseToSuperset(exerciseDefinition, supersetId);
    }
    setShowExerciseSelector(false); // Close selector after adding
  };

  // Determine if this is a cross-section superset
  const isCrossSection = useMemo(() => {
    if (!exercises || exercises.length === 0) return false;
    // Check if any exercise in the superset belongs to a different original section
    // than the current host sectionId of this SupersetContainer.
    return exercises.some(ex => ex.current_section_id && ex.current_section_id !== sectionId);
  }, [exercises, sectionId]);

  // Main content: list of exercises or selector
  const content = (
    <div className="p-3 space-y-3">
      {isExpanded && exercises.map((exercise, index) => {
        // Filter errors for this specific exercise
        const exerciseErrors = {};
        if (allErrors) {
          for (const key in allErrors) {
            if (key.startsWith(`${exercise.ui_id}-`)) {
              const fieldPath = key.substring(exercise.ui_id.length + 1).replace(/^(set_\w+)-(\w+)$/, "$1_$2");
              exerciseErrors[fieldPath] = allErrors[key];
            }
          }
        }

        return (
          <ExerciseItemFull 
            key={exercise.ui_id || exercise.id || index} // Use a robust key
            exercise={exercise} 
            mode={mode} 
            onChangeExerciseField={onChangeExerciseField}
            onChangeSetDetail={onChangeSetDetail}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
            onRemoveExercise={() => onRemoveFromSuperset(supersetId, exercise.ui_id)}
            errors={exerciseErrors}
            hostSectionId={sectionId}
            getSectionName={getSectionName}
          />
        );
      })}
      
      {isExpanded && showExerciseSelector && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Add Exercise to Superset {displayNumber}</h4>
          <ExerciseSelector
            sectionId={sectionId} // Pass sectionId for context, selector might use its type
            exercises={exercises} // Pass current exercises in superset to avoid adding duplicates
            allExercises={availableExercises}
            handleAddExercise={handleSelectExerciseForSuperset} // Use the new handler
            isForSuperset={true}
          />
          <Button variant="ghost" size="sm" onClick={() => setShowExerciseSelector(false)} className="mt-2 text-blue-600">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card 
      className={cn(
        "border-2 rounded-lg shadow-sm transition-all duration-150 ease-in-out",
        isDragging ? "shadow-xl scale-105 border-blue-500" : "border-blue-300",
        isCrossSection ? "border-purple-500 bg-purple-50/50" : "bg-blue-50/50", // Style for cross-section
        needsMoreExercises && "border-dashed border-yellow-500"
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-t-lg cursor-pointer",
          isCrossSection ? "bg-purple-100 hover:bg-purple-200" : "bg-blue-100 hover:bg-blue-200",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2">
          {isDraggable && <GripVertical className="h-5 w-5 text-gray-500 cursor-grab" />}
          <h3 className="font-semibold text-sm text-gray-700">
            Superset {displayNumber}
            {isCrossSection && <span className="ml-2 text-xs text-purple-700 font-normal" title="Contains exercises from other sections">(Cross-Section)</span>}
          </h3>
          <Badge variant={isCrossSection ? "secondary" : "outline"} className={cn(
            "text-xs",
            isCrossSection ? "bg-purple-200 text-purple-800 border-purple-400" : "border-blue-400 text-blue-700"
          )}>
            {exercises.length} {exercises.length === 1 ? "Exercise" : "Exercises"}
          </Badge>
        </div>
        
        {/* Options Menu */}
        <div className="relative" ref={containerRef}>
          <div>
            <Button 
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-blue-600 hover:bg-blue-100"
              onClick={toggleMenu}
            >
              <MoreHorizontal className="h-4 w-4 mr-1" />
              <span className="text-xs">Options</span>
            </Button>
          </div>
          
          {isMenuOpen && typeof document !== 'undefined' && createPortal(menuContent, document.body)}
        </div>
      </div>
      
      {/* Body - only show when expanded */}
      {isExpanded && content}
    </Card>
  );
});

SupersetContainer.displayName = "SupersetContainer";

export default SupersetContainer; 