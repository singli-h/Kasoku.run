import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

/**
 * GET /api/user-status
 * Checks the user's onboarding status via Supabase Edge Function
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

    console.log('[API] Checking onboarding status for user:', userId);
    const userData = await edgeFunctions.users.checkOnboarding(userId);
    
    // Check if user exists and has completed onboarding
    const onboardingCompleted = userData && 
                               Array.isArray(userData.users) && 
                               userData.users.length > 0 && 
                               userData.users[0].onboarding_completed === true;

    console.log('[API] Successfully fetched onboarding status for user:', userId);
    return NextResponse.json({ onboardingCompleted }, { status: 200 });
  } catch (error) {
    console.error('[API] Error checking user status:', error);
    
    // Default to not completed if there's an error
    return NextResponse.json(
      { onboardingCompleted: false },
      { status: 200 }
    );
  }
} 