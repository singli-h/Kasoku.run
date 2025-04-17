import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';
import { z } from 'zod';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

// Define the expected profile data structure
const ProfileDataSchema = z.object({
  id: z.string(),
  role: z.enum(['athlete', 'coach']),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  // Add any other expected fields with their types
}).strict();

/**
 * GET /api/user-profile
 * Retrieves the user's profile data via Supabase Edge Function
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[API] No user ID found in auth, returning unauthorized');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    try {
      // Fetch profile data using the edgeFunctions client
      const { data } = await edgeFunctions.users.getProfile(userId);
      
      if (!data) {
        console.log('[API] No profile data returned from Edge Function');
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      // Validate the profile data structure
      try {
        const validatedData = ProfileDataSchema.parse(data);
        console.log('[API] Profile data validated successfully');

        // Return with cache control headers to prevent caching
        const nextResponse = NextResponse.json(validatedData, { status: 200 });
        nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        nextResponse.headers.set('Pragma', 'no-cache');
        nextResponse.headers.set('Expires', '0');
        return nextResponse;
      } catch (validationError) {
        console.error('[API] Profile data validation failed:', validationError);
        return NextResponse.json(
          { error: "Invalid profile data structure" },
          { status: 422 }
        );
      }
    } catch (edgeFunctionError) {
      console.error('[API] Edge Function error:', edgeFunctionError);
      
      // Handle specific edge function errors
      if (edgeFunctionError.status === 404) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      } else if (edgeFunctionError.status === 403) {
        return NextResponse.json(
          { error: "Forbidden - Access denied" },
          { status: 403 }
        );
      }
      
      throw edgeFunctionError; // Let the outer catch handle other errors
    }
  } catch (error) {
    console.error('[API] Error in user profile route:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: error.status || 500 }
    );
  }
} 