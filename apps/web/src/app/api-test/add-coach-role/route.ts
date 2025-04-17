import { NextRequest, NextResponse } from 'next/server';
import { fetchFromEdgeFunction } from '@/lib/edge-functions';

export async function GET(request: NextRequest) {
  try {
    // Get clerk_id from query params
    const clerkId = request.nextUrl.searchParams.get('clerk_id');
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Missing clerk_id parameter" },
        { status: 400 }
      );
    }
    
    console.log(`[Add Coach Role] Processing request for clerk_id: ${clerkId}`);
    
    // First, get the user profile to check current status
    const profileResponse = await fetchFromEdgeFunction(`/api/users/${clerkId}/profile`);
    
    if (!profileResponse?.data?.user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = profileResponse.data.user;
    console.log(`[Add Coach Role] Found user: ${user.first_name} ${user.last_name}, ID: ${user.id}`);
    
    // Check if coach record already exists
    let coachId = null;
    if (profileResponse.data.role === 'coach' && profileResponse.data.roleSpecificData) {
      coachId = profileResponse.data.roleSpecificData.id;
      console.log(`[Add Coach Role] User already has coach role with ID: ${coachId}`);
    }
    
    // If coach record already exists, just return it
    if (coachId) {
      return NextResponse.json({
        success: true,
        message: "User already has coach role",
        user: user,
        coach: profileResponse.data.roleSpecificData
      });
    }
    
    // Otherwise, create a coach record
    console.log(`[Add Coach Role] Creating coach record for user ID: ${user.id}`);
    
    // Update user's metadata to include coach role
    const userUpdate = await fetchFromEdgeFunction(`/api/users/${clerkId}`, {
      method: 'PUT',
      body: {
        clerk_id: clerkId,
        metadata: {
          ...user.metadata,
          role: 'coach'
        }
      }
    });
    
    console.log(`[Add Coach Role] Updated user metadata:`, userUpdate);
    
    // Create a coach record directly in Supabase
    const coachCreate = await fetchFromEdgeFunction(`/api/coaches`, {
      method: 'POST',
      body: {
        user_id: user.id,
        speciality: 'Sprint Training',
        experience: '12+ years',
        philosophy: 'asrgakjsrgbl',
        sport_focus: 'Running'
      }
    });
    
    console.log(`[Add Coach Role] Created coach record:`, coachCreate);
    
    // Get updated profile
    const updatedProfile = await fetchFromEdgeFunction(`/api/users/${clerkId}/profile`);
    
    return NextResponse.json({
      success: true,
      message: "Coach role added successfully",
      user: updatedProfile.data.user,
      coach: updatedProfile.data.roleSpecificData
    });
  } catch (error: any) {
    console.error(`[Add Coach Role] Error:`, error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to add coach role",
        details: error.data || {}
      },
      { status: error.status || 500 }
    );
  }
} 