"use client"

import { useState, useMemo, memo } from "react"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/**
 * Exercise Selector Component
 * 
 * Allows users to search and select exercises from the exercise library.
 * Filters exercises by section type and search term.
 * 
 * @param {Object} props - Component props
 * @param {string} props.sectionId - Current section ID
 * @param {number} props.sessionId - Current session ID
 * @param {Array} props.exercises - Current exercises
 * @param {Array} props.allExercises - All available exercises
 * @param {Function} props.handleAddExercise - Function to add an exercise
 */
const ExerciseSelector = memo(({ 
  sectionId, 
  sessionId, 
  exercises, 
  allExercises, 
  handleAddExercise
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  
  // Filter exercises by section type and search term
  const filteredExercises = useMemo(() => {
    const sectionExercises = allExercises.filter((ex) => ex.type === sectionId)
    
    if (!searchTerm.trim()) {
      return sectionExercises
    }
    
    return sectionExercises.filter((ex) => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.category && ex.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [allExercises, sectionId, searchTerm])
  
  // Get already added exercise IDs for this section and session
  const addedExerciseIds = useMemo(() => {
    return exercises
      .filter((ex) => ex.session === sessionId && ex.part === sectionId)
      .map((ex) => ex.id)
  }, [exercises, sessionId, sectionId])
  
  // Handle adding an exercise
  const onAddExercise = (exercise) => {
    handleAddExercise(exercise)
    setIsOpen(false)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 text-xs sm:text-sm h-8 bg-white"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Exercise</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-2 border-gray-300 shadow-lg z-[9999]">
        <DialogHeader className="bg-white">
          <DialogTitle>Add Exercise to {sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 bg-white">
          {/* Debug info */}
          <div className="text-xs text-blue-600 mb-2">
            Total available exercises: {filteredExercises.length} | Already added: {addedExerciseIds.length}
          </div>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search exercises..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Exercise list */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 bg-white">
            {filteredExercises.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No exercises found. Try a different search term.
              </p>
            ) : (
              filteredExercises.map((exercise) => {
                const isAdded = addedExerciseIds.includes(exercise.id)
                
                return (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 bg-white border border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-sm">{exercise.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {exercise.category || "General"}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAdded ? "outline" : "default"}
                      disabled={isAdded}
                      onClick={() => onAddExercise(exercise)}
                      className="h-8 px-3"
                    >
                      {isAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ExerciseSelector.displayName = "ExerciseSelector"

export default ExerciseSelector 