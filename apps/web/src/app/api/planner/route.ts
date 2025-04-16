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
 * Handles plan creation directly and sends clerk user ID to edge function
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
    
    // Fetch the user's profile to check for coach record
    const profileUrl = `/api/users/${userId}/profile`;
    const profileResponse = await fetchFromEdgeFunction(profileUrl);
    
    if (!profileResponse || profileResponse.status !== 'success' || !profileResponse.data?.user) {
      console.error("[DEBUG] User profile not found:", profileResponse);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    
    // Get role-specific data to check for coach record
    const { roleSpecificData } = profileResponse.data;
    
    // Check if user has a coach record, regardless of their role
    if (!roleSpecificData || !roleSpecificData.id) {
      console.error("[DEBUG] No coach record found for user");
      return NextResponse.json(
        { error: "You need a coach record to create training plans" },
        { status: 403 }
      );
    }
    
    const coachId = roleSpecificData.id;
    console.log(`[DEBUG] Found coach ID: ${coachId} for user: ${userId}`);
    
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
    
    // Prepare plan data with coach ID
    const preparedPlanData = {
      ...planData,
      clerk_id: userId,
      coach_id: coachId // Pass actual coach ID from the database
    };
    
    console.log(`[DEBUG] Calling edge function /api/planner/${planType} with coach_id: ${coachId}`, JSON.stringify(preparedPlanData));
    
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