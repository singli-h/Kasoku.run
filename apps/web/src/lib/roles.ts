import { createServerSupabaseClient } from "@/lib/supabase";

export type UserRoleData = {
  userId: number;
  role: string;
  athleteId?: number;
  athleteGroupId?: number;
  coachId?: number;
};

/**
 * Fetches user, role, and associated athlete/coach IDs via a single RPC.
 */
export async function getUserRoleData(clerkId: string): Promise<UserRoleData> {
  console.log('[Roles] getUserRoleData called with clerkId:', clerkId);
  const supabase = createServerSupabaseClient();
  // Call database function to retrieve all relevant IDs in one go
  const { data, error } = await supabase.rpc('get_user_role_data', { _clerk_id: clerkId });
  if (error) {
    console.error('RPC get_user_role_data error:', error);
    throw error;
  }
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error('User not found');
  }
  const row = data[0] as any;
  return {
    userId: row.user_id,
    role: row.role,
    athleteId: row.athlete_id || undefined,
    athleteGroupId: row.athlete_group_id || undefined,
    coachId: row.coach_id || undefined,
  };
} 