import { useState, useEffect } from "react"

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const API_BASE_URL = "http://localhost:54321/functions/v1/api"

export const useExerciseData = () => {
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

  // Initialize dashboard data
  useEffect(() => {
    const fetchInitialData = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/exercisesInit`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

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
        // Add other fields as needed
      }));

      const response = await fetch(`${API_BASE_URL}/training_exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_training_session_id: state.session.details.id,
          exercisesDetail
        })
      });

      if (!response.ok) throw new Error('Failed to start session');

      await refreshSessionData();
    } catch (error) {
      console.error("Error starting session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
    }
  };

  const refreshSessionData = async () => {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/dashboard/exercisesInit`);
      if (!refreshResponse.ok) throw new Error('Failed to refresh session data');
      const refreshData = await refreshResponse.json();

      setState(prev => ({
        ...prev,
        session: refreshData.data.session,
        isLoading: false,
        _version: prev._version + 1
      }));
    } catch (error) {
      throw new Error('Failed to refresh session data');
    }
  };

  const saveSession = async () => {
    if (!state.session?.details?.id) {
      console.error('No session ID available');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const exerciseDetails = state.session.details.exercise_preset_groups.exercise_presets
        .flatMap(preset => preset.exercise_training_details
          .map(detail => ({
            id: detail.id,
            set_index: detail.set_index,
            reps: detail.reps,
            weight: detail.weight,
            power: detail.power,
            velocity: detail.velocity,
            rest_time: detail.rest_time,
            completed: detail.completed
          }))
        );

      const response = await fetch(`${API_BASE_URL}/training_exercises/${state.session.details.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_training_session_id: state.session.details.id,
          exercisesDetail: exerciseDetails
        })
      });

      if (!response.ok) throw new Error('Failed to save session');

      await refreshSessionData();
    } catch (error) {
      console.error("Error saving session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
    }
  };

  const completeSession = async () => {
    try {
      // First save the current state
      await saveSession();

      // Then mark the session as completed
      const response = await fetch(`${API_BASE_URL}/dashboard/finishSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_training_session_id: state.session.details.id,
          status: 'completed'
        })
      });

      if (!response.ok) throw new Error('Failed to complete session');

      await refreshSessionData();
    } catch (error) {
      console.error("Error completing session:", error);
      setState(prev => ({ 
        ...prev, 
        error,
        isLoading: false 
      }));
    }
  };

  const updateExerciseDetails = (sectionType, updatedPresets) => {
    if (!state.session) return;

    const updatedSession = {
      ...state.session,
      details: {
        ...state.session.details,
        exercise_preset_groups: {
          ...state.session.details.exercise_preset_groups,
          exercise_presets: state.session.details.exercise_preset_groups.exercise_presets.map(
            preset => {
              const updatedPreset = updatedPresets.find(up => up.id === preset.id);
              return updatedPreset || preset;
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
  };

  const toggleSection = (title) => {
    setState(prev => ({
      ...prev,
      openSections: { ...prev.openSections, [title]: !prev.openSections[title] }
    }));
  };

  return {
    ...state,
    version: state._version,
    startSession,
    saveSession,
    completeSession,
    toggleSection,
    updateExerciseDetails,
    isOngoing: state.session?.details?.status === 'ongoing',
    isAssigned: state.session?.details?.status === 'assigned',
    isCompleted: state.session?.details?.status === 'completed'
  };
}; 