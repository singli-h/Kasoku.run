"use client"

import { useState } from "react"
import { edgeFunctions } from '@/lib/edge-functions'

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
   * Formats microcycle data into the structure expected by the microcycle API
   * 
   * @param {Object} formData - The form data from the wizard
   * @returns {Object} - Formatted data for the microcycle API
   */
  const formatMicrocycleData = (formData) => {
    // Calculate end date (1 week after start date)
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Add 6 days to make it a 7-day period (inclusive)
    
    // Format dates to YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Map weekday names to day numbers (Monday = 1, Sunday = 7)
    const weekdayToNumber = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    
    // Format the microcycle sessions
    const sessions = formData.sessions.map(session => {
      // Get exercises for this session
      const sessionExercises = formData.exercises.filter(ex => ex.session === session.id);
      
      // Calculate session date based on weekday
      const sessionDate = new Date(startDate);
      if (session.weekday && weekdayToNumber[session.weekday.toLowerCase()]) {
        // Adjust date to match the weekday (0 = Sunday in getDay())
        const dayDiff = weekdayToNumber[session.weekday.toLowerCase()] - 1;
        sessionDate.setDate(startDate.getDate() + dayDiff);
      }
      
      // Create group object
      const group = {
        week: 1,
        day: weekdayToNumber[session.weekday?.toLowerCase()] || null,
        date: formatDate(sessionDate),
        name: session.name || `Session ${session.id}`,
        description: session.description || `${session.name || `Session ${session.id}`} from microcycle "${formData.name || formData.goals}"`
      };
      
      // Create presets for each exercise
      const presets = sessionExercises.map((exercise, index) => {
        // Get the proper exercise ID from the backend
        // Log the exercise to debug the ID issue
        console.log(`Exercise data for ${exercise.name}:`, {
          originalId: exercise.originalId,
          id: exercise.id,
          type: typeof exercise.originalId,
          supersetId: exercise.supersetId,
          supersetIdType: typeof exercise.supersetId
        });
        
        // Enhanced logic to ensure we get a valid exercise ID (1-48 range)
        let exerciseId;
        if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
          exerciseId = parseInt(exercise.originalId);
          
          // Validate that it's a reasonable ID (1-48 range)
          if (exerciseId > 1000000) {
            console.warn(`Unusually large exercise ID detected (${exerciseId}), this is likely a frontend-generated ID. Using fallback ID.`);
            // If ID is very large (timestamp-based), it's likely a frontend ID, so use a fallback
            exerciseId = index + 1; // Fallback to a reasonable range
          }
        } else {
          // Fallback to a reasonable value if missing or invalid originalId
          exerciseId = index + 1;
          console.warn(`Missing or invalid originalId for exercise ${exercise.name}, using index-based fallback ID: ${exerciseId}`);
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
                console.log(`Extracted superset display number ${supersetId} from ID ${exercise.supersetId}`);
              } else {
                supersetId = 1; // Default to 1 if pattern doesn't match but has 'ss-' prefix
              }
            } else {
              // Try to parse it as a regular number
              supersetId = parseInt(exercise.supersetId);
            }
            
            // Validate that it's a reasonable superset ID
            if (isNaN(supersetId) || supersetId < 1) {
              console.warn(`Invalid superset ID: ${supersetId}, using null instead`);
              supersetId = null;
            } else {
              console.log(`Using superset ID: ${supersetId} for exercise ${exercise.name}`);
            }
          } catch (err) {
            console.warn(`Error parsing superset ID: ${exercise.supersetId}`, err);
            supersetId = null;
          }
        }
        
        return {
          preset: {
            exercise_id: exerciseId, // Use the properly parsed ID
            superset_id: supersetId, // Use the properly parsed superset ID
            preset_order: exercise.position || index + 1,
            notes: exercise.notes
          },
          details: Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => ({
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
            metadata: {
              rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
              exercise_name: exercise.name
            }
          }))
        };
      });
      
      return {
        group,
        presets
      };
    });
    
    // Return formatted data structure
    return {
      microcycle: {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        name: formData.name || (formData.goals?.substring(0, 50) || "One-Week Training Plan"),
        description: formData.goals || "Microcycle training plan",
        intensity: null,
        volume: null
      },
      sessions
    };
  };

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
      // Format the data according to the microcycle API structure
      const formattedData = formatMicrocycleData(formData);
      
      // Log the data being sent for debugging
      console.log('Sending microcycle data:', JSON.stringify(formattedData, null, 2));
      
      // Use edge functions client instead of direct fetch
      const data = await edgeFunctions.dashboard.createTrainingSession({
        type: 'microcycle',
        ...formattedData
      });
      
      setSuccess(true);
      setSavedData(data);
      return data;
    } catch (err) {
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
        
        // Create the group object for microcycle
        const group = {
          name: session.name,
          description: `${session.name} from microcycle "${formData.name || formData.goals}"`,
          day: session.weekday ? session.weekday.toLowerCase() : null,
          // Store additional information in metadata
          metadata: {
            plan_type: "microcycle",
            microcycle_id: formData.id || Date.now().toString(),
            microcycle_name: formData.name || "One-Week Training Plan",
            microcycle_goals: formData.goals,
            microcycle_duration: 1,
            microcycle_start_date: formData.startDate,
            special_constraints: formData.specialConstraints || null,
            ai_suggestions: formData.aiSuggestions || null
          }
        }

        // Create presets for exercises - simplified for microcycle
        const presets = sessionExercises.map((exercise, index) => {
          // Get the proper exercise ID from the backend
          // Log the exercise to debug the ID issue
          console.log(`Exercise data in transformFormData for ${exercise.name}:`, {
            originalId: exercise.originalId,
            id: exercise.id,
            type: typeof exercise.originalId,
            supersetId: exercise.supersetId,
            supersetIdType: typeof exercise.supersetId
          });
          
          // Enhanced logic to ensure we get a valid exercise ID (1-48 range)
          let exerciseId;
          if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
            exerciseId = parseInt(exercise.originalId);
            
            // Validate that it's a reasonable ID (1-48 range)
            if (exerciseId > 1000000) {
              console.warn(`Unusually large exercise ID detected (${exerciseId}), this is likely a frontend-generated ID. Using fallback ID.`);
              // If ID is very large (timestamp-based), it's likely a frontend ID, so use a fallback
              exerciseId = index + 1; // Fallback to a reasonable range
            }
          } else {
            // Fallback to a reasonable value if missing or invalid originalId
            exerciseId = index + 1;
            console.warn(`Missing or invalid originalId for exercise ${exercise.name}, using index-based fallback ID: ${exerciseId}`);
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
                  console.log(`Extracted superset display number ${supersetId} from ID ${exercise.supersetId}`);
                } else {
                  supersetId = 1; // Default to 1 if pattern doesn't match but has 'ss-' prefix
                }
              } else {
                // Try to parse it as a regular number
                supersetId = parseInt(exercise.supersetId);
              }
              
              // Validate that it's a reasonable superset ID
              if (isNaN(supersetId) || supersetId < 1) {
                console.warn(`Invalid superset ID: ${supersetId}, using null instead`);
                supersetId = null;
              } else {
                console.log(`Using superset ID: ${supersetId} for exercise ${exercise.name}`);
              }
            } catch (err) {
              console.warn(`Error parsing superset ID: ${exercise.supersetId}`, err);
              supersetId = null;
            }
          }
          
          // Create preset object according to schema
          const preset = {
            exercise_id: exerciseId, // Use the properly parsed ID
            superset_id: supersetId, // Use the properly parsed superset ID
            preset_order: exercise.position || index,
            notes: exercise.notes || null,
            metadata: {
              name: exercise.name,
              part: exercise.part,
              category: exercise.category || null,
              sets: parseInt(exercise.sets),
              // For microcycle, we don't need progression data
              intensity_type: 'direct'
            }
          }

          // Create details for each set - simplified for microcycle
          const details = Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => {
            return {
              set_index: i + 1,
              reps: parseInt(exercise.reps) || 0,
              weight: exercise.weight ? parseFloat(exercise.weight) : null,
              power: null,
              velocity: null,
              distance: null,
              height: null,
              effort: exercise.effort ? parseFloat(exercise.effort) : null,
              performing_time: null,
              rest_time: exercise.rest ? parseInt(exercise.rest) : 60,
              resistance_value: null,
              resistance_unit_id: null,
              // Store additional metrics in metadata
              metadata: {
                rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
                tempo: exercise.tempo || null,
                notes: exercise.setNotes || null
              }
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
    
    // Original mesocycle transformation
    return formData.sessions.map((session) => {
      // Get exercises for this session
      const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
      
      // 1. Create the group object as required by API
      const group = {
        name: session.name,
        description: `${session.name} from mesocycle "${formData.name || formData.goals}"`,
        day: session.weekday ? session.weekday.toLowerCase() : null,
        // Store additional information in metadata
        metadata: {
          plan_type: "mesocycle",
          progression_model: session.progressionModel || 'standard',
          progression_value: session.progressionValue || null,
          mesocycle_id: formData.id || Date.now().toString(),
          mesocycle_name: formData.name || "Training Plan",
          mesocycle_goals: formData.goals,
          mesocycle_duration: formData.duration,
          mesocycle_start_date: formData.startDate,
          special_constraints: formData.specialConstraints || null,
          ai_suggestions: formData.aiSuggestions || null
        }
      }

      // 2. Create presets for each exercise
      const presets = sessionExercises.map((exercise, index) => {
        // Get the proper exercise ID from the backend
        // Log the exercise to debug the ID issue
        console.log(`Exercise data in mesocycle for ${exercise.name}:`, {
          originalId: exercise.originalId,
          id: exercise.id,
          type: typeof exercise.originalId,
          supersetId: exercise.supersetId,
          supersetIdType: typeof exercise.supersetId
        });
        
        // Enhanced logic to ensure we get a valid exercise ID (1-48 range)
        let exerciseId;
        if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
          exerciseId = parseInt(exercise.originalId);
          
          // Validate that it's a reasonable ID (1-48 range)
          if (exerciseId > 1000000) {
            console.warn(`Unusually large exercise ID detected (${exerciseId}), this is likely a frontend-generated ID. Using fallback ID.`);
            // If ID is very large (timestamp-based), it's likely a frontend ID, so use a fallback
            exerciseId = index + 1; // Fallback to a reasonable range
          }
        } else {
          // Fallback to a reasonable value if missing or invalid originalId
          exerciseId = index + 1;
          console.warn(`Missing or invalid originalId for exercise ${exercise.name}, using index-based fallback ID: ${exerciseId}`);
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
                console.log(`Extracted superset display number ${supersetId} from ID ${exercise.supersetId}`);
              } else {
                supersetId = 1; // Default to 1 if pattern doesn't match but has 'ss-' prefix
              }
            } else {
              // Try to parse it as a regular number
              supersetId = parseInt(exercise.supersetId);
            }
            
            // Validate that it's a reasonable superset ID
            if (isNaN(supersetId) || supersetId < 1) {
              console.warn(`Invalid superset ID: ${supersetId}, using null instead`);
              supersetId = null;
            } else {
              console.log(`Using superset ID: ${supersetId} for exercise ${exercise.name}`);
            }
          } catch (err) {
            console.warn(`Error parsing superset ID: ${exercise.supersetId}`, err);
            supersetId = null;
          }
        }
        
        // Create preset object according to schema
        const preset = {
          exercise_id: exerciseId, // Use the properly parsed ID
          superset_id: supersetId, // Use the properly parsed superset ID
          preset_order: exercise.position || index,
          notes: exercise.notes || null,
          metadata: {
            name: exercise.name,
            part: exercise.part,
            category: exercise.category || null,
            sets: parseInt(exercise.sets),
            one_rep_max: exercise.oneRepMax ? parseInt(exercise.oneRepMax) : null,
            intensity_type: exercise.intensityType || 'percentage'
          }
        }

        // Create details for each set
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

          // Create the set detail
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
            rest_time: exercise.rest ? parseInt(exercise.rest) : 60,
            resistance_value: null,
            resistance_unit_id: null,
            // Store additional metrics in metadata
            metadata: {
              one_rep_max_percentage: exercise.oneRepMax ? parseFloat(exercise.oneRepMax) : null,
              rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
              tempo: exercise.tempo || null,
              notes: exercise.setNotes || null
            }
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
      
      // Log the data being sent for debugging
      console.log('Sending training plan data:', JSON.stringify({
        sessions,
        timezone,
        planType: formData.planType || 'mesocycle'
      }, null, 2));

      // Use edge functions client instead of direct fetch
      const data = await edgeFunctions.dashboard.createTrainingSession({
        type: 'mesocycle',
        sessions,
        timezone,
        planType: formData.planType || 'mesocycle'
      });
      
      setSuccess(true)
      setSavedData(data)
      return data
    } catch (err) {
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