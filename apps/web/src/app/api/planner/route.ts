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
 * Forwards requests to the appropriate dynamic route based on data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }
    
    // Clone the request for reading
    const requestClone = request.clone();
    const planData = await requestClone.json();
    
    // Determine the plan type from the request data
    let planType = '';
    if (planData.planType === 'microcycle' || planData.microcycle) {
      planType = 'microcycle';
    } else {
      planType = 'mesocycle';
    }
    
    // Create a new request URL based on the plan type
    const redirectUrl = `/api/planner/${planType}`;
    const url = new URL(redirectUrl, request.url);
    
    // Redirect to the appropriate dynamic route
    return NextResponse.redirect(url, 307); // 307 temporary redirect preserves the HTTP method and body
  } catch (error: any) {
    console.error(`Error in planner POST route:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
} 