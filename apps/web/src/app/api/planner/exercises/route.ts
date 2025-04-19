import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/planner/exercises
 * Returns all exercises with their associated types.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServerSupabaseClient();
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select(
      `
      id,
      name,
      description,
      exercise_type (
        id,
        name,
        description
      )`
    )
    .order('name');

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }

  // Format nested type
  const list = exercises ?? [];
  const formatted = list.map((ex: any) => ({
    id: ex.id,
    name: ex.name,
    description: ex.description,
    type: {
      id: ex.exercise_type.id,
      name: ex.exercise_type.name,
      description: ex.exercise_type.description,
    }
  }));

  return NextResponse.json({ status: 'success', data: { exercises: formatted } });
} 