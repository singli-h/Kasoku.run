import { useState, useEffect, useCallback } from "react"
import { exerciseLibrary } from "../sampledata"

/**
 * Custom hook for managing MesoWizard state
 * 
 * @param {Function} onComplete - Callback function when wizard is completed
 * @returns {Object} State and handlers for the MesoWizard
 */
export const useMesoWizardState = (onComplete) => {
  // Main wizard step state
  const [step, setStep] = useState(1)
  
  // Form data state
  const [formData, setFormData] = useState({
    goals: "",
    startDate: "",
    duration: "",
    sessionsPerWeek: "",
    exercises: [],
    sessions: [],
    specialConstraints: "",
  })
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExercises, setFilteredExercises] = useState(exerciseLibrary)
  const [activeSession, setActiveSession] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [errors, setErrors] = useState({})
  const [sessionSections, setSessionSections] = useState({})
  const [exerciseOrder, setExerciseOrder] = useState({}) // Track exercise order by section

  // Calculate progress percentage
  const progressPercentage = ((step - 1) / 3) * 100

  // Filter exercises based on search term
  useEffect(() => {
    setFilteredExercises(
      exerciseLibrary.filter((exercise) => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm])

  // Handle basic input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear errors for this field if any
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  // Handle session-specific input changes
  const handleSessionInputChange = useCallback((sessionId, field, value) => {
    setFormData((prev) => {
      const updatedSessions = [...prev.sessions]
      const sessionIndex = updatedSessions.findIndex((s) => s.id === sessionId)
      
      if (sessionIndex !== -1) {
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          [field]: value,
        }
      }
      
      return { ...prev, sessions: updatedSessions }
    })
    
    // Clear errors for this field if any
    const errorKey = `session-${sessionId}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }, [errors])

  // Handle adding an exercise
  const handleAddExercise = useCallback((exercise) => {
    const newExercise = {
      ...exercise,
      id: Date.now(), // Generate a unique ID
      session: activeSession,
      part: exercise.type,
      sets: "",
      reps: "",
      rest: "",
    }
    
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }))
    
    // Update exercise order
    setExerciseOrder((prev) => {
      const sectionKey = `${activeSession}-${exercise.type}`
      const currentOrder = prev[sectionKey] || []
      return {
        ...prev,
        [sectionKey]: [...currentOrder, newExercise.id]
      }
    })
  }, [activeSession])

  // Handle removing an exercise
  const handleRemoveExercise = useCallback((id, session, part) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== id),
    }))
    
    // Update exercise order
    setExerciseOrder((prev) => {
      const sectionKey = `${session}-${part}`
      const currentOrder = prev[sectionKey] || []
      return {
        ...prev,
        [sectionKey]: currentOrder.filter(exId => exId !== id)
      }
    })
  }, [])

  // Handle exercise detail changes
  const handleExerciseDetailChange = useCallback((id, session, part, field, value) => {
    setFormData((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id === id) {
          return { ...ex, [field]: value }
        }
        return ex
      })
      
      return { ...prev, exercises: updatedExercises }
    })
    
    // Clear errors for this field if any
    const errorKey = `exercise-${id}-${session}-${part}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }, [errors])

  // Handle exercise reordering
  const handleExerciseReorder = useCallback((sessionId, sectionId, reorderedExercises) => {
    // Update the exercise order
    const exerciseIds = reorderedExercises.map(ex => ex.id)
    const sectionKey = `${sessionId}-${sectionId}`
    
    setExerciseOrder(prev => ({
      ...prev,
      [sectionKey]: exerciseIds
    }))
  }, [])

  // Handle progression model changes
  const handleProgressionModelChange = useCallback((sessionId, model) => {
    setFormData((prev) => {
      const updatedSessions = [...prev.sessions]
      const sessionIndex = updatedSessions.findIndex((s) => s.id === sessionId)
      
      if (sessionIndex !== -1) {
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          progressionModel: model,
          progressionValue: "",
        }
      }
      
      return { ...prev, sessions: updatedSessions }
    })
  }, [])

  // Handle progression value changes
  const handleProgressionValueChange = useCallback((sessionId, model, value) => {
    setFormData((prev) => {
      const updatedSessions = [...prev.sessions]
      const sessionIndex = updatedSessions.findIndex((s) => s.id === sessionId)
      
      if (sessionIndex !== -1) {
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          progressionValue: value,
        }
      }
      
      return { ...prev, sessions: updatedSessions }
    })
    
    // Clear errors for this field if any
    const errorKey = `session-${sessionId}-progressionValue`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }, [errors])

  // Handle accepting AI suggestions
  const handleAcceptSuggestion = useCallback((suggestionId) => {
    // Mark the suggestion as accepted
    setAiSuggestions((prev) => {
      if (!prev) return null
      
      return {
        ...prev,
        suggestions: prev.suggestions.map((s) => {
          if (s.id === suggestionId) {
            return { ...s, accepted: true }
          }
          return s
        }),
      }
    })
  }, [])

  // Handle setting active sections for a session
  const handleSetActiveSections = useCallback((sessionId, sections) => {
    setSessionSections((prev) => ({
      ...prev,
      [sessionId]: sections,
    }))
  }, [])

  // Validate the current step
  const validateStep = useCallback((currentStep) => {
    const newErrors = {}
    
    if (currentStep === 1) {
      // Validate Step 1: Mesocycle Overview
      if (!formData.goals.trim()) {
        newErrors.goals = "Goals are required"
      }
      
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required"
      }
      
      if (!formData.duration) {
        newErrors.duration = "Duration is required"
      } else if (isNaN(formData.duration) || parseInt(formData.duration) <= 0) {
        newErrors.duration = "Duration must be a positive number"
      }
      
      if (!formData.sessionsPerWeek) {
        newErrors.sessionsPerWeek = "Sessions per week is required"
      } else if (isNaN(formData.sessionsPerWeek) || parseInt(formData.sessionsPerWeek) <= 0) {
        newErrors.sessionsPerWeek = "Sessions per week must be a positive number"
      }
    } else if (currentStep === 2) {
      // Validate Step 2: Session & Exercise Planning
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
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle next step
  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3))
    }
  }, [step, validateStep])

  // Handle previous step
  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1))
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (validateStep(step)) {
      setIsLoading(true)
      
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        
        // Process AI suggestions if needed
        const processedData = {
          ...formData,
          aiSuggestions: aiSuggestions?.suggestions
            .filter((s) => s.accepted)
            .map((s) => s.text),
        }
        
        // Call the onComplete callback with the processed data
        onComplete(processedData)
      } catch (error) {
        console.error("Error submitting mesocycle:", error)
        setErrors({ submit: "Failed to submit mesocycle. Please try again." })
      } finally {
        setIsLoading(false)
      }
    }
  }, [step, formData, aiSuggestions, validateStep, onComplete])

  // Initialize sessions based on sessionsPerWeek
  useEffect(() => {
    if (formData.sessionsPerWeek && !isNaN(formData.sessionsPerWeek)) {
      const numSessions = parseInt(formData.sessionsPerWeek)
      
      if (numSessions > 0) {
        const newSessions = Array.from({ length: numSessions }, (_, i) => ({
          id: i + 1,
          name: `Session ${i + 1}`,
          progressionModel: "",
          progressionValue: "",
        }))
        
        setFormData((prev) => ({ ...prev, sessions: newSessions }))
        
        // Initialize session sections
        const initialSections = {}
        newSessions.forEach((session) => {
          initialSections[session.id] = ["warmup", "gym"]
        })
        
        setSessionSections(initialSections)
        
        // Set active session to 1
        setActiveSession(1)
      }
    }
  }, [formData.sessionsPerWeek])

  // Generate AI suggestions when moving to step 3
  useEffect(() => {
    if (step === 3 && !aiSuggestions) {
      setIsLoading(true)
      
      // Simulate API call to get AI suggestions
      setTimeout(() => {
        setAiSuggestions({
          overall: "Your mesocycle looks well-structured. Here are some suggestions to optimize it further:",
          suggestions: [
            {
              id: 1,
              text: "Add more compound movements to maximize strength gains",
              accepted: false,
            },
            {
              id: 2,
              text: "Consider adding a deload week at the end of the mesocycle",
              accepted: false,
            },
            {
              id: 3,
              text: "Increase rest periods for heavy compound lifts to 3-5 minutes",
              accepted: false,
            },
          ],
        })
        
        setIsLoading(false)
      }, 2000)
    }
  }, [step, aiSuggestions])

  // Get ordered exercises for a section
  const getOrderedExercises = useCallback((sessionId, sectionId) => {
    const sectionKey = `${sessionId}-${sectionId}`
    const sectionExercises = formData.exercises.filter(
      ex => ex.session === sessionId && ex.part === sectionId
    )
    
    // If we have a custom order, use it
    if (exerciseOrder[sectionKey] && exerciseOrder[sectionKey].length > 0) {
      const orderedIds = exerciseOrder[sectionKey]
      return orderedIds
        .map(id => sectionExercises.find(e => e.id === id))
        .filter(Boolean) // Filter out undefined (in case some exercises were removed)
        .concat(sectionExercises.filter(e => !orderedIds.includes(e.id))) // Append any exercises not in the order
    }
    
    // Otherwise return as-is
    return sectionExercises
  }, [formData.exercises, exerciseOrder])

  return {
    // State
    step,
    formData,
    searchTerm,
    filteredExercises,
    activeSession,
    isLoading,
    aiSuggestions,
    errors,
    sessionSections,
    progressPercentage,
    exerciseOrder,
    
    // Handlers
    setStep,
    setFormData,
    setSearchTerm,
    setFilteredExercises,
    setActiveSession,
    setIsLoading,
    setAiSuggestions,
    setErrors,
    setSessionSections,
    handleInputChange,
    handleSessionInputChange,
    handleAddExercise,
    handleRemoveExercise,
    handleExerciseDetailChange,
    handleExerciseReorder,
    handleProgressionModelChange,
    handleProgressionValueChange,
    handleAcceptSuggestion,
    handleSetActiveSections,
    getOrderedExercises,
    validateStep,
    handleNext,
    handleBack,
    handleSubmit,
  }
} 