"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * ExerciseSelector Component
 * 
 * Provides a search interface for selecting exercises
 * 
 * @param {Object} props - Component props
 * @param {string} props.sectionId - ID of the section
 * @param {Array} props.exercises - Already added exercises
 * @param {Array} props.allExercises - All available exercises
 * @param {Function} props.handleAddExercise - Function to add an exercise 
 * @param {boolean} props.isForSuperset - Whether this selector is for a superset
 */
const ExerciseSelector = ({
  sectionId,
  exercises = [],
  allExercises = [],
  handleAddExercise,
  isForSuperset = false
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredExercise, setHoveredExercise] = useState(null)
  const [tooltipData, setTooltipData] = useState(null)
  const hoverTimerRef = useRef(null)
  
  // Filter exercises based on section type and search term
  const filteredExercises = useMemo(() => {
    // If in superset mode, don't filter by section type
    const typeFiltered = isForSuperset 
      ? allExercises
      : allExercises.filter(ex => ex.type === sectionId);
    
    if (!searchTerm.trim()) {
      return typeFiltered;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return typeFiltered.filter(ex => 
      ex.name.toLowerCase().includes(lowerSearchTerm) ||
      (ex.category && ex.category.toLowerCase().includes(lowerSearchTerm))
    );
  }, [allExercises, searchTerm, sectionId, isForSuperset]);

  // Debounce search input
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);
  
  // Handle mouse enter for tooltip
  const handleMouseEnter = useCallback((exercise, e) => {
    clearTimeout(hoverTimerRef.current);
    
    // Store the target button for position calculation
    const button = e?.currentTarget;
    if (!button) return;
    
    hoverTimerRef.current = setTimeout(() => {
      setHoveredExercise(exercise);
      
      // Calculate button position
      if (button && typeof button.getBoundingClientRect === 'function') {
        const rect = button.getBoundingClientRect();
        // Store all needed data
        setTooltipData({
          buttonRect: {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          exercise
        });
      }
    }, 300);
  }, []);
  
  // Handle mouse leave for tooltip
  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setHoveredExercise(null);
    setTooltipData(null);
  }, []);
  
  // Check if an exercise is already added to avoid duplicates
  const isAlreadyAdded = useCallback((exerciseId) => {
    return exercises.some(ex => ex.id === exerciseId);
  }, [exercises]);

  // Tooltip component using portal
  const Tooltip = useCallback(() => {
    if (!tooltipData || !hoveredExercise) return null;
    
    // Function to calculate tooltip position
    const calculatePosition = () => {
      const { buttonRect } = tooltipData;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Position directly below the button
      let left = 0;
      let top = buttonRect.bottom + 5; // 5px gap
      
      // Center horizontally relative to the button
      const estimatedWidth = 280; // Estimate tooltip width
      left = buttonRect.left + (buttonRect.width / 2) - (estimatedWidth / 2);
      
      // Make sure it doesn't go off left or right edge
      if (left + estimatedWidth > viewportWidth - 10) {
        left = viewportWidth - estimatedWidth - 10;
      }
      if (left < 10) {
        left = 10;
      }
      
      // Check if it would go off the bottom
      const estimatedHeight = 80; // Estimate tooltip height
      if (top + estimatedHeight > viewportHeight - 10) {
        // If not enough space below, position above the button
        top = buttonRect.top - estimatedHeight - 5;
      }
      
      
      return { left, top };
    };
    
    const position = calculatePosition();
    
    return createPortal(
      <div
        className="fixed bg-black text-white p-3 rounded-md text-xs"
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
          maxWidth: '280px',
          pointerEvents: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <p>{hoveredExercise.description || "No description available"}</p>
      </div>,
      document.body
    );
  }, [tooltipData, hoveredExercise]);

  return (
    <div className={cn(
      "relative",
      isForSuperset ? "max-h-[250px] overflow-y-auto" : ""
    )}>
      {/* Search input */}
      <div className="flex items-center mb-3 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={`Search ${isForSuperset ? 'all exercises' : `${sectionId} exercises`}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "pl-9",
            isForSuperset ? "h-8 text-sm" : "h-9"
          )}
        />
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">Loading exercises...</p>
        </div>
      )}
      
      {/* No results state */}
      {!isLoading && filteredExercises.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">No exercises found. Try a different search term.</p>
        </div>
      )}
      
      {/* Exercise grid - smaller for supersets */}
      {!isLoading && filteredExercises.length > 0 && (
        <div className={cn(
          "grid gap-2 overflow-y-auto",
          isForSuperset
            ? "grid-cols-2 max-h-[150px]"
            : "grid-cols-2 sm:grid-cols-3 max-h-80"
        )}>
          {filteredExercises.map((exercise) => (
            <Button
              key={exercise.id}
              variant={isAlreadyAdded(exercise.id) ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "h-auto text-xs justify-between px-3 py-2",
                isAlreadyAdded(exercise.id) ? 'opacity-50 cursor-not-allowed' : '',
                isForSuperset ? "text-[11px]" : ""
              )}
              disabled={isAlreadyAdded(exercise.id)}
              onClick={() => !isAlreadyAdded(exercise.id) && handleAddExercise(exercise)}
              onMouseEnter={(e) => handleMouseEnter(exercise, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className={cn(
                "text-left truncate pr-2 flex-1",
                isForSuperset ? "space-y-0" : "space-y-1"
              )}>
                <div className="font-medium truncate">{exercise.name}</div>
                <span className="text-[10px] text-gray-500 truncate block">{exercise.category}</span>
              </div>
              {!isAlreadyAdded(exercise.id) && (
                <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-blue-50 h-5 w-5 text-blue-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
      
      {/* Render tooltip via portal */}
      <Tooltip />
    </div>
  )
}

export default ExerciseSelector 