import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { fetchFromEdgeFunction } from '@/lib/edge-functions';

export const dynamic = 'force-dynamic';

/**
 * Helper API route that adds coach role to the current user and creates a coach record
 * This is for testing purposes only
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - User not authenticated" }, { status: 401 });
    }
    
    console.log(`[DEBUG] Attempting to add coach role to user: ${userId}`);
    
    // 1. Get the current user profile
    const profileUrl = `/api/users/${userId}/profile?_t=${Date.now()}`;
    const profileResponse = await fetchFromEdgeFunction(profileUrl);
    
    console.log(`[DEBUG] Current user profile:`, profileResponse);
    
    if (!profileResponse?.data?.user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    
    const user = profileResponse.data.user;
    const userData = {
      clerk_id: userId,
      email: user.email,
      username: user.username || userId,
      first_name: user.first_name || 'Test',
      last_name: user.last_name || 'Coach',
      role: 'coach',
      metadata: {
        ...user.metadata,
        role: 'coach'
      },
      coach_specialization: 'Running',
      coach_sport_focus: 'Track',
      coach_experience: '5+',
      coach_philosophy: 'Testing philosophy',
      onboarding_completed: true
    };
    
    // 2. Call the onboarding API to update the user and create coach record
    try {
      const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const onboardingData = await onboardingResponse.json();
      
      if (!onboardingResponse.ok) {
        console.error(`[DEBUG] Error updating user:`, onboardingData);
        return NextResponse.json({ 
          error: "Failed to update user", 
          details: onboardingData 
        }, { status: 500 });
      }
      
      // 3. Check if the coach record was created
      const updatedProfileUrl = `/api/users/${userId}/profile?_t=${Date.now() + 1}`;
      const updatedProfile = await fetchFromEdgeFunction(updatedProfileUrl);
      
      console.log(`[DEBUG] Updated user profile:`, updatedProfile);
      
      return NextResponse.json({
        success: true,
        message: "Successfully added coach role and created coach record",
        originalProfile: profileResponse.data,
        updatedProfile: updatedProfile.data,
        onboardingResponse: onboardingData
      });
    } catch (error) {
      console.error(`[DEBUG] Error calling onboarding API:`, error);
      return NextResponse.json({ 
        error: "Error updating user with coach role", 
        details: error 
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`[DEBUG] Unexpected error:`, error);
    return NextResponse.json({ 
      error: "An unexpected error occurred", 
      details: error 
    }, { status: 500 });
  }
} 