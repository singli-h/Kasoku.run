import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/[table]/[id]    - Fetch one record by its primary key `id`
 * PUT /api/[table]/[id]    - Update a record
 * DELETE /api/[table]/[id] - Remove a record
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { table: string; id: string } }
) {
  const { table, id } = params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 404 });
  }
  return NextResponse.json({ status: 'success', data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { table: string; id: string } }
) {
  const { table, id } = params;
  const body = await req.json();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from(table).update(body).eq('id', id).select();
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
  }
  return NextResponse.json({ status: 'success', data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { table: string; id: string } }
) {
  const { table, id } = params;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' }, { status: 204 });
} 