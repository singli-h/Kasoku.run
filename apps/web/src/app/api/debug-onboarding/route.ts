import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

/**
 * GET /api/debug-onboarding
 * Debug endpoint to check onboarding status directly
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

    // Call Edge Function to get direct database results
    console.log('[Debug] Checking onboarding status for user:', userId);
    const userData = await edgeFunctions.users.checkOnboarding(`${userId}?timestamp=${Date.now()}`);
    
    // Get raw SQL results with full user data
    console.log('[Debug] Getting full user data for debugging');
    const fullUserData = await fetchFromEdgeFunction(userId);
    
    return NextResponse.json({
      userId,
      rawResponse: userData,
      fullUserData,
      message: "Check browser console for detailed logs"
    }, { status: 200 });
  } catch (error) {
    console.error('[Debug] Error checking status:', error);
    return NextResponse.json({ error: "Error checking status" }, { status: 500 });
  }
}

/**
 * POST /api/debug-onboarding
 * Debug endpoint to force update onboarding status to completed
 */
export async function POST() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Call direct SQL function to force update onboarding status
    console.log('[Debug] Forcing onboarding status to completed for user:', userId);
    const result = await forceOnboardingCompleted(userId);
    
    return NextResponse.json({
      userId,
      result,
      message: "Onboarding status has been force-updated to completed"
    }, { status: 200 });
  } catch (error) {
    console.error('[Debug] Error updating status:', error);
    return NextResponse.json({ error: "Error updating status" }, { status: 500 });
  }
}

// Helper function to fetch full user data
async function fetchFromEdgeFunction(clerkId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/users?clerk_id=eq.${clerkId}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  
  return await response.json();
}

// Helper function to force update onboarding status
async function forceOnboardingCompleted(clerkId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/users?clerk_id=eq.${clerkId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update: ${response.status}`);
  }
  
  return await response.json();
} 