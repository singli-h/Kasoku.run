import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

export const dynamic = 'force-dynamic';

/**
 * GET handler for /api/coach/[userId] route
 * Fetches coach information for a given user ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify the user is authenticated
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      console.log('[API] Unauthorized access attempt to coach data');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Get the target userId from params
    const targetUserId = params.userId;

    // Ensure the user is fetching their own record (security measure)
    if (currentUserId !== targetUserId) {
      console.log('[API] Attempted to access another user\'s coach record');
      return NextResponse.json(
        { error: "You can only access your own coach record" },
        { status: 403 }
      );
    }

    try {
      // Call the user profile endpoint to get complete user data
      const { data } = await edgeFunctions.users.getProfile(targetUserId);

      if (!data?.user) {
        console.log('[API] No user data found');
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const { user, roleSpecificData } = data;

      // Check if user has a coach role in their metadata
      const isCoach = user.metadata?.role === 'coach';

      // Check if user has a coach record
      if (!roleSpecificData && isCoach) {
        console.log('[API] Coach role exists but no coach record found');
        return NextResponse.json(
          { error: "Coach role exists but no coach record found" },
          { status: 404 }
        );
      }

      // If no coach record exists at all, return an error
      if (!roleSpecificData) {
        console.log('[API] No coach record found');
        return NextResponse.json(
          { error: "No coach record found for this user" },
          { status: 404 }
        );
      }

      // Return with cache control headers
      const nextResponse = NextResponse.json(roleSpecificData, { status: 200 });
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');
      return nextResponse;
    } catch (edgeFunctionError) {
      console.error('[API] Edge Function error:', edgeFunctionError);
      throw edgeFunctionError; // Let the outer catch handle the error
    }
  } catch (error) {
    console.error("[API] Error fetching coach information:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: error.status || 500 }
    );
  }
} 