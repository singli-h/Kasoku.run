// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// @deno-types="https://deno.land/std@0.188.0/http/server.ts"
import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.23.0"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { corsHeaders, handleError } from './utils.ts';
import { getAthletes, createAthlete } from './athletes.ts';
import { getUserStatus, getUserProfile } from './users.ts';
import { 
  postMesocycle, 
  postMicrocycle, 
  getExercisesForPlanner, 
  getMesocycle, 
  getMicrocycle 
} from './planner.ts';

// Toggle for authentication (default is enabled)
const AUTH_ENABLED = true;
// Type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve: typeof serve;
  };
  
  class URLPattern {
    constructor(init: { pathname: string });
    exec(input: string): { pathname: { groups: Record<string, string> } } | null;
  }
}

// Type definitions for common parameters and records
type AthleteId = string | number;
type CoachId = string;

interface UserRecord {
  id: string;
  clerk_id: string;
  email: string;
  metadata?: {
    role?: string;
  };
}

interface CoachRecord {
  id: string;
  user_id: string;
}

interface AthleteRecord {
  id: string;
  user_id: string;
  athlete_group_id?: string;
}

// Type definitions for user data
interface UserData {
  userId: string;
  athleteId?: string;
  coachId?: string;
  timezone?: string;
}

// Default user data - Properly initialized with null values
const DEFAULT_USER_DATA: UserData = {
  userId: '',
  athleteId: undefined,
  coachId: undefined,
  timezone: 'UTC'
};

// Helper function to verify user and get role-specific ID
async function getUserRoleData(supabase: SupabaseClient, clerkId: string): Promise<UserData> {
  try {
    console.log("[getUserRoleData] Fetching user data for clerk_id:", clerkId);
    
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, metadata, timezone")
      .eq("clerk_id", clerkId)
      .single();

    if (userError || !userData) {
      console.error("[getUserRoleData] Error fetching user:", userError);
      throw new Error("User not found");
    }

    console.log("[getUserRoleData] Found user:", { id: userData.id, role: userData.metadata?.role });

    // Ensure userId is always a string
    const result: UserData = { 
      userId: String(userData.id),
      timezone: userData.timezone || "UTC"
    };
    const role = userData.metadata?.role;

    if (role === 'athlete') {
      console.log("[getUserRoleData] Fetching athlete data for user_id:", userData.id);
      const { data: athleteData } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", userData.id)
        .single();
      if (athleteData) {
        result.athleteId = String(athleteData.id);
        console.log("[getUserRoleData] Found athlete ID:", result.athleteId);
      }
    } else if (role === 'coach') {
      console.log("[getUserRoleData] Fetching coach data for user_id:", userData.id);
      const { data: coachData } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", userData.id)
        .single();
      if (coachData) {
        result.coachId = String(coachData.id);
        console.log("[getUserRoleData] Found coach ID:", result.coachId);
      }
    }

    console.log("[getUserRoleData] Final user data:", result);
    return result;
  } catch (error) {
    console.error("[getUserRoleData] Error:", error);
    throw new Error(`Failed to get user role data: ${error.message}`);
  }
}

// Helper function to create standardized success response
function createSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify({
      status: "success",
      data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Helper function to parse request body from a URL
const parseRequestBody = async (url: URL): Promise<any> => {
  const body = await (new Request(url)).json();
  return body;
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
const getItem = async (supabase: SupabaseClient, table: string, id: string) => {
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
const getAllItems = async (supabase: SupabaseClient, table: string, params: Record<string, string>) => {
  try {
    let query = supabase.from(table).select("*");
    for (const [key, value] of Object.entries(params)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({
        status: "success",
        data: { [table]: data },
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return handleError(error);
  }
};

// POST /api/:table - Create new item(s)
const createItem = async (supabase: SupabaseClient, table: string, req: Request) => {
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
const updateItem = async (supabase: SupabaseClient, table: string, req: Request) => {
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
const deleteItem = async (supabase: SupabaseClient, table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    return handleError(error);
  }
  return new Response(null, { status: 204, headers: corsHeaders });
};

// Update the getCoachIdFromClerkId return type
export async function getCoachIdFromClerkId(clerkId: string): Promise<string> {
  if (!clerkId) {
    throw new Error("Missing clerkId parameter");
  }

  try {
    // Use the admin client for this privileged operation
    const userData = await getUserRoleData(adminSupabase, clerkId);
    
    if (!userData.coachId) {
      throw new Error("User is not a coach or coach record not found");
    }

    return userData.coachId;
  } catch (error) {
    throw error;
  }
}

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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
  // Log timezone for debugging
  console.log(`[getExercisesInit] Using timezone: ${timezone}`);

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
    
    // Debug - Log the full input data
    console.log("Received user data for onboarding:", JSON.stringify(userData, null, 2));
    
    // Extract necessary fields from userData
    const {
      clerk_id,
      username,
      email,
      first_name,
      last_name,
      role,
      birthdate,
      timezone,
      athlete_height,
      athlete_weight,
      athlete_training_history,
      athlete_training_goals,
      coach_specialization,
      coach_sport_focus,
      coach_experience,
      coach_philosophy,
      athlete_events,
      subscription_status,
      metadata
    } = userData;

    // Debug - Log extracted fields
    console.log("Extracted athlete fields:", { 
      athlete_height, 
      athlete_weight, 
      athlete_training_history, 
      athlete_training_goals,
      athlete_events: Array.isArray(athlete_events) ? `${athlete_events.length} events` : athlete_events
    });

    // Validate required fields
    if (!clerk_id || !email) {
      console.error("Missing required fields for onboarding:", {
        hasClerkId: !!clerk_id,
        hasEmail: !!email,
        requestDataSample: JSON.stringify({
          clerk_id,
          email,
          first_name,
          last_name
        })
      });
      throw new Error(`Missing required fields: clerk_id and email are required. Got clerk_id: ${!!clerk_id}, email: ${!!email}`);
    }

    // Store role in metadata but don't use it as a column in users table
    const updatedMetadata = {
      ...metadata,
      role: role // Ensure the role is stored in metadata
    };

    console.log("Updating user with onboarding_completed: true");
    
    // First, check if the user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerk_id)
      .single();
      
    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error finding user:", findError);
      throw findError;
    }
    
    let userRecord: UserRecord | null = null;
    
    if (existingUser) {
      console.log(`User with clerk_id ${clerk_id} found. Updating existing record.`);
      const { data, error } = await supabase
        .from('users')
        .update({
          username,
          first_name,
          last_name,
          birthdate,
          timezone: timezone || "UTC",
          subscription_status,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
          metadata: updatedMetadata
        })
        .eq('clerk_id', clerk_id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating existing user:", error);
        throw error;
      }
      
      if (isUserRecord(data)) {
        userRecord = data;
      }
    } else {
      console.log(`User with clerk_id ${clerk_id} not found. This shouldn't happen. Using email as fallback.`);
      // This shouldn't happen, but as a fallback, we'll try to find by email
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, clerk_id')
        .eq('email', email)
        .single();
        
      if (emailError && emailError.code !== 'PGRST116') {
        console.error("Error finding user by email:", emailError);
        throw emailError;
      }
      
      if (userByEmail) {
        console.log(`User with email ${email} found. Updating existing record.`);
        // User exists by email, update their record and set clerk_id
        const { data, error } = await supabase
          .from('users')
          .update({
            clerk_id, // Ensure clerk_id is set
            username,
            first_name,
            last_name,
            birthdate,
            timezone: timezone || "UTC",
            subscription_status,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
            metadata: updatedMetadata
          })
          .eq('email', email)
          .select();
          
        if (error) {
          console.error("Error updating existing user by email:", error);
          throw error;
        }
        
        if (isUserRecord(data)) {
          userRecord = data;
        }
      } else {
        console.error("No user found with clerk_id or email. This should not happen.");
        throw new Error("User not found. This should not happen during onboarding.");
      }
    }

    // Get the user ID from the users table
    let userId = userRecord?.id;
    if (!userId) {
      const { data: retrievedUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerk_id)
        .single();
        
      if (userError) {
        console.error("Error fetching user ID:", userError);
        throw userError;
      }
      
      userId = String((retrievedUser as { id: number }).id);
    }
    
    console.log(`Creating/updating athlete record for user ID: ${userId}`);
    
    // Debug - Log athlete data being inserted
    const athleteDataToInsert = {
      user_id: userId,
      height: athlete_height || 0,
      weight: athlete_weight || 0,
      training_goals: athlete_training_goals || '',
      experience: athlete_training_history || '',
      events: athlete_events || []
    };
    
    console.log("Athlete data being inserted:", JSON.stringify(athleteDataToInsert, null, 2));
    
    // Always create/update the athlete record with all athlete-specific fields
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .upsert(athleteDataToInsert)
      .select();
      
    if (athleteError) {
      console.error("Error creating/updating athlete record:", athleteError);
      throw athleteError;
    }

    console.log("Successfully created/updated athlete record:", athleteData?.[0]?.id);
    
    // Create or update coach record if role is coach
    if (role === 'coach') {
      console.log(`Creating/updating coach record for user ID: ${userId}`);
      const coachDataToInsert = {
        user_id: userId,
        sport_focus: coach_sport_focus || '', 
        speciality: coach_specialization || '', 
        philosophy: coach_philosophy || '',
        experience: coach_experience || ''
      };
      
      console.log("Coach data being inserted:", JSON.stringify(coachDataToInsert, null, 2));
      
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .upsert(coachDataToInsert)
        .select();
        
      if (coachError) {
        console.error("Error creating/updating coach record:", coachError);
        throw coachError;
      }
      
      console.log("Successfully created/updated coach record:", coachData?.[0]?.id);
    }

    // Double-check that onboarding_completed is set to true
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error("Error updating onboarding completion status:", updateError);
    }

    // Prepare the full response data
    const responseData = {
      success: true,
      data: {
        user: userRecord || {},
        athlete: athleteData?.[0] || {}
      },
      message: "User onboarding completed successfully"
    };
    
    console.log("Onboarding successful, returning response:", JSON.stringify(responseData, null, 2));

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in postOnboardingUser:", error);
    return new Response(
      JSON.stringify({ 
        status: "error",
        error: error.message || "An unexpected error occurred during onboarding" 
      }),
      {
        status: error.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
 * GET /api/dashboard/weeklyOverview
 *
 * Returns weekly data for the dashboard overview.
 * For now, this returns mock data, but in the future it should:
 * - Calculate weekly progress stats from the athlete's training sessions
 */
export const getWeeklyOverview = async (
  supabase: any,
  url: URL,
  athleteId: number | string
): Promise<Response> => {
  try {
    // Mock data for the weekly overview
    const mockWeeklyData = [
      {
        title: "Training Volume",
        stat: "12,500 kg",
        progress: 75
      },
      {
        title: "Training Sessions",
        stat: "4/5",
        progress: 80
      },
      {
        title: "Calories Burned",
        stat: "3,621",
        progress: 65
      },
      {
        title: "Completed Exercises",
        stat: "24/28",
        progress: 85
      }
    ];

    // In a real implementation, we would:
    // 1. Calculate the start and end dates for the current week
    // 2. Query the database for training sessions in this date range
    // 3. Calculate volume, sessions completed, etc.
    // 4. Format the data for the front-end

    return new Response(
      JSON.stringify({
        status: "success",
        data: mockWeeklyData,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return handleError(error);
  }
};

// Rename the dashboard getMesocycle to avoid conflict
export const getDashboardMesocycle = async (
  supabase: any,
  url: URL,
  athleteId: AthleteId
): Promise<Response> => {
  try {
    // Mock mesocycle data
    const mockMesocycle = {
      id: "meso123",
      name: "Summer Strength Cycle",
      startDate: "2023-07-01",
      endDate: "2023-08-26",
      status: "active",
      weeks: [
        {
          name: "Hypertrophy Week 1",
          totalVolume: 10500,
          intensity: "65",
          mainObjectives: "Volume, Muscle Growth",
          notes: "Focus on time under tension and mind-muscle connection",
          progression: [
            { name: "Mon", volume: 2500, intensity: 65 },
            { name: "Tue", volume: 0, intensity: 0 },
            { name: "Wed", volume: 3000, intensity: 70 },
            { name: "Thu", volume: 0, intensity: 0 },
            { name: "Fri", volume: 2800, intensity: 65 },
            { name: "Sat", volume: 2200, intensity: 60 },
            { name: "Sun", volume: 0, intensity: 0 }
          ]
        },
        {
          name: "Hypertrophy Week 2",
          totalVolume: 11200,
          intensity: "70",
          mainObjectives: "Volume, Progressive Overload",
          notes: "Increase weight by 5% from last week where possible",
          progression: [
            { name: "Mon", volume: 2700, intensity: 70 },
            { name: "Tue", volume: 0, intensity: 0 },
            { name: "Wed", volume: 3200, intensity: 75 },
            { name: "Thu", volume: 0, intensity: 0 },
            { name: "Fri", volume: 3000, intensity: 70 },
            { name: "Sat", volume: 2300, intensity: 65 },
            { name: "Sun", volume: 0, intensity: 0 }
          ]
        },
        {
          name: "Strength Week 1",
          totalVolume: 9500,
          intensity: "80",
          mainObjectives: "Strength, Power",
          notes: "Lower volume, increase intensity. Focus on compound movements.",
          progression: [
            { name: "Mon", volume: 2200, intensity: 80 },
            { name: "Tue", volume: 0, intensity: 0 },
            { name: "Wed", volume: 2800, intensity: 85 },
            { name: "Thu", volume: 0, intensity: 0 },
            { name: "Fri", volume: 2500, intensity: 80 },
            { name: "Sat", volume: 2000, intensity: 75 },
            { name: "Sun", volume: 0, intensity: 0 }
          ]
        },
        {
          name: "Strength Week 2",
          totalVolume: 8800,
          intensity: "85",
          mainObjectives: "Strength, Power, Neural Adaptation",
          notes: "Focus on perfect form and explosive concentric phase",
          progression: [
            { name: "Mon", volume: 2000, intensity: 85 },
            { name: "Tue", volume: 0, intensity: 0 },
            { name: "Wed", volume: 2600, intensity: 90 },
            { name: "Thu", volume: 0, intensity: 0 },
            { name: "Fri", volume: 2300, intensity: 85 },
            { name: "Sat", volume: 1900, intensity: 80 },
            { name: "Sun", volume: 0, intensity: 0 }
          ]
        }
      ],
      sessions: [
        {
          id: "sess1",
          name: "Upper Body Power",
          date: "2023-07-10T09:00:00Z",
          exercises: [
            { id: 1, name: "Bench Press", sets: [{ setNumber: 1, reps: 8, weight: 80, power: 650, velocity: 0.8 }] }
          ],
          warmup: [
            { id: 101, name: "Arm Circles", duration: "2 min" }
          ],
          circuits: [
            { id: 201, name: "Push-ups", reps: 15, duration: "30 sec" }
          ]
        },
        {
          id: "sess2",
          name: "Lower Body Strength",
          date: "2023-07-12T09:00:00Z",
          exercises: [
            { id: 2, name: "Squat", sets: [{ setNumber: 1, reps: 5, weight: 100, power: 850, velocity: 0.7 }] }
          ],
          warmup: [
            { id: 102, name: "Leg Swings", duration: "2 min" }
          ],
          circuits: [
            { id: 202, name: "Bodyweight Lunges", reps: 20, duration: "45 sec" }
          ]
        }
      ]
    };

    return new Response(
      JSON.stringify({
        status: "success",
        data: mockMesocycle,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return handleError(error);
  }
};

/**
 * GET /api/dashboard/exercises
 *
 * Returns exercise data for the dashboard.
 * Fetches actual exercise data from the database.
 */
export const getExercises = async (
  supabase: any,
  url: URL,
  athleteId: number | string
): Promise<Response> => {
  try {
    // Fetch exercises from the database
    const { data: exercises, error } = await supabase
      .from("exercises")
      .select(`
        id,
        name,
        description,
        exercise_type_id,
        exercise_types(type)
      `)
      .order('name');

    if (error) {
      throw error;
    }

    // Map the data to match the expected structure in the frontend
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      type: exercise.exercise_types?.type?.toLowerCase() || 'gym' // Convert to lowercase to match frontend expectations
    }));

    return new Response(
      JSON.stringify({
        status: "success",
        data: formattedExercises,
        metadata: {
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching exercises:", error);
    return new Response(
      JSON.stringify({ 
        status: "error",
        error: error.message || "An unexpected error occurred" 
      }),
      {
        status: error.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Helper functions for ID handling
function ensureValidId(id: string | undefined | null): string {
  return id || '0';
}

function extractIdFromPath(pathname: string): string {
  const id = pathname.split("/").pop();
  if (!id || isNaN(parseInt(id))) {
    throw new Error("Invalid ID in path");
  }
  return id;
}

// Type guard for user record
function isUserRecord(data: any): data is UserRecord {
  return data && typeof data === 'object' && 'id' in data;
}

// Helper function to get coach ID from request
async function getCoachIdFromRequest(supabase: SupabaseClient, req: Request, userDataFromAuth?: UserData): Promise<string> {
  try {
    // First, check if coachId is available from auth flow
    if (userDataFromAuth?.coachId) {
      console.log("[getCoachIdFromRequest] Using coachId from auth:", userDataFromAuth.coachId);
      return userDataFromAuth.coachId;
    }
    
    // Fallback to request body if no auth data is available
    // Get request body
    const reqBody = await req.clone().json();
    const clerkId = reqBody.clerk_id;
    
    console.log("[getCoachIdFromRequest] Processing request for clerk_id:", clerkId);
    
    if (!clerkId) {
      throw new Error("Missing clerk_id in request");
    }

    // Get user data with full profile for debugging
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, metadata")
      .eq("clerk_id", clerkId)
      .single();

    if (userError || !userData) {
      console.error("[getCoachIdFromRequest] Error fetching user:", userError);
      throw new Error(`User not found for clerk_id: ${clerkId}`);
    }

    console.log("[getCoachIdFromRequest] Found user:", userData);

    // Verify the user has coach role in metadata
    if (!userData.metadata?.role || userData.metadata.role !== 'coach') {
      console.error("[getCoachIdFromRequest] User does not have coach role:", userData.metadata);
      throw new Error(`User does not have coach role. Current role: ${userData.metadata?.role || 'undefined'}`);
    }

    // Get coach record using user_id - use admin client for this privileged query
    
    // Log all coaches in the database for debugging
    const { data: allCoaches, error: allCoachesError } = await adminSupabase
      .from("coaches")
      .select("id, user_id")
      .limit(10);
      
    console.log("[getCoachIdFromRequest] All coaches in system:", allCoaches);
    
    // Try to find the specific coach
    const { data: coachData, error: coachError } = await adminSupabase
      .from("coaches")
      .select("id, user_id, sport_focus, speciality")
      .eq("user_id", userData.id)
      .single();

    if (coachError) {
      console.error("[getCoachIdFromRequest] Error fetching coach:", coachError);
      throw new Error(`Coach record not found (DB error). User ID: ${userData.id}, Error: ${coachError.message}`);
    }
    
    if (!coachData) {
      console.error("[getCoachIdFromRequest] No coach record found for user ID:", userData.id);
      throw new Error(`Coach record not found for user (no record). User ID: ${userData.id}, Name: ${userData.first_name} ${userData.last_name}`);
    }

    console.log("[getCoachIdFromRequest] Found coach record:", coachData);
    return String(coachData.id);
  } catch (error) {
    console.error("[getCoachIdFromRequest] Error:", error);
    throw error;
  }
}

/**
 * Main request handler
 *
 * This function routes the incoming GET request to the corresponding handler
 * based on the request pathname.
 */
Deno.serve(async (req) => {
  const { url, method } = req;
  const parsedUrl = new URL(url); // Parse the URL
  
  // Extract the pathname - either from query param (for clients using our SDK) or from the URL path
  let pathname = parsedUrl.pathname; // Extract the pathname
  
  console.log("[API] Received request:", { 
    method, 
    url, 
    originalPathname: pathname,
    search: parsedUrl.search
  });
  
  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // -------------------------
    // Authentication section (use Supabase Auth)
    // -------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    // Create two separate Supabase clients:
    // 1. Standard client with anon key that respects RLS policies
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // 2. Admin client with service role key that bypasses RLS - use only when necessary
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate the user with the token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("[API] Authenticated Supabase user:", authData.user.id);
    // Populate userData for downstream routes
    let userData: UserData = { ...DEFAULT_USER_DATA };
    userData.userId = String(authData.user.id);

    // Try to get timezone from the request body
    let timezone = "UTC"; // Default fallback timezone
    try {
      const reqBody = await req.clone().json();
      if (reqBody.timezone) {
        console.log("[API] Using timezone from request:", reqBody.timezone);
        timezone = reqBody.timezone;
        userData.timezone = timezone;
      }
    } catch (error) {
      console.log("[API] No timezone in request body, using default:", timezone);
    }

    // Handle routes that need role-specific IDs
    if (pathname.includes('/dashboard') || pathname.includes('/athlete') || pathname.includes('/planner')) {
      if (!userData.athleteId && pathname.includes('/athlete')) {
        return handleError(new Error("Athlete record not found"), "access");
      }
      // Note: We don't check for coach ID here anymore since we handle that in the specific endpoint
    }

    // -------------------------
    // Routing section
    // -------------------------

    // Handle planner endpoints
    if (pathname.startsWith("/api/planner")) {
      // GET /api/planner/exercises is accessible to all authenticated users
      if (pathname === "/api/planner/exercises" && method === "GET") {
        return await getExercisesForPlanner(supabase);
      }
      
      // For other planner endpoints, we need to ensure the user has a coach role
      try {
        // Use userData from the auth flow (which will be active in production)
        // If AUTH_ENABLED is false during development, provide fallback by examining the request body
        let coachId = userData.coachId;
        
        // If we still don't have a coach ID, return an error
        if (!coachId) {
          console.error("[API] User is not a coach or coach ID not found");
          return handleError(new Error("Coach record not found - User is not a coach or coach record doesn't exist"), "access");
        }
        
        console.log("[API] Using coach ID for planner request:", coachId);
        
        // Now handle specific endpoints
        // POST /api/planner/mesocycle or microcycle
        if ((pathname === "/api/planner/mesocycle" || pathname === "/api/planner/microcycle") && method === "POST") {
          try {
            // Now handle the specific endpoint with the coach ID from userData
            if (pathname === "/api/planner/mesocycle") {
              return await postMesocycle(supabase, parsedUrl, req, coachId);
            } else {
              return await postMicrocycle(supabase, parsedUrl, req, coachId);
            }
          } catch (error: any) {
            console.error("[Edge] Error processing planner request:", error);
            return handleError(error, "planner");
          }
        }
        
        // GET endpoints remain the same
        if (pathname.match(/^\/api\/planner\/mesocycle\/\d+$/) && method === "GET") {
          try {
            const mesocycleId = extractIdFromPath(pathname);
            return await getMesocycle(supabase, mesocycleId);
          } catch (error) {
            return handleError(error, "validation");
          }
        }
        
        if (pathname.match(/^\/api\/planner\/microcycle\/\d+$/) && method === "GET") {
          try {
            const microcycleId = extractIdFromPath(pathname);
            return await getMicrocycle(supabase, microcycleId);
          } catch (error) {
            return handleError(error, "validation");
          }
        }
      } catch (error: any) {
        console.error("[API] Error processing planner user data:", error);
        return handleError(error, "access");
      }
      
      // Method not allowed
      return handleError(new Error(`${method} Method not allowed for this planner endpoint`), "method");
    }

    // Handle user onboarding
    if (pathname === "/api/onboarding/user") {
      if (method === "POST") {
        return await postOnboardingUser(supabase, parsedUrl, req);
      }
      return new Response(
        JSON.stringify({ error: `${method} Method not allowed for onboarding` }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle events endpoint
    if (pathname === "/api/events") {
      if (method !== "GET") {
        return new Response(
          JSON.stringify({ error: `${method} Method not allowed for events endpoint` }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return await getEvents(supabase);
    }

    // Handle dashboard exercises endpoint
    if (pathname === "/api/dashboard/exercises") {
      if (method !== "GET") {
        return handleError(new Error("Method not allowed"), "method");
      }
      return await getExercises(supabase, parsedUrl, ensureValidId(userData.athleteId));
    }

    // Handle dashboard endpoints
    if (pathname.includes("/api/dashboard")) {
      // Retrieve the athlete record using the authenticated user id.
      const { data: athleteData, error: athleteError } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", userData.userId)
        .maybeSingle();
      if (athleteError || !athleteData) {
        return new Response(
          JSON.stringify({ error: "Athlete not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      const athleteGroupId = athleteData.athlete_group_id

      if (pathname === "/api/dashboard/exercisesInit") {
        if (method !== "GET") {
          return handleError(new Error("Method not allowed"), "method");
        }
        return await getExercisesInit(
          supabase,
          parsedUrl,
          ensureValidId(userData.athleteId),
          ensureValidId(athleteGroupId),
          timezone
        );
      }

      if (pathname === "/api/dashboard/weeklyOverview") {
        if (method !== "GET") {
          return handleError(new Error("Method not allowed"), "method");
        }
        return await getWeeklyOverview(supabase, parsedUrl, ensureValidId(userData.athleteId));
      }

      if (pathname === "/api/dashboard/mesocycle") {
        if (method !== "GET") {
          return handleError(new Error("Method not allowed"), "method");
        }
        return await getDashboardMesocycle(supabase, parsedUrl, ensureValidId(userData.athleteId));
      }

      if (pathname === "/api/dashboard/exercisesDetail") {
        if (method === "POST") {
          return await postExercisesDetail(supabase, parsedUrl, ensureValidId(userData.athleteId));
        }
        if (method === "PUT") {
          return await putExercisesDetail(supabase, parsedUrl, ensureValidId(userData.athleteId));
        }
        return handleError(new Error("Method not allowed"), "method");
      }
    }

    // Handle athletes endpoints
    if (pathname === "/api/athletes") {
      if (method === "GET") {
        const { params: queryParams } = extractPathParams(url);
        return await getAthletes(supabase, queryParams);
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

    // Handle GET /api/users/:clerkId/profile
    if (method === "GET" && pathname.includes("/users/") && pathname.endsWith("/profile")) {
      // Extract clerk_id from the path segments
      const segments = pathname.split("/");
      const userIndex = segments.findIndex(segment => segment === "users");
      if (userIndex === -1 || userIndex + 1 >= segments.length) {
        return new Response(
          JSON.stringify({ error: "Invalid user profile URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const clerkId = segments[userIndex + 1].split("?")[0]; // Remove any query parameters
      return getUserProfile(supabase, clerkId);
    }

    // Handle generic /api/dashboard/:table endpoints
    const { table, id, params } = extractPathParams(url);
    if (!table) {
      return new Response(
        JSON.stringify({ error: "Table Not Found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        status: "error",
        error: error.message || "An unexpected error occurred" 
      }),
      {
        status: error.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});