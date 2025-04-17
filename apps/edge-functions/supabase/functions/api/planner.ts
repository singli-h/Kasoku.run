import { corsHeaders, handleError } from './utils.ts';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper function to convert camelCase parameters to snake_case for database operations
 */
function normalizeParameters(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  // Common parameter mappings
  if (params.clerkId !== undefined) result.clerk_id = params.clerkId;
  if (params.coachId !== undefined) result.coach_id = params.coachId;
  if (params.startDate !== undefined) result.start_date = params.startDate;
  if (params.endDate !== undefined) result.end_date = params.endDate;
  if (params.athleteGroupId !== undefined) result.athlete_group_id = params.athleteGroupId;
  if (params.macrocycleId !== undefined) result.macrocycle_id = params.macrocycleId;
  if (params.mesocycleId !== undefined) result.mesocycle_id = params.mesocycleId;
  
  // Copy remaining parameters as-is
  for (const key in params) {
    if (result[key] === undefined && !key.includes('Id') && !key.includes('Date')) {
      result[key] = params[key];
    }
  }
  
  return result;
}

/**
 * POST /api/planner/mesocycle
 *
 * Creates a complete mesocycle with:
 * 1. Basic mesocycle information
 * 2. Exercise preset groups for each week/day
 * 3. Exercise presets for each group
 * 4. Exercise preset details for each exercise
 * 
 * @param supabase - Supabase client
 * @param url - Request URL object
 * @param req - Request object
 * @param coachId - Coach ID associated with this plan
 * @returns Response with created mesocycle and related data
 */
export const postMesocycle = async (
  supabase: any,
  url: URL,
  req: Request,
  coachId: number | string
): Promise<Response> => {
  try {
    // Parse request body
    let planData = await req.json();
    
    // Normalize parameters to ensure compatibility with both camelCase and snake_case formats
    planData = normalizeParameters(planData);
    
    // Extract mesocycle details
    const {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      athlete_group_id: athleteGroupId,
      weeks = []
    } = planData;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      throw new Error("Missing required fields. Name, start date, and end date are required.");
    }

    // 1. Create the mesocycle
    const { data: mesocycle, error: mesocycleError } = await supabase
      .from('mesocycles')
      .insert({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        // If macrocycle is provided, link it
        ...(planData.macrocycle_id && { macrocycle_id: planData.macrocycle_id })
      })
      .select()
      .single();

    if (mesocycleError) throw mesocycleError;

    // Process each week in the mesocycle
    const allPresetGroups = [];
    const allPresets = [];
    const allPresetDetails = [];

    // 2. Create exercise preset groups, presets, and details for each week
    for (const [weekIndex, week] of weeks.entries()) {
      const { sessions = [] } = week;
      
      for (const [dayIndex, session] of sessions.entries()) {
        const {
          name: sessionName,
          description: sessionDescription,
          date,
          exercises = []
        } = session;

        // 2a. Create exercise preset group
        const { data: presetGroup, error: presetGroupError } = await supabase
          .from('exercise_preset_groups')
          .insert({
            name: sessionName,
            description: sessionDescription,
            week: weekIndex + 1,
            day: dayIndex + 1,
            date,
            coach_id: coachId,
            athlete_group_id: athleteGroupId
          })
          .select()
          .single();

        if (presetGroupError) throw presetGroupError;
        allPresetGroups.push(presetGroup);

        // 2b. Create exercise presets for this group
        for (const [exerciseIndex, exercise] of exercises.entries()) {
          // Handle both camelCase and snake_case formats
          const exerciseId = exercise.exerciseId || exercise.exercise_id;
          const supersetId = exercise.supersetId || exercise.superset_id;
          const presetOrder = exercise.presetOrder || exercise.preset_order || exerciseIndex + 1;
          const setRestTime = exercise.setRestTime || exercise.set_rest_time;
          const repRestTime = exercise.repRestTime || exercise.rep_rest_time;
          
          const {
            sets,
            reps,
            weight,
            notes,
            order = exerciseIndex + 1,
            presetDetails = []
          } = exercise;

          // Create exercise preset
          const { data: preset, error: presetError } = await supabase
            .from('exercise_presets')
            .insert({
              exercise_preset_group_id: presetGroup.id,
              exercise_id: exerciseId,
              sets,
              reps,
              weight,
              set_rest_time: setRestTime,
              rep_rest_time: repRestTime,
              order,
              superset_id: supersetId,
              preset_order: presetOrder,
              notes
            })
            .select()
            .single();

          if (presetError) throw presetError;
          allPresets.push(preset);

          // 2c. Create exercise preset details if provided
          if (presetDetails && presetDetails.length > 0) {
            const detailsToInsert = presetDetails.map(detail => {
              // Handle both camelCase and snake_case
              const setNumber = detail.setNumber || detail.set_number;
              const resistanceUnitId = detail.resistanceUnitId || detail.resistance_unit_id;

              return {
                exercise_preset_id: preset.id,
                set_number: setNumber,
                resistance: detail.resistance,
                resistance_unit_id: resistanceUnitId,
                reps: detail.reps,
                distance: detail.distance,
                duration: detail.duration,
                tempo: detail.tempo,
                height: detail.height,
                metadata: detail.metadata
              };
            });

            const { data: details, error: detailsError } = await supabase
              .from('exercise_preset_details')
              .insert(detailsToInsert)
              .select();

            if (detailsError) throw detailsError;
            allPresetDetails.push(...details);
          }
        }
      }
    }

    // 3. Return success with created objects
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          mesocycle,
          presetGroups: allPresetGroups,
          presets: allPresets,
          presetDetails: allPresetDetails
        },
        message: "Mesocycle created successfully"
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error creating mesocycle:", error);
    return handleError(error);
  }
};

/**
 * POST /api/planner/microcycle
 *
 * Creates a microcycle (training week) with:
 * 1. Basic microcycle information
 * 2. Exercise preset groups for each day
 * 3. Exercise presets for each group
 * 4. Exercise preset details for each exercise
 * 
 * @param supabase - Supabase client
 * @param url - Request URL object
 * @param req - Request object
 * @param coachId - Coach ID associated with this plan
 * @returns Response with created microcycle and related data
 */
export const postMicrocycle = async (
  supabase: any,
  url: URL,
  req: Request,
  coachId: number | string
): Promise<Response> => {
  try {
    // Parse request body
    let planData = await req.json();
    
    // Normalize parameters to ensure compatibility with both camelCase and snake_case formats
    planData = normalizeParameters(planData);
    
    // Support for nested microcycle object
    if (planData.microcycle) {
      // Extract fields from the nested microcycle object
      const {
        name, description, startDate, endDate, intensity, volume
      } = planData.microcycle;
      
      // Reassign to the main planData object with snake_case keys
      planData.name = name;
      planData.description = description;
      planData.start_date = startDate;
      planData.end_date = endDate;
      planData.intensity = intensity;
      planData.volume = volume;
    }
    
    // Extract microcycle details
    const {
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      mesocycle_id: mesocycleId,
      athlete_group_id: athleteGroupId,
      sessions = []
    } = planData;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      throw new Error("Missing required fields. Name, start date, and end date are required.");
    }

    // 1. Create the microcycle
    const { data: microcycle, error: microcycleError } = await supabase
      .from('microcycles')
      .insert({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        mesocycle_id: mesocycleId,
        coach_id: coachId
      })
      .select()
      .single();

    if (microcycleError) throw microcycleError;

    // Store all created objects
    const allPresetGroups = [];
    const allPresets = [];
    const allPresetDetails = [];

    // 2. Create exercise preset groups, presets, and details for each day
    for (const [dayIndex, session] of sessions.entries()) {
      const {
        name: sessionName,
        description: sessionDescription,
        date,
        exercises = []
      } = session;

      // 2a. Create exercise preset group
      const { data: presetGroup, error: presetGroupError } = await supabase
        .from('exercise_preset_groups')
        .insert({
          name: sessionName,
          description: sessionDescription,
          week: 1, // Microcycle is just one week
          day: dayIndex + 1,
          date,
          coach_id: coachId,
          athlete_group_id: athleteGroupId,
          microcycle_id: microcycle.id
        })
        .select()
        .single();

      if (presetGroupError) throw presetGroupError;
      allPresetGroups.push(presetGroup);

      // 2b. Create exercise presets for this group
      for (const [exerciseIndex, exercise] of exercises.entries()) {
        const {
          exerciseId,
          sets,
          reps,
          weight,
          notes,
          setRestTime,
          repRestTime,
          order,
          supersetId,
          presetOrder,
          presetDetails = []
        } = exercise;

        // Create exercise preset
        const { data: preset, error: presetError } = await supabase
          .from('exercise_presets')
          .insert({
            exercise_preset_group_id: presetGroup.id,
            exercise_id: exerciseId,
            sets,
            reps,
            weight,
            set_rest_time: setRestTime,
            rep_rest_time: repRestTime,
            order: order || exerciseIndex + 1,
            superset_id: supersetId,
            preset_order: presetOrder,
            notes
          })
          .select()
          .single();

        if (presetError) throw presetError;
        allPresets.push(preset);

        // 2c. Create exercise preset details if provided
        if (presetDetails && presetDetails.length > 0) {
          const detailsToInsert = presetDetails.map(detail => ({
            exercise_preset_id: preset.id,
            set_number: detail.setNumber,
            resistance: detail.resistance,
            resistance_unit_id: detail.resistanceUnitId,
            reps: detail.reps,
            distance: detail.distance,
            duration: detail.duration,
            tempo: detail.tempo,
            height: detail.height,
            metadata: detail.metadata
          }));

          const { data: details, error: detailsError } = await supabase
            .from('exercise_preset_details')
            .insert(detailsToInsert)
            .select();

          if (detailsError) throw detailsError;
          allPresetDetails.push(...details);
        }
      }
    }

    // 3. Return success with created objects
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          microcycle,
          presetGroups: allPresetGroups,
          presets: allPresets,
          presetDetails: allPresetDetails
        },
        message: "Microcycle created successfully"
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error creating microcycle:", error);
    return handleError(error);
  }
};

/**
 * GET /api/planner/exercises
 * 
 * Retrieves all exercises with their types for use in the planner.
 * 
 * @param supabase - Supabase client
 * @returns Response with all exercises and their types
 */
export async function getExercisesForPlanner(supabase: SupabaseClient) {
  try {
    console.log("[API] Fetching exercises for planner");
    
    // Fetch exercises with their types
    const { data: exercises, error } = await supabase
      .from("exercises")
      .select(`
        id,
        name,
        description,
        exercise_type (
          id,
          name,
          description
        )
      `)
      .order("name");
    
    if (error) {
      console.error("[API] Error fetching exercises:", error);
      return handleError(error, "database");
    }
    
    if (!exercises || exercises.length === 0) {
      console.log("[API] No exercises found");
      return new Response(
        JSON.stringify({ exercises: [] }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200
        }
      );
    }
    
    console.log("[API] Successfully fetched exercises:", exercises.length);
    
    // Format exercises for frontend
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      type: {
        id: exercise.exercise_type.id,
        name: exercise.exercise_type.name,
        description: exercise.exercise_type.description
      }
    }));
    
    return new Response(
      JSON.stringify({ exercises: formattedExercises }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("[API] Unexpected error in getExercisesForPlanner:", error);
    return handleError(error, "unexpected");
  }
}

/**
 * GET /api/planner/mesocycle/:id
 * 
 * Retrieves a complete mesocycle with all related data
 * 
 * @param supabase - Supabase client
 * @param mesocycleId - ID of the mesocycle to retrieve
 * @returns Response with the complete mesocycle data
 */
export const getMesocycle = async (
  supabase: any,
  mesocycleId: string
): Promise<Response> => {
  try {
    // Fetch the mesocycle
    const { data: mesocycle, error: mesocycleError } = await supabase
      .from('mesocycles')
      .select('*')
      .eq('id', mesocycleId)
      .single();

    if (mesocycleError) throw mesocycleError;
    if (!mesocycle) throw new Error('Mesocycle not found');

    // Get all preset groups related to this mesocycle via microcycles
    const { data: microcycles, error: microcyclesError } = await supabase
      .from('microcycles')
      .select('*')
      .eq('mesocycle_id', mesocycleId)
      .order('start_date');

    if (microcyclesError) throw microcyclesError;

    // Get microcycle IDs
    const microcycleIds = microcycles.map(mc => mc.id);

    // Get all preset groups related to these microcycles
    const { data: presetGroups, error: presetGroupsError } = await supabase
      .from('exercise_preset_groups')
      .select('*')
      .in('microcycle_id', microcycleIds)
      .order('week')
      .order('day');

    if (presetGroupsError) throw presetGroupsError;

    // Get preset group IDs
    const presetGroupIds = presetGroups.map(pg => pg.id);

    // Get all exercise presets within these groups
    const { data: presets, error: presetsError } = await supabase
      .from('exercise_presets')
      .select(`
        *,
        exercises (
          id,
          name,
          description,
          exercise_types (type)
        )
      `)
      .in('exercise_preset_group_id', presetGroupIds)
      .order('preset_order')
      .order('order');

    if (presetsError) throw presetsError;

    // Get preset IDs
    const presetIds = presets.map(p => p.id);

    // Get preset details
    const { data: presetDetails, error: presetDetailsError } = await supabase
      .from('exercise_preset_details')
      .select('*')
      .in('exercise_preset_id', presetIds)
      .order('set_number');

    if (presetDetailsError) throw presetDetailsError;

    // Organize data into a structured response
    // Group preset details by preset ID
    const detailsByPresetId = presetDetails.reduce((acc, detail) => {
      const presetId = detail.exercise_preset_id;
      if (!acc[presetId]) acc[presetId] = [];
      acc[presetId].push(detail);
      return acc;
    }, {});

    // Group presets by preset group ID and add their details
    const presetsByGroupId = presets.reduce((acc, preset) => {
      const groupId = preset.exercise_preset_group_id;
      if (!acc[groupId]) acc[groupId] = [];
      
      // Add details to preset
      const presetWithDetails = {
        ...preset,
        presetDetails: detailsByPresetId[preset.id] || []
      };
      
      acc[groupId].push(presetWithDetails);
      return acc;
    }, {});

    // Group preset groups by microcycle
    const groupsByMicrocycle = presetGroups.reduce((acc, group) => {
      const microId = group.microcycle_id;
      if (!acc[microId]) acc[microId] = [];
      
      // Add exercises to group
      const groupWithExercises = {
        ...group,
        exercises: presetsByGroupId[group.id] || []
      };
      
      acc[microId].push(groupWithExercises);
      return acc;
    }, {});

    // Build complete microcycles with their sessions
    const completeMicrocycles = microcycles.map(micro => ({
      ...micro,
      sessions: groupsByMicrocycle[micro.id] || []
    }));

    // Return the complete mesocycle structure
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          mesocycle,
          weeks: completeMicrocycles
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error fetching mesocycle:", error);
    return handleError(error);
  }
};

/**
 * GET /api/planner/microcycle/:id
 * 
 * Retrieves a complete microcycle with all related data
 * 
 * @param supabase - Supabase client
 * @param microcycleId - ID of the microcycle to retrieve
 * @returns Response with the complete microcycle data
 */
export const getMicrocycle = async (
  supabase: any,
  microcycleId: string
): Promise<Response> => {
  try {
    // Fetch the microcycle
    const { data: microcycle, error: microcycleError } = await supabase
      .from('microcycles')
      .select('*')
      .eq('id', microcycleId)
      .single();

    if (microcycleError) throw microcycleError;
    if (!microcycle) throw new Error('Microcycle not found');

    // Get all preset groups for this microcycle
    const { data: presetGroups, error: presetGroupsError } = await supabase
      .from('exercise_preset_groups')
      .select('*')
      .eq('microcycle_id', microcycleId)
      .order('day');

    if (presetGroupsError) throw presetGroupsError;

    // Get preset group IDs
    const presetGroupIds = presetGroups.map(pg => pg.id);

    // Get all exercise presets within these groups
    const { data: presets, error: presetsError } = await supabase
      .from('exercise_presets')
      .select(`
        *,
        exercises (
          id,
          name,
          description,
          exercise_types (type)
        )
      `)
      .in('exercise_preset_group_id', presetGroupIds)
      .order('preset_order')
      .order('order');

    if (presetsError) throw presetsError;

    // Get preset IDs
    const presetIds = presets.map(p => p.id);

    // Get preset details
    const { data: presetDetails, error: presetDetailsError } = await supabase
      .from('exercise_preset_details')
      .select('*')
      .in('exercise_preset_id', presetIds)
      .order('set_number');

    if (presetDetailsError) throw presetDetailsError;

    // Group preset details by preset ID
    const detailsByPresetId = presetDetails.reduce((acc, detail) => {
      const presetId = detail.exercise_preset_id;
      if (!acc[presetId]) acc[presetId] = [];
      acc[presetId].push(detail);
      return acc;
    }, {});

    // Group presets by preset group ID and add their details
    const presetsByGroupId = presets.reduce((acc, preset) => {
      const groupId = preset.exercise_preset_group_id;
      if (!acc[groupId]) acc[groupId] = [];
      
      // Add details to preset
      const presetWithDetails = {
        ...preset,
        presetDetails: detailsByPresetId[preset.id] || []
      };
      
      acc[groupId].push(presetWithDetails);
      return acc;
    }, {});

    // Add exercises to each preset group
    const sessionsWithExercises = presetGroups.map(group => ({
      ...group,
      exercises: presetsByGroupId[group.id] || []
    }));

    // Return the complete microcycle structure
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          microcycle,
          sessions: sessionsWithExercises
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error fetching microcycle:", error);
    return handleError(error);
  }
}; 