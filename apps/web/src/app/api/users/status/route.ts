import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/users/status
 * Returns the authenticated user's onboarding and subscription status.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const clerkId = authResult;

  const supabase = createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('onboarding_completed, subscription_status')
    .eq('clerk_id', clerkId)
    .single();

  if (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'success', data: user });
} 