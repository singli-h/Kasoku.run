import { NextResponse } from 'next/server';
import { edgeFunctions } from '@/lib/edge-functions';

/**
 * GET /api/events
 * Fetches all events from the Supabase Edge Function
 */
export async function GET() {
  try {
    console.log('[API] Fetching events from Edge Function');
    const data = await edgeFunctions.events.getAll();
    
    console.log('[API] Successfully fetched events');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: error.status || 500 }
    );
  }
} 