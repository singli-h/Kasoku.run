import { useCallback } from "react"

/**
 * Custom hook for handling drag and drop functionality
 * 
 * @param {Function} setFormData - Function to update form data
 * @param {Function} setSessionSections - Function to update session sections
 * @returns {Object} Drag and drop handlers
 */
export const useDragAndDrop = (setFormData, setSessionSections) => {
  /**
   * Handle section drag end
   * 
   * @param {Object} result - Drag result from @dnd-kit
   * @param {number} sessionId - Current session ID
   * @param {Array} activeSections - Current active sections
   */
  const handleSectionDragEnd = useCallback((result, sessionId, activeSections) => {
    if (!result.destination) return
    
    const { source, destination } = result
    
    // Reorder sections
    const reorderedSections = Array.from(activeSections)
    const [removed] = reorderedSections.splice(source.index, 1)
    reorderedSections.splice(destination.index, 0, removed)
    
    // Update session sections
    setSessionSections((prev) => ({
      ...prev,
      [sessionId]: reorderedSections,
    }))
  }, [setSessionSections])
  
  /**
   * Handle exercise drag end
   * 
   * @param {Object} result - Drag result from @dnd-kit
   * @param {number} sessionId - Current session ID
   */
  const handleExerciseDragEnd = useCallback((result, sessionId) => {
    if (!result.destination) return
    
    const { source, destination } = result
    
    // Only reorder if the source and destination are the same section
    if (source.droppableId === destination.droppableId) {
      const sectionId = source.droppableId
      
      setFormData((prev) => {
        // Get exercises for this section and session
        const sectionExercises = prev.exercises.filter(
          (ex) => ex.session === sessionId && ex.part === sectionId
        )
        
        // Reorder exercises
        const reorderedExercises = Array.from(sectionExercises)
        const [removed] = reorderedExercises.splice(source.index, 1)
        reorderedExercises.splice(destination.index, 0, removed)
        
        // Update all exercises
        const updatedExercises = prev.exercises.map((ex) => {
          if (ex.session === sessionId && ex.part === sectionId) {
            // Find the reordered exercise with the same ID
            const reorderedEx = reorderedExercises.find((rex) => rex.id === ex.id)
            return reorderedEx || ex
          }
          return ex
        })
        
        return {
          ...prev,
          exercises: updatedExercises,
        }
      })
    }
  }, [setFormData])
  
  return {
    handleSectionDragEnd,
    handleExerciseDragEnd,
  }
} 