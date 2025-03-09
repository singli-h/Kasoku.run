import { useCallback } from "react"

/**
 * Custom hook for form validation
 * 
 * @param {Object} formData - Form data to validate
 * @param {Function} setErrors - Function to set validation errors
 * @returns {Object} Validation functions
 */
export const useValidation = (formData, setErrors) => {
  /**
   * Validate step 1: Mesocycle Overview
   * 
   * @returns {boolean} Whether the step is valid
   */
  const validateStepOne = useCallback(() => {
    const newErrors = {}
    
    // Validate goals
    if (!formData.goals.trim()) {
      newErrors.goals = "Goals are required"
    }
    
    // Validate start date
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required"
    }
    
    // Validate duration
    if (!formData.duration) {
      newErrors.duration = "Duration is required"
    } else if (isNaN(formData.duration) || parseInt(formData.duration) <= 0) {
      newErrors.duration = "Duration must be a positive number"
    }
    
    // Validate sessions per week
    if (!formData.sessionsPerWeek) {
      newErrors.sessionsPerWeek = "Sessions per week is required"
    } else if (isNaN(formData.sessionsPerWeek) || parseInt(formData.sessionsPerWeek) <= 0) {
      newErrors.sessionsPerWeek = "Sessions per week must be a positive number"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, setErrors])
  
  /**
   * Validate step 2: Session & Exercise Planning
   * 
   * @returns {boolean} Whether the step is valid
   */
  const validateStepTwo = useCallback(() => {
    const newErrors = {}
    
    // Validate sessions
    formData.sessions.forEach((session) => {
      if (!session.name || !session.name.trim()) {
        newErrors[`session-${session.id}-name`] = "Session name is required"
      }
      
      if (session.progressionModel && !session.progressionValue) {
        newErrors[`session-${session.id}-progressionValue`] = "Progression value is required"
      }
    })
    
    // Validate exercises
    formData.exercises.forEach((exercise) => {
      if (!exercise.sets) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] = "Sets are required"
      } else if (isNaN(exercise.sets) || parseInt(exercise.sets) <= 0) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] = "Sets must be a positive number"
      }
      
      if (!exercise.reps) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] = "Reps are required"
      } else if (isNaN(exercise.reps) || parseInt(exercise.reps) <= 0) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] = "Reps must be a positive number"
      }
      
      if (!exercise.rest) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] = "Rest time is required"
      } else if (isNaN(exercise.rest) || parseInt(exercise.rest) <= 0) {
        newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] = "Rest time must be a positive number"
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, setErrors])
  
  /**
   * Validate step 3: Confirmation & AI Review
   * 
   * @returns {boolean} Whether the step is valid
   */
  const validateStepThree = useCallback(() => {
    // No validation needed for step 3
    return true
  }, [])
  
  /**
   * Validate the current step
   * 
   * @param {number} step - Current step
   * @returns {boolean} Whether the step is valid
   */
  const validateStep = useCallback((step) => {
    switch (step) {
      case 1:
        return validateStepOne()
      case 2:
        return validateStepTwo()
      case 3:
        return validateStepThree()
      default:
        return false
    }
  }, [validateStepOne, validateStepTwo, validateStepThree])
  
  /**
   * Clear errors for a specific field
   * 
   * @param {string} field - Field name
   */
  const clearError = useCallback((field) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [setErrors])
  
  return {
    validateStep,
    validateStepOne,
    validateStepTwo,
    validateStepThree,
    clearError,
  }
} 