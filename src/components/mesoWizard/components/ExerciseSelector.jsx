"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const hoverTimerRef = useRef(null)
  const tooltipRef = useRef(null)
  
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
    
    hoverTimerRef.current = setTimeout(() => {
      setHoveredExercise(exercise);
      
      try {
        // Get the button that triggered the tooltip for better positioning
        const button = e?.currentTarget;
        
        // Safety check - if button is null or doesn't have getBoundingClientRect, use fallback
        if (!button || typeof button.getBoundingClientRect !== 'function') {
          // Fallback to a default position
          setTooltipPosition({ 
            x: Math.max(10, e?.clientX || window.innerWidth / 2), 
            y: Math.max(10, e?.clientY || window.innerHeight / 2) 
          });
          return;
        }
        
        const buttonRect = button.getBoundingClientRect();
        
        // Get the viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate position relative to the button
        let positionX, positionY;
        
        // Position tooltip to the right of the button by default,
        // or to the left if there's not enough space on the right
        if (buttonRect.right + 300 < viewportWidth) {
          positionX = buttonRect.right + 5; // Right of button with smaller offset
        } else {
          positionX = buttonRect.left - 285; // Left of button with smaller offset
        }
        
        // Position tooltip aligned with the button's top
        positionY = buttonRect.top;
        
        // If tooltip would go off-screen at the bottom, position it higher
        if (buttonRect.top + 150 > viewportHeight) {
          positionY = viewportHeight - 160; 
        }
        
        // Make sure the tooltip is always within viewport bounds
        positionX = Math.max(10, Math.min(positionX, viewportWidth - 290));
        positionY = Math.max(10, Math.min(positionY, viewportHeight - 150));
        
        setTooltipPosition({ x: positionX, y: positionY });
      } catch (error) {
        console.error("Error positioning tooltip:", error);
        // Fallback positioning in case of any error
        setTooltipPosition({ 
          x: Math.max(10, window.innerWidth / 4), 
          y: Math.max(10, window.innerHeight / 4) 
        });
      }
    }, 300); // Reduced delay for better responsiveness
  }, []);
  
  // Handle mouse leave for tooltip
  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    setHoveredExercise(null);
  }, []);
  
  // Check if an exercise is already added to avoid duplicates
  const isAlreadyAdded = useCallback((exerciseId) => {
    return exercises.some(ex => ex.id === exerciseId);
  }, [exercises]);

  // Tooltip for exercise description
  const renderTooltip = () => {
    if (!hoveredExercise) return null;
    
    return (
      <div 
        ref={tooltipRef}
        className="fixed bg-black text-white p-3 rounded-md text-xs"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          maxWidth: '280px',
          pointerEvents: 'none',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 99999, // Extremely high z-index to ensure visibility
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <p className="font-medium mb-1">{hoveredExercise.name}</p>
        <p>{hoveredExercise.description || "No description available"}</p>
      </div>
    );
  };

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
          "grid gap-2",
          isForSuperset ? "grid-cols-2 max-h-[150px] overflow-y-auto" : "grid-cols-2 sm:grid-cols-3"
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
      
      {/* Render tooltip */}
      {hoveredExercise && renderTooltip()}
    </div>
  )
}

export default ExerciseSelector 