import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET  /api/[table]    -> list all records
 * POST /api/[table]    -> insert one or more records
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const { table } = params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 'success', data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { table: string } }
) {
  const { table } = params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const records = Array.isArray(body) ? body : [body];
  const { data, error } = await supabase.from(table).insert(records).select();
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
  return NextResponse.json({ status: 'success', data }, { status: 201 });
} 