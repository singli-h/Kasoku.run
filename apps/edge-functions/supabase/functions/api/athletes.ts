import { corsHeaders, handleError } from './utils.ts';

/**
 * GET /api/athletes
 * 
 * Fetches all athletes from the database
 * Can be filtered by various parameters passed in the URL
 */
export const getAthletes = async (
  supabase: any,
  params: Record<string, string>
): Promise<Response> => {
  try {
    console.log("Fetching athletes from database...");
    
    let query = supabase
      .from("athletes")
      .select(`
        *,
        users (
          id,
          username,
          first_name,
          last_name,
          email,
          role
        )
      `);

    // Apply any filters from params
    Object.entries(params).forEach(([key, value]) => {
      if (key.startsWith("users.")) {
        // Handle filtering on users table fields
        query = query.eq(`users.${key.split(".")[1]}`, value);
      } else {
        // Handle filtering on athletes table fields
        query = query.eq(key, value);
      }
    });

    const { data: athletes, error } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: "success",
        data: athletes
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in getAthletes:", error);
    return handleError(error);
  }
};

/**
 * POST /api/athletes
 * 
 * Creates a new athlete record
 */
export const createAthlete = async (
  supabase: any,
  req: Request
): Promise<Response> => {
  try {
    const athleteData = await req.json();
    
    // Validate required fields
    if (!athleteData.user_id) {
      throw new Error("user_id is required");
    }

    const { data, error } = await supabase
      .from("athletes")
      .insert(athleteData)
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: "success",
        data: data[0]
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in createAthlete:", error);
    return handleError(error);
  }
}; 