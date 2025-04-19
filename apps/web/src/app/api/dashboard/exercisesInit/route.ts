import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

/**
 * GET /api/dashboard/exercisesInit
 * Retrieves the athlete's latest session (ongoing/today/completed) or null.
 */
export async function GET(req: NextRequest) {
  // Enforce authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const clerkId = authResult;

  // Resolve athlete ID
  const { athleteId } = await getUserRoleData(clerkId);

  const supabase = createServerSupabaseClient();

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