/**
 * Formats microcycle data into the structure expected by the microcycle API
 * following the exact database schema
 * 
 * @param {Object} formData - The form data from the wizard
 * @returns {Object} - Formatted data for the microcycle API
 */
export const formatMicrocycleData = (formData) => {
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
      // Adjust date to match the weekday
      const dayDiff = weekdayToNumber[session.weekday.toLowerCase()] - 1;
      sessionDate.setDate(startDate.getDate() + dayDiff);
    }
    
    // Create group object - following database schema
    const group = {
      week: 1,
      day: weekdayToNumber[session.weekday?.toLowerCase()] || null,
      date: formatDate(sessionDate),
      name: session.name || `Session ${session.id}`,
      description: session.description || `${session.name || `Session ${session.id}`} from microcycle "${formData.name || formData.goals}"`,
      metadata: {
        specialConstraints: formData.specialConstraints || null,
        aiSuggestions: formData.aiSuggestions || null
      }
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
      
      // Store all additional data in metadata for details
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
      
      // Create the preset object matching exact DB schema (exercise_presets table)
      // No metadata in preset object per the schema requirements
      return {
        preset: {
          // Using exact field names matching the database columns
          exercise_id: exerciseId,
          superset_id: supersetId,
          preset_order: exercise.position || index + 1,
          notes: exercise.notes || null
        },
        details: Array.from({ length: parseInt(exercise.sets) || 1 }, (_, i) => ({
          // Using exact field names matching the database columns
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
        }))
      };
    });
    
    return {
      group,
      presets
    };
  });
  
  // Return formatted data structure using exact field names for the API
  return {
    microcycle: {
      name: formData.name || (formData.goals?.substring(0, 50) || "One-Week Training Plan"),
      description: formData.goals || "Microcycle training plan",
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      intensity: null,
      volume: null
    },
    sessions
  };
}; 