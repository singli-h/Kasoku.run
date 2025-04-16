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
  
  try {
    // Get the request data
    const requestData = await request.json();
    console.log(`[DEBUG] Received request data for ${type}:`, JSON.stringify(requestData));
    
    // Send the request directly to the edge function with the Clerk ID
    const formattedData = {
      ...requestData,
      clerk_id: userId,
      userRole: 'coach' // Include this for backward compatibility
    };
    
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
      
      return NextResponse.json(result);
    } catch (edgeFunctionError: any) {
      console.error(`Error from edge function:`, edgeFunctionError);
      
      // Check if it's a coach role issue
      if (edgeFunctionError.message?.includes('coach')) {
        return NextResponse.json(
          { error: edgeFunctionError.message || 'Only coaches can create training plans' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: edgeFunctionError.message || 'Error processing request' },
        { status: edgeFunctionError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error(`Error in POST /api/planner/${type}:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: error.status || 500 }
    );
  }
} 