import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { edgeFunctions } from '@/lib/edge-functions';

// Configure this route for dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Fetches all events from the Supabase Edge Function
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    if (!userId) {
      console.log('[API] Unauthorized access attempt to events');
      return NextResponse.json(
        { error: "Unauthorized - User not authenticated" },
        { status: 401 }
      );
    }

    console.log('[API] Fetching events from Edge Function');
    const { data } = await edgeFunctions.events.getAll();
    
    console.log('[API] Successfully fetched events');
    
    // Return with cache control headers
    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: error.status || 500 }
    );
  }
} 