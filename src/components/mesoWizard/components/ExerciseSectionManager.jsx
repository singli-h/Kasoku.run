"use client"

import { useState, useEffect, useCallback, memo } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import {
  X,
  Flame,
  Dumbbell,
  RotateCcw,
  ArrowUpCircle,
  Pause,
  Timer,
  Target,
  PlusCircle,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import ExerciseSelector from "./ExerciseSelector"
import ExerciseDetailFields from "./ExerciseDetailFields"

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
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Function} props.handleExerciseReorder - Function to handle exercise reordering
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 * @param {Object} props.errors - Validation errors
 * @param {Array} props.activeSections - Active sections for this session
 * @param {Function} props.setActiveSections - Function to set active sections
 */
const ExerciseSectionManager = memo(({
  sessionId,
  exercises,
  filteredExercises,
  handleAddExercise,
  handleRemoveExercise,
  handleExerciseDetailChange,
  handleExerciseReorder,
  getOrderedExercises,
  errors = {},
  activeSections = [],
  setActiveSections,
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState([])
  
  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  // Available section types
  const sectionTypes = [
    { id: "warmup", name: "Warm-up", icon: <Flame className="h-4 w-4" /> },
    { id: "gym", name: "Gym Exercises", icon: <Dumbbell className="h-4 w-4" /> },
    { id: "circuit", name: "Circuits", icon: <RotateCcw className="h-4 w-4" /> },
    { id: "plyometric", name: "Plyometrics", icon: <ArrowUpCircle className="h-4 w-4" /> },
    { id: "isometric", name: "Isometrics", icon: <Pause className="h-4 w-4" /> },
    { id: "sprint", name: "Sprints", icon: <Timer className="h-4 w-4" /> },
    { id: "drill", name: "Drills", icon: <Target className="h-4 w-4" /> },
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
  const handleSectionMouseDown = useCallback((sectionId) => {
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
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Section</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sectionTypes
                  .filter((type) => !activeSections.includes(type.id))
                  .map((type) => (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => handleAddSection(type.id)}
                      className="flex items-center gap-2"
                    >
                      {type.icon}
                      <span>{type.name}</span>
                    </DropdownMenuItem>
                  ))}
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
                          className={`relative bg-gray-50 p-3 flex items-center justify-between cursor-pointer ${isDragging ? 'cursor-grabbing' : ''}`}
                          onClick={() => toggleSection(sectionId)}
                          onMouseDown={() => handleSectionMouseDown(sectionId)}
                          onMouseUp={handleSectionMouseUp}
                          onTouchStart={() => handleSectionMouseDown(sectionId)}
                          onTouchEnd={handleSectionMouseUp}
                          {...provided.dragHandleProps}
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
                          {/* Delete button positioned absolutely at the right */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent toggle
                              handleRemoveSection(sectionId);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {expandedSections.includes(sectionId) && (
                          <div className="p-3">
                            <div className="flex justify-end mb-3">
                              <ExerciseSelector
                                sectionId={sectionId}
                                sessionId={sessionId}
                                exercises={exercises}
                                allExercises={filteredExercises}
                                handleAddExercise={handleAddExercise}
                              />
                            </div>
                            
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
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                                  </div>
                                                  <div>
                                                    <p className="font-medium">{exercise.name}</p>
                                                    <Badge variant="outline" className="mt-1">
                                                      {exercise.category}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                {/* Delete button positioned absolutely at the right */}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 text-red-500 absolute right-2 top-1/2 transform -translate-y-1/2"
                                                  onClick={() => 
                                                    handleRemoveExercise(exercise.id, exercise.session, exercise.part)
                                                  }
                                                >
                                                  <X className="h-4 w-4" />
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