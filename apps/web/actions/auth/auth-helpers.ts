"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { RoleName } from "@/types/database"

/**
 * Authentication helper functions for Kasoku running website
 * Simplified athlete/coach role system without organizations
 */

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticatedAction(): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    return {
      isSuccess: true,
      message: userId ? "User is authenticated" : "User is not authenticated",
      data: !!userId
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return {
      isSuccess: false,
      message: "Failed to check authentication status"
    }
  }
}

/**
 * Check if the current user has a specific role (athlete, coach, admin)
 */
export async function hasRoleAction(requiredRole: RoleName): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: false
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user's role from the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: false
      }
    }

    const hasRole = user.role === requiredRole

    return {
      isSuccess: true,
      message: hasRole ? `User has ${requiredRole} role` : `User does not have ${requiredRole} role`,
      data: hasRole
    }
  } catch (error) {
    console.error('Error checking user role:', error)
    return {
      isSuccess: false,
      message: "Failed to check user role"
    }
  }
}

/**
 * Check if the current user has admin privileges
 */
export async function isAdminAction(): Promise<ActionState<boolean>> {
  return hasRoleAction('admin')
}

/**
 * Check if the current user is a coach
 */
export async function isCoachAction(): Promise<ActionState<boolean>> {
  return hasRoleAction('coach')
}

/**
 * Check if the current user is an athlete
 */
export async function isAthleteAction(): Promise<ActionState<boolean>> {
  return hasRoleAction('athlete')
}

/**
 * Get the current user's role
 */
export async function getUserRoleAction(): Promise<ActionState<RoleName | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: null
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user's role from the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: null
      }
    }

    return {
      isSuccess: true,
      message: `User role: ${user.role}`,
      data: user.role as RoleName
    }
  } catch (error) {
    console.error('Error getting user role:', error)
    return {
      isSuccess: false,
      message: "Failed to get user role"
    }
  }
}

/**
 * Check if the current user can access athlete data (coach or admin)
 */
export async function canAccessAthleteDataAction(): Promise<ActionState<boolean>> {
  try {
    const roleResult = await getUserRoleAction()
    
    if (!roleResult.isSuccess || !roleResult.data) {
      return {
        isSuccess: true,
        message: "User role not found",
        data: false
      }
    }

    const canAccess = roleResult.data === 'coach' || roleResult.data === 'admin'

    return {
      isSuccess: true,
      message: canAccess ? "User can access athlete data" : "User cannot access athlete data",
      data: canAccess
    }
  } catch (error) {
    console.error('Error checking athlete data access:', error)
    return {
      isSuccess: false,
      message: "Failed to check athlete data access"
    }
  }
}

/**
 * Get the current user's profile with role information
 */
export async function getUserProfileAction(): Promise<ActionState<{ role: RoleName; profile: any } | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: null
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user's basic profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Get role-specific profile data
    let roleProfile = null
    if (user.role === 'athlete') {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user.id)
        .single()
      roleProfile = athlete
    } else if (user.role === 'coach') {
      const { data: coach } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single()
      roleProfile = coach
    }

    return {
      isSuccess: true,
      message: "User profile retrieved successfully",
      data: {
        role: user.role as RoleName,
        profile: {
          ...user,
          roleSpecific: roleProfile
        }
      }
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return {
      isSuccess: false,
      message: "Failed to get user profile"
    }
  }
}

/**
 * Validate user permissions for a specific action
 */
export async function validatePermissionAction(
  requiredRole: RoleName,
  resourceType?: string,
  resourceId?: number
): Promise<ActionState<boolean>> {
  try {
    const roleResult = await hasRoleAction(requiredRole)
    
    if (!roleResult.isSuccess) {
      return {
        isSuccess: false,
        message: "Failed to check user permissions"
      }
    }

    // For now, just check the basic role requirement
    // In the future, this could be extended to check resource-specific permissions
    return {
      isSuccess: true,
      message: roleResult.data ? "Permission granted" : "Permission denied",
      data: roleResult.data
    }
  } catch (error) {
    console.error('Error validating permissions:', error)
    return {
      isSuccess: false,
      message: "Failed to validate permissions"
    }
  }
} 