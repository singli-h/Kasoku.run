"use client"

import { useState } from "react"
import { useClerk } from '@clerk/nextjs'

/**
 * Custom hook for saving training plans via API endpoints
 * 
 * @returns {Object} - Functions and state for saving mesocycle and microcycle plans
 */
export const useSaveTrainingPlan = () => {
  const { session } = useClerk()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [savedData, setSavedData] = useState(null)

  /**
   * Get the auth token for API requests
   * @returns {Promise<string>} The authentication token
   */
  const getAuthToken = async () => {
    if (!session) {
      throw new Error('No authenticated session available')
    }
    return await session.getToken()
  }

  /**
   * Formats microcycle data for the API endpoint
   * 
   * @param {Object} formData - The form data from the wizard
   * @param {Array} exerciseList - List of exercises for lookup
   * @returns {Object} - Formatted data for the API
   */
  const formatMicrocycleData = (formData, exerciseList = []) => {
    console.log('[formatMicrocycleData] sessions:', formData.sessions.map(s => ({ id: s.id, sessionMode: s.sessionMode, weekday: s.weekday })));
    // Map frontend weekdays to numbers (adjust if API expects different mapping)
    const weekdayToNumber = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 7
    };

    // Calculate end date (start date + 6 days for a 1-week microcycle)
    const startDate = new Date(formData.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      if (!date || !(date instanceof Date)) {
        // Handle invalid or missing dates gracefully
        console.warn("Invalid date provided for formatting:", date);
        // Return today's date as a fallback or handle as needed
        return new Date().toISOString().split('T')[0]; 
      }
      return date.toISOString().split('T')[0];
    };

    // Structure the main microcycle payload
    const microcyclePayload = {
      name: formData.name,
      description: formData.goals || `Microcycle starting ${formatDate(startDate)}`,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      mesocycle_id: formData.mesocycleId || null,
      athlete_group_id: formData.athleteGroupId || null,
      sessions: formData.sessions.map((session, sessionIndex) => {
        console.log('[formatMicrocycleData] building session payload for:', session.id, session.sessionMode);
        const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id);
        
        // Calculate session date based on weekday relative to start date
        const sessionDate = new Date(startDate);
        if (session.weekday && weekdayToNumber[session.weekday.toLowerCase()]) {
            const startDay = startDate.getDay() || 7; // 1 (Mon) - 7 (Sun)
            const targetDay = weekdayToNumber[session.weekday.toLowerCase()];
            let dayDiff = targetDay - startDay;
            // If target day is earlier in the week than start day, add 7 days
            // (Assuming microcycle starts on start_date's day or later)
            // This logic might need refinement based on exact week start definition
            // if (dayDiff < 0) {
            //   dayDiff += 7;
            // }
            sessionDate.setDate(startDate.getDate() + dayDiff);
        } else {
          // Default to session index if weekday is missing, relative to start date
          sessionDate.setDate(startDate.getDate() + sessionIndex); 
        }

        return {
          name: session.name,
          session_mode: session.sessionMode || 'individual',
          description: `${session.name} - ${formData.name}`,
          date: formatDate(sessionDate), // Session date
          // API expects 'exercises', not 'presets'
          exercises: sessionExercises.map((exercise, exerciseIndex) => {
            // Use the database's original exercise ID or lookup by name; do not use timestamp IDs
            let exerciseId;
            if (exercise.originalId !== undefined && exercise.originalId !== null) {
              exerciseId = Number(exercise.originalId);
            } else {
              // Lookup by exercise name in fetched exerciseList
              const found = exerciseList.find((item) => item.name === exercise.name);
              if (!found || !found.id) {
                throw new Error(`Cannot determine exercise ID for "${exercise.name}". Check originalId or exerciseList.`);
              }
              exerciseId = found.id;
            }
            // Validate the found ID
            if (isNaN(exerciseId) || exerciseId <= 0) {
              throw new Error(`Invalid exercise ID (${exerciseId}) for "${exercise.name}".`);
            }
            // *** Add this log for debugging ***
            console.log(`[formatMicrocycleData] Exercise: "${exercise.name}", originalId: ${exercise.originalId}, frontendId: ${exercise.id}, Final API exercise_id: ${exerciseId}`);

            // Parse superset ID if present
            let supersetId = null;
            if (exercise.supersetId) {
              if (typeof exercise.supersetId === 'string' && exercise.supersetId.startsWith('ss-')) {
                const parts = exercise.supersetId.split('-');
                supersetId = parts.length >= 3 ? parseInt(parts[parts.length - 1]) : 1;
              } else {
                supersetId = parseInt(exercise.supersetId);
              }
              if (isNaN(supersetId) || supersetId < 1) supersetId = null;
            }

            // Create the preset object for the API (exercise entry within the session)
            const presetPayload = {
              exercise_id: exerciseId,
              superset_id: supersetId,
              preset_order: exercise.position !== undefined ? exercise.position : exerciseIndex, // Always prioritize position for superset ordering
              notes: exercise.notes || null,
              // Fields like sets, reps, weight, rest DO NOT belong here for the API
              // They belong in the presetDetails below

              // Create details for each set - API expects 'presetDetails' array
              presetDetails: Array.from({ length: parseInt(exercise.sets) || 1 }, (_, setIdx) => {
                // Store exercise-specific but non-set-varying info in metadata
                const detailMetadata = {
                  exerciseName: exercise.name, // Keep original name if needed
                  part: exercise.part,
                  category: exercise.category || null,
                  // intensityType: 'direct', // Redundant if RPE/etc are direct fields
                  // rpe: exercise.rpe ? parseFloat(exercise.rpe) : null, // Move to direct field
                  tempo: exercise.tempo || null, // Move to direct field? API has tempo.
                  notes: exercise.setNotes || null // Notes specific to this set type?
                };

                return {
                  // Map frontend exercise data to direct API fields for exercise_preset_details
                  set_number: setIdx + 1, // API expects set_number
                  reps: parseInt(exercise.reps) || null, // Direct field
                  weight: exercise.weight ? parseFloat(exercise.weight) : null, // Direct field
                  rest_time: exercise.rest ? parseInt(exercise.rest) : null, // Direct field (maps to DB rest_time)
                  rpe: exercise.rpe ? parseFloat(exercise.rpe) : null, // Direct field
                  tempo: exercise.tempo || null, // Direct field
                  
                  // Other potential fields from exercise_preset_details table
                  resistance: exercise.resistance_value ? parseFloat(exercise.resistance_value) : null, // Map resistance_value if used
                  resistance_unit_id: exercise.resistance_unit_id ? parseInt(exercise.resistance_unit_id) : null,
                  distance: exercise.distance ? parseFloat(exercise.distance) : null,
                  height: exercise.height ? parseFloat(exercise.height) : null,
                  power: exercise.power ? parseFloat(exercise.power) : null,
                  velocity: exercise.velocity ? parseFloat(exercise.velocity) : null,
                  effort: exercise.effort ? parseFloat(exercise.effort) : null,
                  performing_time: exercise.performing_time ? parseFloat(exercise.performing_time) : null,
                  duration: exercise.duration || null, // Map duration if used

                  metadata: detailMetadata // Remaining non-mapped data
                };
              })
            };
            return presetPayload;
          })
        };
      })
    };

    console.log("Formatted Microcycle Data for API:", microcyclePayload);
    return microcyclePayload;
  }

  /**
   * Saves a microcycle plan using the new API structure
   * 
   * @param {Object} formData - The form data from the wizard
   * @param {Array} exerciseList - List of exercises for lookup
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMicrocycle = async (formData, exerciseList = []) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Format the data according to the microcycle API structure using the *local* function
      const formattedData = formatMicrocycleData(formData, exerciseList)
      console.log('formattedData sent to API', formattedData) // Log the actual data being sent
      // Get authentication token
      const token = await getAuthToken()
      
      // Call the microcycle API endpoint
      const response = await fetch('/api/plans/microcycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      })
      
      // Handle response
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create microcycle')
      }
      
      return data
    } catch (err) {
      console.error('Error saving microcycle:', err)
      // Provide more context in the error if possible
      const errorMessage = err.response ? JSON.stringify(await err.response.json()) : err.message;
      setError(`Failed to save microcycle: ${errorMessage}` || 'An unexpected error occurred')
      throw err // Re-throw the error so handleSubmit can catch it
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Transforms the mesocycle data into the format expected by the API
   * 
   * @param {Object} formData - The form data from the mesocycle wizard
   * @param {Array} exerciseList - List of exercises for lookup
   * @returns {Object} - Formatted data for the API
   */
  const transformFormData = (formData, exerciseList) => {
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
            preset_order: exercise.position !== undefined ? exercise.position : index, // Prioritize position for superset ordering
            notes: exercise.notes || null
          };

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
        // Include the selected session mode (individual or group)
        session_mode: session.sessionMode || 'individual',
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
        
        // Process superset ID if present
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
          preset_order: exercise.position !== undefined ? exercise.position : index, // Prioritize position for superset ordering
          notes: exercise.notes || null
        };

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
   * Saves a training plan via the API
   * 
   * @param {Object} formData - The form data from the wizard
   * @param {Array} exerciseList - List of exercises for lookup
   * @param {string} timezone - The timezone of the user
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMesocycle = async (formData, exerciseList, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    console.log('[saveMesocycle] planType:', formData.planType);
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // For microcycle plans, use the dedicated API format via saveMicrocycle
      if (formData.planType === "microcycle") {
        console.log("Calling saveMicrocycle for planType:", formData.planType);
        // saveMicrocycle now internally calls formatMicrocycleData
        return await saveMicrocycle(formData, exerciseList) 
      }
      
      // For mesocycle plans, use the original format (transformFormData -> API call)
      console.log("Calling transformFormData for MESOCYCLE");
      const weeks = transformFormData(formData, exerciseList)
      console.log('[saveMesocycle] mesocycle weeks payload:', JSON.stringify(weeks, null, 2));
      
      // Get authentication token
      const token = await getAuthToken()
      
      // Build mesocycle plan payload
      // Compute end date for mesocycle based on startDate + duration
      const startDateObj = new Date(formData.startDate)
      const weeksDuration = parseInt(formData.duration) || 1
      const endDateObj = new Date(startDateObj)
      endDateObj.setDate(startDateObj.getDate() + (weeksDuration * 7) - 1)
      const endDateStr = endDateObj.toISOString().split('T')[0]
      const planPayload = {
        name: formData.name,
        description: formData.goals || '',
        startDate: formData.startDate,
        endDate: endDateStr,
        athleteGroupId: formData.athleteGroupId || null,
        ...(formData.macrocycleId && { macrocycleId: formData.macrocycleId }),
        weeks
      }
      console.log('[saveMesocycle] planPayload for API:', planPayload);
      const response = await fetch('/api/plans/mesocycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planPayload)
      })
      
      // Handle response
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create mesocycle')
      }
      
      return data
    } catch (err) {
      console.error('Error saving plan:', err) // Generic error log
      // Set specific error based on plan type if possible
      const planTypeLabel = formData.planType || "plan";
      const errorMessage = err.response ? JSON.stringify(await err.response.json()) : err.message;
      setError(`Failed to save ${planTypeLabel}: ${errorMessage}` || 'An unexpected error occurred')
      throw err // Re-throw error for handleSubmit
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