/**
 * Formats microcycle data for API submission
 * Calculates end dates, formats dates correctly, maps session details
 * @param {Object} formData - The microcycle form data to format
 * @returns {Object} - Formatted data ready for API submission
 */
export const formatMicrocycleData = (formData) => {
  console.log("[formatMicrocycleData] Starting to format data for:", {
    name: formData.name,
    startDate: formData.startDate,
    sessionsCount: formData.sessions?.length || 0
  });

  // Prepare dates
  const startDate = new Date(formData.startDate);
  
  // Calculate end date (7 days from start date)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // End date is 6 days after start (1 week total)
  
  console.log("[formatMicrocycleData] Date range:", {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });

  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Setup weekday mapping
  const weekdayToNumber = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  };

  // Map sessions to the format expected by the API
  console.log("[formatMicrocycleData] Processing sessions:", formData.sessions?.length || 0);
  const sessions = formData.sessions?.map((session, index) => {
    // Calculate session date based on weekday
    const sessionDate = new Date(startDate);
    if (session.weekday && weekdayToNumber[session.weekday.toLowerCase()]) {
      // Adjust date to match the weekday
      const dayDiff = weekdayToNumber[session.weekday.toLowerCase()] - 1;
      sessionDate.setDate(startDate.getDate() + dayDiff);
      console.log(`[formatMicrocycleData] Session ${index + 1}: ${session.name} - calculated date: ${formatDate(sessionDate)}`);
    } else {
      console.log(`[formatMicrocycleData] Warning: Session ${index + 1} missing weekday, using start date`);
    }

    // Format the session data according to API expectations
    return {
      id: session.id,
      name: session.name || `Session ${index + 1}`,
      description: session.description || `Training session ${index + 1}`,
      weekday: session.weekday?.toLowerCase() || null,
      day_number: weekdayToNumber[session.weekday?.toLowerCase()] || null,
      date: formatDate(sessionDate),
      order: index + 1,
      type: session.type || "training",
      status: "planned",
      exercises: session.exercises || []
    };
  }) || [];

  console.log(`[formatMicrocycleData] Processed ${sessions.length} sessions`);

  // Build exercise preset groups
  const exercisePresetGroups = [];
  sessions.forEach((session, sessionIndex) => {
    if (!session.exercises || session.exercises.length === 0) {
      console.log(`[formatMicrocycleData] Session ${sessionIndex + 1} has no exercises, skipping preset groups`);
      return;
    }

    console.log(`[formatMicrocycleData] Building preset group for session ${sessionIndex + 1}: ${session.name} with ${session.exercises.length} exercises`);
    
    // Create the exercise preset group for this session
    const presetGroup = {
      name: session.name || `Session ${sessionIndex + 1}`,
      description: session.description || `Training session on ${session.date}`,
      day: session.day_number,
      week: 1, // Microcycle is always one week
      date: session.date,
      metadata: {
        session_id: session.id,
        session_type: session.type || "training",
        weekday: session.weekday
      }
    };

    // Process exercises for this session
    const presets = session.exercises.map((exercise, index) => {
      console.log(`[formatMicrocycleData] Processing exercise ${index + 1} in session ${sessionIndex + 1}: ${exercise.name || 'Unnamed'}`);
      
      // Ensure exercise has required fields
      if (!exercise.name) {
        console.log(`[formatMicrocycleData] Warning: Exercise ${index + 1} missing name`);
      }
      
      // Get the proper exercise ID
      let exerciseId;
      if (exercise.originalId && !isNaN(parseInt(exercise.originalId))) {
        exerciseId = parseInt(exercise.originalId);
        console.log(`[formatMicrocycleData] Using originalId ${exerciseId} for exercise ${index + 1}`);
      } else if (exercise.id && !isNaN(parseInt(exercise.id))) {
        exerciseId = parseInt(exercise.id);
        console.log(`[formatMicrocycleData] Using id ${exerciseId} for exercise ${index + 1}`);
      } else {
        console.log(`[formatMicrocycleData] Warning: Exercise ${index + 1} missing valid ID, using index`);
        exerciseId = index + 1; // Fallback
      }
      
      // Handle superset ID
      let supersetId = null;
      if (exercise.supersetId) {
        try {
          if (typeof exercise.supersetId === 'string' && exercise.supersetId.startsWith('ss-')) {
            const parts = exercise.supersetId.split('-');
            if (parts.length >= 3) {
              supersetId = parseInt(parts[parts.length - 1]);
              console.log(`[formatMicrocycleData] Parsed superset ID ${supersetId} from ${exercise.supersetId}`);
            }
          } else {
            // Try as a regular number
            supersetId = parseInt(exercise.supersetId);
          }
          
          if (isNaN(supersetId) || supersetId < 1) {
            console.log(`[formatMicrocycleData] Invalid superset ID value, setting to null`);
            supersetId = null;
          }
        } catch (err) {
          console.log(`[formatMicrocycleData] Error parsing superset ID: ${err.message}`);
          supersetId = null;
        }
      }
      
      // Create preset according to database schema - no metadata
      const preset = {
        exercise_id: exerciseId,
        superset_id: supersetId,
        preset_order: exercise.position || index,
        notes: exercise.notes || null
      };

      // Create details for each set following database schema
      const setsCount = parseInt(exercise.sets) || 1;
      console.log(`[formatMicrocycleData] Creating ${setsCount} set details for exercise ${index + 1}`);
      
      const details = Array.from({ length: setsCount }, (_, i) => {
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
        
        // Create the detail object
        return {
          set_index: i + 1,
          reps: parseInt(exercise.reps) || 0,
          weight: exercise.weight ? parseFloat(exercise.weight) : null,
          power: exercise.power ? parseFloat(exercise.power) : null,
          velocity: exercise.velocity ? parseFloat(exercise.velocity) : null,
          distance: exercise.distance ? parseFloat(exercise.distance) : null,
          effort: exercise.effort ? parseFloat(exercise.effort) : null,
          performing_time: exercise.performing_time ? parseFloat(exercise.performing_time) : null,
          rest_time: exercise.rest_time ? parseFloat(exercise.rest_time) : null,
          metadata: detailMetadata
        };
      });
      
      // Return the preset with its details
      return {
        ...preset,
        exercise_preset_details: details
      };
    });
    
    // Add the exercise presets to the group
    presetGroup.exercise_presets = presets;
    
    // Add the group to our collection
    exercisePresetGroups.push(presetGroup);
    console.log(`[formatMicrocycleData] Added preset group for "${session.name}" with ${presets.length} exercises`);
  });

  // Construct the final formatted microcycle data
  console.log(`[formatMicrocycleData] Building final formatted data with ${exercisePresetGroups.length} preset groups`);
  
  const formattedData = {
    name: formData.name,
    description: formData.description || `Microcycle starting on ${formatDate(startDate)}`,
    type: formData.type || "microcycle",
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    status: "planned",
    intensity: formData.intensity || 5,
    volume: formData.volume || 5,
    mesocycle_id: formData.mesocycleId || null,
    athlete_id: formData.athleteId || null,
    sessions: sessions,
    exercise_preset_groups: exercisePresetGroups
  };

  console.log(`[formatMicrocycleData] Formatting complete for microcycle "${formattedData.name}"`);
  return formattedData;
}; 