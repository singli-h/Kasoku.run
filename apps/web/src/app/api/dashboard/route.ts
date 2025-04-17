import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * Fetches dashboard data for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      console.log('[API] Unauthorized access attempt to dashboard');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    try {
      // Get user profile to determine role
      const { data: profile } = await edgeFunctions.users.getProfile(userId);
      
      if (!profile || !profile.role) {
        console.log('[API] No profile or role found for user');
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 404 }
        );
      }

      // Fetch dashboard data based on user role
      let dashboardData;
      if (profile.role === 'coach') {
        console.log('[API] Fetching coach dashboard data');
        const { data } = await edgeFunctions.dashboard.getCoachData(userId);
        dashboardData = data;
      } else if (profile.role === 'athlete') {
        console.log('[API] Fetching athlete dashboard data');
        const { data } = await edgeFunctions.dashboard.getAthleteData(userId);
        dashboardData = data;
      } else {
        return NextResponse.json(
          { error: "Invalid user role" },
          { status: 400 }
        );
      }

      // Return with cache control headers
      const response = NextResponse.json(dashboardData, { status: 200 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    } catch (edgeFunctionError) {
      console.error('[API] Edge Function error:', edgeFunctionError);
      
      if (edgeFunctionError.status === 404) {
        return NextResponse.json(
          { error: "Dashboard data not found" },
          { status: 404 }
        );
      }
      
      throw edgeFunctionError; // Let the outer catch handle other errors
    }
  } catch (error) {
    console.error('[API] Error in dashboard route:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: error.status || 500 }
    );
  }
} 