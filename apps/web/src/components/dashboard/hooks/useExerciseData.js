import { useState, useEffect, useRef, useCallback } from "react"
import { edgeFunctions } from '@/lib/edge-functions'

// Remove hardcoded URL and use edge functions directly
// const API_BASE_URL = "http://localhost:54321/functions/v1/api"  // Remove this

export const useExerciseData = () => {
  // Add a ref to keep track of the latest state
  const stateRef = useRef(null);
  
  // Add a dedicated state for exercise training details
  const [trainingDetails, setTrainingDetails] = useState([]);
  // Add a ref to track latest training details
  const trainingDetailsRef = useRef([]);
  
  const [state, setState] = useState({
    isLoading: true,
    error: null,
    session: null,
    openSections: {
      "Warm Up": true,
      "Gym": true,
      "Circuit": true,
    },
    _version: 0
  });

  // Update the refs whenever state changes
  useEffect(() => {
    stateRef.current = {
      ...state,
      trainingDetails
    };
    trainingDetailsRef.current = trainingDetails;
  }, [state, trainingDetails]);

  // Initialize dashboard data
  useEffect(() => {
    const fetchInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const data = await edgeFunctions.dashboard.getExercisesInit();
        
        // Extract all training details into the flat array
        const allTrainingDetails = data.data.session?.details?.exercise_preset_groups?.exercise_presets
          ?.flatMap(preset => preset.exercise_training_details.map(detail => ({
              ...detail,
              exercise_preset_id: preset.id // Keep track of which preset it belongs to
          }))) || [];
        
        setTrainingDetails(allTrainingDetails);
        
        setState(prev => ({
          ...prev,
          session: data.data.session,
          isLoading: false,
          _version: prev._version + 1
        }));
      } catch (err) {
        console.error('Initial data fetch error:', err);
        setState(prev => ({ 
          ...prev, 
          error: err,
          isLoading: false 
        }));
      }
    };

    fetchInitialData();
  }, []);

  const startSession = async () => {
    if (!state.session?.details?.id) {
      console.error('No session ID available');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const exercisePresets = state.session.details.exercise_preset_groups.exercise_presets;
      const exercisesDetail = exercisePresets.map(preset => ({
        name: preset.exercises.name,
        sets: preset.exercise_training_details.length,
        reps: preset.exercise_training_details[0]?.reps || 0,
      }));

      await edgeFunctions.dashboard.createTrainingSession({
        exercise_training_session_id: state.session.details.id,
        exercisesDetail
      });

      await refreshSessionData();
      return { success: true };
    } catch (error) {
      console.error("Error starting session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
      return { success: false, error };
    }
  };

  const refreshSessionData = async () => {
    try {
      const data = await edgeFunctions.dashboard.getExercisesInit();

      // Refresh the flat training details array
      const allTrainingDetails = data.data.session?.details?.exercise_preset_groups?.exercise_presets
        ?.flatMap(preset => preset.exercise_training_details.map(detail => ({
            ...detail,
            exercise_preset_id: preset.id
        }))) || [];
      
      setTrainingDetails(allTrainingDetails);
      
      setState(prev => ({
        ...prev,
        session: data.data.session,
        isLoading: false,
        _version: prev._version + 1
      }));
    } catch (error) {
      throw new Error('Failed to refresh session data');
    }
  };

  const saveSession = useCallback(async (status = null) => {
    if (!state.session?.details?.id) {
      console.error('No session ID available');
      return { success: false, error: new Error('No session ID available') };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Use the ref to ensure we have the most up-to-date training details
      const currentTrainingDetails = trainingDetailsRef.current;
      
      // Format the details for the API
      const exerciseDetails = currentTrainingDetails.map(detail => ({
        id: detail.id,
        set_index: detail.set_index,
        reps: detail.reps || 0,
        weight: detail.weight,
        power: detail.power,
        velocity: detail.velocity,
        rest_time: detail.rest_time,
        resistance_value: detail.resistance_value,
        completed: detail.completed
      }));
      
      await edgeFunctions.dashboard.updateTrainingSession({
        exercise_training_session_id: state.session.details.id,
        exercisesDetail: exerciseDetails,
        ...(status ? { status } : {})
      });

      await refreshSessionData();
      return { success: true };
    } catch (error) {
      console.error("Error saving session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
      return { success: false, error };
    }
  }, [state.session]);

  const completeSession = useCallback(async () => {
    try {
      // First save the current state
      const saveResult = await saveSession("completed");
      if (!saveResult.success) {
        return saveResult;
      }
      await refreshSessionData();
      return { success: true };
    } catch (error) {
      console.error("Error completing session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
      return { success: false, error };
    }
  }, [saveSession, state.session]);

  // Update a single training detail
  const updateTrainingDetail = useCallback((detailId, updates) => {
    setTrainingDetails(prev => {
      const updated = prev.map(detail => 
        detail.id === detailId 
          ? { ...detail, ...updates } 
          : detail
      );
      return updated;
    });
  }, []);
  
  // Update multiple training details for an exercise
  const updateExerciseTrainingDetails = useCallback((exerciseId, updatedDetails) => {
    setTrainingDetails(prev => {
      // First, filter out any details that belong to this exercise
      const otherDetails = prev.filter(detail => detail.exercise_preset_id !== exerciseId);
      
      // Then add the updated details with the exercise_preset_id
      const newDetails = [
        ...otherDetails,
        ...updatedDetails.map(detail => ({
          ...detail,
          exercise_preset_id: exerciseId
        }))
      ];
      
      return newDetails;
    });
    
    // Also update the context state for UI updates
    updateExerciseDetailsInState(exerciseId, updatedDetails);
  }, []);
  
  // This function updates the visual state but doesn't affect saving
  const updateExerciseDetailsInState = useCallback((exerciseId, updatedDetails) => {
    if (!state.session) return;

    // Create a deep copy of the current session
    const updatedSession = {
      ...state.session,
      details: {
        ...state.session.details,
        exercise_preset_groups: {
          ...state.session.details.exercise_preset_groups,
          exercise_presets: state.session.details.exercise_preset_groups.exercise_presets.map(
            preset => {
              if (preset.id === exerciseId) {
                return {
                  ...preset,
                  exercise_training_details: updatedDetails
                };
              }
              return preset;
            }
          )
        }
      }
    };

    setState(prev => ({
      ...prev,
      session: updatedSession,
      _version: prev._version + 1
    }));
  }, [state.session]);
  
  // Legacy function - now delegate to the specific functions
  const updateExerciseDetails = useCallback((sectionType, updatedPresets) => {
    if (!state.session) return;
    
    // Process each updated preset
    updatedPresets.forEach(updatedPreset => {
      // Update in the flat structure
      updateExerciseTrainingDetails(updatedPreset.id, updatedPreset.exercise_training_details);
    });
  }, [state.session, updateExerciseTrainingDetails]);

  const toggleSection = useCallback((title) => {
    setState(prev => ({
      ...prev,
      openSections: { ...prev.openSections, [title]: !prev.openSections[title] }
    }));
  }, []);

  return {
    ...state,
    trainingDetails,
    version: state._version,
    startSession,
    saveSession,
    completeSession,
    toggleSection,
    updateExerciseDetails,
    updateTrainingDetail,
    updateExerciseTrainingDetails,
    isOngoing: state.session?.details?.status === 'ongoing',
    isAssigned: state.session?.details?.status === 'assigned',
    isCompleted: state.session?.details?.status === 'completed'
  };
}; 