"use client"

import { useState } from "react"
const API_BASE_URL = "http://localhost:54321/functions/v1/api"
/**
 * Custom hook for saving mesocycle plans to Supabase
 * 
 * @returns {Object} - Functions and state for saving mesocycle plans
 */
export const useSaveMesocycle = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [savedData, setSavedData] = useState(null)

  /**
   * Transforms the mesocycle data into the format expected by the API
   * 
   * @param {Object} formData - The form data from the mesocycle wizard
   * @param {string|number} coachId - The ID of the coach
   * @returns {Object} - Formatted data for the API
   */
  const transformFormData = (formData, coachId) => {
    // Clear any previous state
    setError(null)
    setSuccess(false)
    setSavedData(null)

    // Format sessions based on the API schema
    return formData.sessions.map((session) => {
      // Get exercises for this session
      const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
      
      // 1. Create the group object as required by API
      const group = {
        coach_id: coachId,
        name: session.name,
        description: `${session.name} from mesocycle "${formData.goals}"`,
        day: session.weekday ? session.weekday.toLowerCase() : null,
        // Store additional information in metadata
        metadata: {
          progression_model: session.progressionModel || 'standard',
          progression_value: session.progressionValue || null,
          mesocycle_id: formData.id || Date.now().toString(),
          mesocycle_goals: formData.goals,
          mesocycle_duration: formData.duration,
          mesocycle_start_date: formData.startDate,
          special_constraints: formData.specialConstraints || null,
          ai_suggestions: formData.aiSuggestions || null
        }
      }

      // 2. Create presets for each exercise
      const presets = sessionExercises.map((exercise, index) => {
        // Create preset object according to schema
        const preset = {
          exercise_id: exercise.originalId || exercise.id,
          superset_id: exercise.supersetId || null,
          preset_order: exercise.position || index, // Use position or fallback to index
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
   * Saves a mesocycle plan to Supabase
   * 
   * @param {Object} formData - The form data from the mesocycle wizard
   * @param {string|number} coachId - The ID of the coach
   * @param {string} timezone - The timezone of the user
   * @returns {Promise<Object>} - The response from the API
   */
  const saveMesocycle = async (formData, coachId, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Transform the data
      const sessions = transformFormData(formData, coachId)
      
      // Log the data being sent for debugging
      console.log('Sending mesocycle data:', JSON.stringify({
        sessions,
        coachId,
        timezone
      }, null, 2));

      // Make the API request with the exact format expected by the backend
      const response = await fetch(`${API_BASE_URL}/planner/mesocycle/POST`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessions,
          coachId,
          timezone 
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save mesocycle')
      }
      
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