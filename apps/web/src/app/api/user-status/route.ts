import { NextRequest, NextResponse } from 'next/server';
import { edgeFunctions } from '@/lib/edge-functions';
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

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
    
    // Add cache-busting timestamp to force fresh data
    const timestamp = Date.now();
    const userData = await edgeFunctions.users.checkOnboarding(`${userId}`);
    
    // Log the raw response for debugging
    console.log('[API] Raw user data from Edge Function:', JSON.stringify(userData));
    
    // Check if user exists and has completed onboarding
    const onboardingCompleted = userData && 
                               Array.isArray(userData.users) && 
                               userData.users.length > 0 && 
                               userData.users[0].onboarding_completed === true;

    console.log('[API] User record found:', userData && Array.isArray(userData.users) && userData.users.length > 0);
    if (userData && Array.isArray(userData.users) && userData.users.length > 0) {
      console.log('[API] Database onboarding_completed value:', userData.users[0].onboarding_completed);
    }
    
    console.log('[API] Final computed onboardingCompleted value:', onboardingCompleted);
    
    // Return with cache control headers to prevent caching
    const response = NextResponse.json({ onboardingCompleted }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[API] Error checking user status:', error);
    
    // Default to not completed if there's an error
    const response = NextResponse.json(
      { onboardingCompleted: false },
      { status: 200 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
} 