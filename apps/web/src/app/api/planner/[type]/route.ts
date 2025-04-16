import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions, fetchFromEdgeFunction } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Helper function to call an edge function with the coach ID
 */
async function callEdgeFunction(functionName: string, request: Request, params: any) {
  // Clone the request to read its body
  const clone = request.clone();
  const body = await clone.json();
  
  // Forward the request to the edge function with the additional parameters
  return fetchFromEdgeFunction(`/api/planner/${functionName}`, {
    method: 'POST',
    body: {
      ...body,
      ...params
    }
  });
}

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const authResult = await auth();
  
  if (!authResult || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  try {
    if (type === 'exercises') {
      const exercises = await edgeFunctions.planner.getExercises();
      return NextResponse.json(exercises);
    } else if (type === 'mesocycle' && id) {
      const mesocycle = await edgeFunctions.planner.getMesocycle(id);
      return NextResponse.json(mesocycle);
    } else if (type === 'microcycle' && id) {
      const microcycle = await edgeFunctions.planner.getMicrocycle(id);
      return NextResponse.json(microcycle);
    } else {
      return NextResponse.json(
        { error: `Invalid request. Type '${type}' or ID '${id}' is invalid` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error(`Error in GET /api/planner/${type}:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST handler for /api/planner/[type] routes
 */
export async function POST(request: Request, { params }: { params: { type: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle different plan types
    const type = params.type;
    
    // Fetch the user's profile to check for coach record
    const profileUrl = `/api/users/${userId}/profile`;
    const profileResponse = await fetchFromEdgeFunction(profileUrl);
    
    if (!profileResponse || profileResponse.status !== 'success' || !profileResponse.data?.user) {
      console.error("User profile not found:", profileResponse);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    
    // Get user data and role-specific data
    const { roleSpecificData } = profileResponse.data;
    
    // Only check if the user has a coach record, regardless of their role
    if (!roleSpecificData || !roleSpecificData.id) {
      console.error("No coach record found for user");
      return NextResponse.json(
        { error: "You need a coach record to create training plans" },
        { status: 403 }
      );
    }
    
    // Use the coach_id from the database
    const coachId = roleSpecificData.id;
    
    console.log(`Creating ${type} for coach ID: ${coachId}`);
    
    // Handle the request based on the plan type
    try {
      switch (type) {
        case "mesocycle":
          const mesocycleResponse = await callEdgeFunction("mesocycle", request, { coach_id: coachId });
          return NextResponse.json(mesocycleResponse);
        
        case "microcycle":
          const microcycleResponse = await callEdgeFunction("microcycle", request, { coach_id: coachId });
          return NextResponse.json(microcycleResponse);
        
        default:
          return NextResponse.json(
            { error: `Invalid request type: ${type}` },
            { status: 400 }
          );
      }
    } catch (edgeFunctionError: any) {
      console.error(`Error from edge function for ${type}:`, edgeFunctionError);
      return NextResponse.json(
        { 
          error: edgeFunctionError.message || `Error creating ${type}`,
          details: edgeFunctionError.data || "Check server logs for details"
        },
        { status: edgeFunctionError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in planner POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}