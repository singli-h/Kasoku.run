import { NextResponse } from "next/server";

/**
 * Handle GET requests to /api/events
 * 
 * This API route proxies the request to the Supabase Edge Function
 * for fetching track and field events.
 */
export async function GET() {
  try {
    console.log("API route: Fetching events from Supabase edge function");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Forward the request to the Supabase Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/api/events`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      }
    );

    // Log the response status
    console.log(`Edge function response status: ${response.status}`);

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to fetch events";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      console.error(`Error from edge function: ${errorMessage}`);
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Get the response from the edge function
    const data = await response.json();
    console.log("Successfully fetched events from edge function");

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