import { NextRequest, NextResponse } from 'next/server';
import { fetchFromEdgeFunction } from "@/lib/edge-functions";
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Route handler for /api/planner/[type] routes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Get current user from Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }

    const { type } = params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let result;

    // Route based on the requested type
    if (type === 'exercises') {
      // Get the exercise library
      result = await fetchFromEdgeFunction('/api/planner/exercises', {
        method: 'GET'
      });
    } else if (type === 'mesocycle' && id) {
      // Get a specific mesocycle
      result = await fetchFromEdgeFunction(`/api/planner/mesocycle/${id}`, {
        method: 'GET'
      });
    } else if (type === 'microcycle' && id) {
      // Get a specific microcycle
      result = await fetchFromEdgeFunction(`/api/planner/microcycle/${id}`, {
        method: 'GET'
      });
    } else {
      return NextResponse.json({ 
        error: "Invalid request. Please include a valid type (exercises, mesocycle, microcycle) and id if applicable" 
      }, { status: 400 });
    }

    // Return the result from the edge function
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error fetching data:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/planner/[type] routes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Get current user from Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }

    const { type } = params;
    const planData = await request.json();
    
    // Check if user role is included in the plan data
    if (planData.userRole !== 'coach') {
      return NextResponse.json({ error: "Only coaches can create training plans" }, { status: 403 });
    }

    let result;

    if (type === 'mesocycle') {
      // Call the edge function to create a mesocycle
      result = await fetchFromEdgeFunction('/api/planner/mesocycle', {
        method: 'POST',
        body: {
          ...planData,
          coach_id: userId, // Add clerk user ID as coach_id
          // Ensure we're passing the correctly formatted data
          sessions: planData.sessions,
          timezone: planData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    } else if (type === 'microcycle') {
      // Call the edge function to create a microcycle
      result = await fetchFromEdgeFunction('/api/planner/microcycle', {
        method: 'POST',
        body: {
          ...planData,
          coach_id: userId, // Add clerk user ID as coach_id
          // Ensure we're passing the microcycle data in the right format
          microcycle: planData.microcycle,
          sessions: planData.sessions
        }
      });
    } else {
      return NextResponse.json({ error: `Invalid plan type: ${type}. Must be 'mesocycle' or 'microcycle'` }, { status: 400 });
    }

    // Return the result from the edge function
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error creating plan:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
} 