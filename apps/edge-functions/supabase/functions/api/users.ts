import { corsHeaders, handleError } from './utils.ts';

/**
 * GET /api/users/:clerkId/status
 * 
 * Gets the onboarding status for a user by their Clerk ID
 */
export const getUserStatus = async (
  supabase: any,
  clerkId: string
): Promise<Response> => {
  try {
    console.log(`Checking status for user: ${clerkId}`);
    
    // Validate input
    if (!clerkId) {
      console.error("No clerk_id provided");
      return new Response(
        JSON.stringify({
          status: "error",
          error: "Missing clerk_id parameter",
          context: "validation"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Query the database
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("clerk_id", clerkId)
      .single();

    if (error) {
      console.error(`Database error for clerk_id ${clerkId}:`, error);
      
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            status: "success",
            data: {
              onboardingCompleted: false
            },
            context: "user_not_found"
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      throw error;
    }

    // Log the actual value for debugging
    console.log(`User ${clerkId} onboarding_completed value:`, data?.onboarding_completed);
    console.log(`User ${clerkId} onboarding_completed type:`, typeof data?.onboarding_completed);

    // Ensure boolean consistency
    let onboardingCompleted = false;
    
    if (data && data.onboarding_completed !== undefined && data.onboarding_completed !== null) {
      if (typeof data.onboarding_completed === 'boolean') {
        onboardingCompleted = data.onboarding_completed;
      } else if (typeof data.onboarding_completed === 'string') {
        onboardingCompleted = data.onboarding_completed.toLowerCase() === 'true';
      } else if (typeof data.onboarding_completed === 'number') {
        onboardingCompleted = data.onboarding_completed !== 0;
      } else {
        onboardingCompleted = Boolean(data.onboarding_completed);
      }
    }
    
    console.log(`Final onboardingCompleted value for ${clerkId}:`, onboardingCompleted);

    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          onboardingCompleted: onboardingCompleted
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in getUserStatus:", error);
    
    // Return consistent error response
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message || "Error checking user status",
        context: "server_error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

/**
 * GET /api/users/:clerkId/profile
 * 
 * Gets the complete profile data for a user by their Clerk ID
 */
export const getUserProfile = async (
  supabase: any,
  clerkId: string
): Promise<Response> => {
  try {
    console.log(`Fetching profile for user: ${clerkId}`);
    
    // Get the base user record - using maybeSingle() to handle multiple records case
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        clerk_id,
        username,
        email,
        first_name,
        last_name,
        birthdate,
        timezone,
        subscription_status,
        avatar_url,
        metadata,
        created_at,
        updated_at
      `)
      .eq("clerk_id", clerkId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching user with clerk_id ${clerkId}:`, error);
      throw error;
    }
    
    // If no user was found, return an error
    if (!user) {
      console.error(`No user found with clerk_id ${clerkId}`);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "User not found"
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Determine if user is an athlete or coach based on metadata
    const role = user.metadata?.role || null;
    
    let roleSpecificData = null;
    
    // Fetch role-specific data if role is available
    if (role === 'athlete') {
      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (!athleteError && athleteData) {
        roleSpecificData = athleteData;
      }
    } else if (role === 'coach') {
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (!coachError && coachData) {
        roleSpecificData = coachData;
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          user,
          role,
          roleSpecificData
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in getUserProfile:", error);
    return handleError(error);
  }
}; 