"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Organization, 
  OrganizationInsert,
  MembershipInsert,
  UserRoleInsert
} from "@/types"
import type { OrganizationWizardData } from "@/components/features/organization/types"

/**
 * Create organization and set up initial team structure from wizard data
 */
export async function createOrganizationFromWizardAction(
  wizardData: OrganizationWizardData
): Promise<ActionState<Organization>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Use secure database function following 2025 best practices
    // This bypasses RLS policies and ensures atomic operation
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('create_organization_with_admin', {
        p_clerk_id: userId,
        p_organization_name: wizardData.companyName.trim(),
      })

    if (error) {
      console.error('Error creating organization:', error)
      return {
        isSuccess: false,
        message: `Failed to create organization: ${error.message}`
      }
    }

    if (!data || data.length === 0) {
      return {
        isSuccess: false,
        message: "No organization data returned from database function"
      }
    }

    // Extract organization data from function result
    const orgResult = data[0]
    const organization: Organization = {
      id: orgResult.organization_id,
      name: orgResult.organization_name,
      stripe_customer_id: null, // Will be set when user subscribes
      subscription_status: null, // Will be set when user subscribes
      created_at: orgResult.organization_created_at,
      updated_at: orgResult.organization_created_at
    }

    return {
      isSuccess: true,
      message: "Organization created successfully",
      data: organization
    }
  } catch (error) {
    console.error('Error in createOrganizationFromWizardAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Send team invitations (placeholder for MVP - using simple email validation)
 * In a full implementation, this would integrate with Clerk's organization invitations
 */
export async function sendTeamInvitationsAction(
  organizationId: number,
  teamMembers: { email: string; role: 'client_admin' | 'client_team' }[]
): Promise<ActionState<{ invitationsSent: number }>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // For MVP: Just validate emails and return success
    // In production: Integrate with Clerk's organization invitation system
    const validEmails = teamMembers.filter(member => 
      member.email.includes('@') && member.email.includes('.')
    )

    if (validEmails.length !== teamMembers.length) {
      return {
        isSuccess: false,
        message: "Some email addresses are invalid"
      }
    }

    // TODO: Implement actual Clerk organization invitations
    // await clerkClient.organizations.createOrganizationInvitation({
    //   organizationId: clerkOrgId,
    //   emailAddress: member.email,
    //   role: member.role === 'client_admin' ? 'admin' : 'basic_member'
    // })

    return {
      isSuccess: true,
      message: `${validEmails.length} invitation(s) will be sent`,
      data: { invitationsSent: validEmails.length }
    }
  } catch (error) {
    console.error('Error in sendTeamInvitationsAction:', error)
    return {
      isSuccess: false,
      message: "Failed to send invitations"
    }
  }
}

/**
 * Validate company name availability
 */
export async function validateCompanyNameAction(
  companyName: string
): Promise<ActionState<{ isAvailable: boolean }>> {
  try {
    // Use direct client for read-only operations 
    // This is safe and doesn't require SECURITY DEFINER functions
    const supabase = createServerSupabaseClient()
    
    const { data: existingOrg, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', companyName.trim())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking company name:', error)
      return {
        isSuccess: false,
        message: "Failed to validate company name"
      }
    }

    const isAvailable = !existingOrg

    return {
      isSuccess: true,
      message: isAvailable ? "Company name is available" : "Company name is already taken",
      data: { isAvailable }
    }
  } catch (error) {
    console.error('Error in validateCompanyNameAction:', error)
    return {
      isSuccess: false,
      message: "Failed to validate company name"
    }
  }
} 