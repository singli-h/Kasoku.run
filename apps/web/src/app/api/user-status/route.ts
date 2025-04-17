import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

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

    try {
      // Get the JWT session token using the edgeFunctions client
      const { data } = await edgeFunctions.users.getStatus(userId);
      
      // Enhanced debugging
      console.log('[API] Raw data from Edge Function:', JSON.stringify(data));
      
      // Check if user exists and has completed onboarding
      let onboardingCompleted = false;
      
      if (data) {
        const onboardingValue: unknown = data.onboardingCompleted;
        
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
      
      // Default to true if there's an error to prevent redirect loops in production
      const nextResponse = NextResponse.json(
        { onboardingCompleted: true },
        { status: 200 }
      );
      nextResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      nextResponse.headers.set('Pragma', 'no-cache');
      nextResponse.headers.set('Expires', '0');
      return nextResponse;
    }
  } catch (error) {
    console.error('[API] Error in user status route:', error);
    return NextResponse.json(
      { error: error.message || "Failed to check user status" },
      { status: error.status || 500 }
    );
  }
}

/**
 * Emergency fallback to edge function if needed
 * This should normally not be used, but is a fallback in case the database approach fails
 */
async function handleEdgeFunctionFallback(userId: string) {
  try {
    console.log('[API] Attempting edge function fallback for user:', userId);
    
    // Add cache-busting timestamp
    const timestamp = Date.now();
    
    // Get the Supabase URL and API key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Try to use the service role key first, then fall back to the anon key
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    
    if (!serviceRoleKey) {
      console.warn('[API] No service role key found, using anon key as fallback');
      serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!serviceRoleKey) {
        throw new Error('No Supabase API keys available');
      }
    }
    
    // Build the URL to the edge function
    const url = `${supabaseUrl}/functions/v1/api/users/${userId}/status?_t=${timestamp}`;
    
    console.log('[API] Edge function fallback URL:', url);
    
    // Make the request with explicit error handling
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Edge function error (${response.status}):`, errorText);
      
      // For all errors, default to not completed
      return NextResponse.json(
        { onboardingCompleted: false },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    
    // Parse the response
    const data = await response.json();
    console.log('[API] Edge function success response:', data);
    
    // Extract the onboarding completed status
    let onboardingCompleted = false;
    
    if (data && data.status === 'success' && data.data && data.data.onboardingCompleted !== undefined) {
      onboardingCompleted = !!data.data.onboardingCompleted;
    }
    
    // Return the response
    return NextResponse.json(
      { onboardingCompleted },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('[API] Edge function fallback error:', error);
    
    // If fallback fails, default to onboarding not completed
    return NextResponse.json(
      { onboardingCompleted: false },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
