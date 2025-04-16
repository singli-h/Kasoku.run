import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { fetchFromEdgeFunction } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST handler for /api/onboarding/user
 * This endpoint creates or updates a user's profile and creates role-specific records
 */
export async function POST(request: NextRequest) {
  try {
    // Get the clerk user ID from auth session
    const { userId } = await auth();
    
    // Allow unauthenticated requests for testing
    const isTestingMode = process.env.NODE_ENV === 'development';
    
    if (!userId && !isTestingMode) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get the request data
    const userData = await request.json();
    
    // Use clerk_id from auth if available, otherwise use the one from the body
    const clerkId = userId || userData.clerk_id;
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Missing clerk_id - user must be authenticated or provide clerk_id in request body" },
        { status: 400 }
      );
    }
    
    // Ensure clerk_id is included in the data sent to edge function
    const enrichedData = {
      ...userData,
      clerk_id: clerkId
    };
    
    console.log(`[DEBUG] Sending onboarding data for user ${clerkId}:`, JSON.stringify({
      role: enrichedData.role,
      email: enrichedData.email,
      metadata: enrichedData.metadata
    }));
    
    // Call the edge function
    try {
      const response = await fetchFromEdgeFunction('/api/onboarding/user', {
        method: 'POST',
        body: enrichedData
      });
      
      console.log(`[DEBUG] Onboarding response:`, JSON.stringify(response));
      
      return NextResponse.json(response);
    } catch (error: any) {
      console.error(`[DEBUG] Error in onboarding edge function:`, error);
      
      return NextResponse.json(
        { error: error.message || 'Error in onboarding process' },
        { status: error.status || 500 }
      );
    }
  } catch (error: any) {
    console.error(`[DEBUG] Unexpected error in onboarding API:`, error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 