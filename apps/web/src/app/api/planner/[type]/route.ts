import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

type PlannerType = 'mesocycle' | 'microcycle' | 'exercises';

/**
 * Helper function to fetch a user's coach ID from their profile
 */
async function getCoachIdFromProfile(userId: string): Promise<string | null> {
  try {
    const { data } = await edgeFunctions.users.getProfile(userId);
    
    if (!data?.role || !data?.roleSpecificData?.id) {
      console.error('[API] Invalid profile data:', data);
      return null;
    }
    
    if (data.role !== 'coach') {
      console.error('[API] User is not a coach:', data.role);
      return null;
    }
    
    return String(data.roleSpecificData.id);
  } catch (error) {
    console.error('[API] Error fetching coach profile:', error);
    return null;
  }
}

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API] Unauthorized access attempt to planner');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
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

    console.log(`[API] Processing ${type} request`);

    try {
      let response;
      switch (type as PlannerType) {
        case 'exercises': 
          try {
            console.log('[API] Fetching exercises data');
            const { data: exercisesData } = await edgeFunctions.planner.getExercises();
            console.log('[API] Exercises data fetched successfully');
            response = exercisesData;
          } catch (exerciseError) {
            console.error('[API] Error fetching exercises:', exerciseError);
            throw new Error('Failed to fetch exercises data');
          }
          break;
        
        case 'mesocycle':
          if (!id) {
            return NextResponse.json(
              { error: 'Missing mesocycle ID' },
              { status: 400 }
            );
          }
          try {
            const { data: mesocycleData } = await edgeFunctions.planner.getMesocycle(id);
            response = mesocycleData;
          } catch (mesocycleError) {
            console.error('[API] Error fetching mesocycle:', mesocycleError);
            throw new Error(`Failed to fetch mesocycle with ID: ${id}`);
          }
          break;
        
        case 'microcycle':
          if (!id) {
            return NextResponse.json(
              { error: 'Missing microcycle ID' },
              { status: 400 }
            );
          }
          try {
            const { data: microcycleData } = await edgeFunctions.planner.getMicrocycle(id);
            response = microcycleData;
          } catch (microcycleError) {
            console.error('[API] Error fetching microcycle:', microcycleError);
            throw new Error(`Failed to fetch microcycle with ID: ${id}`);
          }
          break;
        
        default:
          return NextResponse.json(
            { error: 'Invalid request type' },
            { status: 400 }
          );
      }

      // Return with cache control headers
      const nextResponse = NextResponse.json(response, { status: 200 });
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');
      return nextResponse;
    } catch (edgeFunctionError) {
      console.error(`[API] Edge function error for ${type}:`, edgeFunctionError);
      
      // Provide a more user-friendly error response
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from the server', 
          details: edgeFunctionError.message || 'Unknown error',
          type: type
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`[API] Error in GET /api/planner/${params.type}:`, error);
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
      console.log('[API] Unauthorized attempt to create plan');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
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
    const coachId = await getCoachIdFromProfile(userId);
    if (!coachId) {
      return NextResponse.json(
        { error: "You need a coach record to create training plans" },
        { status: 403 }
      );
    }
    
    try {
      // Clone the request to read its body
      const clone = request.clone();
      const planData = await clone.json();
      
      // Add coach ID to the plan data
      const enrichedData = {
        ...planData,
        coach_id: coachId
      };

      // Call the appropriate edge function based on type
      let response;
      if (type === 'mesocycle') {
        const { data } = await edgeFunctions.planner.createMesocycle(enrichedData);
        response = data;
      } else {
        const { data } = await edgeFunctions.planner.createMicrocycle(enrichedData);
        response = data;
      }
      
      // Return with cache control headers
      const nextResponse = NextResponse.json(response, { status: 201 });
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');
      return nextResponse;
    } catch (edgeFunctionError: any) {
      console.error(`[API] Error from edge function for ${type}:`, edgeFunctionError);
      return NextResponse.json(
        { 
          error: edgeFunctionError.message || `Error creating ${type}`,
          details: edgeFunctionError.data || "Check server logs for details"
        },
        { status: edgeFunctionError.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Error in planner POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}