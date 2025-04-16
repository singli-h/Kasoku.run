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
      
      // Create presets for exercises
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
        
        return {
          preset: {
            exerciseId, // camelCase
            supersetId, // camelCase
            presetOrder: exercise.position || index + 1,
            notes: exercise.notes
          },
          details: Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => ({
            setIndex: i + 1, // camelCase
            reps: parseInt(exercise.reps) || 0,
            weight: exercise.weight ? parseFloat(exercise.weight) : null,
            power: exercise.power ? parseFloat(exercise.power) : null,
            velocity: exercise.velocity ? parseFloat(exercise.velocity) : null,
            distance: exercise.distance ? parseFloat(exercise.distance) : null,
            height: exercise.height ? parseFloat(exercise.height) : null,
            effort: exercise.effort ? parseFloat(exercise.effort) : null,
            performingTime: exercise.performing_time ? parseFloat(exercise.performing_time) : null, // camelCase
            restTime: exercise.rest ? parseInt(exercise.rest) : null, // camelCase
            resistanceValue: exercise.resistance_value ? parseFloat(exercise.resistance_value) : null, // camelCase
            resistanceUnitId: exercise.resistance_unit_id ? parseInt(exercise.resistance_unit_id) : null, // camelCase
            metadata: {
              rpe: exercise.rpe ? parseFloat(exercise.rpe) : null,
              exerciseName: exercise.name // camelCase
            }
          }))
        };
      });
      
      return {
        group,
        presets
      };
    });
    
    // Return formatted data structure using camelCase for fields
    return {
      microcycle: {
        name: formData.name || (formData.goals?.substring(0, 50) || "One-Week Training Plan"),
        description: formData.goals || "Microcycle training plan",
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
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
      
      // Use the planner API function
      const data = await edgeFunctions.planner.createMicrocycle(formattedData);
      
      setSuccess(true);
      setSavedData(data);
      return data;
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
        
        // Create the group object for microcycle
        const group = {
          name: session.name,
          description: `${session.name} from microcycle "${formData.name || formData.goals}"`,
          day: session.weekday ? session.weekday.toLowerCase() : null,
          // Store additional information in metadata
          metadata: {
            planType: "microcycle", // camelCase
            microcycleId: formData.id || Date.now().toString(), // camelCase
            microcycleName: formData.name || "One-Week Training Plan", // camelCase
            microcycleGoals: formData.goals, // camelCase
            microcycleDuration: 1, // camelCase
            microcycleStartDate: formData.startDate, // camelCase
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
          
          // Create preset object according to schema
          const preset = {
            exerciseId, // camelCase
            supersetId, // camelCase
            presetOrder: exercise.position || index, // camelCase
            notes: exercise.notes || null,
            metadata: {
              name: exercise.name,
              part: exercise.part,
              category: exercise.category || null,
              sets: parseInt(exercise.sets),
              intensityType: 'direct' // camelCase
            }
          }

          // Create details for each set - simplified for microcycle
          const details = Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => {
            return {
              setIndex: i + 1, // camelCase
              reps: parseInt(exercise.reps) || 0,
              weight: exercise.weight ? parseFloat(exercise.weight) : null,
              power: null,
              velocity: null,
              distance: null,
              height: null,
              effort: exercise.effort ? parseFloat(exercise.effort) : null,
              performingTime: null, // camelCase
              restTime: exercise.rest ? parseInt(exercise.rest) : 60, // camelCase
              resistanceValue: null, // camelCase
              resistanceUnitId: null, // camelCase
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
    
    // Original mesocycle transformation with camelCase
    return formData.sessions.map((session) => {
      // Get exercises for this session
      const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
      
      // Create the group object as required by API
      const group = {
        name: session.name,
        description: `${session.name} from mesocycle "${formData.name || formData.goals}"`,
        day: session.weekday ? session.weekday.toLowerCase() : null,
        // Store additional information in metadata with camelCase
        metadata: {
          planType: "mesocycle", // camelCase
          progressionModel: session.progressionModel || 'standard', // camelCase
          progressionValue: session.progressionValue || null, // camelCase
          mesocycleId: formData.id || Date.now().toString(), // camelCase
          mesocycleName: formData.name || "Training Plan", // camelCase
          mesocycleGoals: formData.goals, // camelCase
          mesocycleDuration: formData.duration, // camelCase
          mesocycleStartDate: formData.startDate, // camelCase
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
        
        // Create preset with camelCase
        const preset = {
          exerciseId,
          supersetId,
          presetOrder: exercise.position || index,
          notes: exercise.notes || null,
          metadata: {
            name: exercise.name,
            part: exercise.part,
            category: exercise.category || null,
            sets: parseInt(exercise.sets) || 0,
            intensityType: exercise.intensityType || 'direct',
            baseWeight: exercise.baseWeight ? parseFloat(exercise.baseWeight) : null,
            oneRepMax: exercise.oneRepMax ? parseFloat(exercise.oneRepMax) : null,
            progressionModel: session.progressionModel || 'standard',
            progressionValue: session.progressionValue ? parseFloat(session.progressionValue) : null
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

          // Create the set detail with camelCase
          return {
            setIndex: i + 1,
            reps: parseInt(exercise.reps) || 0,
            weight: calculatedWeight,
            power: null,
            velocity: null,
            distance: null,
            height: null,
            effort: exercise.effort ? parseFloat(exercise.effort) : null,
            performingTime: null,
            restTime: exercise.rest ? parseInt(exercise.rest) : 60,
            resistanceValue: null,
            resistanceUnitId: null,
            metadata: {
              oneRepMaxPercentage: exercise.oneRepMax ? parseFloat(exercise.oneRepMax) : null,
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

      // Use the planner API function
      const data = await edgeFunctions.planner.createMesocycle({
        sessions,
        timezone
      });
      
      setSuccess(true)
      setSavedData(data)
      return data
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