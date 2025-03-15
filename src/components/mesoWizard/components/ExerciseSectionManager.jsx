"use client"

import { useState, useEffect, useCallback, memo } from "react"
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
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ExerciseType } from "@/types/exercise"
import SupersetContainer from "./SupersetContainer"
import ExerciseContextMenu from "./ExerciseContextMenu"

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
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
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
  getOrderedExercises,
  activeSections = [],
  setActiveSections,
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  // Add state for section search terms
  const [sectionSearchTerms, setSectionSearchTerms] = useState({})
  
  // Loading state (simulated for this example)
  const [isLoading, setIsLoading] = useState(false)
  
  // Available section types based on ExerciseType enum
  const sectionTypes = [
    { id: "warmup", name: "Warm-up", icon: <Flame className="h-4 w-4" />, typeId: ExerciseType.WarmUp },
    { id: "gym", name: "Gym Exercises", icon: <Dumbbell className="h-4 w-4" />, typeId: ExerciseType.Gym },
    { id: "circuit", name: "Circuits", icon: <RotateCcw className="h-4 w-4" />, typeId: ExerciseType.Circuit },
    { id: "plyometric", name: "Plyometrics", icon: <ArrowUpCircle className="h-4 w-4" />, typeId: ExerciseType.Plyometric },
    { id: "isometric", name: "Isometrics", icon: <Pause className="h-4 w-4" />, typeId: ExerciseType.Isometric },
    { id: "sprint", name: "Sprints", icon: <Timer className="h-4 w-4" />, typeId: ExerciseType.Sprint },
    { id: "drill", name: "Drills", icon: <Target className="h-4 w-4" />, typeId: ExerciseType.Drill },
  ]
  
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
    return getOrderedExercises(sessionId, sectionId)
  }, [getOrderedExercises, sessionId])
  
  // Helper function to get exercises sorted by superset and position
  const getOrderedExercisesAndSupersets = useCallback((sectionId) => {
    // Get exercises for this section
    const sectionExercises = getSectionExercises(sectionId);
    
    // Step 1: Identify all supersets and their positions
    const supersetPositions = new Map();
    sectionExercises.forEach((exercise, index) => {
      if (exercise.supersetId && !supersetPositions.has(exercise.supersetId)) {
        supersetPositions.set(exercise.supersetId, index);
      }
    });
    
    // Step 2: Group exercises by superset while preserving order
    const supersetMap = new Map();
    const orderedSupersetExercises = new Map();
    const normalExercises = [];
    
    sectionExercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!supersetMap.has(exercise.supersetId)) {
          supersetMap.set(exercise.supersetId, []);
          orderedSupersetExercises.set(exercise.supersetId, []);
        }
        supersetMap.get(exercise.supersetId).push(exercise);
        
        // Track the original order of exercises within the superset
        if (!orderedSupersetExercises.get(exercise.supersetId).some(ex => ex.id === exercise.id)) {
          orderedSupersetExercises.get(exercise.supersetId).push(exercise);
        }
      } else {
        normalExercises.push(exercise);
      }
    });
    
    // Step 3: Create a unified list of exercises and supersets
    const unifiedItems = [];
    
    // Map of already added superset IDs
    const addedSupersets = new Set();
    
    // Add items in proper order
    sectionExercises.forEach((exercise, index) => {
      if (exercise.supersetId) {
        // If this is the first occurrence of this superset and we haven't added it yet
        if (supersetPositions.get(exercise.supersetId) === index && 
            !addedSupersets.has(exercise.supersetId)) {
          // Add the superset as a group
          unifiedItems.push({
            type: 'superset',
            id: exercise.supersetId,
            exercises: orderedSupersetExercises.get(exercise.supersetId),
            position: index
          });
          addedSupersets.add(exercise.supersetId);
        }
      } else {
        // It's a normal exercise
        unifiedItems.push({
          type: 'exercise',
          exercise,
          position: index
        });
      }
    });
    
    return {
      unifiedItems,
      supersetMap,
      orderedSupersetExercises,
      supersetPositions
    };
  }, [getSectionExercises, sessionId]);
  
  // Handle section drag end
  const onSectionDragEnd = useCallback((result) => {
    if (!result.destination) return
    
    const { source, destination } = result
    
    // Reorder sections
    const reorderedSections = Array.from(activeSections)
    const [removed] = reorderedSections.splice(source.index, 1)
    reorderedSections.splice(destination.index, 0, removed)
    
    setActiveSections(reorderedSections)
    setIsDragging(false)
  }, [activeSections, setActiveSections])
  
  // Handle exercise drag end
  const onExerciseDragEnd = useCallback((result) => {
    if (!result.destination) return
    
    const { source, destination } = result
    
    // Only reorder if the source and destination are the same section
    if (source.droppableId === destination.droppableId) {
      const sectionId = source.droppableId
      
      // Use our helper to get the unified list
      const { unifiedItems } = getOrderedExercisesAndSupersets(sectionId);
      
      // Perform the reordering on the unified list
      const [removed] = unifiedItems.splice(source.index, 1)
      unifiedItems.splice(destination.index, 0, removed)
      
      // Convert back to a flat list of exercises in the new order
      const reorderedExercises = []
      unifiedItems.forEach(item => {
        if (item.type === 'exercise') {
          reorderedExercises.push(item.exercise)
        } else if (item.type === 'superset') {
          // Add all exercises from the superset in their original order
          item.exercises.forEach(exercise => {
            reorderedExercises.push(exercise)
          })
        }
      })
      
      // Update exercise order
      handleExerciseReorder(sessionId, sectionId, reorderedExercises)
    }
    
    setIsDragging(false)
  }, [sessionId, getOrderedExercisesAndSupersets, handleExerciseReorder])
  
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
  
  // Handle search change for a specific section
  const handleSearchChange = useCallback((sectionId, e) => {
    setSectionSearchTerms(prev => ({
      ...prev,
      [sectionId]: e.target.value
    }));
    
    // Simulate loading state briefly when searching
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  // Get filtered exercises for a specific section
  const getFilteredExercisesForSection = useCallback((sectionId) => {
    // Filter exercises by section type
    const sectionExercises = filteredExercises.filter(ex => ex.type === sectionId);
    const searchTerm = sectionSearchTerms[sectionId] || '';
    
    if (!searchTerm.trim()) {
      return sectionExercises;
    }
    
    // Filter by search term
    return sectionExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.category && ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredExercises, sectionSearchTerms]);

  // Get filtered exercises for a superset, searching across all exercise types
  const getFilteredExercisesForSuperset = useCallback((sectionId) => {
    const searchTerm = sectionSearchTerms[sectionId] || '';
    
    if (!searchTerm.trim()) {
      // When no search term, return only exercises of this section type
      return filteredExercises.filter(ex => ex.type === sectionId);
    }
    
    // When searching, include ALL exercise types
    return filteredExercises.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.category && ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredExercises, sectionSearchTerms]);

  // Check if exercise is already added
  const isExerciseAdded = useCallback((exerciseId) => {
    return exercises.some(ex => ex.id === exerciseId);
  }, [exercises]);
  
  // Add state for managing supersets
  const [supersets, setSupersets] = useState([])
  // Counter for generating unique superset IDs
  const [supersetCounter, setSupersetCounter] = useState(1)

  // Function to create a new superset
  const handleCreateSuperset = useCallback((exerciseId, sessionId, sectionId) => {
    // Find the exercise
    const exercise = exercises.find(ex => 
      ex.id === exerciseId && ex.session === sessionId && ex.part === sectionId
    );
    
    if (!exercise) return;
    
    // Get all section exercises and find index of the exercise to be converted
    const sectionExercises = getSectionExercises(sectionId);
    const exerciseIndex = sectionExercises.findIndex(ex => ex.id === exerciseId);
    
    // Create a new superset ID
    const newSupersetId = `superset-${supersetCounter}`;
    
    // Create the superset
    const newSuperset = {
      id: newSupersetId,
      label: `${supersetCounter}`,
      exercises: [{ ...exercise, supersetId: newSupersetId }],
      // Store the original exercise's position to maintain order
      originalPosition: exerciseIndex
    };
    
    // Add the superset to state, maintaining the order
    setSupersets(prev => {
      const newSupersets = [...prev, newSuperset];
      // Sort supersets by their original position within the section
      return newSupersets.sort((a, b) => {
        // If both have originalPosition, sort by that
        if (a.originalPosition !== undefined && b.originalPosition !== undefined) {
          return a.originalPosition - b.originalPosition;
        }
        // If only one has originalPosition, put it first
        if (a.originalPosition !== undefined) return -1;
        if (b.originalPosition !== undefined) return 1;
        // Otherwise keep existing order
        return 0;
      });
    });
    
    // Update the exercise with superset ID in the parent component's state
    handleExerciseDetailChange(exerciseId, sessionId, sectionId, 'supersetId', newSupersetId);
    
    // Increment the counter for the next superset
    setSupersetCounter(prev => prev + 1);
  }, [exercises, supersetCounter, handleExerciseDetailChange, getSectionExercises]);

  // Function to add an exercise to an existing superset
  const handleAddToSuperset = useCallback((exerciseId, supersetId, sessionId, sectionId) => {
    // Find the exercise
    const exercise = exercises.find(ex => 
      ex.id === exerciseId && ex.session === sessionId && ex.part === sectionId
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
    handleExerciseDetailChange(exerciseId, sessionId, sectionId, 'supersetId', supersetId);
  }, [exercises, handleExerciseDetailChange]);

  // Function to add a new exercise directly to a superset
  const handleAddExerciseToSuperset = useCallback((exercise, supersetId) => {
    // Create a new exercise with the superset ID
    const newExercise = {
      ...exercise,
      id: Date.now(), // Generate a unique ID
      session: sessionId,
      part: exercise.type,
      sets: "",
      reps: "",
      rest: "",
      supersetId: supersetId
    };
    
    // Add the exercise to the parent component's state
    handleAddExercise(newExercise);
    
    // Update the superset
    setSupersets(prev => 
      prev.map(superset => 
        superset.id === supersetId
          ? { ...superset, exercises: [...superset.exercises, newExercise] }
          : superset
      )
    );
  }, [sessionId, handleAddExercise]);

  // Function to remove an exercise from a superset
  const handleRemoveFromSuperset = useCallback((supersetId, exerciseId) => {
    // Find the exercise in the superset
    const superset = supersets.find(s => s.id === supersetId);
    if (!superset) return;
    
    const exercise = superset.exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Update the superset
    let updatedSupersets = supersets.map(superset => {
      if (superset.id === supersetId) {
        const newExercises = superset.exercises.filter(ex => ex.id !== exerciseId);
        return { ...superset, exercises: newExercises };
      }
      return superset;
    });
    
    // Remove the superset if it has no exercises left
    updatedSupersets = updatedSupersets.filter(superset => superset.exercises.length > 0);
    
    setSupersets(updatedSupersets);
    
    // Update the exercise to remove superset ID
    handleExerciseDetailChange(exerciseId, exercise.session, exercise.part, 'supersetId', null);
  }, [supersets, handleExerciseDetailChange]);

  // Function to completely dissolve a superset
  const handleExitSuperset = useCallback((supersetId) => {
    // Get the exercises from the superset
    const supersetExercises = supersets.find(s => s.id === supersetId)?.exercises || [];
    
    // Remove the superset
    setSupersets(prev => prev.filter(s => s.id !== supersetId));
    
    // Update all exercises to remove superset ID
    supersetExercises.forEach(exercise => {
      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, 'supersetId', null);
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
        
        <DragDropContext onDragEnd={onSectionDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {activeSections.map((sectionId, index) => (
                  <Draggable key={sectionId} draggableId={String(sectionId)} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-md overflow-visible relative"
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
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Search className="w-5 h-5 text-gray-400" />
                                <Input
                                  type="text"
                                  placeholder={`Search ${getSectionName(sectionId).toLowerCase()} exercises...`}
                                  onChange={(e) => handleSearchChange(sectionId, e)}
                                  value={sectionSearchTerms[sectionId] || ''}
                                  className="flex-grow"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 bg-gray-50 rounded-md">
                                {isLoading ? (
                                  // Show skeletons while loading
                                  Array(6)
                                    .fill(0)
                                    .map((_, i) => (
                                      <div key={i} className="flex items-center space-x-2 p-2 border rounded-md bg-white">
                                        <div className="flex-1">
                                          <Skeleton className="h-4 w-3/4 mb-2" />
                                          <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                      </div>
                                    ))
                                ) : getFilteredExercisesForSection(sectionId).length === 0 ? (
                                  <div className="col-span-full text-center py-4 text-gray-500">
                                    No exercises found. Try a different search term.
                                  </div>
                                ) : (
                                  getFilteredExercisesForSection(sectionId).map((exercise) => (
                                    <Button
                                      key={exercise.id}
                                      type="button"
                                      variant="outline"
                                      className="justify-between text-left h-auto py-2 bg-white hover:bg-gray-50"
                                      onClick={() => handleAddExercise({ ...exercise, part: sectionId })}
                                      disabled={isExerciseAdded(exercise.id)}
                                    >
                                      <div>
                                        <div className="font-medium text-sm">{exercise.name}</div>
                                        <div className="text-xs text-gray-500">{exercise.category}</div>
                                      </div>
                                      <Plus className="w-4 h-4 flex-shrink-0 ml-2" />
                                    </Button>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* Existing exercises list */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Added Exercises</h4>
                              <DragDropContext onDragEnd={onExerciseDragEnd}>
                                <Droppable droppableId={String(sectionId)}>
                                  {(provided) => (
                                    <div
                                      {...provided.droppableProps}
                                      ref={provided.innerRef}
                                      className="space-y-2"
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
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className="border rounded-md p-3 bg-white relative overflow-visible"
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
                                              return (
                                                <Draggable
                                                  key={`superset-${item.id}`}
                                                  draggableId={`superset-${item.id}`}
                                                  index={idx}
                                                >
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
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
                                                        availableExercises={getFilteredExercisesForSuperset(sectionId)}
                                                        isDraggable={true}
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