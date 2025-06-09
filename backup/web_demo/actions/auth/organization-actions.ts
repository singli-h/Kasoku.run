"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Organization, 
  OrganizationInsert, 
  OrganizationUpdate,
  Membership, 
  MembershipInsert,
  UserRole,
  UserRoleInsert,
  Role,
  RoleName 
} from "@/types"

/**
 * Create a new organization
 */
export async function createOrganizationAction(
  organizationData: OrganizationInsert
): Promise<ActionState<Organization>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Create the organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert(organizationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating organization:', error)
      return {
        isSuccess: false,
        message: "Failed to create organization"
      }
    }

    return {
      isSuccess: true,
      message: "Organization created successfully",
      data: organization
    }
  } catch (error) {
    console.error('Error in createOrganizationAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Update an existing organization
 */
export async function updateOrganizationAction(
  orgId: number,
  updates: OrganizationUpdate
): Promise<ActionState<Organization>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Update the organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return {
        isSuccess: false,
        message: "Failed to update organization"
      }
    }

    return {
      isSuccess: true,
      message: "Organization updated successfully",
      data: organization
    }
  } catch (error) {
    console.error('Error in updateOrganizationAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationAction(orgId: number): Promise<ActionState<Organization>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Organization not found"
        }
      }
      console.error('Error fetching organization:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch organization"
      }
    }

    return {
      isSuccess: true,
      message: "Organization retrieved successfully",
      data: organization
    }
  } catch (error) {
    console.error('Error in getOrganizationAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Create a membership (add user to organization)
 */
export async function createMembershipAction(
  membershipData: MembershipInsert
): Promise<ActionState<Membership>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Check if membership already exists
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
              .eq('organization_id', membershipData.organization_id)
      .eq('user_id', membershipData.user_id)
      .single()

    if (existingMembership) {
      return {
        isSuccess: false,
        message: "User is already a member of this organization"
      }
    }

    // Create the membership
    const { data: membership, error } = await supabase
      .from('memberships')
      .insert(membershipData)
      .select()
      .single()

    if (error) {
      console.error('Error creating membership:', error)
      return {
        isSuccess: false,
        message: "Failed to create membership"
      }
    }

    return {
      isSuccess: true,
      message: "Membership created successfully",
      data: membership
    }
  } catch (error) {
    console.error('Error in createMembershipAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Remove a membership (remove user from organization)
 */
export async function removeMembershipAction(membershipId: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Delete the membership (this will cascade delete user_roles)
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId)

    if (error) {
      console.error('Error removing membership:', error)
      return {
        isSuccess: false,
        message: "Failed to remove membership"
      }
    }

    return {
      isSuccess: true,
      message: "Membership removed successfully",
      data: undefined
    }
  } catch (error) {
    console.error('Error in removeMembershipAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Assign a role to a user in an organization
 */
export async function assignRoleAction(
  membershipId: number,
  roleId: number
): Promise<ActionState<UserRole>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Check if role assignment already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('membership_id', membershipId)
      .eq('role_id', roleId)
      .single()

    if (existingRole) {
      return {
        isSuccess: false,
        message: "User already has this role"
      }
    }

    const userRoleData: UserRoleInsert = {
      membership_id: membershipId,
      role_id: roleId
    }

    // Create the role assignment
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .insert(userRoleData)
      .select()
      .single()

    if (error) {
      console.error('Error assigning role:', error)
      return {
        isSuccess: false,
        message: "Failed to assign role"
      }
    }

    return {
      isSuccess: true,
      message: "Role assigned successfully",
      data: userRole
    }
  } catch (error) {
    console.error('Error in assignRoleAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Remove a role from a user in an organization
 */
export async function removeRoleAction(userRoleId: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // Delete the role assignment
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', userRoleId)

    if (error) {
      console.error('Error removing role:', error)
      return {
        isSuccess: false,
        message: "Failed to remove role"
      }
    }

    return {
      isSuccess: true,
      message: "Role removed successfully",
      data: undefined
    }
  } catch (error) {
    console.error('Error in removeRoleAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get all available roles
 */
export async function getRolesAction(): Promise<ActionState<Role[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching roles:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch roles"
      }
    }

    return {
      isSuccess: true,
      message: "Roles retrieved successfully",
      data: roles
    }
  } catch (error) {
    console.error('Error in getRolesAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get role by name
 */
export async function getRoleByNameAction(roleName: RoleName): Promise<ActionState<Role>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    const { data: role, error } = await supabase
      .from('roles')
      .select('*')
      .eq('name', roleName)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "Role not found"
        }
      }
      console.error('Error fetching role:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch role"
      }
    }

    return {
      isSuccess: true,
      message: "Role retrieved successfully",
      data: role
    }
  } catch (error) {
    console.error('Error in getRoleByNameAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get organization members with their roles
 */
export async function getOrganizationMembersAction(orgId: number): Promise<ActionState<any[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    const { data: members, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user:users(*),
        user_roles(
          *,
          role:roles(*)
        )
      `)
              .eq('organization_id', orgId)

    if (error) {
      console.error('Error fetching organization members:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch organization members"
      }
    }

    return {
      isSuccess: true,
      message: "Organization members retrieved successfully",
      data: members
    }
  } catch (error) {
    console.error('Error in getOrganizationMembersAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Set organization context for RLS policies
 */
export async function setOrganizationContextAction(orgId: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase.rpc('set_organization_context', { organization_id: orgId })
    
    if (error) {
      console.error('Error setting organization context:', error)
      return {
        isSuccess: false,
        message: "Failed to set organization context"
      }
    }

    return {
      isSuccess: true,
      message: "Organization context set successfully",
      data: undefined
    }
  } catch (error) {
    console.error('Error in setOrganizationContextAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
} 