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
    
    // Prepare plan data with clerk user ID
    const preparedPlanData = {
      ...planData,
      clerk_id: userId, // Pass clerk user ID instead of coach_id
      // Include specific fields for each plan type
      ...(planType === 'mesocycle' ? {
        sessions: planData.sessions,
        timezone: planData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      } : {
        microcycle: planData.microcycle,
        sessions: planData.sessions
      })
    };
    
    console.log(`[DEBUG] Calling edge function /api/planner/${planType} with clerk_id: ${userId}`);
    
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