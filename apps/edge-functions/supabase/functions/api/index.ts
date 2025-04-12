import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { corsHeaders, handleError } from './utils';
import { getAthletes, createAthlete } from './athletes';
import { getUserStatus } from './users';

// Toggle for authentication (default is enabled)
const AUTH_ENABLED = false;

// Helper function to create Supabase client
const createSupabaseClient = (req: Request) => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );
};

// Helper function to extract table name and parameters from URL
const extractPathParams = (url: string) => {
  const taskPattern = new URLPattern({ pathname: "/api/:table/:id?" });
  const matchingPath = taskPattern.exec(url);
  const table = matchingPath?.pathname.groups.table;
  const id = matchingPath?.pathname.groups.id;
  const queryParams = new URLSearchParams(new URL(url).search);
  const params = Object.fromEntries(queryParams.entries());
  return { table, id, params };
};

// GET /api/:table/:id - Get one item by ID
const getItem = async (supabase: any, table: string, id: string) => {
  const { data, error } = await supabase.from(table).select("*").eq("id", id);
  if (error) {
    return handleError(error);
  }
  return new Response(JSON.stringify({ [table.slice(0, -1)]: data[0] }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

// GET /api/:table - Get all items
const getAllItems = async (supabase: any, table: string, params: Record<string, string>) => {
  let query = supabase.from(table).select("*");
  for (const [key, value] of Object.entries(params)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) {
    return handleError(error);
  }
  return new Response(JSON.stringify({ [table]: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

// POST /api/:table - Create new item(s)
const createItem = async (supabase: any, table: string, req: Request) => {
  try {
    const newItems = await req.json(); 

    // Handle both single object and array of objects
    const itemsToInsert = Array.isArray(newItems) ? newItems : [newItems]; 

    const { data, error } = await supabase.from(table).insert(itemsToInsert).select();
    if (error) {
      return handleError(error);
    }

    return new Response(JSON.stringify({ [table.slice(0, -1)]: data }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error); // Handle potential JSON parsing errors
  }
};

// PUT /api/:table - Update existing item(s)
const updateItem = async (supabase: any, table: string, req: Request) => {
  try {
    const updatedItems = await req.json();

    // Handle both single object and array of objects
    const itemsToUpdate = Array.isArray(updatedItems) ? updatedItems : [updatedItems];

    //Using upsert for efficient batch update/insert
    //Update records if they have an id matching an existing record.
    //Insert records if the id is missing or doesn't match any record.
    const { data, error } = await supabase.from(table).upsert(itemsToUpdate, { onConflict: 'id' }).select();

    if (error) {
      return handleError(error);
    }

    return new Response(JSON.stringify({ [table.slice(0, -1)]: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};

// DELETE /api/:table/:id - Delete an item
const deleteItem = async (supabase: any, table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    return handleError(error);
  }
  return new Response(null, { status: 204, headers: corsHeaders });
};

/**
 * POST /api/dashboard/exercisesDetail
 *
 * Creates exercise preset details for a given training session group.
 * 1) Validates the input.
 * 2) Checks if the session belongs to the given athleteId.
 * 3) Ensures no existing details for that session (should not happen).
 * 4) Inserts all new details in a single call (all or nothing).
 */
export const postExercisesDetail = async (
  supabase: any,
  url: URL,
  athleteId: number | string
): Promise<Response> => {
  try {
    // 1) Parse and validate request body
    const body = await parseRequestBody(url);
    const { exercise_training_session_id, exercisesDetail } = body;

    if (
      !exercise_training_session_id ||
      !Array.isArray(exercisesDetail) ||
      exercisesDetail.length === 0
    ) {
      throw new Error("Invalid request data. Please provide a session ID and a non-empty array of exercisesDetail.");
    }

    // 2) Check if the training session belongs to the athlete
    const { data: session, error: sessionError } = await supabase
      .from("exercise_training_session")
      .select("id, athlete_id")
      .eq("id", exercise_training_session_id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      throw new Error("Training session not found.");
    }
    if (session.athlete_id !== athleteId) {
      throw new Error("Not authorized to access this training session.");
    }

    // 3) Check if there are already details for this session
    const { data: existingDetails, error: existingError } = await supabase
      .from("exercise_preset_details")
      .select("id")
      .eq("exercise_training_session_id", exercise_training_session_id);

    if (existingError) throw existingError;
    if (existingDetails.length > 0) {
      throw new Error("Exercise details already exist for this session (unexpected).");
    }

    // 4) Insert new details (all or nothing)
    // Make sure each detail references the correct exercise_training_session_id
    const detailsToInsert = exercisesDetail.map((detail: any) => ({
      ...detail,
      exercise_training_session_id,
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("exercise_preset_details")
      .insert(detailsToInsert);

    if (insertError) throw insertError;

    // Return success
    return new Response(
      JSON.stringify({ success: true, data: insertedData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * PUT /api/dashboard/exercisesDetail
 *
 * Updates exercise preset details for a given training session group.
 * 1) Validates the input.
 * 2) Checks if the session belongs to the given athleteId.
 * 3) Ensures each provided detail ID exists and belongs to the session.
 * 4) Performs an upsert or update in one call (all or nothing).
 */
export const putExercisesDetail = async (
  supabase: any,
  url: URL,
  athleteId: number | string
): Promise<Response> => {
  try {
    // 1) Parse and validate request body
    const body = await parseRequestBody(url);
    const { exercise_training_session_id, exercisesDetail } = body;

    if (
      !exercise_training_session_id ||
      !Array.isArray(exercisesDetail) ||
      exercisesDetail.length === 0
    ) {
      throw new Error("Invalid request data. Please provide a session ID and a non-empty array of exercisesDetail.");
    }

    // 2) Check if the training session belongs to the athlete
    const { data: session, error: sessionError } = await supabase
      .from("exercise_training_session")
      .select("id, athlete_id")
      .eq("id", exercise_training_session_id)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      throw new Error("Training session not found.");
    }
    if (session.athlete_id !== athleteId) {
      throw new Error("Not authorized to access this training session.");
    }

    // 3) Verify that each detail ID is valid and belongs to this session
    const detailIds = exercisesDetail
      .map((detail: any) => detail.id)
      .filter((id: any) => !!id);

    if (detailIds.length !== exercisesDetail.length) {
      throw new Error("One or more exercise details are missing an ID, which should not happen in PUT.");
    }

    // Check if those detail IDs exist in the DB for this session
    const { data: existingDetails, error: existingError } = await supabase
      .from("exercise_preset_details")
      .select("id")
      .in("id", detailIds)
      .eq("exercise_training_session_id", exercise_training_session_id);

    if (existingError) throw existingError;
    if (existingDetails.length !== detailIds.length) {
      throw new Error("Some provided exercise details do not exist in this session (unexpected).");
    }

    // 4) Update details (all or nothing). Using upsert with onConflict on "id" can simplify the operation:
    const detailsToUpdate = exercisesDetail.map((detail: any) => ({
      ...detail,
      exercise_training_session_id,
    }));

    //Strictly updates exsisted rows:
    const { data: updatedData, error: updateError } = await supabase
      .from("exercise_preset_details")
      .update(detailsToUpdate)
      .in("id", detailIds);
      
    // Alternatively, if you want to create for non existing rows:
    // .upsert(detailsToUpdate, { onConflict: "id" }); 

    if (updateError) throw updateError;

    // Return success
    return new Response(
      JSON.stringify({ success: true, data: updatedData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return handleError(error);
  }
};


/**
 * GET /api/dashboard/exercisesInit
 *
 * This function initializes the dashboard by:
 * - Checking if the athlete has a training session today.
 * - Retrieving all exercises, preset groups, and training sessions for the athlete.
 */
export const getExercisesInit = async (
  supabase: any,
  url: URL,
  athleteId: number | string,
  athleteGroupId: number | string,
  timezone: string
): Promise<Response> => {
  // 1) Compute the date range for "the last 7 days"
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]; // "YYYY-MM-DD"

  // 2) Check for the latest ongoing (unfinished) session
  // There's some issue including exercise_presets_groups here, so excluded
  const { data: ongoingSessions, error: ongoingError } = await supabase
  .from("exercise_training_sessions")
  .select(`
    *,
    exercise_preset_groups (
      *,
      exercise_presets (
        *,
        exercises (*),
        exercise_training_details (*)
      )
    )
  `)
  .eq("athlete_id", athleteId)
  .eq("status", "ongoing")
  .order("date_time", { ascending: false })
  .limit(1);



  if (ongoingError) {
    throw new Error(ongoingError.message);
  }
  if (ongoingSessions && ongoingSessions.length > 0) {
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          session: {
            type: "ongoing",
            details: ongoingSessions[0],
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          timezone: timezone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 3) Check for today's assigned session using the provided timezone
  // The goal here is to provide exercise_preset_details for FE to Post create exercise_preset_details
  const localNowStr = new Date().toLocaleString("en-US", { timeZone: timezone });
  const localNow = new Date(localNowStr); // "now" in the user's local time
  const localYear = localNow.getFullYear();
  const localMonth = localNow.getMonth(); // 0-based index
  const localDay = localNow.getDate();
  const startOfDayLocal = new Date(localYear, localMonth, localDay, 0, 0, 0, 0);
  const endOfDayLocal = new Date(localYear, localMonth, localDay, 23, 59, 59, 999);
  const startOfDayISO = startOfDayLocal.toISOString();
  const endOfDayISO = endOfDayLocal.toISOString();

  const { data: todaysSessions, error: todaysError } = await supabase
    .from("exercise_training_sessions")
    .select(`
      *,
      exercise_preset_groups (
        *,
        exercise_presets (
          *,
          exercises (*),
          exercise_preset_details (*)
        )
      )
    `)
    .eq("athlete_id", athleteId)
    .gte("date_time", startOfDayISO)
    .lte("date_time", endOfDayISO)
    .limit(1);

  if (todaysError) {
    throw new Error(todaysError.message);
  }
  if (todaysSessions && todaysSessions.length > 0) {
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          session: {
            type: "assigned",
            details: todaysSessions[0],
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          timezone: timezone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 4) If no ongoing or today's session, get the latest completed session from the last 7 days
  const { data: completedSessions, error: completedError } = await supabase
    .from("exercise_training_sessions")
    .select(`
      *,
      exercise_preset_groups (
        *,
        exercise_presets (
          *,
          exercises (*),
          exercise_training_details (*)
        )
      )
    `)
    .eq("athlete_id", athleteId)
    .eq("status", "completed")
    .gte("date_time", sevenDaysAgoStr)
    .order("date_time", { ascending: false })
    .limit(1);

  if (completedError) {
    throw new Error(completedError.message);
  }
  if (completedSessions && completedSessions.length > 0) {
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          session: {
            type: "completed",
            details: completedSessions[0],
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          timezone: timezone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5) If no session is found at all, return a consistent response with null values.
  return new Response(
    JSON.stringify({
      status: "success",
      data: {
        session: {
          type: null,
          details: null,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        timezone: timezone,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
};
/**
 * Response Schema
{
  "status": "success",
  "data": {
    "session": {
      "type": "ongoing" | "assigned" | "completed" | null,
      "details": { 
        exercise_training_sessions(
          *,
          exercise_preset_groups (
            *,
            exercise_presets (
              *,
              exercises (*),
              exercise_training_details (*)
            )
          )
        )
      } | null
    }
  },
  "metadata": {
    "timestamp": "ISO8601 timestamp",
    "timezone": "provided timezone"
  }
} 

*/

/**
 * POST /api/onboarding/user
 *
 * Handles user onboarding by creating or updating a user in the 'users' table with data from Clerk.
 * 1) Validates the input data
 * 2) Upserts user data into the users table with the clerk_id
 * 3) Returns success or error
 */
export const postOnboardingUser = async (
  supabase: any,
  url: URL,
  req: Request
): Promise<Response> => {
  try {
    // Parse and validate request body
    const userData = await req.json();
    
    // Extract necessary fields from userData
    const {
      clerk_id,
      username,
      email,
      first_name,
      last_name,
      role,
      birthday,
      height,
      weight,
      training_history,
      training_goals,
      team_name,
      sport_focus,
      subscription_status,
      events,
      metadata
    } = userData;

    // Validate required fields
    if (!clerk_id || !email) {
      throw new Error("Missing required fields: clerk_id and email are required");
    }

    // Insert or update user in users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        clerk_id,
        username,
        email,
        first_name,
        last_name,
        role,
        birthday,
        height,
        weight,
        training_history: training_history,
        training_goals,
        team_name,
        sport_focus,
        subscription_status,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
        metadata
      })
      .select();

    if (error) throw error;

    // Create athlete record if role is athlete
    if (role === 'athlete') {
      // Get the user ID first from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerk_id)
        .single();
        
      if (userError) throw userError;
      
      // Create athlete record with user ID and events
      const { error: athleteError } = await supabase
        .from('athletes')
        .upsert({
          user_id: userData.id,
          events: events || [], // Store selected events
          // Add additional athlete-specific fields here if needed
        });
        
      if (athleteError) throw athleteError;
    }

    // Similar logic for coach role if needed
    if (role === 'coach') {
      // Get the user ID first from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerk_id)
        .single();
        
      if (userError) throw userError;
      
      // Create coach record with user ID
      const { error: coachError } = await supabase
        .from('coaches')
        .upsert({
          user_id: userData.id,
          // Add additional coach-specific fields here if needed
        });
        
      if (coachError) throw coachError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data || {},
        message: "User onboarding completed successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * Creates the events table and seeds it with initial data if it doesn't exist
 */
export const createAndSeedEventsTable = async (
  supabase: any
): Promise<boolean> => {
  try {
    console.log("Checking if events table needs to be created...");
    
    // Create events table if it doesn't exist
    const { error: createError } = await supabase.rpc('create_events_table_if_not_exists');
    if (createError) {
      // Table might already exist or we don't have rpc access
      // Let's try a direct approach to seed the table if it exists
      console.log("Using direct approach to seed events table...");
    }
    
    // Check if the table is empty
    const { data: eventCount, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error checking events count:", countError);
      return false;
    }
    
    // If there are already events, don't seed
    if (eventCount && eventCount.length > 0) {
      console.log("Events table already has data");
      return true;
    }
    
    console.log("Seeding events table with initial data...");
    
    // Sample track and field events data
    const eventsData = [
      // Track events
      { name: '100m', category: 'track', description: '100 meters sprint' },
      { name: '200m', category: 'track', description: '200 meters sprint' },
      { name: '400m', category: 'track', description: '400 meters sprint' },
      { name: '800m', category: 'track', description: '800 meters middle distance' },
      { name: '1500m', category: 'track', description: '1500 meters middle distance' },
      { name: '5000m', category: 'track', description: '5000 meters long distance' },
      { name: '10000m', category: 'track', description: '10000 meters long distance' },
      { name: '110m Hurdles', category: 'track', description: '110 meters hurdles' },
      { name: '400m Hurdles', category: 'track', description: '400 meters hurdles' },
      { name: '3000m Steeplechase', category: 'track', description: '3000 meters steeplechase' },
      
      // Field events
      { name: 'High Jump', category: 'field', description: 'High jump field event' },
      { name: 'Pole Vault', category: 'field', description: 'Pole vault field event' },
      { name: 'Long Jump', category: 'field', description: 'Long jump field event' },
      { name: 'Triple Jump', category: 'field', description: 'Triple jump field event' },
      { name: 'Shot Put', category: 'field', description: 'Shot put throwing event' },
      { name: 'Discus Throw', category: 'field', description: 'Discus throw field event' },
      { name: 'Hammer Throw', category: 'field', description: 'Hammer throw field event' },
      { name: 'Javelin Throw', category: 'field', description: 'Javelin throw field event' },
      
      // Combined events
      { name: 'Decathlon', category: 'combined', description: '10 combined events for men' },
      { name: 'Heptathlon', category: 'combined', description: '7 combined events for women' }
    ];
    
    // Insert sample data
    const { error: insertError } = await supabase
      .from('events')
      .insert(eventsData);
      
    if (insertError) {
      console.error("Error seeding events table:", insertError);
      return false;
    }
    
    console.log("Events table seeded successfully");
    return true;
  } catch (error) {
    console.error("Error creating/seeding events table:", error);
    return false;
  }
};

/**
 * GET /api/events
 *
 * Fetches all track and field events from the database
 * Groups events by their category: track, field, combined
 */
export const getEvents = async (
  supabase: any
): Promise<Response> => {
  try {
    console.log("Fetching events from database...");
    
    // Try to create and seed the events table if needed
    await createAndSeedEventsTable(supabase);
    
    // Fetch all events from the events table
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
    
    console.log(`Found ${events?.length || 0} events`);
    
    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({
          status: "success",
          data: { track: [], field: [], combined: [] },
          message: "No events found"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Group events by category
    const groupedEvents = events.reduce((acc: any, event: any) => {
      const category = event.category?.toLowerCase() || "track";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(event);
      return acc;
    }, { track: [], field: [], combined: [] });

    return new Response(
      JSON.stringify({
        status: "success",
        data: groupedEvents
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in getEvents:", error);
    return handleError(error);
  }
};

/**
 * Main request handler
 *
 * This function routes the incoming GET request to the corresponding handler
 * based on the request pathname.
 */
Deno.serve(async (req) => {
  const { url, method } = req;
  const parsedUrl = new URL(url); // Parse the URL
  const pathname = parsedUrl.pathname; // Extract the pathname
   // Handle CORS preflight
   if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
     
    if(AUTH_ENABLED){
      // -------------------------
      // Authentication section
      // -------------------------
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing Authorization header" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Extract the token
      const token = authHeader.replace("Bearer ", "");
      // Use an anon client to verify the token
      const supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser(token);
      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const userId = authData.user.id;
    }
    
    const userId = 1;
    const timezone = "Europe/London";

    // Create a Supabase client (service role or secure client) for subsequent queries
    const supabase = createSupabaseClient(req);
    // -------------------------
    // Routing section
    // -------------------------
    // Handle events endpoint - place this before other routes
    if (pathname === "/api/events") {
      if (method !== "GET") {
        return new Response(`${method} Method not allowed for events endpoint`, { 
          status: 405,
          headers: corsHeaders
        });
      }
      return await getEvents(supabase);
    }
    
    // Handle onboarding endpoints
    if (pathname === "/api/onboarding/user") {
      if (method !== "POST") {
        return new Response(`${method} Method not allowed for onboarding`, { status: 405 });
      }
      return await postOnboardingUser(supabase, parsedUrl, req);
    }
    
    // Handle dashboard endpoints
    if (pathname.includes("/api/dashboard")) {
      // Retrieve the athlete record using the authenticated user id.
      const { data: athleteData, error: athleteError } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (athleteError || !athleteData) {
        return new Response(
          JSON.stringify({ error: "Athlete not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      const athleteId = athleteData.id;
      const athleteGroupId = athleteData.athlete_group_id

      if (pathname === "/api/dashboard/exercisesInit") {
        if (method !== "GET") {
          return new Response(`${method} Method not allowed for dashboard`, { status: 405 });
        }
        // Pass the parsedUrl and athleteId to the handler
        return await getExercisesInit(supabase, parsedUrl, athleteId, athleteGroupId, timezone);
      }

      if (pathname === "/api/dashboard/exercisesDetail") {
        if(method == "Post"){
          return await postExercisesDetail(supabase, parsedUrl, athleteId)
        }
        if(method == "Put"){
          return await putExercisesDetail(supabase, parsedUrl, athleteId)
        }
        //No other method allowed
        return new Response(`${method} Method not allowed for dashboard`, { status: 405 });
      }
    }

    // Handle athletes endpoints
    if (pathname === "/api/athletes") {
      if (method === "GET") {
        return await getAthletes(supabase, params);
      }
      if (method === "POST") {
        return await createAthlete(supabase, req);
      }
      return new Response(`${method} Method not allowed for athletes endpoint`, { 
        status: 405,
        headers: corsHeaders
      });
    }

    // Handle user status endpoint
    if (pathname.startsWith("/api/users/") && pathname.endsWith("/status")) {
      if (method !== "GET") {
        return new Response(`${method} Method not allowed for user status`, { 
          status: 405,
          headers: corsHeaders
        });
      }
      const clerkId = pathname.split("/")[3]; // Extract clerk_id from URL
      return await getUserStatus(supabase, clerkId);
    }

    // Handle generic /api/dashboard/:table endpoints
    const { table, id, params } = extractPathParams(url);
    if (!table) {
      return new Response(`Table Not Found`, { status: 404 });
    }

    switch (method) {
      case "GET":
        return id
          ? await getItem(supabase, table, id)
          : await getAllItems(supabase, table, params);
      case "POST":
        return await createItem(supabase, table, req);
      case "PUT":
        return await updateItem(supabase, table, req);
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  } catch (error: any) {
    return handleError(error);
  }
});