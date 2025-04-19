import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/events
 * Returns a list of all events sorted by name.
 */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'success', data: events });
} 