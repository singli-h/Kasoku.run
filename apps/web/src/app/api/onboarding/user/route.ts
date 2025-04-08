import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Handle POST requests to /api/onboarding/user
 * 
 * This API route proxies the request to the Supabase Edge Function
 * for handling user onboarding.
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

    // Get the request body
    const body = await request.json();
    
    // Make sure clerk_id matches the authenticated user
    if (body.clerk_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID mismatch" },
        { status: 403 }
      );
    }

    // Forward the request to the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/onboarding/user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    // Get the response from the edge function
    const data = await response.json();

    // Return the response from the edge function
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error in onboarding API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 