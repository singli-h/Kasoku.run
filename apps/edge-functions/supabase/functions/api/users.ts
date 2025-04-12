import { corsHeaders, handleError } from './utils';

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