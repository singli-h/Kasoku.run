import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile record.
 */
export async function GET(req: NextRequest) {
  // Enforce Clerk auth
  const authResult = await requireAuth();
  console.log('[API/users/profile] requireAuth returned:', authResult);
  if (authResult instanceof NextResponse) return authResult;
  const clerkId = authResult;
  console.log('[API/users/profile] clerkId:', clerkId);

  // Try header-injected role data to avoid extra RPC
  console.log('[API/users/profile] raw header x-kasoku-userrole:', req.headers.get('x-kasoku-userrole'));
  let roleData = getRoleDataFromHeader(req);
  if (!roleData) roleData = await getUserRoleData(clerkId);
  console.log('[API/users/profile] roleData used:', roleData);
  const { userId, role, athleteId, coachId } = roleData;

  try {
    const supabase = createServerSupabaseClient();
    console.log('[API/users/profile] created Supabase client; service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    // Fetch basic user fields including role and birthdate
    console.log('[API/users/profile] querying users table with id:', userId);
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, username, avatar_url, subscription_status, timezone, metadata, birthdate, role')
      .eq('id', userId)
      .single();
    console.log('[API/users/profile] supabase user response:', { user, userErr });
    if (userErr) {
      console.error('[API] Error fetching user profile:', userErr);
      return NextResponse.json({ status: 'error', message: userErr.message }, { status: 500 });
    }

    // Assemble role-specific data
    let roleSpecificData: any = null;
    if (role === 'athlete' && athleteId) {
      const { data: athlete, error: athErr } = await supabase
        .from('athletes')
        .select('height, weight, training_goals, experience, events')
        .eq('id', athleteId)
        .single();
      if (athErr) {
        console.error('[API] Error fetching athlete data:', athErr);
      } else {
        roleSpecificData = {
          height: athlete.height,
          weight: athlete.weight,
          training_goals: athlete.training_goals,
          training_history: athlete.experience,
          events: athlete.events,
        };
      }
    } else if (role === 'coach' && coachId) {
      const { data: coach, error: coachErr } = await supabase
        .from('coaches')
        .select('speciality, experience, philosophy, sport_focus')
        .eq('id', coachId)
        .single();
      if (coachErr) {
        console.error('[API] Error fetching coach data:', coachErr);
      } else {
        roleSpecificData = {
          specialization: coach.speciality,
          experience: coach.experience,
          philosophy: coach.philosophy,
          sport_focus: coach.sport_focus,
        };
      }
    }

    // Return combined profile
    return NextResponse.json({ status: 'success', data: { ...user, role, roleSpecificData } }, { status: 200 });
  } catch (error: any) {
    console.error('[API] Unexpected error in profile retrieval:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
} 