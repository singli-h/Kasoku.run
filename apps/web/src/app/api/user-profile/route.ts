import { NextResponse } from "next/server";
import { edgeFunctions } from '@/lib/edge-functions';
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/user-profile
 * Fetches the complete profile data for the authenticated user
 */
export async function GET() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    console.log('[API] Fetching profile data for user:', userId);
    
    // Fetch profile data from Edge Function
    const profileData = await edgeFunctions.users.getProfile(userId);
    
    // Log the response for debugging
    console.log('[API] Profile data response received');
    
    // Add cache control headers to prevent caching
    const response = NextResponse.json(profileData, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[API] Error fetching user profile:', error);
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: error.status || 500 }
    );
  }
} 