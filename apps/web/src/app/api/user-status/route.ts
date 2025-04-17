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
      console.log('[API] No user ID found in auth, returning unauthorized');
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
    
    // Enhanced debugging information
    console.log('[API] User data type:', typeof userData);
    console.log('[API] Has users array:', userData && Array.isArray(userData.users));
    
    if (userData && Array.isArray(userData.users) && userData.users.length > 0) {
      console.log('[API] First user in array:', JSON.stringify(userData.users[0]));
      console.log('[API] onboarding_completed value:', userData.users[0].onboarding_completed);
      console.log('[API] onboarding_completed type:', typeof userData.users[0].onboarding_completed);
    } else {
      console.log('[API] No users found in response');
    }
    
    // Check if user exists and has completed onboarding
    // Use strict checking for boolean values and string values "true"/"false"
    let onboardingCompleted = false;
    
    if (userData && Array.isArray(userData.users) && userData.users.length > 0) {
      const onboardingValue: unknown = userData.users[0].onboarding_completed;
      
      // Handle different data types that might come from the database or API
      if (typeof onboardingValue === 'boolean') {
        onboardingCompleted = onboardingValue;
      } else if (typeof onboardingValue === 'string') {
        onboardingCompleted = (onboardingValue as string).toLowerCase() === 'true';
      } else if (typeof onboardingValue === 'number') {
        onboardingCompleted = (onboardingValue as number) !== 0;
      } else {
        // For any other case, use Boolean casting
        onboardingCompleted = Boolean(onboardingValue);
      }
      
      console.log('[API] Raw onboarding value:', onboardingValue);
      console.log('[API] Converted onboarding value:', onboardingCompleted);
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