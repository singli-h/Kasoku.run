import { NextResponse } from 'next/server';
import { edgeFunctions } from '@/lib/edge-functions';

/**
 * GET /api/athletes
 * Fetches all athletes from the Supabase Edge Function
 */
export async function GET() {
  try {
    console.log('[API] Fetching athletes from Edge Function');
    const data = await edgeFunctions.athletes.getAll();
    
    console.log('[API] Successfully fetched athletes');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error fetching athletes:', error);
    
    // Return appropriate error response
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
export async function POST(request: Request) {
  try {
    console.log('[API] Creating new athlete via Edge Function');
    const body = await request.json();
    const data = await edgeFunctions.athletes.create(body);
    
    console.log('[API] Successfully created athlete');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error creating athlete:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      { error: error.message || 'Failed to create athlete' },
      { status: error.status || 500 }
    );
  }
} 