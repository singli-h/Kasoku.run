"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { RoleName } from "@/types/database"

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
 * Check if the current user has a specific role in an organization
 */
export async function hasRoleAction(
  organizationId: number, 
  requiredRole: RoleName
): Promise<ActionState<boolean>> {
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
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: false
      }
    }

    // Check if user has the required role in the organization
    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !membership) {
      return {
        isSuccess: true,
        message: "User is not a member of this organization",
        data: false
      }
    }

    // Check if user has the required role
    const userRoles = membership.user_roles?.map((ur: any) => ur.role?.name as RoleName) || []
    const hasRole = userRoles.includes(requiredRole)

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
 * Check if the current user has admin privileges (system_admin or client_admin) in an organization
 */
export async function isAdminAction(organizationId: number): Promise<ActionState<boolean>> {
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
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: false
      }
    }

    // Check if user has admin roles in the organization
    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !membership) {
      return {
        isSuccess: true,
        message: "User is not a member of this organization",
        data: false
      }
    }

    // Check if user has admin roles
    const userRoles = membership.user_roles?.map((ur: any) => ur.role?.name as RoleName) || []
    const isAdmin = userRoles.includes('system_admin') || userRoles.includes('client_admin')

    return {
      isSuccess: true,
      message: isAdmin ? "User has admin privileges" : "User does not have admin privileges",
      data: isAdmin
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return {
      isSuccess: false,
      message: "Failed to check admin status"
    }
  }
}

/**
 * Check if the current user can access a specific organization
 */
export async function canAccessOrgAction(organizationId: number): Promise<ActionState<boolean>> {
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
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: false
      }
    }

    // Check if user is a member of the organization
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    const canAccess = !error && !!membership

    return {
      isSuccess: true,
      message: canAccess ? "User can access organization" : "User cannot access organization",
      data: canAccess
    }
  } catch (error) {
    console.error('Error checking organization access:', error)
    return {
      isSuccess: false,
      message: "Failed to check organization access"
    }
  }
}

/**
 * Get the current user's highest role in an organization
 */
export async function getUserHighestRoleAction(organizationId: number): Promise<ActionState<RoleName | null>> {
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
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: null
      }
    }

    // Get user's membership and roles in the organization
    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (error || !membership) {
      return {
        isSuccess: true,
        message: "User is not a member of this organization",
        data: null
      }
    }

    // Get the highest priority role (system_admin > client_admin > client_team)
    const userRoles = membership.user_roles?.map((ur: any) => ur.role?.name as RoleName) || []
    
    let highestRole: RoleName | null = null
    if (userRoles.includes('system_admin')) {
      highestRole = 'system_admin'
    } else if (userRoles.includes('client_admin')) {
      highestRole = 'client_admin'
    } else if (userRoles.includes('client_team')) {
      highestRole = 'client_team'
    }

    return {
      isSuccess: true,
      message: highestRole ? `User's highest role is ${highestRole}` : "User has no roles in this organization",
      data: highestRole
    }
  } catch (error) {
    console.error('Error getting user highest role:', error)
    return {
      isSuccess: false,
      message: "Failed to get user's highest role"
    }
  }
}

/**
 * Check if the current user is a system admin (across all organizations)
 */
export async function isSystemAdminAction(): Promise<ActionState<boolean>> {
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
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: false
      }
    }

    // Check if user has system_admin role in any organization
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*),
        membership:memberships(*)
      `)
      .eq('membership.user_id', user.id)
      .eq('role.name', 'system_admin')

    if (error) {
      console.error('Error checking system admin status:', error)
      return {
        isSuccess: false,
        message: "Failed to check system admin status"
      }
    }

    const isSystemAdmin = userRoles && userRoles.length > 0

    return {
      isSuccess: true,
      message: isSystemAdmin ? "User is a system admin" : "User is not a system admin",
      data: isSystemAdmin
    }
  } catch (error) {
    console.error('Error checking system admin status:', error)
    return {
      isSuccess: false,
      message: "Failed to check system admin status"
    }
  }
}

/**
 * Get all organizations where the user has a specific role
 */
export async function getOrganizationsWithRoleAction(role: RoleName): Promise<ActionState<number[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: []
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Get user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: true,
        message: "User not found in database",
        data: []
      }
    }

    // Get all memberships where user has the specified role
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select(`
        organization_id,
        user_roles!inner(
          role:roles!inner(name)
        )
      `)
      .eq('user_id', user.id)
      .eq('user_roles.role.name', role)

    if (error) {
      console.error('Error getting organizations with role:', error)
      return {
        isSuccess: false,
        message: "Failed to get organizations"
      }
    }

    const organizationIds = memberships?.map(membership => membership.organization_id) || []

    return {
      isSuccess: true,
      message: `Found ${organizationIds.length} organizations with ${role} role`,
      data: organizationIds
    }
  } catch (error) {
    console.error('Error getting organizations with role:', error)
    return {
      isSuccess: false,
      message: "Failed to get organizations"
    }
  }
}

/**
 * Validate if user has permission to perform an action on a resource
 */
export async function validatePermissionAction(
  organizationId: number,
  requiredRole: RoleName,
  resourceType?: string,
  resourceId?: number
): Promise<ActionState<boolean>> {
  try {
    // First check if user has the required role in the organization
    const roleCheck = await hasRoleAction(organizationId, requiredRole)
    
    if (!roleCheck.isSuccess) {
      return roleCheck
    }

    if (!roleCheck.data) {
      return {
        isSuccess: true,
        message: `User does not have required ${requiredRole} role`,
        data: false
      }
    }

    // Additional resource-specific checks can be added here
    // For example, checking if user owns a specific task, etc.
    
    return {
      isSuccess: true,
      message: "Permission validated successfully",
      data: true
    }
  } catch (error) {
    console.error('Error validating permission:', error)
    return {
      isSuccess: false,
      message: "Failed to validate permission"
    }
  }
} 