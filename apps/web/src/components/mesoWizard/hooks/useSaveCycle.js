"use client"

import { useState } from "react"
import { useBrowserSupabaseClient } from '@/lib/supabase'
import { formatMicrocycleData } from './formatMicrocycleData'

/**
 * Custom hook for saving training plans to Supabase
 * 
 * @returns {Object} - Functions and state for saving mesocycle and microcycle plans
 */
export const useSaveTrainingPlan = () => {
  const supabase = useBrowserSupabaseClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [savedData, setSavedData] = useState(null)

  /**
   * Saves a microcycle plan using the new API structure
   * 
   * @param {Object} formData - The form data from the wizard
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMicrocycle = async (formData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Format the data according to the microcycle API structure using the imported function
      const formattedData = formatMicrocycleData(formData);
      
      // Invoke the edge function for microcycle creation via RPC
      const { data: rawData, error: fnError } = await supabase.functions.invoke('api', {
        method: 'POST',
        path: '/planner/microcycle',
        body: formattedData
      })
      if (fnError) throw fnError
      const json = JSON.parse(rawData)
      return json
    } catch (err) {
      console.error('Error saving microcycle:', err);
      setError(err.message || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Transforms the mesocycle data into the format expected by the API
   * 
   * @param {Object} formData - The form data from the mesocycle wizard
   * @returns {Object} - Formatted data for the API
   */
  const transformFormData = (formData) => {
    // Clear any previous state
    setError(null)
    setSuccess(false)
    setSavedData(null)

    // Handle microcycle plan type specifically
    if (formData.planType === "microcycle") {
      return formData.sessions.map((session) => {
        // Get exercises for this session
        const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
        
        // Calculate session date based on weekday
        const weekdayToNumber = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 7
        };
        
        const startDate = new Date(formData.startDate);
        const sessionDate = new Date(startDate);
        if (session.weekday && weekdayToNumber[session.weekday.toLowerCase()]) {
          // Adjust date to match the weekday
          const dayDiff = weekdayToNumber[session.weekday.toLowerCase()] - 1;
          sessionDate.setDate(startDate.getDate() + dayDiff);
        }
        
        // Format date to YYYY-MM-DD
        const formatDate = (date) => {
          return date.toISOString().split('T')[0];
        };
        
        // Create the group object for microcycle with all required fields
        const group = {
          name: session.name,
          description: `${session.name} from microcycle "${formData.name || formData.goals}"`,
          day: weekdayToNumber[session.weekday?.toLowerCase()] || null,
          week: 1, // Microcycle is always just one week
          date: formatDate(sessionDate),
          // Store only the specified information in metadata
          metadata: {
            specialConstraints: formData.specialConstraints || null,
            aiSuggestions: formData.aiSuggestions || null
          }
        }

        // Create presets for exercises - simplified for microcycle
        const presets = sessionExercises.map((exercise, index) => {
          // Get the proper exercise ID from the backend
          let exerciseId;
          if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
            exerciseId = parseInt(exercise.originalId);
            
            // Validate that it's a reasonable ID
            if (exerciseId > 1000000) {
              exerciseId = index + 1; // Fallback to a reasonable range
            }
          } else {
            // Fallback to a reasonable value if missing or invalid originalId
            exerciseId = index + 1;
          }
          
          // Parse superset ID if present
          let supersetId = null;
          if (exercise.supersetId) {
            try {
              // Check if it's in the format "ss-timestamp-displayNumber"
              if (typeof exercise.supersetId === 'string' && exercise.supersetId.startsWith('ss-')) {
                // Extract the display number from the end of the string
                const parts = exercise.supersetId.split('-');
                if (parts.length >= 3) {
                  supersetId = parseInt(parts[parts.length - 1]);
                } else {
                  supersetId = 1; // Default to 1 if pattern doesn't match but has 'ss-' prefix
                }
              } else {
                // Try to parse it as a regular number
                supersetId = parseInt(exercise.supersetId);
              }
              
              // Validate that it's a reasonable superset ID
              if (isNaN(supersetId) || supersetId < 1) {
                supersetId = null;
              }
            } catch (err) {
              supersetId = null;
            }
          }
          
          // Create preset object according to database schema - no metadata
          const preset = {
            exercise_id: exerciseId,
            superset_id: supersetId,
            preset_order: exercise.position || index,
            notes: exercise.notes || null
          }

          // Create details for each set following database schema
          const details = Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => {
            // Store all additional data in metadata
            const detailMetadata = {
              name: exercise.name,
              part: exercise.part,
              category: exercise.category || null,
              sets: parseInt(exercise.sets) || 1,
              intensityType: 'direct',
              rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
              tempo: exercise.tempo || null,
              notes: exercise.setNotes || null
            };
            
            return {
              set_index: i + 1,
              reps: parseInt(exercise.reps) || 0,
              weight: exercise.weight ? parseFloat(exercise.weight) : null,
              power: exercise.power ? parseFloat(exercise.power) : null,
              velocity: exercise.velocity ? parseFloat(exercise.velocity) : null,
              distance: exercise.distance ? parseFloat(exercise.distance) : null,
              height: exercise.height ? parseFloat(exercise.height) : null,
              effort: exercise.effort ? parseFloat(exercise.effort) : null,
              performing_time: exercise.performing_time ? parseFloat(exercise.performing_time) : null,
              rest_time: exercise.rest ? parseInt(exercise.rest) : null,
              resistance_value: exercise.resistance_value ? parseFloat(exercise.resistance_value) : null,
              resistance_unit_id: exercise.resistance_unit_id ? parseInt(exercise.resistance_unit_id) : null,
              metadata: detailMetadata
            }
          })

          return {
            preset,
            details
          }
        })

        // Return the session object in the format expected by the API
        return {
          group,
          presets
        }
      });
    }
    
    // Original mesocycle transformation with camelCase
    return formData.sessions.map((session, weekIndex) => {
      // Get exercises for this session
      const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
      
      // Calculate session date based on weekday and week number
      const weekdayToNumber = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7
      };
      
      const startDate = new Date(formData.startDate);
      const sessionDate = new Date(startDate);
      
      // Add weeks based on the week number (assuming each session has a week property, or derive from index)
      const weekNumber = session.week || Math.floor(weekIndex / 7) + 1;
      sessionDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7)); // Add weeks
      
      // Then adjust for the specific day of the week
      if (session.weekday && weekdayToNumber[session.weekday.toLowerCase()]) {
        const dayOfWeek = weekdayToNumber[session.weekday.toLowerCase()];
        const currentDay = sessionDate.getDay() || 7; // getDay() returns 0-6 where 0 is Sunday, convert to 1-7
        const dayDiff = dayOfWeek - currentDay;
        sessionDate.setDate(sessionDate.getDate() + dayDiff);
      }
      
      // Format date to YYYY-MM-DD
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Create the group object as required by API, with all required fields
      const group = {
        name: session.name,
        description: `${session.name} from mesocycle "${formData.name || formData.goals}"`,
        day: weekdayToNumber[session.weekday?.toLowerCase()] || null,
        week: weekNumber || 1,
        date: formatDate(sessionDate),
        // Store only the specified information in metadata
        metadata: {
          specialConstraints: formData.specialConstraints || null,
          aiSuggestions: formData.aiSuggestions || null
        }
      }

      // Create exercise presets
      const presets = sessionExercises.map((exercise, index) => {
        // Process exercise ID
        let exerciseId;
        if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
          exerciseId = parseInt(exercise.originalId);
          if (exerciseId > 1000000) {
            exerciseId = index + 1;
          }
        } else {
          exerciseId = index + 1;
        }
        
        // Process superset ID
        let supersetId = null;
        if (exercise.supersetId) {
          try {
            if (typeof exercise.supersetId === 'string' && exercise.supersetId.startsWith('ss-')) {
              const parts = exercise.supersetId.split('-');
              if (parts.length >= 3) {
                supersetId = parseInt(parts[parts.length - 1]);
              } else {
                supersetId = 1;
              }
            } else {
              supersetId = parseInt(exercise.supersetId);
            }
            
            if (isNaN(supersetId) || supersetId < 1) {
              supersetId = null;
            }
          } catch (err) {
            supersetId = null;
          }
        }
        
        // Create preset with snake_case field names matching DB schema
        const preset = {
          exercise_id: exerciseId,
          superset_id: supersetId,
          preset_order: exercise.position || index,
          notes: exercise.notes || null
        }

        // Create details for each set following database schema
        const details = Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => {
          // Calculate weight based on one rep max if available
          let calculatedWeight = null;
          if (exercise.oneRepMax && exercise.intensityType === 'percentage') {
            // If weight is specified as percentage of 1RM
            const baseWeight = parseFloat(exercise.baseWeight || 0);
            const percentage = parseFloat(exercise.oneRepMax) / 100;
            calculatedWeight = baseWeight * percentage;
          } else {
            calculatedWeight = exercise.weight ? parseFloat(exercise.weight) : null;
          }

          // Store all additional data in metadata
          const detailMetadata = {
            name: exercise.name,
            part: exercise.part,
            category: exercise.category || null,
            sets: parseInt(exercise.sets) || 1,
            intensityType: exercise.intensityType || 'direct',
            baseWeight: exercise.baseWeight ? parseFloat(exercise.baseWeight) : null,
            oneRepMax: exercise.oneRepMax ? parseFloat(exercise.oneRepMax) : null,
            oneRepMaxPercentage: exercise.oneRepMax ? parseFloat(exercise.oneRepMax) : null,
            progressionModel: session.progressionModel || 'standard',
            progressionValue: session.progressionValue ? parseFloat(session.progressionValue) : null,
            rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
            tempo: exercise.tempo || null,
            notes: exercise.setNotes || null
          };

          // Create the set detail with snake_case field names matching DB schema
          return {
            set_index: i + 1,
            reps: parseInt(exercise.reps) || 0,
            weight: calculatedWeight,
            power: null,
            velocity: null,
            distance: null,
            height: null,
            effort: exercise.effort ? parseFloat(exercise.effort) : null,
            performing_time: null,
            rest_time: exercise.rest ? parseInt(exercise.rest) : null,
            resistance_value: null,
            resistance_unit_id: null,
            metadata: detailMetadata
          }
        })

        return {
          preset,
          details
        }
      })

      // Return the session object
      return {
        group,
        presets
      }
    })
  }

  /**
   * Saves a training plan to Supabase
   * 
   * @param {Object} formData - The form data from the wizard
   * @param {string} timezone - The timezone of the user
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMesocycle = async (formData, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // For microcycle plans, use the dedicated API format
      if (formData.planType === "microcycle") {
        return await saveMicrocycle(formData);
      }
      
      // For mesocycle plans, use the original format
      const sessions = transformFormData(formData)

      // Invoke edge function for mesocycle creation
      const payload = { sessions, timezone }
      const { data: rawData, error: fnError } = await supabase.functions.invoke('api', {
        method: 'POST',
        path: '/planner/mesocycle',
        body: payload
      })
      if (fnError) throw fnError
      const json = JSON.parse(rawData)
      return json
    } catch (err) {
      console.error('Error saving mesocycle:', err);
      setError(err.message || 'An unexpected error occurred')
      throw err
    } finally {
      setIsSubmitting(false)
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