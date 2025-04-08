import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Handle GET requests to /api/user-status
 * 
 * This API route returns the user's onboarding status from Supabase
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

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the users table to check onboarding status
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error("Supabase query error:", error);
      
      // If the error is because the user doesn't exist yet, return a specific status
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { exists: false, onboardingCompleted: false },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      onboardingCompleted: data?.onboarding_completed || false
    });
    
  } catch (error: any) {
    console.error("Error in user status API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 