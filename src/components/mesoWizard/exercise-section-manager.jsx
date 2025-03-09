"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import {
  Search,
  Plus,
  Minus,
  X,
  Flame,
  Dumbbell,
  RotateCcw,
  ArrowUpCircle,
  Pause,
  Timer,
  Target,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { exerciseSectionTypes } from "@/lib/sample-data"
import { useMediaQuery } from "@/hooks/use-media-query"

// Memoized exercise detail fields component
const ExerciseDetailFields = memo(({ exercise, handleExerciseDetailChange, errors }) => {
  // Determine which fields to show based on exercise type
  const showOneRepMax = exercise.part === "gym"
  const showPlyometricFields = exercise.part === "plyometric"
  const showSprintFields = exercise.part === "sprint"
  const showIsometricFields = exercise.part === "isometric"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3">
          Edit Details
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2">
        <div className="space-y-2 p-2">
          {showOneRepMax && (
            <div>
              <Label htmlFor={`${exercise.id}-1rm`} className="text-xs">
                1RM (%)
              </Label>
              <Input
                id={`${exercise.id}-1rm`}
                type="text"
                value={exercise.oneRepMax || ""}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numeric input
                  if (value === "" || /^\d+$/.test(value)) {
                    handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "oneRepMax", value)
                  }
                }}
                className={`mt-1 ${errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-oneRepMax`] ? "border-red-500" : ""}`}
              />
            </div>
          )}

          {(showOneRepMax || exercise.type === "powerlifting") && (
            <>
              <div>
                <Label htmlFor={`${exercise.id}-power`} className="text-xs">
                  Power (W)
                </Label>
                <Input
                  id={`${exercise.id}-power`}
                  type="text"
                  value={exercise.power || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "power", e.target.value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-velocity`} className="text-xs">
                  Velocity (m/s)
                </Label>
                <Input
                  id={`${exercise.id}-velocity`}
                  type="text"
                  value={exercise.velocity || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(
                        exercise.id,
                        exercise.session,
                        exercise.part,
                        "velocity",
                        e.target.value,
                      )
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {(showPlyometricFields || showSprintFields) && (
            <>
              <div>
                <Label htmlFor={`${exercise.id}-distance`} className="text-xs">
                  Distance (m)
                </Label>
                <Input
                  id={`${exercise.id}-distance`}
                  type="text"
                  value={exercise.distance || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(
                        exercise.id,
                        exercise.session,
                        exercise.part,
                        "distance",
                        e.target.value,
                      )
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-height`} className="text-xs">
                  Height (cm)
                </Label>
                <Input
                  id={`${exercise.id}-height`}
                  type="text"
                  value={exercise.height || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "height", e.target.value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`${exercise.id}-performing-time`} className="text-xs">
                  Performing Time (sec)
                </Label>
                <Input
                  id={`${exercise.id}-performing-time`}
                  type="text"
                  value={exercise.performing_time || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numeric input
                    if (value === "" || /^\d+$/.test(value)) {
                      handleExerciseDetailChange(
                        exercise.id,
                        exercise.session,
                        exercise.part,
                        "performing_time",
                        e.target.value,
                      )
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </>
          )}

          {showIsometricFields && (
            <div>
              <Label htmlFor={`${exercise.id}-hold-time`} className="text-xs">
                Hold Time (sec)
              </Label>
              <Input
                id={`${exercise.id}-hold-time`}
                type="text"
                value={exercise.performing_time || ""}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow numeric input
                  if (value === "" || /^\d+$/.test(value)) {
                    handleExerciseDetailChange(
                      exercise.id,
                      exercise.session,
                      exercise.part,
                      "performing_time",
                      e.target.value,
                    )
                  }
                }}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor={`${exercise.id}-effort`} className="text-xs">
              Effort (%)
            </Label>
            <Input
              id={`${exercise.id}-effort`}
              type="text"
              value={exercise.effort || ""}
              onChange={(e) => {
                const value = e.target.value
                // Only allow numeric input
                if (value === "" || /^\d+$/.test(value)) {
                  handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "effort", e.target.value)
                }
              }}
              className="mt-1"
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
ExerciseDetailFields.displayName = "ExerciseDetailFields"

// Memoized exercise selector component
const ExerciseSelector = memo(({ sectionId, sessionId, exercises, allExercises, handleAddExercise, errors }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Filter exercises by section type and search term
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) {
      return allExercises.filter((ex) => ex.type === sectionId).slice(0, 12)
    }

    setIsLoading(true)
    const result = allExercises.filter(
      (ex) =>
        ex.type === sectionId &&
        (ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.category.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    // Simulate delay for loading state demonstration
    setTimeout(() => setIsLoading(false), 300)
    return result
  }, [allExercises, sectionId, searchTerm])

  // Debounce search input
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    const timeoutId = setTimeout(() => {
      setSearchTerm(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder={`Search ${sectionId} exercises...`}
          onChange={handleSearchChange}
          className="flex-grow"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 bg-gray-50 rounded-md">
        {isLoading ? (
          // Show skeletons while loading
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 border rounded-md">
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            ))
        ) : filteredExercises.length === 0 ? (
          <div className="col-span-full text-center py-4 text-gray-500">
            No exercises found. Try a different search term.
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <Button
              key={exercise.id}
              type="button"
              variant="outline"
              className="justify-between text-left h-auto py-2"
              onClick={() => handleAddExercise({ ...exercise, part: sectionId })}
              disabled={exercises.some((ex) => ex.id === exercise.id)}
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
  )
})
ExerciseSelector.displayName = "ExerciseSelector"

// Main component
const ExerciseSectionManager = ({
  sessionId,
  exercises,
  filteredExercises,
  handleAddExercise,
  handleRemoveExercise,
  handleExerciseDetailChange,
  errors = {},
  activeSections,
  setActiveSections,
}) => {
  const [sectionOrder, setSectionOrder] = useState([])
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false)
  const [availableSections, setAvailableSections] = useState([])
  const [expandedSection, setExpandedSection] = useState(null)
  const [exerciseOrder, setExerciseOrder] = useState({})
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Initialize section order from active sections
  useEffect(() => {
    setSectionOrder(activeSections.map((section) => section.id))
  }, [activeSections])

  // Update available sections for adding
  useEffect(() => {
    const activeIds = activeSections.map((section) => section.id)
    setAvailableSections(exerciseSectionTypes.filter((type) => !activeIds.includes(type.id)))
  }, [activeSections])

  // Initialize exercise order
  useEffect(() => {
    const newExerciseOrder = {}

    activeSections.forEach((section) => {
      const sectionExercises = exercises.filter((ex) => ex.session === sessionId && ex.part === section.id)

      newExerciseOrder[section.id] = sectionExercises.map((ex) => `${ex.id}-${ex.session}-${ex.part}`)
    })

    setExerciseOrder(newExerciseOrder)
  }, [exercises, activeSections, sessionId])

  // Handle section drag end event
  const onSectionDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(sectionOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSectionOrder(items)
    setIsDragging(false)

    // Update active sections based on new order
    const newActiveSections = items.map((id) => activeSections.find((section) => section.id === id))

    setActiveSections(newActiveSections)
  }

  // Handle exercise drag end event
  const onExerciseDragEnd = (result) => {
    const { source, destination } = result

    if (!destination) return

    const sectionId = source.droppableId

    // Create a copy of the current exercise order
    const newExerciseOrderList = Array.from(exerciseOrder[sectionId] || [])

    // Remove the dragged item from its original position
    const [removed] = newExerciseOrderList.splice(source.index, 1)

    // Insert it at the new position
    newExerciseOrderList.splice(destination.index, 0, removed)

    // Update the exercise order state
    setExerciseOrder({
      ...exerciseOrder,
      [sectionId]: newExerciseOrderList,
    })
  }

  // Add a new section
  const handleAddSection = (sectionType) => {
    setActiveSections([...activeSections, sectionType])
    setExpandedSection(sectionType.id)
    setShowAddSectionDialog(false)
  }

  // Remove a section
  const handleRemoveSection = (sectionId) => {
    setActiveSections(activeSections.filter((section) => section.id !== sectionId))

    // If removing the expanded section, collapse it
    if (expandedSection === sectionId) {
      setExpandedSection(null)
    }
  }

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  // Handle long press to initiate drag
  const handleSectionMouseDown = (sectionId) => {
    const timer = setTimeout(() => {
      setIsDragging(true)
    }, 500) // 500ms long press to initiate drag

    setLongPressTimer(timer)
  }

  const handleSectionMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSection(null)
  }

  // Get icon component for section type
  const getSectionIcon = (iconName) => {
    const icons = {
      Flame: <Flame className="h-4 w-4" />,
      Dumbbell: <Dumbbell className="h-4 w-4" />,
      RotateCcw: <RotateCcw className="h-4 w-4" />,
      ArrowUpCircle: <ArrowUpCircle className="h-4 w-4" />,
      Pause: <Pause className="h-4 w-4" />,
      Timer: <Timer className="h-4 w-4" />,
      Target: <Target className="h-4 w-4" />,
    }
    return icons[iconName] || <Flame className="h-4 w-4" />
  }

  // Get ordered exercises for a section
  const getOrderedExercises = (sectionId) => {
    if (!exerciseOrder[sectionId] || exerciseOrder[sectionId].length === 0) {
      return exercises.filter((ex) => ex.session === sessionId && ex.part === sectionId)
    }

    return exerciseOrder[sectionId]
      .map((id) => {
        const [exerciseId, session, part] = id.split("-")
        return exercises.find(
          (ex) => ex.id.toString() === exerciseId && ex.session.toString() === session && ex.part === part,
        )
      })
      .filter(Boolean)
  }

  // Group exercises by section
  const exercisesBySection = useMemo(() => {
    const result = {}
    activeSections.forEach((section) => {
      result[section.id] = getOrderedExercises(section.id)
    })
    return result
  }, [activeSections, exercises, exerciseOrder, sessionId])

  // Get all exercises for the timeline view
  const allExercisesInOrder = useMemo(() => {
    return sectionOrder.flatMap((sectionId) => {
      return getOrderedExercises(sectionId)
    })
  }, [sectionOrder, exerciseOrder, exercises])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Exercise Sections</h3>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={collapseAllSections} className="text-xs sm:text-sm">
            Collapse All
          </Button>

          <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                disabled={availableSections.length === 0}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Section</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Exercise Section</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {availableSections.map((section) => (
                  <Button
                    key={section.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddSection(section)}
                  >
                    <div className="flex items-center gap-2">
                      {getSectionIcon(section.icon)}
                      <span>{section.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={onSectionDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              <Accordion
                type="single"
                collapsible
                value={expandedSection}
                onValueChange={setExpandedSection}
                className="space-y-2"
              >
                {sectionOrder.map((sectionId, index) => {
                  const section = activeSections.find((s) => s.id === sectionId)
                  if (!section) return null

                  return (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <AccordionItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          value={section.id}
                          className="border rounded-md overflow-hidden relative"
                          data-state={expandedSection === section.id ? "open" : "closed"}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="bg-gray-100 flex items-center cursor-grab active:cursor-grabbing relative"
                          >
                            <div
                              className="flex-1 p-4 flex items-center gap-2"
                              onClick={() => toggleSection(section.id)}
                            >
                              {getSectionIcon(section.icon)}
                              <span className="font-medium">{section.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {exercisesBySection[section.id]?.length || 0} exercises
                              </Badge>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 mr-2 absolute right-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveSection(section.id)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <AccordionContent className="pt-0">
                            <div className="p-4">
                              <ExerciseSelector
                                sectionId={section.id}
                                sessionId={sessionId}
                                exercises={exercisesBySection[section.id] || []}
                                allExercises={filteredExercises}
                                handleAddExercise={handleAddExercise}
                                errors={errors}
                              />

                              {exercisesBySection[section.id]?.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium mb-2">Section Exercises</h4>
                                  <DragDropContext onDragEnd={onExerciseDragEnd}>
                                    <Droppable droppableId={section.id}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className="border rounded-md overflow-hidden"
                                        >
                                          <table className="w-full">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="p-2 text-left text-xs font-medium text-gray-500">#</th>
                                                <th className="p-2 text-left text-xs font-medium text-gray-500">
                                                  Exercise
                                                </th>
                                                <th className="p-2 text-left text-xs font-medium text-gray-500"></th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {exercisesBySection[section.id].map((exercise, idx) => (
                                                <Draggable
                                                  key={`${exercise.id}-${exercise.session}-${exercise.part}`}
                                                  draggableId={`${exercise.id}-${exercise.session}-${exercise.part}`}
                                                  index={idx}
                                                >
                                                  {(provided) => (
                                                    <tr
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                      className="border-b relative cursor-grab active:cursor-grabbing"
                                                    >
                                                      <td className="p-2 sm:p-3">
                                                        <div className="flex items-center">
                                                          <span>{idx + 1}</span>
                                                        </div>
                                                      </td>
                                                      <td className="p-2 sm:p-3">
                                                        <div>
                                                          <div className="font-medium text-sm sm:text-base">
                                                            {exercise.name}
                                                          </div>
                                                          <div className="text-xs text-gray-500">
                                                            {exercise.category}
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="p-2 sm:p-3 text-right">
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleRemoveExercise(
                                                              exercise.id,
                                                              exercise.session,
                                                              exercise.part,
                                                            )
                                                          }}
                                                          className="p-1 h-8 w-8 hover:bg-red-50 hover:text-red-500"
                                                        >
                                                          <Minus className="w-4 h-4" />
                                                        </Button>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </Draggable>
                                              ))}
                                              {provided.placeholder}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </Droppable>
                                  </DragDropContext>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Draggable>
                  )
                })}
              </Accordion>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Exercise Timeline</h3>
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Order</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Section</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Exercise</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Sets</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Reps</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Details</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500">Rest</th>
              </tr>
            </thead>
            <tbody>
              {allExercisesInOrder.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No exercises added. Add sections and exercises to build your workout.
                  </td>
                </tr>
              ) : (
                allExercisesInOrder.map((exercise, index) => {
                  const sectionIndex = sectionOrder.findIndex((id) => id === exercise.part)
                  const section = activeSections.find((s) => s.id === exercise.part)
                  const isFirstInSection = index === 0 || allExercisesInOrder[index - 1]?.part !== exercise.part

                  return (
                    <tr key={`${exercise.id}-${exercise.session}-${exercise.part}`} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">
                        {isFirstInSection && section && (
                          <div className="flex items-center gap-2">
                            {getSectionIcon(section.icon)}
                            <span>{section.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-xs text-gray-500">{exercise.category}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          value={exercise.sets}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow numeric input
                            if (value === "" || /^\d+$/.test(value)) {
                              handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "sets", value)
                            }
                          }}
                          className={`w-16 sm:w-20 ${errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] ? "border-red-500" : ""}`}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow numeric input
                            if (value === "" || /^\d+$/.test(value)) {
                              handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, "reps", value)
                            }
                          }}
                          className={`w-16 sm:w-20 ${errors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] ? "border-red-500" : ""}`}
                        />
                      </td>
                      <td className="p-3">
                        <ExerciseDetailFields
                          exercise={exercise}
                          handleExerciseDetailChange={handleExerciseDetailChange}
                          errors={errors}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="text"
                          value={exercise.rest_time || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow numeric input
                            if (value === "" || /^\d+$/.test(value)) {
                              handleExerciseDetailChange(
                                exercise.id,
                                exercise.session,
                                exercise.part,
                                "rest_time",
                                value,
                              )
                            }
                          }}
                          className="w-16 sm:w-20"
                          placeholder="60"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExerciseSectionManager

