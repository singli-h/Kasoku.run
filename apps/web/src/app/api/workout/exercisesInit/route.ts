import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getRoleDataFromHeader } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/workout/exercisesInit
 * Retrieves the athlete's latest session (ongoing/today/completed) or null.
 */
export async function GET(req: NextRequest) {
  // Enforce authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const clerkId = authResult;

  // Initialize Supabase and resolve athlete profile (includes coaches with athlete entries)
  const supabase = createServerSupabaseClient();
  const roleData = await getUserRoleData(clerkId);
  const userId = roleData.userId;
  const { data: athlete, error: athleteError } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (athleteError || !athlete) {
    return NextResponse.json(
      { status: 'error', message: 'No athlete profile found for user' },
      { status: 403 }
    );
  }
  const athleteId = athlete.id;

  // Timezone support via query param
  const timezone = req.nextUrl.searchParams.get('timezone') || 'UTC';

  // 1) Check for ongoing session
  const { data: ongoing, error: ongoingError } = await supabase
    .from('exercise_training_sessions')
    .select(
      `*,
       exercise_preset_groups (
         *,
         exercise_presets (
           *,
           exercises (*),
           exercise_training_details (*)
         )
       )`
    )
    .eq('athlete_id', athleteId)
    .eq('status', 'ongoing')
    .order('date_time', { ascending: false })
    .limit(1);
  if (ongoingError) {
    return NextResponse.json({ status: 'error', message: ongoingError.message }, { status: 500 });
  }
  if (ongoing && ongoing.length > 0) {
    return NextResponse.json({
      status: 'success',
      data: { session: { type: 'ongoing', details: ongoing[0] } },
      metadata: { timestamp: new Date().toISOString(), timezone }
    });
  }

  // 2) Check for today's assigned session
  const localNow = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const startOfDay = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  const endOfDay = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 23, 59, 59, 999);
  const { data: today, error: todayError } = await supabase
    .from('exercise_training_sessions')
    .select(
      `*,
       exercise_preset_groups (
         *,
         exercise_presets (
           *,
           exercises (*),
           exercise_preset_details (*)
         )
       )`
    )
    .eq('athlete_id', athleteId)
    .gte('date_time', startOfDay.toISOString())
    .lte('date_time', endOfDay.toISOString())
    .limit(1);
  if (todayError) {
    return NextResponse.json({ status: 'error', message: todayError.message }, { status: 500 });
  }
  if (today && today.length > 0) {
    return NextResponse.json({
      status: 'success',
      data: { session: { type: 'assigned', details: today[0] } },
      metadata: { timestamp: new Date().toISOString(), timezone }
    });
  }

  // 2.5) Check for next pending (future) session
  const { data: upcoming, error: upcomingError } = await supabase
    .from('exercise_training_sessions')
    .select(
      `*,
       exercise_preset_groups (
         *,
         exercise_presets (
           *,
           exercises (*),
           exercise_preset_details (*)
         )
       )`
    )
    .eq('athlete_id', athleteId)
    .eq('status', 'pending')
    .gt('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(1);
  if (upcomingError) {
    return NextResponse.json({ status: 'error', message: upcomingError.message }, { status: 500 });
  }
  if (upcoming && upcoming.length > 0) {
    return NextResponse.json({
      status: 'success',
      data: { session: { type: 'pending', details: upcoming[0] } },
      metadata: { timestamp: new Date().toISOString(), timezone }
    });
  }

  // 3) Fetch last completed session in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: completed, error: completedError } = await supabase
    .from('exercise_training_sessions')
    .select(
      `*,
       exercise_preset_groups (
         *,
         exercise_presets (
           *,
           exercises (*),
           exercise_training_details (*)
         )
       )`
    )
    .eq('athlete_id', athleteId)
    .eq('status', 'completed')
    .gte('date_time', sevenDaysAgo)
    .order('date_time', { ascending: false })
    .limit(1);
  if (completedError) {
    return NextResponse.json({ status: 'error', message: completedError.message }, { status: 500 });
  }
  if (completed && completed.length > 0) {
    return NextResponse.json({
      status: 'success',
      data: { session: { type: 'completed', details: completed[0] } },
      metadata: { timestamp: new Date().toISOString(), timezone }
    });
  }

  // 4) No session found
  return NextResponse.json({
    status: 'success',
    data: { session: { type: null, details: null } },
    metadata: { timestamp: new Date().toISOString(), timezone }
  });
} 