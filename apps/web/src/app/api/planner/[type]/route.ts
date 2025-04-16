import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';
import { fetchFromEdgeFunction } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

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
export async function POST(request: NextRequest, { params }: { params: { type: string } }) {
  // We verify authentication with Clerk
  const authResult = await auth();
  
  if (!authResult || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;
  const userId = authResult.userId;
  
  console.log(`[DEBUG] Processing ${type} creation for user: ${userId}`);
  
  try {
    // Get the request data
    const requestData = await request.json();
    console.log(`[DEBUG] Received request data for ${type}:`, JSON.stringify(requestData));
    
    // Debug step: Fetch the user profile to check role and verify coach record
    try {
      console.log(`[DEBUG] Fetching user profile to verify coach status`);
      const profileUrl = `/api/users/${userId}/profile?_t=${Date.now()}`;
      const profileResponse = await fetchFromEdgeFunction(profileUrl);
      
      console.log(`[DEBUG] User profile response:`, JSON.stringify({
        role: profileResponse?.data?.user?.metadata?.role,
        hasCoachData: !!profileResponse?.data?.roleSpecificData,
        coachId: profileResponse?.data?.roleSpecificData?.id
      }));
      
      if (!profileResponse?.data?.user?.metadata?.role) {
        console.error(`[DEBUG] No role found in user metadata`);
      } else if (profileResponse?.data?.user?.metadata?.role !== 'coach') {
        console.error(`[DEBUG] User role is not coach: ${profileResponse?.data?.user?.metadata?.role}`);
      }
      
      if (!profileResponse?.data?.roleSpecificData) {
        console.error(`[DEBUG] No roleSpecificData found in profile`);
      } else if (!profileResponse?.data?.roleSpecificData?.id) {
        console.error(`[DEBUG] No coach ID found in roleSpecificData`);
      }
    } catch (profileError) {
      console.error(`[DEBUG] Error fetching profile:`, profileError);
    }
    
    // Send the request directly to the edge function with the Clerk ID
    const formattedData = {
      ...requestData,
      clerk_id: userId,
      userRole: 'coach' // Include this for backward compatibility
    };
    
    console.log(`[DEBUG] Sending formatted data to edge function`, JSON.stringify({
      clerk_id: userId,
      userRole: formattedData.userRole
    }));
    
    // Call the appropriate edge function directly
    try {
      let result;
      if (type === 'mesocycle') {
        result = await fetchFromEdgeFunction('/api/planner/mesocycle', {
          method: 'POST',
          body: formattedData
        });
      } else if (type === 'microcycle') {
        result = await fetchFromEdgeFunction('/api/planner/microcycle', {
          method: 'POST',
          body: formattedData
        });
      } else {
        return NextResponse.json(
          { error: `Invalid plan type: ${type}` },
          { status: 400 }
        );
      }
      
      console.log(`[DEBUG] Edge function response:`, JSON.stringify(result));
      return NextResponse.json(result);
    } catch (edgeFunctionError: any) {
      console.error(`[DEBUG] Error from edge function:`, edgeFunctionError);
      
      // Check if it's a coach role issue
      if (edgeFunctionError.message?.includes('coach')) {
        return NextResponse.json(
          { error: edgeFunctionError.message || 'Only coaches can create training plans', details: 'User must have role=coach in metadata and a coach record in the database' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: edgeFunctionError.message || 'Error processing request' },
        { status: edgeFunctionError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error(`[DEBUG] Error in POST /api/planner/${type}:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: error.status || 500 }
    );
  }
} 