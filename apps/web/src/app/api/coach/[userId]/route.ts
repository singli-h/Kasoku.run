import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { fetchFromEdgeFunction } from '@/lib/edge-functions';

export const dynamic = 'force-dynamic';

/**
 * GET handler for /api/coach/[userId] route
 * Fetches coach information for a given user ID
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify the user is authenticated
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the target userId from params
    const targetUserId = params.userId;

    // Ensure the user is fetching their own record (security measure)
    if (currentUserId !== targetUserId) {
      return NextResponse.json(
        { error: "You can only access your own coach record" },
        { status: 403 }
      );
    }

    // Call the user profile endpoint to get complete user data
    const profileUrl = `/api/users/${targetUserId}/profile`;
    const profileResponse = await fetchFromEdgeFunction(profileUrl);

    if (!profileResponse?.data?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { user, roleSpecificData } = profileResponse.data;

    // Check if user has a coach role in their metadata
    const isCoach = user.metadata?.role === 'coach';

    // Check if user has a coach record
    if (!roleSpecificData && isCoach) {
      return NextResponse.json(
        { error: "Coach role exists but no coach record found" },
        { status: 404 }
      );
    }

    // If no coach record exists at all, return an error
    if (!roleSpecificData) {
      return NextResponse.json(
        { error: "No coach record found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json(roleSpecificData);
  } catch (error) {
    console.error("Error fetching coach information:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
} 