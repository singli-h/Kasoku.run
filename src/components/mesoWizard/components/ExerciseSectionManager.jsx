"use client"

import { useState, useEffect, useCallback, memo, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
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
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  // State for managing supersets
  const [supersets, setSupersets] = useState([])
  
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
      
      setSupersets(newSupersets);
    }
  }, [exercises]);
  
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
    const sortedExercises = [...sectionExercises].sort((a, b) => 
      (a.position || 0) - (b.position || 0)
    );
    
    // Step 1: Identify all supersets and find the position of the first exercise in each
    const supersetFirstPositions = new Map();
    sortedExercises.forEach((exercise) => {
      if (exercise.supersetId) {
        if (!supersetFirstPositions.has(exercise.supersetId) || 
            (exercise.position || 0) < (supersetFirstPositions.get(exercise.supersetId) || Infinity)) {
          supersetFirstPositions.set(exercise.supersetId, exercise.position || 0);
        }
      }
    });
    
    // Step 2: Group exercises by superset while preserving order
    const supersetMap = new Map();
    
    sortedExercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!supersetMap.has(exercise.supersetId)) {
          supersetMap.set(exercise.supersetId, []);
        }
        // Add if not already in the array (avoid duplicates)
        if (!supersetMap.get(exercise.supersetId).some(ex => ex.id === exercise.id)) {
          supersetMap.get(exercise.supersetId).push(exercise);
        }
      }
    });
    
    // Sort exercises within each superset by their position
    supersetMap.forEach((exercises) => {
      exercises.sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    
    // Step 3: Create a unified list of exercises and supersets based on position
    const unifiedItems = [];
    const addedExerciseIds = new Set(); // Track added exercise IDs to avoid duplicates
    const addedSupersetIds = new Set(); // Track added superset IDs
    
    // Process exercises in order by position
    sortedExercises.forEach((exercise) => {
      // Skip if already processed
      if (addedExerciseIds.has(exercise.id)) return;
      
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
    });
    
    // Finally, sort the unified items by position
    unifiedItems.sort((a, b) => a.position - b.position);
    
    return {
      unifiedItems,
      supersetMap
    };
  }, [getSectionExercises]);
  
  // Handle section drag end
  const onSectionDragEnd = useCallback((result) => {
    // Always reset the dragging state
    setIsDragging(false);
    document.body.classList.remove('dragging');
    
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Reorder sections
    const reorderedSections = Array.from(activeSections);
    const [removed] = reorderedSections.splice(source.index, 1);
    reorderedSections.splice(destination.index, 0, removed);
    
    setActiveSections(reorderedSections);
  }, [activeSections, setActiveSections]);
  
  // Handle exercise drag end
  const onExerciseDragEnd = useCallback((result) => {
    // Always reset the dragging state
    setIsDragging(false);
    document.body.classList.remove('dragging');
    
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Only reorder if the source and destination are the same section
    if (source.droppableId === destination.droppableId) {
      const sectionId = source.droppableId;
      
      // Use our helper to get the unified list
      const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
      
      // Make a deep copy to avoid mutation issues
      const itemsCopy = JSON.parse(JSON.stringify(unifiedItems));
      
      // Perform the reordering on the unified list
      const [removed] = itemsCopy.splice(source.index, 1);
      itemsCopy.splice(destination.index, 0, removed);
      
      // Build a new flat list of exercises with updated positions
      const reorderedExercises = [];
      let position = 0;
      
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
        console.log('Reordering exercises:', reorderedExercises.map(ex => ex.name));
        handleExerciseReorder(sessionId, sectionId, reorderedExercises);
      }
    }
  }, [sessionId, getOrderedExercisesAndSupersets, handleExerciseReorder]);
  
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
    // Generate a unique superset ID using timestamp for true uniqueness
    const supersetId = `ss-${Date.now()}`;
    
    // Get the exercises
    const supersetExercises = exerciseIds.map(id => 
      exercises.find(ex => ex.id === id)
    ).filter(Boolean);
    
    // Only proceed if we have at least one exercise
    if (supersetExercises.length === 0) return;
    
    // Add a new superset
    setSupersets(prev => {
      // Get the next display number, which will be sequential regardless of internal IDs
      const nextDisplayNumber = prev.length + 1;
      
      return [
        ...prev,
        {
          id: supersetId,
          displayNumber: nextDisplayNumber, // Add a display number for UI
          exercises: supersetExercises.map(ex => ({ ...ex, supersetId })),
          originalPosition: supersetExercises[0].position || 0,
          section: sectionId, // Record which section this superset belongs to
          needsMoreExercises: supersetExercises.length < 2 // Flag if the superset needs more exercises
        }
      ];
    });
    
    // Update all exercises with the superset ID and section
    supersetExercises.forEach(exercise => {
      // Set the supersetId property
      handleExerciseDetailChange(
        exercise.id, 
        exercise.session, 
        exercise.part, 
        'supersetId', 
        supersetId
      );
      
      // Also set the section to ensure exercises stay in the desired section
      // This is crucial to prevent duplicate exercises in multiple sections
      handleExerciseDetailChange(
        exercise.id,
        exercise.session,
        exercise.part,
        'section',
        sectionId
      );
    });
  }, [exercises, handleExerciseDetailChange]);

  // Function to add an exercise to an existing superset
  const handleAddToSuperset = useCallback((exerciseId, supersetId, sessionId, sectionId) => {
    // Find the exercise
    const exercise = exercises.find(ex => 
      ex.id === exerciseId && ex.session === sessionId
    );
    
    if (!exercise) return;
    
    // Update the superset
    setSupersets(prev => 
      prev.map(superset => 
        superset.id === supersetId
          ? { ...superset, exercises: [...superset.exercises, { ...exercise, supersetId }] }
          : superset
      )
    );
    
    // Update the exercise with superset ID in the parent component's state
    handleExerciseDetailChange(exerciseId, sessionId, exercise.part, 'supersetId', supersetId);
    
    // Also set the section to ensure the exercise stays in this section
    // This is crucial to prevent duplicate exercises in multiple sections
    handleExerciseDetailChange(exerciseId, sessionId, exercise.part, 'section', sectionId);
  }, [exercises, handleExerciseDetailChange]);

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
      supersetId: supersetId
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
      
      // Remove the superset entirely
      updatedSupersets = updatedSupersets.filter(s => s.id !== supersetId);
    }
    
    // Reindex the display numbers
    updatedSupersets = updatedSupersets.map((superset, index) => ({
      ...superset,
      displayNumber: index + 1
    }));
    
    // Update the supersets state
    setSupersets(updatedSupersets);
    
    // Update the exercise to remove supersetId and section
    handleExerciseDetailChange(exerciseId, exercise.session, exercise.part, 'supersetId', null);
    handleExerciseDetailChange(exerciseId, exercise.session, exercise.part, 'section', null);
  }, [supersets, handleExerciseDetailChange]);

  // Function to completely dissolve a superset
  const handleExitSuperset = useCallback((supersetId) => {
    // Get the exercises from the superset
    const supersetExercises = supersets.find(s => s.id === supersetId)?.exercises || [];
    
    // Remove the superset
    setSupersets(prev => {
      // Remove the target superset
      const filteredSets = prev.filter(s => s.id !== supersetId);
      
      // Reindex the display numbers to be sequential
      return filteredSets.map((superset, index) => ({
        ...superset,
        displayNumber: index + 1
      }));
    });
    
    // Update all exercises to remove superset ID and section (reset to original)
    supersetExercises.forEach(exercise => {
      // Remove supersetId
      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, 'supersetId', null);
      // Reset section to match part (original type)
      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, 'section', null);
    });
  }, [supersets, handleExerciseDetailChange]);

  // Function to move an exercise up or down
  const handleMoveExercise = useCallback((exerciseId, direction, sessionId, sectionId) => {
    const sectionExercises = getSectionExercises(sectionId);
    const exerciseIndex = sectionExercises.findIndex(ex => ex.id === exerciseId);
    
    if (exerciseIndex === -1) return;
    
    // Get the exercise
    const exercise = sectionExercises[exerciseIndex];
    
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
    
    // Perform the move on the unified list
    const [removed] = unifiedItems.splice(itemIndex, 1);
    unifiedItems.splice(newItemIndex, 0, removed);
    
    // Convert back to a flat list of exercises
    const reorderedExercises = [];
    unifiedItems.forEach(item => {
      if (item.type === 'exercise') {
        reorderedExercises.push(item.exercise);
      } else if (item.type === 'superset') {
        // Add all exercises from the superset in their original order
        item.exercises.forEach(ex => {
          reorderedExercises.push(ex);
        });
      }
    });
    
    // Update exercise order
    handleExerciseReorder(sessionId, sectionId, reorderedExercises);
  }, [getSectionExercises, getOrderedExercisesAndSupersets, handleExerciseReorder]);

  // Function to duplicate an exercise
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
      body.dragging .react-beautiful-dnd-draggable {
        transition: transform 0.1s;
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
        transform: scale(1.01) !important;
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
      .react-beautiful-dnd-dragging {
        z-index: 9999 !important;
        position: relative !important;
        transform-origin: center center !important;
        will-change: transform !important;
        backface-visibility: hidden !important;
        -webkit-backface-visibility: hidden !important;
      }
      /* Specific style for dragged superset containers */
      .react-beautiful-dnd-dragging [data-superset="true"] {
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

  const onDragStart = useCallback(() => {
    // Set global dragging state
    setIsDragging(true);
    document.body.classList.add('dragging');
    // Force a small reflow to ensure styles are applied
    requestAnimationFrame(() => {
      const draggedElements = document.querySelectorAll('.react-beautiful-dnd-dragging');
      draggedElements.forEach(el => {
        el.style.zIndex = '9999';
        el.style.position = 'relative';
      });
    });
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
        
        <DragDropContext 
          onDragEnd={onSectionDragEnd}
          onDragStart={onDragStart}
        >
          <Droppable 
            droppableId="sections"
            direction="vertical"
          >
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={cn(
                  "space-y-4",
                  snapshot.isDraggingOver ? "bg-gray-50 p-2 border border-dashed border-gray-200 rounded-md" : ""
                )}
              >
                {activeSections.map((sectionId, index) => (
                  <Draggable key={sectionId} draggableId={String(sectionId)} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "border rounded-md overflow-visible relative section-draggable",
                          snapshot.isDragging ? "shadow-xl border-blue-300" : ""
                        )}
                        style={{
                          ...provided.draggableProps.style
                        }}
                      >
                        {/* Section Header - Clickable for toggle, draggable with long press */}
                        <div 
                          className={`relative bg-gray-50 p-3 flex items-center justify-between cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                          onClick={() => toggleSection(sectionId)}
                          onMouseDown={() => handleSectionMouseDown()}
                          onMouseUp={handleSectionMouseUp}
                          onTouchStart={() => handleSectionMouseDown()}
                          onTouchEnd={handleSectionMouseUp}
                          {...provided.dragHandleProps}
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
                              <DragDropContext 
                                onDragEnd={onExerciseDragEnd}
                                onDragStart={onDragStart}
                              >
                                <Droppable 
                                  droppableId={String(sectionId)}
                                  direction="vertical"
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className={cn(
                                        "space-y-2",
                                        snapshot.isDraggingOver ? "drop-target-active" : ""
                                      )}
                                      style={{ minHeight: '20px' }}
                                    >
                                      {getSectionExercises(sectionId).length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                          No exercises added to this section yet.
                                        </p>
                                      ) : (
                                        // Use our helper function to create the ordered list
                                        (() => {
                                          // Get exercises and supersets in the correct order
                                          const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
                                          
                                          // Render the unified list
                                          return unifiedItems.map((item, idx) => {
                                            if (item.type === 'exercise') {
                                              // Render normal exercise
                                              return (
                                                <Draggable
                                                  key={String(item.exercise.id)}
                                                  draggableId={String(item.exercise.id)}
                                                  index={idx}
                                                >
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className={cn(
                                                        "border rounded-md p-3 bg-white relative",
                                                        snapshot.isDragging ? "shadow-xl border-blue-400 dragged-item" : ""
                                                      )}
                                                      style={{
                                                        ...provided.draggableProps.style,
                                                        opacity: snapshot.isDragging ? 0.85 : 1
                                                      }}
                                                    >
                                                      <div {...provided.dragHandleProps} className="flex items-center justify-between cursor-grab">
                                                        <div className="flex items-center gap-2">
                                                          <div className="cursor-grab">
                                                            <GripVertical className="h-4 w-4 text-gray-400" />
                                                          </div>
                                                          <div>
                                                            <p className="font-medium">{item.exercise.name}</p>
                                                            <Badge variant="outline" className="mt-1">
                                                              {item.exercise.category}
                                                            </Badge>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Context menu */}
                                                        <div className="flex items-center gap-2">
                                                          <ExerciseContextMenu
                                                            exercise={item.exercise}
                                                            supersets={supersets}
                                                            onCreateSuperset={handleCreateSuperset}
                                                            onAddToSuperset={handleAddToSuperset}
                                                            onRemoveExercise={handleRemoveExercise}
                                                            onDuplicateExercise={handleDuplicateExercise}
                                                            onMoveExercise={handleMoveExercise}
                                                            sessionId={sessionId}
                                                            sectionId={sectionId}
                                                            disableMoveUp={idx === 0}
                                                            disableMoveDown={idx === unifiedItems.length - 1}
                                                          />
                                                          
                                                          {/* Delete button - simplified to just a minus icon */}
                                                          <Minus 
                                                            className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleRemoveExercise(item.exercise.id, item.exercise.session, item.exercise.part);
                                                            }}
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              );
                                            } else {
                                              // Render superset as a draggable item
                                              // Find the matching superset object to get its display number
                                              const supersetObj = supersets.find(s => s.id === item.id);
                                              const displayNumber = supersetObj?.displayNumber || 1;
                                              const needsMoreExercises = item.exercises.length < 2 || supersetObj?.needsMoreExercises;
                                              
                                              return (
                                                <Draggable
                                                  key={`superset-${item.id}`}
                                                  draggableId={`superset-${item.id}`}
                                                  index={idx}
                                                >
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      style={{
                                                        ...provided.draggableProps.style,
                                                        transform: snapshot.isDragging ? provided.draggableProps.style.transform : "none",
                                                      }}
                                                      className={cn(
                                                        "transition-shadow duration-200",
                                                        snapshot.isDragging ? "dragged-item" : ""
                                                      )}
                                                    >
                                                      <SupersetContainer
                                                        key={item.id}
                                                        supersetId={item.id}
                                                        exercises={item.exercises}
                                                        onRemoveFromSuperset={handleRemoveFromSuperset}
                                                        onExitSuperset={handleExitSuperset}
                                                        handleRemoveExercise={handleRemoveExercise}
                                                        sessionId={sessionId}
                                                        sectionId={sectionId}
                                                        onAddExerciseToSuperset={handleAddExerciseToSuperset}
                                                        availableExercises={filteredExercises}
                                                        isDraggable={true}
                                                        isForSuperset={true}
                                                        displayNumber={displayNumber}
                                                        needsMoreExercises={needsMoreExercises}
                                                        isDragging={snapshot.isDragging}
                                                      />
                                                    </div>
                                                  )}
                                                </Draggable>
                                              );
                                            }
                                          });
                                        })()
                                      )}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
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