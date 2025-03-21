"use client"

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import {
  Flame,
  Dumbbell,
  RotateCcw,
  ArrowUpCircle,
  Pause,
  Timer,
  Target,
  PlusCircle,
  GripVertical,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExerciseType } from "@/types/exercise"
import SupersetContainer from "./SupersetContainer"
import ExerciseContextMenu from "./ExerciseContextMenu"
import ExerciseSelector from "./ExerciseSelector"
import { cn } from "@/lib/utils"

/**
 * Exercise Section Manager Component
 * 
 * Manages exercise sections within a training session, including:
 * - Adding/removing sections
 * - Reordering sections via drag and drop
 * - Adding/removing exercises to sections
 * - Configuring exercise details
 * 
 * @param {Object} props - Component props
 * @param {number} props.sessionId - Current session ID
 * @param {Array} props.exercises - All exercises
 * @param {Array} props.filteredExercises - Filtered exercises
 * @param {Function} props.handleAddExercise - Function to add an exercise
 * @param {Function} props.handleRemoveExercise - Function to remove an exercise
 * @param {Function} props.handleExerciseReorder - Function to handle exercise reordering
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.setActiveSections - Function to set active sections
 * @param {Function} props.onSupersetChange - Function to track supersets at parent level
 */
const ExerciseSectionManager = memo(({
  sessionId,
  exercises,
  filteredExercises,
  handleAddExercise,
  handleRemoveExercise,
  handleExerciseReorder,
  handleExerciseDetailChange,
  activeSections = [],
  setActiveSections,
  onSupersetChange
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  // State for managing supersets
  const [supersets, setSupersets] = useState([])
  
  // Reference to store previous supersets state to prevent unnecessary updates
  const prevSupersetsRef = useRef('');
  
  // State for active drag item for drag overlay
  const [activeDragItem, setActiveDragItem] = useState(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Available section types based on ExerciseType enum
  const sectionTypes = useMemo(() => [
    { id: "warmup", name: "Warm-up", icon: <Flame className="h-4 w-4" />, typeId: ExerciseType.WarmUp },
    { id: "gym", name: "Gym Exercises", icon: <Dumbbell className="h-4 w-4" />, typeId: ExerciseType.Gym },
    { id: "circuit", name: "Circuits", icon: <RotateCcw className="h-4 w-4" />, typeId: ExerciseType.Circuit },
    { id: "plyometric", name: "Plyometrics", icon: <ArrowUpCircle className="h-4 w-4" />, typeId: ExerciseType.Plyometric },
    { id: "isometric", name: "Isometrics", icon: <Pause className="h-4 w-4" />, typeId: ExerciseType.Isometric },
    { id: "sprint", name: "Sprints", icon: <Timer className="h-4 w-4" />, typeId: ExerciseType.Sprint },
    { id: "drill", name: "Drills", icon: <Target className="h-4 w-4" />, typeId: ExerciseType.Drill },
  ], [])
  
  // Initialize expanded sections
  useEffect(() => {
    if (activeSections.length > 0 && expandedSections.length === 0) {
      // Only initialize on first load, don't reset after user collapses all
      const alreadyInitialized = sessionStorage.getItem('expandedSectionsInitialized');
      if (!alreadyInitialized) {
        setExpandedSections([activeSections[0]]);
        sessionStorage.setItem('expandedSectionsInitialized', 'true');
      }
    }
  }, [activeSections, expandedSections]);
  
  // Initialize supersets based on existing exercises when exercises change
  useEffect(() => {
    // Skip if exercises array is empty to avoid unnecessary updates
    if (!exercises.length) return;
    
    // Create a map of supersetId -> superset
    const supersetMap = new Map();
    
    // Group exercises by supersetId
    exercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!supersetMap.has(exercise.supersetId)) {
          supersetMap.set(exercise.supersetId, {
            id: exercise.supersetId,
            exercises: [],
            section: exercise.section || exercise.part, // Use section or fall back to part
            originalPosition: 0
          });
        }
        
        // Add the exercise to its superset group
        supersetMap.get(exercise.supersetId).exercises.push(exercise);
      }
    });
    
    // If we found supersets, initialize them with display numbers
    if (supersetMap.size > 0) {
      const newSupersets = Array.from(supersetMap.values())
        .map((superset, index) => ({
          ...superset,
          displayNumber: index + 1
        }));
      
      // Use functional setState to avoid stale closures and compare with previous state
      setSupersets(prevSupersets => {
        // Only update if the supersets have actually changed
        // This prevents unnecessary re-renders
        if (JSON.stringify(prevSupersets) === JSON.stringify(newSupersets)) {
          return prevSupersets;
        }
        return newSupersets;
      });
    } else if (supersetMap.size === 0 && supersets.length > 0) {
      // If there are no supersets in exercises but we have supersets in state, clear them
      setSupersets([]);
    }
    // Only re-run when the exercises array changes, but use a stringified version of
    // supersetIds to prevent excessive updates
  }, [exercises, exercises.reduce((acc, ex) => 
    ex.supersetId ? `${acc}|${ex.supersetId}` : acc, '')]);
  
  // Get section icon
  const getSectionIcon = useCallback((sectionId) => {
    const section = sectionTypes.find((s) => s.id === sectionId)
    return section ? section.icon : <Dumbbell className="h-4 w-4" />
  }, [sectionTypes])
  
  // Get section name
  const getSectionName = useCallback((sectionId) => {
    const section = sectionTypes.find((s) => s.id === sectionId)
    return section ? section.name : sectionId
  }, [sectionTypes])
  
  // Get exercises for a section
  const getSectionExercises = useCallback((sectionId) => {
    // Only include exercises that:
    // 1. Are regular exercises that belong to this section type (part === sectionId)
    // 2. OR are part of a superset that belongs to this section (section === sectionId)
    // This ensures exercises in supersets only appear in the section where the superset belongs
    return exercises.filter(ex => 
      (ex.session === sessionId) && ( 
        (ex.part === sectionId && !ex.supersetId) || // Regular exercises in this section
        (ex.supersetId && ex.section === sectionId)  // Exercises in supersets that belong here
      )
    );
  }, [exercises, sessionId]);
  
  // Helper function to get exercises sorted by superset and position
  const getOrderedExercisesAndSupersets = useCallback((sectionId) => {
    // Get exercises for this section, being careful to avoid duplicates
    const sectionExercises = getSectionExercises(sectionId);
    
    // First, let's sort all exercises by their position to ensure proper order
    // Use a stable sort to maintain relative ordering when positions are equal
    const sortedExercises = [...sectionExercises].sort((a, b) => 
      (a.position || 0) - (b.position || 0)
    );
    
    // Instead of multiple iterations, do everything in a single pass
    const supersetMap = new Map();
    const supersetFirstPositions = new Map();
    const addedExerciseIds = new Set();
    const addedSupersetIds = new Set();
    const unifiedItems = [];
    
    // First identify all supersets and create the maps
    for (const exercise of sortedExercises) {
      if (exercise.supersetId) {
        // Track the lowest position for each superset
        if (!supersetFirstPositions.has(exercise.supersetId) || 
            (exercise.position || 0) < (supersetFirstPositions.get(exercise.supersetId) || Infinity)) {
          supersetFirstPositions.set(exercise.supersetId, exercise.position || 0);
        }
        
        // Group exercises by superset
        if (!supersetMap.has(exercise.supersetId)) {
          supersetMap.set(exercise.supersetId, []);
        }
        
        // Add if not already in the array (avoid duplicates)
        if (!supersetMap.get(exercise.supersetId).some(ex => ex.id === exercise.id)) {
          supersetMap.get(exercise.supersetId).push(exercise);
        }
      }
    }
    
    // Sort exercises within each superset by position
    supersetMap.forEach((exercises) => {
      exercises.sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    
    // Process exercises in order by position to build the unified items list
    for (const exercise of sortedExercises) {
      // Skip if already processed
      if (addedExerciseIds.has(exercise.id)) continue;
      
      if (exercise.supersetId) {
        // This exercise is part of a superset
        if (!addedSupersetIds.has(exercise.supersetId)) {
          // First occurrence of this superset, add the entire superset
          const supersetExercises = supersetMap.get(exercise.supersetId) || [];
          
          // Add the superset as a group
          unifiedItems.push({
            type: 'superset',
            id: exercise.supersetId,
            exercises: supersetExercises,
            position: supersetFirstPositions.get(exercise.supersetId) || 0
          });
          
          // Mark all exercises in this superset as added
          supersetExercises.forEach(ex => addedExerciseIds.add(ex.id));
          addedSupersetIds.add(exercise.supersetId);
        }
      } else {
        // It's a normal exercise (not part of a superset)
        unifiedItems.push({
          type: 'exercise',
          exercise,
          position: exercise.position || 0
        });
        addedExerciseIds.add(exercise.id);
      }
    }
    
    // Sort the unified items by position
    unifiedItems.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    return {
      unifiedItems,
      supersetMap
    };
  }, [getSectionExercises]);
  
  // Cleanup function for drag operations and event listeners
  useEffect(() => {
    // Event handlers for global interactions
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isDragging) {
        setIsDragging(false);
        document.body.classList.remove('dragging');
      }
    };
    
    const handleMouseUp = () => {
      // This is a safety measure to ensure dragging state is reset if a drag operation ends unexpectedly
      if (isDragging) {
        // Use a timeout to avoid conflicts with the normal drag end handler
        const timer = setTimeout(() => {
          const dragElements = document.querySelectorAll('.react-beautiful-dnd-dragging');
          if (dragElements.length === 0) {
            setIsDragging(false);
            document.body.classList.remove('dragging');
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    };
    
    // Add global event listeners
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    
    // When component unmounts, ensure we clean up any lingering drag states
    return () => {
      document.body.classList.remove('dragging');
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
      
      // Remove any lingering drag transition styles
      const allDraggables = document.querySelectorAll('.react-beautiful-dnd-draggable');
      allDraggables.forEach(el => {
        el.style.transition = '';
        el.classList.remove('is-actively-dragging');
      });
      
      // Clear any timers
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [isDragging, longPressTimer]);
  
  // Enhanced drag start handler for dnd-kit
  const onDragStart = useCallback((event) => {
    // Set dragging state
    if (!isDragging) {
      setIsDragging(true);
      document.body.classList.add('dragging');
    }

    // Store the current dragging item for overlay or other UI updates
    setActiveDragItem(event.active);

    // Query for all sortable elements and update their styles for better drag performance
    const allSortables = document.querySelectorAll('[data-dnd-sortable]');
    allSortables.forEach(el => {
      el.style.transition = 'none';
    });

    // Add a class to the dragged item
    const dragId = event.active.id;
    const draggedElement = document.querySelector(`[data-dnd-id="${dragId}"]`);
    if (draggedElement) {
      draggedElement.classList.add('is-actively-dragging');
    }
  }, [isDragging]);

  // Enhanced drag end handler for sections with dnd-kit
  const onSectionDragEnd = useCallback((event) => {
    // Always reset the dragging state
    setIsDragging(false);
    document.body.classList.remove('dragging');
    setActiveDragItem(null);

    // Remove drag-specific styles
    const allSortables = document.querySelectorAll('[data-dnd-sortable]');
    allSortables.forEach(el => {
      el.style.transition = '';
      el.classList.remove('is-actively-dragging');
    });

    const { active, over } = event;
    
    // If no over target, the drag was cancelled
    if (!over) return;
    
    // If source and destination are the same, nothing to do
    if (active.id === over.id) return;
    
    // Find indices for source and destination
    const oldIndex = activeSections.findIndex(id => String(id) === active.id);
    const newIndex = activeSections.findIndex(id => String(id) === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder sections using arrayMove utility
      const reorderedSections = arrayMove(activeSections, oldIndex, newIndex);
      
      // Use setTimeout to avoid blocking the UI thread
      setTimeout(() => {
        setActiveSections(reorderedSections);
      }, 0);
    }
  }, [activeSections, setActiveSections]);

  // Enhanced drag end handler for exercises with dnd-kit
  const onExerciseDragEnd = useCallback((event) => {
    // Always reset the dragging state
    setIsDragging(false);
    document.body.classList.remove('dragging');
    setActiveDragItem(null);

    // Remove drag-specific styles
    const allSortables = document.querySelectorAll('[data-dnd-sortable]');
    allSortables.forEach(el => {
      el.style.transition = '';
      el.classList.remove('is-actively-dragging');
    });

    const { active, over } = event;
    
    // If no over target, the drag was cancelled
    if (!over) return;
    
    // If source and destination are the same, nothing to do
    if (active.id === over.id) return;
    
    // Extract the section ID from the container ID (format: "section-{sectionId}")
    const containerIdRegex = /^section-(.+)$/;
    const activeContainer = active.data.current?.sortable?.containerId || '';
    const containerMatch = activeContainer.match(containerIdRegex);
    
    if (!containerMatch) return;
    
    const sectionId = containerMatch[1];
    
    // Use our helper to get the unified list
    const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
    
    // Find the source and target indices
    const sourceIndex = active.data.current?.sortable?.index || 0;
    const targetIndex = over.data.current?.sortable?.index || 0;
    
    // Avoid deep copy for better performance - only make a shallow copy of the array
    const itemsCopy = arrayMove([...unifiedItems], sourceIndex, targetIndex);
    
    // Build a new flat list of exercises with updated positions
    const reorderedExercises = [];
    let position = 0;
    
    // Process each item in the reordered list
    itemsCopy.forEach(item => {
      if (item.type === 'exercise') {
        // For normal exercises, just add with updated position
        reorderedExercises.push({
          ...item.exercise,
          position: position++
        });
      } else if (item.type === 'superset') {
        // For supersets, preserve the internal order of exercises
        // while updating the superset's overall position
        const positionStart = position; // Remember start position for superset
        
        // Assign sequential positions to all exercises in the superset
        item.exercises.forEach(exercise => {
          reorderedExercises.push({
            ...exercise,
            position: position++
          });
        });
        
        // Update the superset in the UI - split this into its own useEffect to avoid
        // blocking the drag animation
        setTimeout(() => {
          setSupersets(prev => 
            prev.map(s => 
              s.id === item.id 
                ? { ...s, originalPosition: positionStart } // Update position reference
                : s
            )
          );
        }, 0);
      }
    });
    
    // Update exercise order if we have exercises to reorder - wrapped in setTimeout
    // to improve performance by allowing the drag animation to complete first
    if (reorderedExercises.length > 0) {
      setTimeout(() => {
        handleExerciseReorder(sessionId, sectionId, reorderedExercises);
      }, 0);
    }
  }, [sessionId, getOrderedExercisesAndSupersets, handleExerciseReorder, setSupersets]);
  
  // Handle adding a section
  const handleAddSection = useCallback((sectionType) => {
    if (!activeSections.includes(sectionType)) {
      const newSections = [...activeSections, sectionType]
      setActiveSections(newSections)
      setExpandedSections([...expandedSections, sectionType])
    }
  }, [activeSections, expandedSections, setActiveSections])
  
  // Handle removing a section
  const handleRemoveSection = useCallback((sectionId) => {
    // Remove section from active sections
    const newSections = activeSections.filter((id) => id !== sectionId)
    setActiveSections(newSections)
    
    // Remove section from expanded sections
    setExpandedSections(expandedSections.filter((id) => id !== sectionId))
  }, [activeSections, expandedSections, setActiveSections])
  
  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    if (isDragging) return
    
    setExpandedSections((prev) => {
      if (prev.includes(sectionId)) {
        // Allow all sections to be collapsed, even if this is the last one
        return prev.filter((id) => id !== sectionId)
      } else {
        return [...prev, sectionId]
      }
    })
  }, [isDragging])
  
  // Collapse all sections
  const collapseAllSections = useCallback(() => {
    // Fully collapse all sections with no restrictions
    setExpandedSections([])
  }, [])
  
  // Expand all sections
  const expandAllSections = useCallback(() => {
    setExpandedSections([...activeSections])
  }, [activeSections])
  
  // Handle mouse/touch down on section header for drag initiation
  const handleSectionMouseDown = useCallback(() => {
    // Start a timer for long press
    const timer = setTimeout(() => {
      setIsDragging(true)
    }, 300) // 300ms is a good threshold for long press
    
    setLongPressTimer(timer)
  }, [])
  
  // Handle mouse/touch up on section header
  const handleSectionMouseUp = useCallback(() => {
    // Clear the long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])
  
  // Function to create a new superset with exercises
  const handleCreateSuperset = useCallback((exerciseIds, sectionId) => {
    // Get the exercises
    const supersetExercises = exerciseIds.map(id => 
      exercises.find(ex => ex.id === id)
    ).filter(Boolean);
    
    // Only proceed if we have at least one exercise
    if (supersetExercises.length === 0) return;
    
    // Sort the exercises by their current position to maintain relative order
    const sortedExercises = [...supersetExercises].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Get the next display number, always start from 1 and increment
    let nextDisplayNumber = 1;
    
    // Find gaps in display numbers or get the next available number
    const existingSupersets = [...supersets].sort((a, b) => a.displayNumber - b.displayNumber);
    const usedNumbers = existingSupersets.map(s => s.displayNumber);
    
    console.log("Creating superset, current supersets:", existingSupersets.map(s => ({ id: s.id, displayNumber: s.displayNumber })));
    console.log("Used display numbers:", usedNumbers);
    
    // Find the first available number starting from 1
    while (usedNumbers.includes(nextDisplayNumber)) {
      nextDisplayNumber++;
    }
    
    console.log("Next display number chosen:", nextDisplayNumber);
    
    // Create a superset ID that includes the display number for easy extraction in the timeline
    // Format: ss-timestamp-displayNumber
    const timestamp = Date.now();
    const supersetId = `ss-${timestamp}-${nextDisplayNumber}`;
    
    console.log("Created new superset ID:", supersetId);
    
    // Add the new superset to state
    setSupersets(prev => [
      ...prev,
      {
        id: supersetId,
        displayNumber: nextDisplayNumber,
        exercises: sortedExercises.map((ex, index) => ({ 
          ...ex, 
          supersetId,
          position: index 
        })),
        originalPosition: sortedExercises[0].position || 0,
        section: sectionId,
        needsMoreExercises: sortedExercises.length < 2
      }
    ]);
    
    // Update all exercises with the superset ID and section
    sortedExercises.forEach((exercise, index) => {
      // Set the supersetId property
      handleExerciseDetailChange(
        exercise.id, 
        exercise.session, 
        exercise.part, 
        'supersetId', 
        supersetId
      );
      
      // Set the position property
      handleExerciseDetailChange(
        exercise.id,
        exercise.session,
        exercise.part,
        'position',
        index
      );
      
      // Also set the section to ensure exercises stay in the desired section
      handleExerciseDetailChange(
        exercise.id,
        exercise.session,
        exercise.part,
        'section',
        sectionId
      );
    });
  }, [exercises, handleExerciseDetailChange, supersets]);

  // Function to add a new exercise directly to a superset
  const handleAddExerciseToSuperset = useCallback((exercise, supersetId, targetSectionId) => {
    // Make sure we have a valid section ID - this is critical to prevent duplicates
    if (!targetSectionId) {
      console.error("Missing section ID when adding to superset");
      return;
    }
    
    // Find the superset to get its display number for proper UI feedback
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) {
      console.error("Superset not found:", supersetId);
      return;
    }
    
    // Note: We could check if exercise.type === targetSectionId here for validation
    // For now, we'll allow adding exercises of any type to a superset
    
    // Find the maximum position of existing exercises in this superset
    let maxPosition = 0;
    if (superset.exercises && superset.exercises.length > 0) {
      maxPosition = superset.exercises.reduce((max, ex) => 
        Math.max(max, ex.position || 0), 0);
    }
    
    // Create a new exercise with the superset ID
    const newExercise = {
      ...exercise,
      id: Date.now(), // Generate a unique ID
      session: sessionId,
      part: exercise.type, // Keep original exercise type for categorization
      section: targetSectionId, // Store the section where this superset is displayed
      sets: "",
      reps: "",
      rest: "",
      supersetId: supersetId,
      position: maxPosition + 1 // Set position to be after all existing exercises
    };
    
    // Add the exercise to the parent component's state
    handleAddExercise(newExercise);
    
    // Update the superset
    setSupersets(prev => 
      prev.map(superset => {
        if (superset.id === supersetId) {
          const updatedExercises = [...superset.exercises, newExercise];
          return { 
            ...superset, 
            exercises: updatedExercises,
            // Set needsMoreExercises to false if we now have 2 or more exercises
            needsMoreExercises: updatedExercises.length < 2
          };
        }
        return superset;
      })
    );
  }, [sessionId, handleAddExercise, supersets]);

  // Function to remove an exercise from a superset
  const handleRemoveFromSuperset = useCallback((supersetId, exerciseId) => {
    // Find the exercise in the superset
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) return;
    
    const exercise = superset.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Update the superset by removing the exercise
    let updatedSupersets = supersets.map(superset => {
      if (superset.id === supersetId) {
        const newExercises = superset.exercises.filter(ex => ex.id !== exerciseId);
        return { 
          ...superset, 
          exercises: newExercises,
          // Update the needsMoreExercises flag
          needsMoreExercises: newExercises.length < 2
        };
      }
      return superset;
    });
    
    // If this would leave the superset with fewer than 2 exercises, dissolve the entire superset
    const targetSuperset = updatedSupersets.find(s => s.id === supersetId);
    if (targetSuperset && targetSuperset.exercises.length < 2) {
      // Extract the remaining exercise to reset its supersetId
      const remainingExercise = targetSuperset.exercises[0];
      if (remainingExercise) {
        // Reset the remaining exercise's supersetId and section
        handleExerciseDetailChange(
          remainingExercise.id, 
          remainingExercise.session, 
          remainingExercise.part, 
          'supersetId', 
          null
        );
        handleExerciseDetailChange(
          remainingExercise.id,
          remainingExercise.session,
          remainingExercise.part,
          'section',
          null
        );
      }
      
      // Remove the superset completely
      updatedSupersets = updatedSupersets.filter(s => s.id !== supersetId);
      
      // Reindex all remaining supersets to ensure sequential display numbers starting from 1
      updatedSupersets = updatedSupersets.map((superset, index) => ({
        ...superset,
        displayNumber: index + 1
      }));
    }
    
    // Update the supersets state
    setSupersets(updatedSupersets);
    
    // Update the exercise to remove supersetId and section
    handleExerciseDetailChange(exerciseId, exercise.session, exercise.part, 'supersetId', null);
    handleExerciseDetailChange(exerciseId, exercise.session, exercise.part, 'section', null);
  }, [supersets, handleExerciseDetailChange]);

  // Function to completely dissolve a superset
  const handleExitSuperset = useCallback((supersetId) => {
    // Get the superset and its parent section
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) return;
    
    // Get the parent section of the superset
    const parentSectionId = superset.section;
    
    // Get the exercises from the superset
    const supersetExercises = superset.exercises || [];
    
    // Remove the superset
    setSupersets(prev => {
      // Remove the target superset
      const filteredSets = prev.filter(s => s.id !== supersetId);
      
      // Reindex the display numbers to be sequential starting from 1
      return filteredSets.map((superset, index) => ({
        ...superset,
        displayNumber: index + 1
      }));
    });
    
    // Update all exercises to remove superset ID and section
    supersetExercises.forEach(exercise => {
      // Check if exercise's original type (part) matches the parent section
      const exerciseTypeMatchesSection = exercise.part === parentSectionId;
      
      if (exerciseTypeMatchesSection) {
        // If the exercise type matches the section, just remove it from the superset
        // Remove supersetId
        handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, 'supersetId', null);
        // Reset section to match part (original type)
        handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, 'section', null);
      } else {
        // If the exercise type doesn't match the section, remove the exercise completely
        handleRemoveExercise(exercise.id, exercise.session, exercise.part);
      }
    });
  }, [supersets, handleExerciseDetailChange, handleRemoveExercise]);

  // Function to move an exercise up or down
  const handleMoveExercise = useCallback((exerciseId, direction, sessionId, sectionId) => {
    // Get all exercises in this section
    const sectionExercises = getSectionExercises(sectionId);
    
    // Find the exercise
    const exercise = sectionExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Get ordered items
    const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
    
    // Find the index of the item to move in the unified list
    let itemIndex = -1;
    if (exercise.supersetId) {
      // If it's a superset exercise, find the superset
      itemIndex = unifiedItems.findIndex(item => 
        item.type === 'superset' && item.id === exercise.supersetId
      );
    } else {
      // If it's a normal exercise, find it
      itemIndex = unifiedItems.findIndex(item => 
        item.type === 'exercise' && item.exercise.id === exerciseId
      );
    }
    
    if (itemIndex === -1) return;
    
    // Calculate new index
    const newItemIndex = direction === 'up' 
      ? Math.max(0, itemIndex - 1)
      : Math.min(unifiedItems.length - 1, itemIndex + 1);
      
    if (newItemIndex === itemIndex) return;
    
    // Make a copy of the items to avoid mutation
    const updatedItems = [...unifiedItems];
    
    // Perform the move on the unified list
    const [removed] = updatedItems.splice(itemIndex, 1);
    updatedItems.splice(newItemIndex, 0, removed);
    
    // Convert back to a flat list of exercises with updated positions
    const reorderedExercises = [];
    let position = 0;
    
    updatedItems.forEach(item => {
      if (item.type === 'exercise') {
        // For normal exercises, add with updated position
        reorderedExercises.push({
          ...item.exercise,
          position: position++
        });
      } else if (item.type === 'superset') {
        // For supersets, preserve the internal order of exercises
        const positionStart = position;
        
        // Add all exercises from the superset with sequential positions
        item.exercises.forEach(ex => {
          reorderedExercises.push({
            ...ex,
            position: position++
          });
        });
        
        // Update the superset position reference
        setSupersets(prev => 
          prev.map(s => 
            s.id === item.id 
              ? { ...s, originalPosition: positionStart }
              : s
          )
        );
      }
    });
    
    // Update exercise order
    if (reorderedExercises.length > 0) {
      handleExerciseReorder(sessionId, sectionId, reorderedExercises);
    }
  }, [getSectionExercises, getOrderedExercisesAndSupersets, handleExerciseReorder, setSupersets]);

  // Function to duplicate an exercise
  // Commented out as not implemented yet
  /*
  const handleDuplicateExercise = useCallback((exerciseId, sessionId, sectionId) => {
    const exercise = exercises.find(ex => 
      ex.id === exerciseId && ex.session === sessionId && ex.part === sectionId
    );
    
    if (!exercise) return;
    
    // TODO: In a real implementation, update the parent component's state
    // Create a duplicate with a new ID
    // const duplicate = {
    //   ...exercise,
    //   id: Date.now(), // Use timestamp as a simple unique ID
    //   name: `${exercise.name} (Copy)`
    // };
    
    // Add it to the exercises
    // handleAddExercise({ ...duplicate, part: sectionId });
  }, [exercises]);
  */

  // Replace the Menu component with custom dropdown
  const [addSectionMenuOpen, setAddSectionMenuOpen] = useState(false)

  // Add CSS style for dragging state
  useEffect(() => {
    // Add global CSS for drag operations
    const style = document.createElement('style');
    style.innerHTML = `
      body.dragging * {
        cursor: grabbing !important;
      }
      body.dragging [data-dnd-sortable] {
        transition: none !important;
      }
      body.dragging .section-draggable {
        opacity: 0.9;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }
      /* Add higher z-index for any dragged item */
      .dragged-item {
        z-index: 9999 !important;
        pointer-events: none;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
      }
      /* Create a placeholder effect for drop targets */
      .drop-target-active {
        background-color: rgba(59, 130, 246, 0.1) !important;
        border: 2px dashed rgba(59, 130, 246, 0.5) !important;
        min-height: 40px !important;
        padding: 4px !important;
        border-radius: 6px !important;
      }
      /* Force dragged elements to be visible */
      [data-dnd-sortable][style*="transform"] {
        z-index: 9999 !important;
        position: relative !important;
        transform-origin: center center !important;
        will-change: transform !important;
        backface-visibility: hidden !important;
        -webkit-backface-visibility: hidden !important;
        pointer-events: none !important;
      }
      /* Specific style for dragged superset containers */
      [data-dnd-sortable][style*="transform"] [data-superset="true"] {
        background-color: rgba(219, 234, 254, 0.9) !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.25) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to move a superset up or down
  const handleMoveSuperset = useCallback((supersetId, direction) => {
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) return;
    
    const sectionId = superset.section;
    if (!sectionId) return;
    
    // Find all items in the section
    const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
    
    // Find the index of the superset
    const supersetIndex = unifiedItems.findIndex(item => 
      item.type === 'superset' && item.id === supersetId
    );
    
    if (supersetIndex === -1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' 
      ? Math.max(0, supersetIndex - 1)
      : Math.min(unifiedItems.length - 1, supersetIndex + 1);
      
    if (newIndex === supersetIndex) return;
    
    // Reorder items
    const updatedItems = [...unifiedItems];
    const [removed] = updatedItems.splice(supersetIndex, 1);
    updatedItems.splice(newIndex, 0, removed);
    
    // Convert back to a flat list of exercises with updated positions
    const reorderedExercises = [];
    let position = 0;
    
    updatedItems.forEach(item => {
      if (item.type === 'exercise') {
        // For normal exercises, just add with updated position
        reorderedExercises.push({
          ...item.exercise,
          position: position++
        });
      } else if (item.type === 'superset') {
        // For supersets, preserve the internal order of exercises
        // while updating the superset's overall position
        const positionStart = position; // Remember start position for superset
        
        // Assign sequential positions to all exercises in the superset
        item.exercises.forEach(exercise => {
          reorderedExercises.push({
            ...exercise,
            position: position++
          });
        });
        
        // Update the superset in the UI
        setSupersets(prev => 
          prev.map(s => 
            s.id === item.id 
              ? { ...s, originalPosition: positionStart } // Update position reference
              : s
          )
        );
      }
    });
    
    // Update exercise order if we have exercises to reorder
    if (reorderedExercises.length > 0) {
      handleExerciseReorder(sessionId, sectionId, reorderedExercises);
    }
  }, [supersets, getOrderedExercisesAndSupersets, handleExerciseReorder, sessionId, setSupersets]);

  // Effect to notify parent of supersets changes
  useEffect(() => {
    if (onSupersetChange && supersets.length > 0) {
      // Create a simplified representation of the superset state to compare
      const simplifiedSupersets = supersets.map(s => ({ 
        id: s.id, 
        displayNumber: s.displayNumber, 
        exerciseCount: s.exercises?.length || 0 
      }));
      
      // Store the simplified state to avoid redundant updates
      const stateKey = JSON.stringify(simplifiedSupersets);
      
      // Use a ref to store the previous supersets state for comparison
      if (!prevSupersetsRef.current || prevSupersetsRef.current !== stateKey) {
        // Only update the parent if the superset state has changed
        onSupersetChange(supersets);
        // Store the current state for future comparison
        prevSupersetsRef.current = stateKey;
      }
    } else if (onSupersetChange && supersets.length === 0 && prevSupersetsRef.current) {
      // If supersets are cleared, notify parent
      onSupersetChange([]);
      prevSupersetsRef.current = '';
    }
  }, [supersets, onSupersetChange]);

  // Create a sortable section component
  const SortableSectionItem = memo(({ sectionId, children, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: String(sectionId),
      data: {
        type: 'section',
        index
      }
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.9 : 1,
      position: 'relative'
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "border rounded-md overflow-visible relative section-draggable",
          isDragging ? "shadow-xl border-blue-300" : ""
        )}
      >
        {children(attributes, listeners, isDragging)}
      </div>
    );
  });
  SortableSectionItem.displayName = "SortableSectionItem";

  // Create a sortable exercise component
  const SortableExerciseItem = memo(({ exercise, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: `exercise-${exercise.id}`,
      data: {
        type: 'exercise',
        exercise,
        index
      }
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.8 : 1
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "border rounded-md p-3 bg-white relative",
          isDragging ? "dragged-item" : ""
        )}
        data-dnd-id={`exercise-${exercise.id}`}
        data-dnd-sortable
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cursor-grab" {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="font-medium">{exercise.name}</p>
              <Badge variant="outline" className="mt-1">
                {exercise.category}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ExerciseContextMenu
              exercise={exercise}
              onCreateSuperset={exercise.onCreateSuperset}
              onRemoveExercise={exercise.onRemoveExercise}
              onMoveExercise={exercise.onMoveExercise}
              sessionId={exercise.sessionId}
              sectionId={exercise.part}
              disableMoveUp={index === 0}
              disableMoveDown={false}
            />
          </div>
        </div>
      </div>
    );
  });
  SortableExerciseItem.displayName = "SortableExerciseItem";

  // Create a sortable superset component
  const SortableSupersetItem = memo(({ supersetId, index, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: `superset-${supersetId}`,
      data: {
        type: 'superset',
        id: supersetId,
        index
      }
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      zIndex: isDragging ? 1000 : 1,
      opacity: isDragging ? 0.9 : 1,
      position: 'relative'
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative"
        data-superset="true"
        data-dnd-id={`superset-${supersetId}`}
        data-dnd-sortable
      >
        {children(attributes, listeners, isDragging)}
      </div>
    );
  });
  SortableSupersetItem.displayName = "SortableSupersetItem";

  // Inside the main ExerciseSectionManager component
  const renderExerciseList = useCallback((sectionId) => {
    const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
    
    if (unifiedItems.length === 0) {
      return (
        <p className="text-sm text-gray-500 text-center py-4">
          No exercises added to this section yet.
        </p>
      );
    }
    
    // Memoize the rendering of the entire list to avoid unnecessary re-renders
    return (
      <SortableContext 
        items={unifiedItems.map(item => item.type === 'exercise' ? `exercise-${item.exercise.id}` : `superset-${item.id}`)}
        strategy={verticalListSortingStrategy}
        id={`section-${sectionId}`}
      >
        {unifiedItems.map((item, idx) => {
          const isLast = idx === unifiedItems.length - 1;
          
          if (item.type === 'exercise') {
            // Add required context props to exercise
            const exerciseWithHandlers = {
              ...item.exercise,
              onCreateSuperset: handleCreateSuperset,
              onRemoveExercise: handleRemoveExercise,
              onMoveExercise: handleMoveExercise,
              sessionId: sessionId
            };
            
            return (
              <SortableExerciseItem
                key={`exercise-${item.exercise.id}`}
                exercise={exerciseWithHandlers}
                index={idx}
              />
            );
          } else if (item.type === 'superset') {
            // Find the superset display number
            const superset = supersets.find(s => s.id === item.id);
            const displayNumber = superset?.displayNumber || 1;
            
            return (
              <SortableSupersetItem
                key={`superset-${item.id}`}
                supersetId={item.id}
                index={idx}
              >
                {(attributes, listeners, isDragging) => (
                  <SupersetContainer
                    supersetId={item.id}
                    exercises={item.exercises}
                    sectionId={sectionId}
                    onRemoveFromSuperset={handleRemoveFromSuperset}
                    onExitSuperset={handleExitSuperset}
                    onAddExerciseToSuperset={handleAddExerciseToSuperset}
                    availableExercises={filteredExercises}
                    isDraggable={true}
                    isDragging={isDragging}
                    displayNumber={displayNumber}
                    needsMoreExercises={item.exercises.length < 2}
                    dragHandleProps={{...attributes, ...listeners}}
                    onMoveSuperset={handleMoveSuperset}
                    disableMoveUp={idx === 0}
                    disableMoveDown={isLast}
                  />
                )}
              </SortableSupersetItem>
            );
          }
          
          return null;
        })}
      </SortableContext>
    );
  }, [
    getOrderedExercisesAndSupersets, 
    supersets, 
    handleRemoveFromSuperset, 
    handleExitSuperset, 
    handleAddExerciseToSuperset, 
    filteredExercises, 
    handleMoveSuperset,
    handleCreateSuperset,
    handleRemoveExercise,
    handleMoveExercise,
    sessionId
  ]);

  return (
    <Card>
      {/* Test dropdown for debugging - positioned at top right corner */}
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Exercise Sections</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={expandedSections.length === activeSections.length ? collapseAllSections : expandAllSections}
              className="text-xs"
            >
              {expandedSections.length === activeSections.length ? "Collapse All" : "Expand All"}
            </Button>
            
            {/* Add Section dropdown using custom implementation */}
            <div className="relative inline-block text-left">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddSectionMenuOpen(!addSectionMenuOpen);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Section</span>
              </Button>
              
              {addSectionMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[3000] animate-in fade-in-50 zoom-in-95 duration-100"
                >
                  {/* Header showing available sections */}
                  <div className="px-4 py-2 text-sm font-semibold border-b">
                    Available sections: {sectionTypes.filter((type) => !activeSections.includes(type.id)).length}
                  </div>
                  
                  {/* Section options */}
                  <div className="px-1 py-1">
                    {sectionTypes
                      .filter((type) => !activeSections.includes(type.id))
                      .map((type) => (
                        <button
                          key={type.id}
                          className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => {
                            handleAddSection(type.id);
                            setAddSectionMenuOpen(false);
                          }}
                        >
                          <div className="text-blue-500 mr-2">
                            {type.icon}
                          </div>
                          <span className="font-medium">{type.name}</span>
                        </button>
                      ))}
                    
                    {/* Show message when all sections are added */}
                    {sectionTypes.filter((type) => !activeSections.includes(type.id)).length === 0 && (
                      <div className="px-2 py-2 text-sm text-gray-400">
                        All section types added
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onSectionDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext 
            items={activeSections.map(id => String(id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {activeSections.map((sectionId, index) => (
                <SortableSectionItem
                  key={sectionId}
                  sectionId={sectionId}
                  index={index}
                >
                  {(attributes, listeners, isDragging) => (
                    <div className={cn(
                      "border rounded-md overflow-visible relative section-draggable",
                      isDragging ? "shadow-xl border-blue-300" : ""
                    )}>
                      {/* Section Header - Clickable for toggle, draggable with long press */}
                      <div 
                        className={`relative bg-gray-50 p-3 flex items-center justify-between cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        onClick={() => toggleSection(sectionId)}
                        onMouseDown={() => handleSectionMouseDown()}
                        onMouseUp={handleSectionMouseUp}
                        onTouchStart={() => handleSectionMouseDown()}
                        onTouchEnd={handleSectionMouseUp}
                        {...attributes}
                        {...listeners}
                        data-dnd-id={String(sectionId)}
                        data-dnd-sortable
                      >
                        <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          {getSectionIcon(sectionId)}
                          <span className="font-medium">{getSectionName(sectionId)}</span>
                          <Badge variant="outline" className="ml-2">
                            {getSectionExercises(sectionId).length} exercises
                          </Badge>
                        </div>
                        {/* Delete button - simplified to just a minus icon */}
                        <Minus 
                          className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent toggle
                            handleRemoveSection(sectionId);
                          }}
                        />
                      </div>
                      
                      {expandedSections.includes(sectionId) && (
                        <div className="p-3">
                          {/* New inline exercise search and grid */}
                          <ExerciseSelector
                            sectionId={sectionId}
                            exercises={exercises}
                            allExercises={filteredExercises}
                            handleAddExercise={handleAddExercise}
                            isForSuperset={false}
                          />
                          
                          {/* Existing exercises list */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Added Exercises</h4>
                            <DndContext 
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragStart={onDragStart}
                              onDragEnd={onExerciseDragEnd}
                              modifiers={[restrictToVerticalAxis]}
                            >
                              <div
                                className="space-y-2"
                                style={{ minHeight: '20px' }}
                              >
                                {renderExerciseList(sectionId)}
                              </div>
                              
                              {/* Optional DragOverlay for showing the dragged item */}
                              <DragOverlay adjustScale={true}>
                                {activeDragItem && (activeDragItem.data.current.type === 'exercise' || activeDragItem.data.current.type === 'superset') ? (
                                  <div className="opacity-80 transform scale-105 shadow-xl">
                                    {activeDragItem.data.current.type === 'exercise' && (
                                      <div className="border rounded-md p-3 bg-white">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="cursor-grab">
                                              <GripVertical className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <div>
                                              <p className="font-medium">{activeDragItem.data.current.exercise.name}</p>
                                              <Badge variant="outline" className="mt-1">
                                                {activeDragItem.data.current.exercise.category}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {activeDragItem.data.current.type === 'superset' && (
                                      <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
                                        <p className="font-medium text-center">Superset</p>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </DragOverlay>
                            </DndContext>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SortableSectionItem>
              ))}
            </div>
          </SortableContext>
          
          {/* Optional DragOverlay for showing the dragged section */}
          <DragOverlay adjustScale={true}>
            {activeDragItem && activeDragItem.data.current?.type === 'section' ? (
              <div className="opacity-80 transform scale-105 shadow-xl border border-blue-300 rounded-md bg-white p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  {getSectionIcon(activeDragItem.id.toString())}
                  <span className="font-medium">{getSectionName(activeDragItem.id.toString())}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {activeSections.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No exercise sections added yet.</p>
            <Button
              variant="outline"
              onClick={() => handleAddSection("warmup")}
              className="mr-2"
            >
              Add Warm-up
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddSection("gym")}
            >
              Add Gym Exercises
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ExerciseSectionManager.displayName = "ExerciseSectionManager"

export default ExerciseSectionManager 