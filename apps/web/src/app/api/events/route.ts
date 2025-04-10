import { NextResponse } from "next/server";

/**
 * Handle GET requests to /api/events
 * 
 * This API route proxies the request to the Supabase Edge Function
 * for fetching track and field events.
 */
export async function GET() {
  try {
    // Forward the request to the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api/events`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch events" },
        { status: response.status }
      );
    }

    // Get the response from the edge function
    const data = await response.json();

    // Return the response from the edge function
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Error in events API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 