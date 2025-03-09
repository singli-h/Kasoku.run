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
  Trash2,
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ExerciseType } from "@/types/exercise"

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
  getOrderedExercises,
  activeSections = [],
  setActiveSections,
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)

  // State for section search terms
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
      setExpandedSections([activeSections[0]])
    }
  }, [activeSections, expandedSections])
  
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
      
      // Get exercises for this section and session
      const sectionExercises = getOrderedExercises(sessionId, sectionId)
      
      // Reorder exercises
      const reorderedExercises = Array.from(sectionExercises)
      const [removed] = reorderedExercises.splice(source.index, 1)
      reorderedExercises.splice(destination.index, 0, removed)
      
      // Update exercise order
      handleExerciseReorder(sessionId, sectionId, reorderedExercises)
    }
    
    setIsDragging(false)
  }, [sessionId, getOrderedExercises, handleExerciseReorder])
  
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
        return prev.filter((id) => id !== sectionId)
      } else {
        return [...prev, sectionId]
      }
    })
  }, [isDragging])
  
  // Collapse all sections
  const collapseAllSections = useCallback(() => {
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

  // Check if exercise is already added
  const isExerciseAdded = useCallback((exerciseId) => {
    return exercises.some(ex => ex.id === exerciseId);
  }, [exercises]);
  
  return (
    <Card>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 bg-white">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Section</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-white border-2 border-blue-500 shadow-lg z-[9999] p-3 rounded-md min-w-[200px]"
              >
                {/* Debug: Shows the number of items */}
                <div className="text-sm font-medium mb-2 text-gray-700 border-b pb-1">
                  Available sections: {sectionTypes.filter((type) => !activeSections.includes(type.id)).length}
                </div>
                
                {sectionTypes
                  .filter((type) => !activeSections.includes(type.id))
                  .map((type) => (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => handleAddSection(type.id)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded-md p-2 my-1"
                    >
                      <div className="text-blue-500">
                        {type.icon}
                      </div>
                      <span className="text-gray-800 font-medium">{type.name}</span>
                    </DropdownMenuItem>
                  ))}
                {sectionTypes.filter((type) => !activeSections.includes(type.id)).length === 0 && (
                  <DropdownMenuItem disabled className="p-2">
                    <span className="text-gray-400">All section types added</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                        className="border rounded-md overflow-hidden"
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
                          {/* Delete button with improved visibility - using Trash2 icon */}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full flex items-center justify-center z-10"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent toggle
                              handleRemoveSection(sectionId);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                                        getSectionExercises(sectionId).map((exercise, index) => (
                                          <Draggable
                                            key={String(exercise.id)}
                                            draggableId={String(exercise.id)}
                                            index={index}
                                          >
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="border rounded-md p-3 bg-white relative"
                                              >
                                                <div {...provided.dragHandleProps} className="flex items-center justify-between cursor-grab">
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
                                                  {/* Delete button with improved visibility - using Trash2 icon */}
                                                  <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full flex items-center justify-center z-10"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRemoveExercise(exercise.id, exercise.session, exercise.part);
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                                
                                                {/* Exercise details will be moved to the Timeline view */}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))
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