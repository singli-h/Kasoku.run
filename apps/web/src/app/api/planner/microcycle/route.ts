import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getUserRoleData } from '@/lib/roles';

// Type definitions for better type safety
interface ExercisePresetRecord {
  exercise_preset_group_id: number;
  exercise_id: number;
  superset_id?: number | null;
  preset_order: number;
  notes?: string | null;
  [key: string]: any; // Allow other properties
}

interface ExercisePresetDetailRecord {
  exercise_preset_id: number;
  set_index: number;
  reps?: number | null;
  weight?: number | null;
  resistance?: number | null;
  resistance_unit_id?: number | null;
  distance?: number | null;
  height?: number | null;
  tempo?: string | null;
  rest_time?: number | null;
  power?: number | null;
  velocity?: number | null;
  effort?: number | null;
  performing_time?: number | null;
  metadata?: any;
  [key: string]: any; // Allow other properties
}

// Normalize camelCase keys to snake_case
function normalizeParameters(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (params.clerkId) result.clerk_id = params.clerkId;
  if (params.coachId) result.coach_id = params.coachId;
  if (params.startDate) result.start_date = params.startDate;
  if (params.endDate) result.end_date = params.endDate;
  if (params.athleteGroupId) result.athlete_group_id = params.athleteGroupId;
  if (params.mesocycleId) result.mesocycle_id = params.mesocycleId;
  for (const key in params) {
    if (!key.endsWith('Id') && !key.endsWith('Date')) {
      result[key] = params[key];
    }
  }
  return result;
}

/**
 * POST /api/planner/microcycle
 * Create a microcycle with nested sessions, presets, and details.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const clerkId = auth;

  const { role, coachId } = await getUserRoleData(clerkId);
  if (role !== 'coach') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  try {
    let data = await req.json();
    data = normalizeParameters(data);
    const { name, description, start_date: startDate, end_date: endDate, mesocycle_id: mesoId, athlete_group_id: athleteGroupId, sessions = [] } = data;
    
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // 1) Insert microcycle
    const { data: microcycle, error: mcErr } = await supabase
      .from('microcycles')
      .insert({ name, description, start_date: startDate, end_date: endDate, mesocycle_id: mesoId, coach_id: coachId })
      .select()
      .single();
    if (mcErr || !microcycle) throw mcErr;

    const groups: any[] = [];
    const presets: any[] = [];
    const details: any[] = [];

    // 2) Process each session
    for (const [idx, session] of sessions.entries()) {
      const { name: sName, description: sDesc, date, exercises = [] } = session;
      
      // Insert exercise_preset_group for this session
      const { data: grp, error: gErr } = await supabase
        .from('exercise_preset_groups')
        .insert({ 
          name: sName,
          description: sDesc,
          week: 1,
          day: idx + 1,
          date,
          coach_id: coachId,
          athlete_group_id: athleteGroupId,
          microcycle_id: microcycle.id
        })
        .select()
        .single();
      
      if (gErr || !grp) throw gErr;
      groups.push(grp);

      // 3) Process exercises - Collect all preset records for bulk insert
      const presetRecords: ExercisePresetRecord[] = exercises.map((ex, i) => ({
        exercise_preset_group_id: grp.id,
        exercise_id: ex.exercise_id || ex.exerciseId,  // Support both naming formats
        superset_id: ex.superset_id || ex.supersetId,  // Support both naming formats
        preset_order: ex.position !== undefined ? ex.position : (ex.preset_order || ex.presetOrder || i),  // Prioritize position for superset ordering
        notes: ex.notes
      }));

      // Bulk insert all presets for this group
      if (presetRecords.length > 0) {
        const { data: insertedPresets, error: presetsError } = await supabase
          .from('exercise_presets')
          .insert(presetRecords)
          .select();
          
        if (presetsError) throw presetsError;
        if (insertedPresets) {
          presets.push(...insertedPresets);
        
          // 4) Process all preset details - Collect for bulk insert
          const detailRecords: ExercisePresetDetailRecord[] = [];
          
          // For each exercise/preset
          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            const preset = insertedPresets[i];
            
            if (preset && preset.id && ex.presetDetails && Array.isArray(ex.presetDetails)) {
              // Map each preset detail to proper DB fields
              const exerciseDetails = ex.presetDetails.map(det => ({
                exercise_preset_id: preset.id,
                set_index: det.set_number || det.setNumber,  // Support both formats
                reps: det.reps,
                // Direct mappings for all table fields
                weight: det.weight,
                resistance: det.resistance,
                resistance_unit_id: det.resistance_unit_id || det.resistanceUnitId,
                distance: det.distance,
                height: det.height,
                tempo: det.tempo,
                rest_time: det.rest_time,
                power: det.power,
                velocity: det.velocity,
                effort: det.effort, 
                performing_time: det.performing_time,
                metadata: det.metadata
              }));
              
              detailRecords.push(...exerciseDetails);
            }
          }
          
          // Bulk insert all details if we have any
          if (detailRecords.length > 0) {
            const { data: insertedDetails, error: detailsError } = await supabase
              .from('exercise_preset_details')
              .insert(detailRecords)
              .select();
              
            if (detailsError) throw detailsError;
            if (insertedDetails) {
              details.push(...insertedDetails);
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      data: { 
        microcycle, 
        groups, 
        presets, 
        details 
      } 
    }, { status: 201 });
    
  } catch (err: any) {
    console.error('Error creating microcycle:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 