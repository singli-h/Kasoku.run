"use client"

import { useState } from "react"
import { edgeFunctions } from '@/lib/edge-functions'
import { formatMicrocycleData } from './formatMicrocycleData'
import { supabase } from '@/lib/supabase-browser'
import { v4 as uuidv4 } from 'uuid'

/**
 * Custom hook for saving training plans to Supabase
 * 
 * @returns {Object} - Functions and state for saving mesocycle and microcycle plans
 */
export const useSaveTrainingPlan = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [savedData, setSavedData] = useState(null)

  /**
   * Transforms form data into the structure required for API processing
   * @param {Object} formData - Raw form data 
   * @returns {Object} - Transformed data
   */
  const transformFormData = (formData) => {
    console.log("[useSaveCycle.transformFormData] Starting form data transformation");
    
    // Clone to avoid modifying the original
    const transformedData = { ...formData };

    // Ensure sessions array exists
    transformedData.sessions = transformedData.sessions || [];
    console.log(`[useSaveCycle.transformFormData] Processing ${transformedData.sessions.length} sessions`);

    // Process each session to ensure it has exercises
    transformedData.sessions = transformedData.sessions.map((session, idx) => {
      // If no session ID assigned yet, create a temporary one
      if (!session.id) {
        session.id = `temp-session-${idx}-${Date.now()}`;
        console.log(`[useSaveCycle.transformFormData] Warning: Created temporary ID for session ${idx + 1}: ${session.name || 'Unnamed'}`);
      }

      // Get exercises for this session
      const sessionExercises = transformedData.exercises?.filter(ex => ex.session === session.id) || [];
      console.log(`[useSaveCycle.transformFormData] Session ${idx + 1}: ${session.name || 'Unnamed'} has ${sessionExercises.length} exercises`);
      
      // Add exercises to the session object
      return {
        ...session,
        exercises: sessionExercises
      };
    });

    // Remove exercises from the top level as they're now included in sessions
    delete transformedData.exercises;
    
    console.log("[useSaveCycle.transformFormData] Transformation complete");
    return transformedData;
  };

  /**
   * Saves a microcycle to the database
   * @param {Object} formData - The form data to save
   * @returns {Promise<Object>} - The save result
   */
  const saveMicrocycle = async (formData) => {
    console.log('[useSaveCycle] Starting saveMicrocycle', { 
      name: formData.name, 
      hasSessionData: !!formData.sessions 
    });
    
    // Reset state
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Transform form data to ensure all sessions have IDs
      const transformedData = transformFormData(formData);
      console.log('[useSaveCycle] Form data transformed successfully');

      // Format the data for API submission
      console.log('[useSaveCycle] Formatting microcycle data with formatMicrocycleData');
      const formattedData = formatMicrocycleData(transformedData);
      console.log('[useSaveCycle] Microcycle formatted successfully', { 
        name: formattedData.name,
        sessions: formattedData.sessions?.length || 0,
        presetGroups: formattedData.exercise_preset_groups?.length || 0
      });

      // Submit to API
      console.log('[useSaveCycle] Submitting to API...');
      const { data, error: apiError } = await supabase
        .from('microcycles')
        .insert(formattedData)
        .select()
        .single();

      // Handle API response
      if (apiError) {
        console.error('[useSaveCycle] API submission error:', apiError);
        setError({
          message: 'Failed to save microcycle',
          details: apiError.message,
          code: apiError.code
        });
        setSavedData(null);
        return { success: false, error: apiError };
      }

      console.log('[useSaveCycle] Microcycle saved successfully:', { 
        id: data.id, 
        name: data.name 
      });
      setSuccess(true);
      setSavedData(data);
      
      return { 
        success: true, 
        data,
        message: `Microcycle "${data.name}" saved successfully with ID: ${data.id}`
      };
    } catch (err) {
      console.error('[useSaveCycle] Unexpected error during submission:', err);
      setError({
        message: 'An unexpected error occurred',
        details: err.message,
        stack: err.stack
      });
      setSavedData(null);
      
      return { 
        success: false, 
        error: err,
        message: err.message || 'An unexpected error occurred'
      };
    } finally {
      setIsSubmitting(false);
      console.log('[useSaveCycle] Submission process completed');
    }
  };

  /**
   * Saves a training plan to Supabase
   * 
   * @param {Object} formData - The form data from the wizard
   * @param {string} timezone - The timezone of the user
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMesocycle = async (formData, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    console.log('[DEBUG] saveMesocycle - Starting with formData:', { 
      ...formData, 
      timezone,
      planType: formData.planType
    });
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // For microcycle plans, use the dedicated API format
      if (formData.planType === "microcycle") {
        console.log('[DEBUG] saveMesocycle - Detected microcycle plan, delegating to saveMicrocycle');
        return await saveMicrocycle(formData);
      }
      
      // For mesocycle plans, use the original format
      console.log('[DEBUG] saveMesocycle - Processing as mesocycle, transforming form data');
      const sessions = transformFormData(formData);
      console.log('[DEBUG] saveMesocycle - Form data transformed, sessions created:', sessions.length);

      // Create the API payload
      const payload = {
        sessions,
        timezone
      };
      console.log('[DEBUG] saveMesocycle - API request payload:', payload);

      // Use the planner API function
      console.log('[DEBUG] saveMesocycle - Calling edgeFunctions.planner.createMesocycle');
      const data = await edgeFunctions.planner.createMesocycle(payload);
      console.log('[DEBUG] saveMesocycle - API response received:', data);
      
      setSuccess(true);
      setSavedData(data);
      return data;
    } catch (err) {
      console.error('[DEBUG] saveMesocycle - Error occurred:', err);
      setError(err.message || 'An unexpected error occurred');
      throw err;
    } finally {
      console.log('[DEBUG] saveMesocycle - Request completed, isSubmitting set to false');
      setIsSubmitting(false);
    }
  }

  return {
    saveMesocycle,
    isSubmitting,
    error,
    success,
    savedData,
    transformFormData
  }
}

// For backwards compatibility - use the new name in new code
export const useSaveMesocycle = useSaveTrainingPlan; 