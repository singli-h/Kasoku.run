import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from '@clerk/nextjs'

export const useExerciseData = () => {
  // Add a ref to keep track of the latest state
  const stateRef = useRef(null);
  const { getToken } = useAuth();
  
  // Helper function to get token, throws if not available
  const getAuthToken = async () => {
    const token = await getToken();
    if (!token) throw new Error('Authentication token not available');
    return token;
  };
  
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

  // Initialize workout data
  useEffect(() => {
    const fetchInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const token = await getAuthToken();
        
        // Use fetch to call the new API endpoint
        const response = await fetch('/api/workout/exercisesInit', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch initial exercises data');
        }
        
        const data = await response.json();
        
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
  }, [getToken]);

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

      const token = await getAuthToken();
      
      // Use fetch to call the new API endpoint
      const response = await fetch('/api/workout/trainingSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_training_session_id: state.session.details.id,
          exercisesDetail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start training session');
      }
      
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
      const token = await getAuthToken();
      
      // Use fetch to call the new API endpoint
      const response = await fetch('/api/workout/exercisesInit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refresh session data');
      }
      
      const data = await response.json();

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
      
      const token = await getAuthToken();
      
      // Use fetch to call the new API endpoint
      const response = await fetch('/api/workout/trainingSession', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_training_session_id: state.session.details.id,
          exercisesDetail: exerciseDetails,
          ...(status ? { status } : {})
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save training session');
      }

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
      return prev.map(detail => {
        const matchingUpdate = updatedDetails.find(ud => ud.id === detail.id);
        return matchingUpdate 
          ? { ...detail, ...matchingUpdate } 
          : detail;
      });
    });
  }, []);

  // Grouped training details by exercise preset
  const groupedTrainingDetailsByExercise = useCallback(() => {
    const grouped = {};
    trainingDetails.forEach(detail => {
      if (!grouped[detail.exercise_preset_id]) {
        grouped[detail.exercise_preset_id] = [];
      }
      grouped[detail.exercise_preset_id].push(detail);
    });
    return grouped;
  }, [trainingDetails]);

  // Handle toggling section visibility
  const toggleSectionOpen = useCallback((sectionName) => {
    setState(prev => ({
      ...prev,
      openSections: {
        ...prev.openSections,
        [sectionName]: !prev.openSections[sectionName]
      }
    }));
  }, []);

  // Helper to get all exercises for a specific section
  const getExercisesForSection = useCallback((sectionName) => {
    const session = state.session;
    if (!session || !session.details || !session.details.exercise_preset_groups) {
      return [];
    }
    
    // Filter exercises to this section
    return session.details.exercise_preset_groups.exercise_presets.filter(
      preset => preset.exercises.location === sectionName
    );
  }, [state.session]);

  // Check if a section is empty
  const isSectionEmpty = useCallback((sectionName) => {
    return getExercisesForSection(sectionName).length === 0;
  }, [getExercisesForSection]);

  // Handle marking a set as completed
  const markSetCompleted = useCallback((detailId, completed = true) => {
    updateTrainingDetail(detailId, { completed });
  }, [updateTrainingDetail]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    session: state.session,
    openSections: state.openSections,
    trainingDetails,
    startSession,
    saveSession,
    completeSession,
    updateTrainingDetail,
    updateExerciseTrainingDetails,
    groupedTrainingDetailsByExercise,
    toggleSectionOpen,
    getExercisesForSection,
    isSectionEmpty,
    markSetCompleted,
    version: state._version
  };
}; 