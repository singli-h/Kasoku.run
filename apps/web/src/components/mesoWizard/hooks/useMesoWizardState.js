import { useState, useEffect, useCallback } from "react"
import { useBrowserSupabaseClient } from '@/lib/supabase'
import { plannerApi } from '@/lib/supabase-api'
import { useSaveTrainingPlan } from "./useSaveCycle"

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
    planType: "mesocycle", // Default to mesocycle
    name: "",
    goals: "",
    startDate: "",
    duration: "",
    sessionsPerWeek: "",
    intensity: "",  // Added for intensity picker
    volume: "",     // Added for volume picker
    exercises: [],
    sessions: [],
  })
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExercises, setFilteredExercises] = useState([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [allExercises, setAllExercises] = useState([])
  const [activeSession, setActiveSession] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [errors, setErrors] = useState({})
  const [sessionSections, setSessionSections] = useState({})
  const [exerciseOrder, setExerciseOrder] = useState({}) // Track exercise order by section

  // Use the save mesocycle hook
  const { saveMesocycle, isSubmitting, error: saveError } = useSaveTrainingPlan()

  // Calculate progress percentage
  const progressPercentage = ((step - 1) / 4) * 100

  const supabase = useBrowserSupabaseClient()

  // Fetch exercises from edge function instead of sample data
  useEffect(() => {
    const getExercises = async () => {
      setLoadingExercises(true)
      try {
        // Use the planner API helper
        const response = await plannerApi.getExercises(supabase)
        const exercises = response.exercises || []
        setAllExercises(exercises)
        setFilteredExercises(exercises)
      } catch (error) {
        console.error("Error fetching exercises:", error)
      } finally {
        setLoadingExercises(false)
      }
    }
    
    getExercises()
  }, [supabase])

  // Filter exercises based on search term
  useEffect(() => {
    if (!allExercises.length) return
    
    setFilteredExercises(
      allExercises.filter((exercise) => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [searchTerm, allExercises])

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
    // Determine the appropriate section to add the exercise to
    const targetSection = exercise.section || exercise.type;
    
    // Get the current exercises in the target section to determine the next position
    const sectionExercises = formData.exercises.filter(ex => 
      ex.session === activeSession && 
      (ex.section === targetSection || (ex.section === null && ex.part === targetSection))
    );
    
    // Find the maximum position value in the section, defaulting to -1 if no exercises exist
    const maxPosition = sectionExercises.length > 0
      ? Math.max(...sectionExercises.map(ex => ex.position || 0))
      : -1;
    
    // Create the new exercise with a position value one higher than the current maximum
    const newExercise = {
      ...exercise,
      originalId: exercise.id, // Store the original BE exercise ID
      id: Date.now(), // Generate a unique ID for frontend use only
      session: activeSession,
      part: exercise.type,
      section: exercise.section || null, // Preserve section for superset exercises
      sets: "",
      reps: "",
      rest: "",
      position: maxPosition + 1, // Set position to be after all existing exercises
    }
    
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }))
    
    // Update exercise order
    setExerciseOrder((prev) => {
      const sectionKey = `${activeSession}-${exercise.section || exercise.type}`
      const currentOrder = prev[sectionKey] || []
      return {
        ...prev,
        [sectionKey]: [...currentOrder, newExercise.id]
      }
    })
  }, [activeSession, formData.exercises])

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
          const updatedEx = { ...ex, [field]: value };
          
          // If we're setting a supersetId, ensure we preserve the section property
          // This ensures the exercise stays in its designated section
          if (field === 'supersetId' && value && !updatedEx.section) {
            // If adding to a superset, make sure section is set
            // Use the current section if available, otherwise use the part
            updatedEx.section = ex.section || part;
          } else if (field === 'supersetId' && !value) {
            // If removing from a superset, clear the section property
            // This allows the exercise to return to its natural section
            updatedEx.section = null;
          }
          
          return updatedEx;
        }
        return ex;
      });
      
      return { ...prev, exercises: updatedExercises };
    });
    
    // Clear errors for this field if any
    const errorKey = `exercise-${id}-${session}-${part}-${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle exercise reordering
  const handleExerciseReorder = useCallback((sessionId, sectionId, reorderedExercises) => {
    // Update the exercise order
    const exerciseIds = reorderedExercises.map(ex => ex.id);
    const sectionKey = `${sessionId}-${sectionId}`;
    
    console.log(`Reordering exercises for section ${sectionId}:`, exerciseIds);
    
    // Update the exercise order mapping
    setExerciseOrder(prev => ({
      ...prev,
      [sectionKey]: exerciseIds
    }));

    // Update exercise positions in the form data
    setFormData(prev => {
      const updatedExercises = prev.exercises.map(ex => {
        // Only update exercises that are part of this reordering
        const reorderedEx = reorderedExercises.find(re => re.id === ex.id);
        if (reorderedEx) {
          return { ...ex, position: reorderedEx.position };
        }
        return ex;
      });
      
      return { ...prev, exercises: updatedExercises };
    });
  }, []);

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
    console.log("Validating step:", currentStep);
    const newErrors = {}
    
    if (currentStep === 1) {
      // Step 1 only requires planType selection
      if (!formData.planType) {
        newErrors.planType = "Please select a plan type"
      }
    } else if (currentStep === 2) {
      // Validate Step 2: Plan Overview (Mesocycle or Microcycle)
      console.log(`Validating ${formData.planType} overview with data:`, formData);
      
      if (!formData.name || !formData.name.trim()) {
        newErrors.name = "Plan name is required"
      }
      
      if (!formData.goals.trim()) {
        newErrors.goals = "Goals are required"
      }
      
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required"
      }
      
      // For microcycle, duration is fixed at 1 week and doesn't need validation
      if (formData.planType !== "microcycle") {
        if (!formData.duration) {
          newErrors.duration = "Duration is required"
        } else if (isNaN(formData.duration) || parseInt(formData.duration) <= 0) {
          newErrors.duration = "Duration must be a positive number"
        }
      }
      
      if (!formData.sessionsPerWeek) {
        newErrors.sessionsPerWeek = "Sessions per week is required"
      } else if (isNaN(formData.sessionsPerWeek) || parseInt(formData.sessionsPerWeek) <= 0) {
        newErrors.sessionsPerWeek = "Sessions per week must be a positive number"
      }

      // Validate intensity and volume only for mesocycle plans
      if (formData.planType !== "microcycle") {
        if (!formData.intensity && !(formData.weeklyProgression && formData.weeklyProgression.length > 0)) {
          newErrors.intensity = "Please select an intensity level"
        }
        
        if (!formData.volume && !(formData.weeklyProgression && formData.weeklyProgression.length > 0)) {
          newErrors.volume = "Please select a volume level"
        }
      }
    } else if (currentStep === 3) {
      // Validate Step 3: Session & Exercise Planning
      formData.sessions.forEach((session) => {
        if (!session.name || !session.name.trim()) {
          newErrors[`session-${session.id}-name`] = "Session name is required"
        }
        
        if (!session.weekday) {
          newErrors[`session-${session.id}-weekday`] = "Please select a weekday for this session"
        }
        
        if (session.progressionModel && !session.progressionValue) {
          newErrors[`session-${session.id}-progressionValue`] = "Progression value is required"
        }
      })
      
      // Validate exercises
      formData.exercises.forEach((exercise) => {
        if (!exercise.sets) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] = "Sets required"
        } else if (isNaN(exercise.sets) || parseInt(exercise.sets) <= 0) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-sets`] = "Sets must be a positive number"
        }
        
        if (!exercise.reps) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] = "Reps required"
        } else if (isNaN(exercise.reps) || parseInt(exercise.reps) <= 0) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-reps`] = "Reps must be a positive number"
        }
        
        if (isNaN(exercise.rest) || parseInt(exercise.rest) <= 0) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] = "Rest time must be a positive number"
        }
      })
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle next step
  const handleNext = useCallback(() => {
    console.log("handleNext called - current step:", step);
    if (validateStep(step)) {
      console.log("Validation passed, advancing to next step");
      setStep((prev) => Math.min(prev + 1, 4));
    } else {
      console.log("Validation failed, errors:", errors);
    }
  }, [step, validateStep, errors]);

  // Handle previous step
  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1))
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault()
    
    if (validateStep(step)) {
      setIsLoading(true)
      
      try {
        // Determine plan type label for logging
        const planTypeLabel = formData.planType || "mesocycle";
        
        // Process AI suggestions if needed
        const processedData = {
          ...formData,
          id: Date.now().toString(), // Generate unique plan ID
          isMicrocycle: formData.planType === "microcycle", // Flag for identifying microcycle plans
          microCycleDuration: formData.planType === "microcycle" ? 1 : null, // Set duration for microcycle
          aiSuggestions: aiSuggestions?.suggestions
            .filter((s) => s.accepted)
            .map((s) => s.text),
        }
        
        // Save plan data to Supabase
        const result = await saveMesocycle(processedData)
        
        console.log(`${planTypeLabel} saved successfully:`, result)
        
        // Call the onComplete callback with the processed data and API response
        onComplete({
          formData: processedData, 
          apiResponse: result
        })
      } catch (error) {
        console.error(`Error submitting ${formData.planType || "mesocycle"}:`, error)
        setErrors({ 
          submit: saveError || `Failed to submit ${formData.planType || "mesocycle"}. Please try again.` 
        })
      } finally {
        setIsLoading(false)
      }
    }
  }, [step, formData, aiSuggestions, validateStep, onComplete, saveMesocycle, saveError])

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
          weekday: "",
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
        if (formData.planType === "microcycle") {
          // Microcycle-specific suggestions
          setAiSuggestions({
            overall: "Your microcycle plan looks good. Here are some suggestions to optimize your one-week training:",
            suggestions: [
              {
                id: 1,
                text: "Balance your training intensity throughout the week to avoid fatigue",
                accepted: false,
              },
              {
                id: 2,
                text: "Add variety to your exercise selection to keep workouts engaging",
                accepted: false,
              },
              {
                id: 3,
                text: "Ensure at least one full rest day in your weekly schedule",
                accepted: false,
              },
            ],
          });
        } else {
          // Mesocycle suggestions
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
          });
        }
        
        setIsLoading(false)
      }, 2000)
    }
  }, [step, aiSuggestions, formData.planType])

  // Get ordered exercises for a section
  const getOrderedExercises = useCallback((sessionId, sectionId) => {
    // Get exercises that either:
    // 1. Belong to this section directly (part === sectionId) AND are not in a superset, or
    // 2. Are part of a superset that belongs to this section (section === sectionId)
    // This ensures each exercise only appears in its designated section
    
    const sectionExercises = formData.exercises.filter(
      ex => (ex.session === sessionId) && (
        // Regular exercises that belong to this section (by type) and aren't in a superset
        (ex.part === sectionId && !ex.supersetId) || 
        // Exercises that are part of a superset that's assigned to this section
        (ex.supersetId && ex.section === sectionId)
      )
    );
    
    // If we have a custom order, use it
    const sectionKey = `${sessionId}-${sectionId}`;
    if (exerciseOrder[sectionKey] && exerciseOrder[sectionKey].length > 0) {
      const orderedIds = exerciseOrder[sectionKey];
      return orderedIds
        .map(id => sectionExercises.find(e => e.id === id))
        .filter(Boolean) // Filter out undefined (in case some exercises were removed)
        .concat(sectionExercises.filter(e => !orderedIds.includes(e.id))); // Append any exercises not in the order
    }
    
    // Otherwise return as-is
    return sectionExercises;
  }, [formData.exercises, exerciseOrder]);

  return {
    // State
    step,
    formData,
    searchTerm,
    filteredExercises,
    activeSession,
    isLoading: isLoading || isSubmitting,
    loadingExercises,
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