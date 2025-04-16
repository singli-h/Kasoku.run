import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/user
 * Handles user onboarding via Supabase Edge Function
 */
export async function POST(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Get and validate the request body
    const body = await request.json();
    
    if (body.clerk_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID mismatch" },
        { status: 403 }
      );
    }

    console.log('[API] Processing onboarding for user:', userId);
    const data = await edgeFunctions.users.onboard(body);
    
    console.log('[API] Successfully completed onboarding for user:', userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error in onboarding:', error);
    
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: error.status || 500 }
    );
  }
} 