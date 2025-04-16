import { NextRequest, NextResponse } from 'next/server';
import { fetchFromEdgeFunction } from "@/lib/edge-functions";
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET handler for /api/planner route
 * Redirects to the appropriate dynamic route
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    // Create the redirect URL
    let redirectUrl;
    
    if (type === 'exercises') {
      redirectUrl = '/api/planner/exercises';
    } else if (type === 'mesocycle' && id) {
      redirectUrl = `/api/planner/mesocycle?id=${id}`;
    } else if (type === 'microcycle' && id) {
      redirectUrl = `/api/planner/microcycle?id=${id}`;
    } else {
      return NextResponse.json({ 
        error: "Invalid request. Please include type (exercises, mesocycle, microcycle) and id where applicable" 
      }, { status: 400 });
    }
    
    // Create a new request to the dynamic route
    const url = new URL(redirectUrl, request.url);
    const newRequest = new Request(url, request);
    
    // Return a redirect response
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error(`Error in planner route:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/planner route
 * Handles plan creation directly to avoid redirect issues
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[DEBUG] POST to /api/planner received");
    
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }
    
    console.log(`[DEBUG] User authenticated: ${userId}`);
    
    // Extract the plan data
    const planData = await request.json();
    console.log(`[DEBUG] Plan data type: ${planData.planType || (planData.microcycle ? 'microcycle' : 'mesocycle')}`);
    
    // Determine the plan type from the request data
    let planType = '';
    if (planData.planType === 'microcycle' || planData.microcycle) {
      planType = 'microcycle';
    } else {
      planType = 'mesocycle';
    }
    
    // Get the user's profile to determine coach status
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
    
    // Prepare plan data with coach ID
    const preparedPlanData = {
      ...planData,
      coach_id: coachId,
      userRole: 'coach', // Include for backwards compatibility
      // Include specific fields for each plan type
      ...(planType === 'mesocycle' ? {
        sessions: planData.sessions,
        timezone: planData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      } : {
        microcycle: planData.microcycle,
        sessions: planData.sessions
      })
    };
    
    console.log(`[DEBUG] Calling edge function /api/planner/${planType} with coach_id: ${coachId}`);
    
    // Call the edge function directly
    const result = await fetchFromEdgeFunction(`/api/planner/${planType}`, {
      method: 'POST',
      body: preparedPlanData
    });
    
    console.log(`[DEBUG] Edge function response:`, JSON.stringify(result));
    
    // Return the result
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[DEBUG] Error in planner POST route:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
} 