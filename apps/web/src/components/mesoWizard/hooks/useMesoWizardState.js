import { useState, useEffect, useCallback } from "react"
import { useSession } from '@clerk/nextjs'
import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr' // Added for mutable data like profile
import { useSaveTrainingPlan } from "./useSaveCycle"
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook for managing MesoWizard state
 * 
 * @param {Function} onComplete - Callback function when wizard is completed
 * @returns {Object} State and handlers for the MesoWizard
 */
export const useMesoWizardState = (onComplete) => {
  // Clerk session for auth
  const { session, isLoaded: isSessionLoaded, isSignedIn } = useSession()
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
  const [activeSession, setActiveSession] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [errors, setErrors] = useState({})
  const [sessionSections, setSessionSections] = useState({})
  const [exerciseOrder, setExerciseOrder] = useState({}) // Track exercise order by section

  // Cache key for wizard state in localStorage
  const cacheKey = 'mesoWizardState'

  // Load cached wizard state on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { step: cachedStep, formData: cachedFormData, activeSession: cachedActive, sessionSections: cachedSections, exerciseOrder: cachedOrder } = JSON.parse(cached)
        if (cachedStep) setStep(cachedStep)
        if (cachedFormData) setFormData(cachedFormData)
        if (cachedActive) setActiveSession(cachedActive)
        if (cachedSections) setSessionSections(cachedSections)
        if (cachedOrder) setExerciseOrder(cachedOrder)
      }
    } catch (err) {
      console.error('Failed to load cached wizard state', err)
    }
  }, [])

  // Save wizard state to cache whenever it changes
  useEffect(() => {
    try {
      const stateToCache = { step, formData, activeSession, sessionSections, exerciseOrder }
      localStorage.setItem(cacheKey, JSON.stringify(stateToCache))
    } catch (err) {
      console.error('Failed to save wizard state to cache', err)
    }
  }, [step, formData, activeSession, sessionSections, exerciseOrder])

  // Note: exercises and groups fetched via SWR below

  // Use the save mesocycle hook
  const { saveMesocycle, isSubmitting, error: saveError } = useSaveTrainingPlan()

  // Calculate progress percentage
  const progressPercentage = ((step - 1) / 4) * 100

  // SWR fetcher to include Clerk token
  const fetcherWithToken = async (url) => {
    const token = await session.getToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Network response was not ok')
    return res.json()
  }

  // Fetch and cache exercises (immutable fetch to avoid duplicate calls in dev)
  const { data: exerciseBody, error: exerciseError } = useSWRImmutable(
    isSessionLoaded && isSignedIn ? '/api/plans/exercises' : null,
    fetcherWithToken
  )
  const allExercises = exerciseBody?.data?.exercises || []
  const loadingExercises = !exerciseBody && !exerciseError

  // Fetch and cache groups (immutable fetch to avoid duplicate calls in dev)
  const { data: groupsBody, error: groupsError } = useSWRImmutable(
    isSessionLoaded && isSignedIn ? '/api/athlete-groups' : null,
    fetcherWithToken
  )
  const groups = groupsBody?.data || []
  const groupLoading = !groupsBody && !groupsError

  // Fetch and cache user role (coach or athlete)
  const { data: roleBody, error: roleError } = useSWRImmutable(
    isSessionLoaded && isSignedIn ? '/api/users/role' : null,
    fetcherWithToken
  )
  const userRole = roleBody?.data?.role
  const roleLoading = !roleBody && !roleError

  // Fetch athlete profile if user is an athlete
  const fetcher = (...args) => fetch(...args).then(res => res.json()); // Ensure fetcher is defined

  const { data: athleteProfile, isLoading: profileLoading } = useSWR(
    isSessionLoaded && isSignedIn && userRole === 'athlete' && session?.user?.id
      ? `/api/users/profile?userId=${session.user.id}`
      : null,
    fetcher
  );
  
  // Effect to log athlete profile once loaded or if it changes
  useEffect(() => {
    if (userRole === 'athlete' && athleteProfile) {
      console.log('[MesoWizardState] Athlete profile loaded:', athleteProfile);
    }
  }, [athleteProfile, userRole]);

  // Debug log for SWR key
  useEffect(() => {
    if (userRole === 'athlete') {
      console.log('[MesoWizardState] SWR key for athleteProfile:', isSessionLoaded && isSignedIn && userRole === 'athlete' && session?.user?.id ? `/api/users/profile?userId=${session.user.id}` : null);
    }
  }, [isSessionLoaded, isSignedIn, userRole, session?.user?.id]);

  // Filter exercises based on search term
  useEffect(() => {
    if (!allExercises.length) return;
    
    // Make sure exercises have the required properties for the UI components
    const enrichedExercises = allExercises.map(exercise => ({
      ...exercise,
      // Add a category property based on the type for display and filtering
      category: exercise.type ? exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1) : 'Gym'
    }));
    
    const filtered = enrichedExercises.filter((exercise) => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredExercises(filtered);
  }, [searchTerm, allExercises]);

  // Handle basic input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    // Update formData and reset sessions/exercises when key parameters change
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (['sessionsPerWeek', 'duration', 'planType'].includes(name)) {
        updated.sessions = []
        updated.exercises = []
      }
      return updated
    })
    // Reset session sections and active session when key parameters change
    if (['sessionsPerWeek', 'duration', 'planType'].includes(name)) {
      setSessionSections({})
      setActiveSession(1)
    }
    // Clear errors for this field if any
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors, setSessionSections, setActiveSession])

  // Handle session-specific input changes
  const handleSessionInputChange = useCallback((sessionId, field, value) => {
    setFormData((prev) => {
      const updatedSessions = [...prev.sessions]
      const sessionIndex = updatedSessions.findIndex((s) => s.id === sessionId)
      if (sessionIndex !== -1) {
        updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], [field]: value }
      }
      // If switching to group mode, clear any existing exercises for this session
      let updatedExercises = prev.exercises
      if (field === 'sessionMode' && value === 'group') {
        updatedExercises = prev.exercises.filter(ex => ex.session !== sessionId)
      }
      console.log(`[useMesoWizardState] session ${sessionId} updated ${field} ->`, value, updatedSessions[sessionIndex]);
      return { ...prev, sessions: updatedSessions, exercises: updatedExercises }
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

  // Handle adding an exercise (supports optional exercise.session override)
  const handleAddExercise = useCallback((exercise) => {
    // Determine target session: use exercise.session if provided, otherwise activeSession
    const targetSession = exercise.session !== undefined ? exercise.session : activeSession;
    
    // Get the specific section from the exercise parameter - this is critical to prevent duplication
    const targetSection = exercise.section || exercise.type || exercise.category || "gym";
    
    console.log(`[handleAddExercise] Adding "${exercise.name}" to session ${targetSession}, section ${targetSection}`);
    
    // Generate a unique ID for this exercise instance 
    const exerciseId = Date.now();
    
    // Get the current exercises in the target section of the target session to determine the next position
    const sectionExercises = formData.exercises.filter(ex => 
      ex.session === targetSession && 
      (ex.section === targetSection || (ex.section === null && ex.part === targetSection))
    );
    
    // Find the maximum position value in the section, defaulting to -1 if no exercises exist
    const maxPosition = sectionExercises.length > 0
      ? Math.max(...sectionExercises.map(ex => ex.position || 0))
      : -1;
    
    // Determine group mode: either sessionMode is 'group' or only sprint section active
    const sessionObj = formData.sessions.find(s => s.id === targetSession)
    const sectionList = sessionSections[targetSession] || []
    const isGroupMode = sessionObj?.sessionMode === 'group' 
       || (sectionList.length === 1 && sectionList[0] === 'sprint')
       
    // Always use 1x1 for sprint exercises, otherwise use group mode logic
    const isSprint = exercise.type === 'sprint' || exercise.section === 'sprint'
    const defaultSets = isSprint || isGroupMode ? 1 : 0
    const defaultReps = isSprint || isGroupMode ? 1 : 0
    
    // Create the new exercise with a position value one higher than the current maximum
    const newExerciseWithPos = {
      ...exercise,
      id: exerciseId,
      session: targetSession,
      // IMPORTANT FIX - ensure both part and section are set to the target section
      part: targetSection,
      section: targetSection,
      sets: exercise.sets || defaultSets,
      reps: exercise.reps || defaultReps,
      rest: exercise.rest || "",
      duration: exercise.duration || "",
      position: maxPosition + 1,
    }
    
    // Log the object right before adding to state
    console.log(`[handleAddExercise] Adding exercise with section=${targetSection}, part=${targetSection}`);
    
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExerciseWithPos],
    }))
    
    // Update exercise order
    setExerciseOrder((prev) => {
      const sectionKey = `${targetSession}-${targetSection}`
      const currentOrder = prev[sectionKey] || []
      return {
        ...prev,
        [sectionKey]: [...currentOrder, newExerciseWithPos.id]
      }
    })
  }, [activeSession, formData.exercises, formData.sessions, sessionSections])

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
      
      // Require selecting an athlete group only for coaches
      if (userRole === 'coach') {
        if (!formData.athleteGroupId) {
          newErrors.athleteGroupId = "Please select an athlete group"
        }
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
        // Skip sets/reps validation in group mode
        const sessionObj = formData.sessions.find(s => s.id === exercise.session);
        const isGroupModeExercise = sessionObj?.sessionMode === 'group';
        if (!isGroupModeExercise) {
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
        }
        if (isNaN(exercise.rest) || parseInt(exercise.rest) <= 0) {
          newErrors[`exercise-${exercise.id}-${exercise.session}-${exercise.part}-rest`] = "Rest time must be a positive number"
        }
      })
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, userRole])

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
        // Debug: log sessions and their modes
        console.log('handleSubmit - sessions with modes:', formData.sessions.map(s => ({ id: s.id, sessionMode: s.sessionMode })));
        console.log('handleSubmit - full sessions array:', formData.sessions);
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
        const result = await saveMesocycle(processedData, allExercises)
        
        console.log(`${planTypeLabel} saved successfully:`, result)
        
        // Call the onComplete callback with the processed data and API response
        onComplete({
          formData: processedData, 
          apiResponse: result
        })
        // Clear cached wizard state
        localStorage.removeItem(cacheKey)
      } catch (error) {
        console.error(`Error submitting ${formData.planType || "mesocycle"}:`, error)
        setErrors({ 
          submit: saveError || `Error: ${error?.message || 'Unknown error occurred'}`
        })
      }
    }
  }, [step, validateStep, errors, saveMesocycle, allExercises, aiSuggestions, onComplete, saveError])

  // Generate default session entries when moving to exercise planning (step 3)
  useEffect(() => {
    if (step === 3 && formData.sessions.length === 0) {
      const weeks = formData.planType === 'microcycle' ? 1 : Number(formData.duration) || 1;
      const perWeek = Number(formData.sessionsPerWeek) || 0;
      const totalSessions = weeks * perWeek;
      const newSessions = Array.from({ length: totalSessions }, (_, i) => ({
        id: i + 1,
        name: '',
        weekday: '',
        sessionMode: 'individual',
        progressionModel: '',
        progressionValue: ''
      }));
      setFormData(prev => ({ ...prev, sessions: newSessions }));
    }
  }, [step, formData.duration, formData.sessionsPerWeek, formData.planType, formData.sessions.length]);

  // Helper to get ordered exercises for a session and section
  const getOrderedExercises = useCallback((sessionId, sectionId) => {
    // Filter exercises for this session and section
    return formData.exercises
      .filter(ex => ex.session === sessionId && (ex.section === sectionId || (ex.section === null && ex.part === sectionId)))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [formData.exercises]);

  return {
    // Include fetched data and state
    userRole,
    roleLoading,
    groups,
    groupLoading,
    step,
    formData,
    searchTerm,
    filteredExercises,
    activeSession,
    isLoading,
    aiSuggestions,
    errors,
    sessionSections,
    exerciseOrder,
    progressPercentage,
    loadingExercises,
    getOrderedExercises,
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
    validateStep,
    handleNext,
    handleBack,
    handleSubmit,
    athleteProfile,
    profileLoading
  }
}