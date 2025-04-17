import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';
import { z } from 'zod';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

// Define the onboarding data schema
const OnboardingSchema = z.object({
  role: z.enum(['athlete', 'coach'], {
    required_error: "Role must be either 'athlete' or 'coach'"
  }),
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  metadata: z.record(z.unknown()).optional(),
  // Add any other required fields
}).strict();

/**
 * POST /api/onboarding/user
 * This endpoint creates or updates a user's profile and creates role-specific records
 */
export async function POST(request: NextRequest) {
  try {
    // Get the clerk user ID from auth session
    const { userId } = await auth();
    
    // Allow unauthenticated requests for testing
    const isTestingMode = process.env.NODE_ENV === 'development';
    
    if (!userId && !isTestingMode) {
      console.log('[API] Unauthorized onboarding attempt');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }
    
    // Get and validate the request data
    const userData = await request.json();
    
    try {
      // Validate the request data
      const validatedData = OnboardingSchema.parse(userData);
      console.log('[API] Onboarding data validated successfully');
      
      // Use clerk_id from auth if available, otherwise use the one from the body
      const clerkId = userId || userData.clerk_id;
      
      if (!clerkId) {
        return NextResponse.json(
          { error: "Missing clerk_id - user must be authenticated or provide clerk_id in request body" },
          { status: 400 }
        );
      }
      
      // Ensure clerk_id is included in the data sent to edge function
      const enrichedData = {
        ...validatedData,
        clerk_id: clerkId
      };
      
      console.log(`[API] Sending onboarding data for user ${clerkId}:`, JSON.stringify({
        role: enrichedData.role,
        email: enrichedData.email,
        metadata: enrichedData.metadata
      }));
      
      // Call the edge function
      const { data } = await edgeFunctions.users.onboard(enrichedData);
      
      console.log(`[API] Onboarding response:`, JSON.stringify(data));
      
      // Return success response with cache control headers
      const response = NextResponse.json(data, { status: 201 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    } catch (validationError) {
      console.error(`[API] Validation error in onboarding:`, validationError);
      return NextResponse.json(
        { 
          error: "Invalid onboarding data",
          details: validationError.errors || validationError.message
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error(`[API] Unexpected error in onboarding API:`, error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: error.status || 500 }
    );
  }
} 