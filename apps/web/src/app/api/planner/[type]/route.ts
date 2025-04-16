import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

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
  // We only need to verify authentication, edge function will handle the rest
  const authResult = await auth();
  
  if (!authResult || !authResult.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type } = params;
  
  try {
    // Get the request data
    const requestData = await request.json();
    console.log(`[DEBUG] Received request data for ${type}:`, JSON.stringify(requestData));
    
    // Include clerk_id as a fallback for edge function
    // The edge function has been updated to prefer its own auth
    // but will fallback to clerk_id if needed
    const formattedData = {
      ...requestData,
      clerk_id: authResult.userId // Include as fallback
    };
    
    if (type === 'mesocycle') {
      const result = await edgeFunctions.planner.createMesocycle(formattedData);
      return NextResponse.json(result);
    } else if (type === 'microcycle') {
      const result = await edgeFunctions.planner.createMicrocycle(formattedData);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: `Invalid plan type: ${type}` },
        { status: 400 }
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