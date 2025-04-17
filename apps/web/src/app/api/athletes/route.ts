import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';
import { z } from 'zod';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

// Define the athlete data schema
const AthleteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  // Add other required fields
}).strict();

/**
 * GET /api/athletes
 * Fetches all athletes from the Supabase Edge Function
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      console.log('[API] Unauthorized access attempt to athletes');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    console.log('[API] Fetching athletes from Edge Function');
    const { data } = await edgeFunctions.athletes.getAll();
    
    console.log('[API] Successfully fetched athletes');
    
    // Return with cache control headers
    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[API] Error fetching athletes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athletes' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/athletes
 * Creates a new athlete via the Supabase Edge Function
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      console.log('[API] Unauthorized attempt to create athlete');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    try {
      const validatedData = AthleteSchema.parse(body);
      console.log('[API] Athlete data validated successfully');
      
      // Add clerk_id to the data
      const enrichedData = {
        ...validatedData,
        clerk_id: userId
      };

      // Create athlete via edge function
      const { data } = await edgeFunctions.athletes.create(enrichedData);
      console.log('[API] Successfully created athlete');
      
      // Return success response
      return NextResponse.json(data, { status: 201 });
    } catch (validationError) {
      console.error('[API] Athlete data validation failed:', validationError);
      return NextResponse.json(
        { error: "Invalid athlete data", details: validationError.errors },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('[API] Error creating athlete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create athlete' },
      { status: error.status || 500 }
    );
  }
} 