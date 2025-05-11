"use client"

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react"
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"

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
 * @param {string} props.mode - Mode of operation ('individual' or 'group')
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
  onSupersetChange,
  mode = 'individual'  // 'individual' or 'group'
}) => {
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
  
  // Limit section types when in group mode to only Sprint
  const availableSectionTypes = useMemo(() =>
    mode === 'group'
      ? sectionTypes.filter(s => s.id === 'sprint')
      : sectionTypes
  , [mode, sectionTypes])

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  
  // State for managing supersets
  const [supersets, setSupersets] = useState([])
  
  // Reference to store previous supersets state to prevent unnecessary updates
  const prevSupersetsRef = useRef('');
  
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
  
  // Replace cleanup section of useEffect with dnd-kit compatible version
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
            setIsDragging(false);
            document.body.classList.remove('dragging');
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
    };
  }, [isDragging]);

  // Add sensors and handling for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Activation delay to ensure click events still work with drag handles
      activationConstraint: {
        delay: 150,
        tolerance: 5
      }
    }),
    useSensor(TouchSensor, {
      // Similar constraints for touch
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    })
  );

  // Replace drag handlers with dnd-kit versions
  const handleDragStart = useCallback(() => {
      setIsDragging(true);
      document.body.classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    setIsDragging(false);
    document.body.classList.remove('dragging');
    
    if (!over) return;
    
    // If source and destination are the same, no need to update
    if (active.id === over.id) return;
    
    // Handle section reordering
    if (active.id.toString().includes('section-')) {
      const reorderedSections = arrayMove(
        activeSections,
        activeSections.findIndex(id => `section-${id}` === active.id),
        activeSections.findIndex(id => `section-${id}` === over.id)
      );
      
      setActiveSections(reorderedSections);
    }
  }, [activeSections, setActiveSections]);
  
  // Handle drag end for exercises within a section
  const handleExerciseDragEnd = useCallback((event, sectionId) => {
    const { active, over } = event;
    
    if (!over) return;
    if (active.id === over.id) return;
    
    // Get the unified items for this section
    const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
    
    // Find the indexes based on the IDs
    const oldIndex = unifiedItems.findIndex(item => {
      if (item.type === 'exercise') 
        return `exercise-${item.exercise.id}` === active.id;
      else if (item.type === 'superset')
        return `superset-${item.id}` === active.id;
      return false;
    });
    
    const newIndex = unifiedItems.findIndex(item => {
      if (item.type === 'exercise') 
        return `exercise-${item.exercise.id}` === over.id;
      else if (item.type === 'superset')
        return `superset-${item.id}` === over.id;
      return false;
    });
    
    if (oldIndex === -1 || newIndex === -1) return;
      
    // Avoid deep copy for better performance - only make a shallow copy of the array
    const itemsCopy = arrayMove(unifiedItems, oldIndex, newIndex);
      
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
        
        // Get the ordered exercises from the superset
        const supersetExercises = item.exercises;
        
        // Assign sequential positions to all exercises in the superset
        supersetExercises.forEach(exercise => {
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
                ? { 
                    ...s, 
                    originalPosition: positionStart, // Update position reference
                    exercises: supersetExercises.map((ex, idx) => ({
                      ...ex,
                      position: positionStart + idx  // Ensure all exercises have correct positions
                    }))
                  } 
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
  }, [sessionId, getOrderedExercisesAndSupersets, handleExerciseReorder, setSupersets, supersets]);
  
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
  
  // Update toggleSection to remove longPressTimer
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
    
    // Important: Save the original position of the first exercise to maintain the superset's position in the list
    // This ensures the superset appears in the same place as the first exercise was
    const originalPosition = sortedExercises[0].position || 0;
    console.log("Creating superset at original position:", originalPosition);
    
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
    
    // Create positioned exercises for the superset
    const positionedExercises = sortedExercises.map((ex, index) => ({
      ...ex,
      supersetId,
      position: originalPosition + index // All exercises maintain relative positions based on the original position
    }));
    
    // Add the new superset to state
    setSupersets(prev => [
      ...prev,
      {
        id: supersetId,
        displayNumber: nextDisplayNumber,
        exercises: positionedExercises,
        originalPosition: originalPosition, // Store the original position
        section: sectionId,
        needsMoreExercises: sortedExercises.length < 2
      }
    ]);
    
    // Update all exercises with the superset ID, section, and consistent positions
    positionedExercises.forEach((exercise, index) => {
      // Set the supersetId property
      handleExerciseDetailChange(
        exercise.id, 
        exercise.session, 
        exercise.part, 
        'supersetId', 
        supersetId
      );
      
      // Set the position property - preserve the original relative positions
      handleExerciseDetailChange(
        exercise.id,
        exercise.session,
        exercise.part,
        'position',
        originalPosition + index // Keep relative positions based on original position
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
    
    console.log("Superset created with originalPosition:", originalPosition, "and positions:", 
      positionedExercises.map(ex => ex.position));
  }, [exercises, handleExerciseDetailChange, supersets]);

  // Function to add a new exercise directly to a superset
  const handleAddExerciseToSuperset = useCallback((exercise, supersetId, targetSectionId) => {
    // Make sure we have a valid section ID - this is critical to prevent duplicates
    if (!targetSectionId) {
      console.error("Missing section ID when adding to superset");
      return;
    }
    
    // *** Log the incoming exercise object ID ***
    console.log(`[handleAddExerciseToSuperset] Received exercise: "${exercise.name}" with ID: ${exercise.id} (Type: ${typeof exercise.id})`);

    // Find the superset to get its display number for proper UI feedback
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) {
      console.error("Superset not found:", supersetId);
      return;
    }
    
    // Important: Get the superset's original position to ensure it maintains its place
    const originalPosition = superset.originalPosition || 0;
    console.log("Adding to superset at originalPosition:", originalPosition);
    
    // Find the number of existing exercises in this superset for position calculation
    const exerciseCount = superset.exercises?.length || 0;
    
    // Create a new exercise with the superset ID
    const newExercise = {
      ...exercise,
      originalId: exercise.id, // preserve DB exercise ID for backend mapping
      id: Date.now(), // unique frontend ID
      session: sessionId,
      part: exercise.type, // Keep original exercise type for categorization
      section: targetSectionId, // Store the section where this superset is displayed
      sets: "",
      reps: "",
      rest: "",
      supersetId: supersetId,
      // Position will be updated after adding to the superset
      position: originalPosition + exerciseCount
    };
    
    // *** Log the object being passed to the state hook ***
    console.log(`[handleAddExerciseToSuperset] Passing to handleAddExercise:`, JSON.stringify(newExercise));

    // Add the exercise to the parent component's state
    handleAddExercise(newExercise);
    
    // Create a new array with all exercises including the new one
    const updatedExercises = [...(superset.exercises || []), newExercise];
    
    // Ensure all exercises have consistent positions based on the original position
    const positionedExercises = updatedExercises.map((ex, idx) => ({
      ...ex,
      position: originalPosition + idx
    }));
    
    console.log("Positioned exercises:", positionedExercises.map(ex => ({ 
      id: ex.id, 
      position: ex.position 
    })));
    
    // Update the superset with the new exercise and consistent positions
    setSupersets(prev => 
      prev.map(s => {
        if (s.id === supersetId) {
          return { 
            ...s, 
            exercises: positionedExercises,
            originalPosition: originalPosition, // Reinforce original position
            needsMoreExercises: positionedExercises.length < 2
          };
        }
        return s;
      })
    );
    
    // Update positions for ALL exercises in the superset to ensure consistency in the data store
    positionedExercises.forEach((ex, idx) => {
      handleExerciseDetailChange(
        ex.id,
        ex.session,
        ex.part,
        'position',
        originalPosition + idx // Ensure position is based on original position
      );
    });
  }, [sessionId, handleAddExercise, supersets, handleExerciseDetailChange]);

  // Function to remove an exercise from a superset
  const handleRemoveFromSuperset = useCallback((supersetId, exerciseId) => {
    // Find the exercise in the superset
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) return;
    
    const exercise = superset.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Get the original position of the superset for maintaining order
    const originalPosition = superset.originalPosition || 0;
    
    // Update the superset by removing the exercise
    let updatedSupersets = supersets.map(superset => {
      if (superset.id === supersetId) {
        const newExercises = superset.exercises.filter(ex => ex.id !== exerciseId);
        
        // Update positions of remaining exercises to maintain correct ordering
        const reorderedExercises = newExercises.map((ex, idx) => ({
          ...ex,
          position: originalPosition + idx // Maintain consistent positions based on original position
        }));
        
        return { 
          ...superset, 
          exercises: reorderedExercises,
          needsMoreExercises: reorderedExercises.length < 2
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
    } else if (targetSuperset && targetSuperset.exercises.length >= 2) {
      // If exercises remain in the superset, update their positions in the data store
      targetSuperset.exercises.forEach((ex, idx) => {
        handleExerciseDetailChange(
          ex.id,
          ex.session,
          ex.part,
          'position',
          originalPosition + idx // Ensure consistent positions based on original position
        );
      });
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

  // Replace MemoizedDraggableItem with a dnd-kit compatible version
  const SortableItem = memo(({ id, className, style, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: itemIsDragging
    } = useSortable({ 
      id,
      data: {
        type: id.toString().includes('superset-') ? 'superset' : 'exercise'
      }
    });

    // Reference to measure the element
    const elementRef = useRef(null);
    // State to store the measured height
    const [elementHeight, setElementHeight] = useState(null);

    // Capture height before dragging starts
  useEffect(() => {
      if (elementRef.current && !elementHeight) {
        const height = elementRef.current.offsetHeight;
        setElementHeight(height);
      }
    }, [elementHeight]);

    // Set height explicitly during drag
    useEffect(() => {
      if (itemIsDragging && elementRef.current && elementHeight) {
        // Force height during drag
        elementRef.current.style.height = `${elementHeight}px`;
      } else if (!itemIsDragging && elementRef.current) {
        // Reset after drag ends
        elementRef.current.style.height = '';
      }
    }, [itemIsDragging, elementHeight]);

    // Create the combined ref
    const combinedRef = useMemo(() => {
      return (node) => {
        // Set both refs
        setNodeRef(node);
        elementRef.current = node;
      };
    }, [setNodeRef]);

    const itemStyle = {
      // Use transform without any scaling to prevent height changes
      transform: CSS.Transform.toString({
        ...transform,
        scaleX: 1,
        scaleY: 1
      }),
      transition,
      zIndex: itemIsDragging ? 9999 : undefined,
      opacity: itemIsDragging ? 0.9 : undefined,
      // Fixed height during dragging
      height: itemIsDragging && elementHeight ? `${elementHeight}px` : undefined,
      ...style
    };

    return (
      <div
        ref={combinedRef}
        className={cn(
          className,
          itemIsDragging ? "dragged-item" : "",
          id.toString().includes('superset-') ? "superset-item" : "exercise-item"
        )}
        style={itemStyle}
        {...attributes}
        {...listeners}
      >
        {typeof children === 'function' ? children({isDragging: itemIsDragging}) : children}
      </div>
    );
  });
  SortableItem.displayName = "SortableItem";

  // Memoized exercise component
  const ExerciseItem = memo(({ exercise, index }) => {
    // Generate a consistent ID
    const id = `exercise-${exercise.id}`;
    
    return (
      <SortableItem
        id={id}
        index={index}
        className="border rounded-md p-3 bg-white relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cursor-grab">
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
              // disable superset creation in group mode
              onCreateSuperset={mode === 'group' ? undefined : handleCreateSuperset}
              onRemoveExercise={handleRemoveExercise}
              onMoveExercise={handleMoveExercise}
              sessionId={sessionId}
              sectionId={exercise.part}
              disableMoveUp={index === 0}
              disableMoveDown={false}
              popupDirection="bottom"
            />
          </div>
        </div>
      </SortableItem>
    );
  });
  ExerciseItem.displayName = "ExerciseItem";

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
    return unifiedItems.map((item, idx) => {
      const isLast = idx === unifiedItems.length - 1;
      
      if (item.type === 'exercise') {
        return (
          <ExerciseItem
            key={`exercise-${item.exercise.id}`}
            exercise={item.exercise}
            index={idx}
          />
        );
      } else if (item.type === 'superset') {
        // Find the superset display number
        const superset = supersets.find(s => s.id === item.id);
        const displayNumber = superset?.displayNumber || 1;
        
        return (
          <SortableItem
            key={`superset-${item.id}`}
            id={`superset-${item.id}`}
            index={idx}
            className="relative"
          >
            {({ isDragging }) =>
              mode === 'group' ? null : (
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
                  dragHandleProps={{}} // Not needed with dnd-kit
                  onMoveSuperset={handleMoveSuperset}
                  disableMoveUp={idx === 0}
                  disableMoveDown={isLast}
                  onRemoveExercise={handleRemoveExercise}
                  sessionId={sessionId}
                  menuDirection="bottom"
                />
              )
            }
          </SortableItem>
        );
      }
      
      return null;
    });
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
    sessionId,
    mode
  ]);

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

  // Add CSS style for dragging state
  useEffect(() => {
    // Add global CSS for drag operations
    const style = document.createElement('style');
    style.innerHTML = `
      body.dragging * {
        cursor: grabbing !important;
      }
      body.dragging .section-draggable {
        opacity: 0.9;
        z-index: 1000;
      }
      .dragged-item {
        z-index: 9999 !important;
        pointer-events: none;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15) !important;
        /* Prevent any height changes during drag */
        height: var(--original-height) !important;
        min-height: var(--original-height) !important;
        max-height: var(--original-height) !important;
        overflow: hidden !important;
      }
      /* Freeze dimensions during drag operations */
      .exercise-item, .superset-item {
        position: relative;
        transform-origin: top left;
        transition: transform 200ms ease, opacity 200ms ease;
        transform: translate3d(0, 0, 0);
        /* Prevent content from affecting height during drag */
        box-sizing: border-box !important;
      }
      /* Create a placeholder effect for drop targets */
      .drop-target-active {
        background-color: rgba(59, 130, 246, 0.1) !important;
        border: 2px dashed rgba(59, 130, 246, 0.5) !important;
      }
      /* Ensure smooth transitions */
      [data-sortable] {
        transition: transform 150ms ease;
        will-change: transform;
      }
      /* Lock items in place during drag */
      body.dragging .exercise-item:not(.dragged-item),
      body.dragging .superset-item:not(.dragged-item) {
        transition: transform 250ms ease !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
            >
              {expandedSections.length === activeSections.length ? "Collapse All" : "Expand All"}
            </Button>
            
            {/* Add Section dropdown using custom implementation */}
            <div className="relative inline-block text-left">
              {mode !== 'group' && (
                <>
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
                        Available sections: {availableSectionTypes.filter((type) => !activeSections.includes(type.id)).length}
                      </div>
                      
                      {/* Section options */}
                      <div className="px-1 py-1">
                        {availableSectionTypes
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
                        {availableSectionTypes.filter((type) => !activeSections.includes(type.id)).length === 0 && (
                          <div className="px-2 py-2 text-sm text-gray-400">
                            All section types added
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={activeSections.map(id => `section-${id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {activeSections.map((sectionId, index) => {
                const sortableId = `section-${sectionId}`;
                return (
                  <SortableItem
                    key={sortableId}
                    id={sortableId}
                    index={index}
                    className="border rounded-md overflow-visible relative section-draggable"
                  >
                    {({isDragging}) => (
                      <>
                        {/* Section Header - Clickable for toggle, draggable with handle */}
                        <div 
                          className={`relative bg-gray-50 p-3 flex items-center justify-between ${isDragging ? 'cursor-grabbing' : ''}`}
                          onClick={() => toggleSection(sectionId)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="cursor-grab">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            {getSectionIcon(sectionId)}
                            <span className="font-medium">{getSectionName(sectionId)}</span>
                            <Badge variant="outline" className="ml-2">
                              {getSectionExercises(sectionId).length} exercises
                            </Badge>
                          </div>
                          {/* hide remove button in group mode */}
                          {mode !== 'group' && (
                            <Minus
                              className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveSection(sectionId)
                              }}
                            />
                          )}
                        </div>
                        
                        {expandedSections.includes(sectionId) && (
                          <div className="p-3">
                            {/* New inline exercise search and grid */}
                            <ExerciseSelector
                              sectionId={sectionId}
                              exercises={exercises}
                              allExercises={filteredExercises}
                              handleAddExercise={(exercise) => handleAddExercise({ ...exercise, session: sessionId })}
                              isForSuperset={false}
                            />
                            
                            {/* Existing exercises list */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Added Exercises</h4>
                              
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => handleExerciseDragEnd(event, sectionId)}
                                modifiers={[restrictToVerticalAxis]}
                              >
                                <SortableContext
                                  items={getOrderedExercisesAndSupersets(sectionId).unifiedItems.map(item => {
                                    if (item.type === 'exercise') return `exercise-${item.exercise.id}`;
                                    return `superset-${item.id}`;
                                  })}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-2 overflow-y-auto">
                                    {renderExerciseList(sectionId)}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableItem>
                );
              })}
              </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  )
})

ExerciseSectionManager.displayName = "ExerciseSectionManager"

export default ExerciseSectionManager 