"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { ActionState } from "@/actions/auth/user-actions"

export type UserRoleData = {
  userId: number;
  role: string;
  athleteId?: number;
  athleteGroupId?: number;
  coachId?: number;
};

/**
 * Get user role data for the current authenticated user
 */
export async function getCurrentUserRoleDataAction(): Promise<ActionState<UserRoleData>> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    return await getUserRoleDataAction(clerkId)
  } catch (error) {
    console.error("Error getting current user role data:", error)
    return { isSuccess: false, message: "Failed to get user role data" }
  }
}

/**
 * Get user role data by Clerk ID
 */
export async function getUserRoleDataAction(clerkId: string): Promise<ActionState<UserRoleData>> {
  try {
    console.log('[Role Actions] getUserRoleData called with clerkId:', clerkId);
    const supabase = createServerSupabaseClient();
    
    // Call database function to retrieve all relevant IDs in one go
    const { data, error } = await supabase.rpc('get_user_role_data', { _clerk_id: clerkId });
    
    if (error) {
      console.error('RPC get_user_role_data error:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { isSuccess: false, message: "User not found" }
    }
    
    const row = data[0] as any;
    const roleData: UserRoleData = {
      userId: row.user_id,
      role: row.role,
      athleteId: row.athlete_id || undefined,
      athleteGroupId: row.athlete_group_id || undefined,
      coachId: row.coach_id || undefined,
    };

    return {
      isSuccess: true,
      message: "User role data retrieved successfully",
      data: roleData
    }
  } catch (error) {
    console.error("Error getting user role data:", error)
    return { isSuccess: false, message: "Failed to get user role data" }
  }
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use getCurrentUserRoleDataAction or getUserRoleDataAction instead
 */
export async function getUserRoleData(clerkId: string): Promise<UserRoleData> {
  console.warn("getUserRoleData is deprecated. Use getUserRoleDataAction instead.");
  const result = await getUserRoleDataAction(clerkId);
  if (!result.isSuccess) {
    throw new Error(result.message);
  }
  return result.data;
} 