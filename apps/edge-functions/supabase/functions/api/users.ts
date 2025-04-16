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
    
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("clerk_id", clerkId)
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          onboardingCompleted: data?.onboarding_completed || false
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in getUserStatus:", error);
    // Return false for onboarding status on error
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          onboardingCompleted: false
        }
      }),
      {
        status: 200,
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