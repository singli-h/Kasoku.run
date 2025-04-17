import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/user-status
 * Checks the user's onboarding status via Supabase Edge Function
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

    console.log('[API] Checking onboarding status for user:', userId);
    
    // Add cache-busting timestamp to force fresh data
    const timestamp = Date.now();
    
    // Prepare the URL to the Supabase Edge Function
    // We're now calling the Supabase edge function directly from the API route
    // This follows the n-tier architecture: Frontend -> Next.js API -> Edge Functions -> Database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[API] Missing required environment variables:', { 
        hasSupabaseUrl: !!supabaseUrl, 
        hasServiceRoleKey: !!serviceRoleKey 
      });
      throw new Error('Server configuration error');
    }
    
    // Build the proper URL to the Supabase edge function
    const url = `${supabaseUrl}/functions/v1/api/users/${userId}/status?_t=${timestamp}`;
    
    // Make the request using fetch
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`[API] Failed to fetch from edge function: ${response.status}`);
      const errorText = await response.text();
      console.error(`[API] Error details:`, errorText);
      throw new Error(`Failed to fetch user status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('[API] Raw data from Edge Function:', JSON.stringify(data));
    
    // Enhanced debugging
    if (data && data.status === "success" && data.data) {
      console.log('[API] onboarding_completed value:', data.data.onboardingCompleted);
      console.log('[API] onboarding_completed type:', typeof data.data.onboardingCompleted);
    } else {
      console.log('[API] Unexpected data format:', data);
    }
    
    // Check if user exists and has completed onboarding
    // Use strict checking for boolean values and string values "true"/"false"
    let onboardingCompleted = false;
    
    if (data && data.status === "success" && data.data) {
      const onboardingValue: unknown = data.data.onboardingCompleted;
      
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
    const nextResponse = NextResponse.json({ onboardingCompleted }, { status: 200 });
    nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');
    return nextResponse;
  } catch (error) {
    console.error('[API] Error checking user status:', error);
    
    // Default to not completed if there's an error
    const nextResponse = NextResponse.json(
      { onboardingCompleted: false },
      { status: 200 }
    );
    nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');
    return nextResponse;
  }
} 