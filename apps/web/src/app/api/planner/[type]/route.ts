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
    
    // First, check if the user has a coach record in the database
    // Get the user's profile including role-specific data
    const userProfile = await fetchFromEdgeFunction(`/api/users/${userId}/profile`);
    
    // Check if the user has a coach record
    if (!userProfile?.data?.role || userProfile.data.role !== 'coach' || !userProfile.data.roleSpecificData) {
      return NextResponse.json({ 
        error: "Only coaches can create training plans. This user does not have coach privileges." 
      }, { status: 403 });
    }
    
    // Get the coach ID from the role-specific data
    const coachId = userProfile.data.roleSpecificData.id;
    if (!coachId) {
      return NextResponse.json({ 
        error: "Coach record found but missing ID. Please contact support." 
      }, { status: 500 });
    }

    let result;

    if (type === 'mesocycle') {
      // Call the edge function to create a mesocycle
      result = await fetchFromEdgeFunction('/api/planner/mesocycle', {
        method: 'POST',
        body: {
          ...planData,
          coach_id: coachId, // Use the actual coach ID from the database
          userRole: 'coach', // Ensure we still send this for backward compatibility
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
          coach_id: coachId, // Use the actual coach ID from the database
          userRole: 'coach', // Ensure we still send this for backward compatibility
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