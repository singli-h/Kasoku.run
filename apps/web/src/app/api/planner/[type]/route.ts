import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions, fetchFromEdgeFunction } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

type PlannerType = 'mesocycle' | 'microcycle' | 'exercises';

/**
 * Helper function to fetch a user's coach ID from their profile
 */
async function getCoachIdFromProfile(userId: string): Promise<string | null> {
  try {
    const profileResponse = await fetchFromEdgeFunction(`/api/users/${userId}/profile`);
    
    if (!profileResponse?.data?.role || !profileResponse?.data?.roleSpecificData?.id) {
      console.error('Invalid profile data:', profileResponse);
      return null;
    }
    
    if (profileResponse.data.role !== 'coach') {
      console.error('User is not a coach:', profileResponse.data.role);
      return null;
    }
    
    return String(profileResponse.data.roleSpecificData.id);
  } catch (error) {
    console.error('Error fetching coach profile:', error);
    return null;
  }
}

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const authResult = await auth();
    
    if (!authResult?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = params;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate type parameter
    if (!['exercises', 'mesocycle', 'microcycle'].includes(type)) {
      return NextResponse.json(
        { error: `Invalid plan type: ${type}` },
        { status: 400 }
      );
    }

    // Handle each type with proper validation
    switch (type as PlannerType) {
      case 'exercises':
        return NextResponse.json(await edgeFunctions.planner.getExercises());
      
      case 'mesocycle':
        if (!id) {
          return NextResponse.json(
            { error: 'Missing mesocycle ID' },
            { status: 400 }
          );
        }
        return NextResponse.json(await edgeFunctions.planner.getMesocycle(id));
      
      case 'microcycle':
        if (!id) {
          return NextResponse.json(
            { error: 'Missing microcycle ID' },
            { status: 400 }
          );
        }
        return NextResponse.json(await edgeFunctions.planner.getMicrocycle(id));
      
      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error(`Error in GET /api/planner/${params.type}:`, error);
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

    const { type } = params;
    
    // Validate type parameter
    if (!['mesocycle', 'microcycle'].includes(type)) {
      return NextResponse.json(
        { error: `Invalid plan type: ${type}` },
        { status: 400 }
      );
    }
    
    // Verify user has a coach record
    const profileResponse = await fetchFromEdgeFunction(`/api/users/${userId}/profile`);
    if (!profileResponse?.data?.role || profileResponse.data.role !== 'coach' || !profileResponse.data.roleSpecificData?.id) {
      return NextResponse.json(
        { error: "You need a coach record to create training plans" },
        { status: 403 }
      );
    }
    
    try {
      // Clone the request to read its body
      const clone = request.clone();
      const planData = await clone.json();
      
      // Call the appropriate edge function based on type
      // No need to pass clerk_id as the edge function will get it from the authorization header
      const response = await fetchFromEdgeFunction(`/api/planner/${type}`, {
        method: 'POST',
        body: planData
      });
      
      return NextResponse.json(response);
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