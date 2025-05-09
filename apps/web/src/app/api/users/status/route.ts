import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';
// Force dynamic server runtime to allow headers and prevent static prerendering errors
export const dynamic = 'force-dynamic';

/**
 * GET /api/users/status
 * Returns the authenticated user's onboarding and subscription status.
 */
export async function GET(req: NextRequest) {
  try {
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
      // No user record yet: treat as not onboarded
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          status: 'success',
          data: { onboarding_completed: false, subscription_status: null }
        }, { status: 200 });
      }
      console.error('[API] Error fetching user status:', error);
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'success', data: user });
  } catch (err: any) {
    console.error('[API] Unexpected error in GET /api/users/status:', err);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
} 