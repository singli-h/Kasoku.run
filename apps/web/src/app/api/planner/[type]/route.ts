import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from "@clerk/nextjs/server";
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
 * Helper function to call the edge function with proper authentication
 */
async function callEdgeFunctionWithAuth(endpoint: string, options: RequestInit = {}) {
  try {
    // 1. Get the auth session
    const session = await auth();
    if (!session?.userId) {
      throw new Error("No active user session found");
    }

    // 2. Get the token with the Supabase template
    const token = await session.getToken({
      template: "supabase"
    });
    
    if (!token) {
      throw new Error("Failed to get authentication token");
    }

    // 3. Build the Edge Function URL with proper encoding
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    }
    
    const timestamp = Date.now();
    const baseUrl = `${supabaseUrl}/functions/v1${endpoint}`;
    const url = new URL(baseUrl);
    url.searchParams.append('_t', timestamp.toString());

    console.log(`[Planner API] Calling edge function: ${url.toString()}`);

    // 4. Make the request with proper headers
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[Planner API] Edge function error (${response.status}):`, errorData || await response.text());
      throw new Error(`Edge function error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Planner API] Error calling edge function:', error);
    throw error;
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

    console.log(`[Planner API] Processing ${type} request`);

    // Handle each type with proper validation
    try {
      switch (type as PlannerType) {
        case 'exercises': 
          // Use direct edge function call with proper auth
          const exercisesData = await callEdgeFunctionWithAuth('/api/planner/exercises');
          console.log('[Planner API] Exercises data fetched successfully');
          return NextResponse.json(exercisesData);
        
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
    } catch (edgeFunctionError: any) {
      console.error(`[Planner API] Edge function error for ${type}:`, edgeFunctionError);
      
      // Provide a more user-friendly error response
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from the server', 
          details: edgeFunctionError.message || 'Unknown error' 
        },
        { status: 500 }
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