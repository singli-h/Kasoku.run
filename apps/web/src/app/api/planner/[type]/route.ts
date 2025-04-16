import { NextRequest, NextResponse } from 'next/server';
import { fetchFromEdgeFunction } from "@/lib/edge-functions";
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Get current user from Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }

    const { type } = params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let result;

    // Route based on the requested type
    if (type === 'exercises') {
      // Get the exercise library
      result = await fetchFromEdgeFunction('/api/planner/exercises', {
        method: 'GET'
      });
    } else if (type === 'mesocycle' && id) {
      // Get a specific mesocycle
      result = await fetchFromEdgeFunction(`/api/planner/mesocycle/${id}`, {
        method: 'GET'
      });
    } else if (type === 'microcycle' && id) {
      // Get a specific microcycle
      result = await fetchFromEdgeFunction(`/api/planner/microcycle/${id}`, {
        method: 'GET'
      });
    } else {
      return NextResponse.json({ 
        error: "Invalid request. Please include a valid type (exercises, mesocycle, microcycle) and id if applicable" 
      }, { status: 400 });
    }

    // Return the result from the edge function
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error fetching data:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/planner/[type] routes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Get current user from Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }

    console.log(`[DEBUG] POST /api/planner/${params.type} - Processing request for user: ${userId}`);
    
    const { type } = params;
    const planData = await request.json();
    
    // First, check if the user has a coach record in the database
    // Get the user's profile including role-specific data
    console.log(`[DEBUG] Fetching user profile from /api/users/${userId}/profile`);
    const userProfile = await fetchFromEdgeFunction(`/api/users/${userId}/profile`);
    
    console.log(`[DEBUG] User profile response:`, JSON.stringify({
      role: userProfile?.data?.role,
      hasRoleSpecificData: !!userProfile?.data?.roleSpecificData,
      metadata: userProfile?.data?.user?.metadata
    }));
    
    // Check if the user has the coach role in metadata (most reliable source)
    const userMetadata = userProfile?.data?.user?.metadata || {};
    const userRole = userMetadata.role || userProfile?.data?.role;
    
    console.log(`[DEBUG] User role from metadata: ${userRole}`);
    
    if (userRole !== 'coach') {
      console.log(`[DEBUG] User ${userId} is not a coach. Role: ${userRole}`);
      return NextResponse.json({ 
        error: "Only coaches can create training plans. This user does not have coach privileges." 
      }, { status: 403 });
    }
    
    // Get coach data - try both locations for maximum compatibility
    let coachData = userProfile?.data?.roleSpecificData;
    
    // If no coach data found but user has coach role, we need to query the coaches table directly
    if (!coachData && userRole === 'coach') {
      console.log(`[DEBUG] Coach role found but no roleSpecificData. Querying coaches table for user_id: ${userProfile?.data?.user?.id}`);
      
      // Make a direct database call to get the coach record
      try {
        const coachResponse = await fetchFromEdgeFunction(`/api/coaches?user_id=${userProfile?.data?.user?.id}`);
        console.log(`[DEBUG] Coach query response:`, JSON.stringify(coachResponse));
        
        if (coachResponse?.data?.coaches && coachResponse.data.coaches.length > 0) {
          coachData = coachResponse.data.coaches[0];
        }
      } catch (err) {
        console.error(`[DEBUG] Error fetching coach data:`, err);
      }
    }
    
    // Final check for coach record
    if (!coachData || !coachData.id) {
      console.log(`[DEBUG] No coach record found for user ${userId} with role ${userRole}`);
      return NextResponse.json({ 
        error: "Your account has coach permissions but no coach record exists. Please complete your coach profile." 
      }, { status: 403 });
    }
    
    // Get the coach ID from the role-specific data
    const coachId = coachData.id;
    console.log(`[DEBUG] Coach ID found: ${coachId}`);

    let result;

    if (type === 'mesocycle') {
      console.log(`[DEBUG] Creating mesocycle with coach_id: ${coachId}`);
      // Call the edge function to create a mesocycle
      result = await fetchFromEdgeFunction('/api/planner/mesocycle', {
        method: 'POST',
        body: {
          ...planData,
          coach_id: coachId, // Use the actual coach ID from the database
          userRole: 'coach', // Ensure we still send this for backward compatibility
          // Ensure we're passing the correctly formatted data
          sessions: planData.sessions,
          timezone: planData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    } else if (type === 'microcycle') {
      console.log(`[DEBUG] Creating microcycle with coach_id: ${coachId}`);
      // Call the edge function to create a microcycle
      result = await fetchFromEdgeFunction('/api/planner/microcycle', {
        method: 'POST',
        body: {
          ...planData,
          coach_id: coachId, // Use the actual coach ID from the database
          userRole: 'coach', // Ensure we still send this for backward compatibility
          // Ensure we're passing the microcycle data in the right format
          microcycle: planData.microcycle,
          sessions: planData.sessions
        }
      });
    } else {
      return NextResponse.json({ error: `Invalid plan type: ${type}. Must be 'mesocycle' or 'microcycle'` }, { status: 400 });
    }

    console.log(`[DEBUG] Edge function response:`, JSON.stringify(result));
    // Return the result from the edge function
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[DEBUG] Error creating plan:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
} 