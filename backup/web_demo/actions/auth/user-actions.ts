"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { User, UserWithMemberships, MembershipWithDetails, RoleName, UserInsert } from "@/types"
import { createClient } from "@supabase/supabase-js"

/**
 * Get the current authenticated user from Supabase using Clerk authentication
 */
export async function getCurrentUserAction(): Promise<ActionState<User>> {
  try {
    console.log("🔍 getCurrentUserAction: Starting user fetch...")
    
    const { userId, getToken } = await auth()
    console.log("🔍 Clerk userId:", userId)
    
    if (!userId) {
      console.log("❌ No userId from Clerk auth")
      return {
        isSuccess: false,
        message: "User not authenticated with Clerk"
      }
    }

    // Test if we can get a Clerk token
    try {
      const token = await getToken()
      console.log("🔍 Clerk token obtained:", token ? "✅ Yes" : "❌ No")
      if (token) {
        // Decode the token to see its structure (first part is header, second is payload)
        const parts = token.split('.')
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]))
            console.log("🔍 JWT payload:", {
              sub: payload.sub,
              role: payload.role,
              iat: payload.iat,
              exp: payload.exp
            })
          } catch (e) {
            console.log("🔍 Could not decode JWT payload")
          }
        }
      }
    } catch (tokenError) {
      console.error("❌ Error getting Clerk token:", tokenError)
    }

    // Use the correct 2025 approach with createServerSupabaseClient
    const supabase = createServerSupabaseClient()
    console.log("🔍 Supabase client created successfully")
    
    console.log("🔍 Querying users table with clerk_id:", userId)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    console.log("🔍 Supabase query result:", { user, error })

    if (error) {
      console.error("❌ Supabase error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      if (error.code === 'PGRST116') {
        console.log("❌ User not found in database - this is the main issue!")
        return {
          isSuccess: false,
          message: "User not found in database. The webhook might not have created the user yet, or Clerk third-party auth is not properly configured in Supabase."
        }
      }
      
      if (error.code === 'PGRST301') {
        console.log("❌ RLS policy blocking access - authentication issue!")
        return {
          isSuccess: false,
          message: "Access denied by Row Level Security. This suggests Clerk third-party auth is not properly configured in Supabase."
        }
      }
      
      return {
        isSuccess: false,
        message: `Failed to fetch user data: ${error.message} (Code: ${error.code})`
      }
    }

    console.log("✅ User found successfully:", user.email)
    return {
      isSuccess: true,
      message: "User retrieved successfully",
      data: user
    }
  } catch (error) {
    console.error('❌ Error in getCurrentUserAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get the current user with all their organization memberships and roles
 */
export async function getCurrentUserWithMembershipsAction(): Promise<ActionState<UserWithMemberships>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const userResult = await getUserByClerkIdAction(userId)
    
    if (!userResult.isSuccess || !userResult.data) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    return {
      isSuccess: true,
      message: "User with memberships retrieved successfully",
      data: userResult.data
    }
  } catch (error) {
    console.error('Error in getCurrentUserWithMembershipsAction:', error)
    return {
      isSuccess: false,
      message: "Failed to fetch user memberships"
    }
  }
}

/**
 * Get all organizations the current user belongs to
 */
export async function getUserOrganizationsAction(): Promise<ActionState<MembershipWithDetails[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // First get the user's internal ID
    const supabase = createServerSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Get user memberships with organization and role details
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select(`
        *,
        user:users(*),
        organization:organizations(*),
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching user organizations:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch user organizations"
      }
    }

    return {
      isSuccess: true,
      message: "User organizations retrieved successfully",
      data: memberships as MembershipWithDetails[]
    }
  } catch (error) {
    console.error('Error in getUserOrganizationsAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get the user's role in a specific organization
 */
export async function getUserRoleInOrganizationAction(organizationId: number): Promise<ActionState<RoleName | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    
    // First get the user's internal ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // Get the user's membership and role in the organization
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

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isSuccess: true,
          message: "User is not a member of this organization",
          data: null
        }
      }
      console.error('Error fetching user role:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch user role"
      }
    }

    // Get the highest role (assuming there could be multiple roles)
    const roles = membership.user_roles?.map((ur: any) => ur.role?.name as RoleName) || []
    const highestRole = roles.includes('system_admin') ? 'system_admin' :
                       roles.includes('client_admin') ? 'client_admin' :
                       roles.includes('client_team') ? 'client_team' : null

    return {
      isSuccess: true,
      message: "User role retrieved successfully",
      data: highestRole
    }
  } catch (error) {
    console.error('Error in getUserRoleInOrganizationAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Check if the current user exists in the database (for partial signup detection)
 */
export async function checkUserExistsAction(): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found - this is expected for partial signup
        return {
          isSuccess: true,
          message: "User does not exist in database",
          data: false
        }
      }
      console.error('Error checking user existence:', error)
      return {
        isSuccess: false,
        message: "Failed to check user existence"
      }
    }

    return {
      isSuccess: true,
      message: "User exists in database",
      data: true
    }
  } catch (error) {
    console.error('Error in checkUserExistsAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Create a new user in Supabase (typically called from webhook)
 */
export async function createSupabaseUserAction(
  clerkUserId: string, 
  email: string, 
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    const userData: UserInsert = {
      clerk_id: clerkUserId,
      email: email,
      first_name: firstName || null,
      last_name: lastName || null,
      avatar_url: avatarUrl || null,
      onboarding_completed: false, // Set default value for new field
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('Error creating Supabase user:', error)
      return {
        isSuccess: false,
        message: `Failed to create user: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "User created successfully",
      data
    }
  } catch (error) {
    console.error('Error creating Supabase user:', error)
    return {
      isSuccess: false,
      message: "Failed to create user"
    }
  }
}

/**
 * Create a new user in Supabase using secure database function (for webhooks)
 * This uses SECURITY DEFINER functions instead of service role key for better security
 */
export async function createSupabaseUserFromWebhookAction(
  clerkUserId: string, 
  email: string, 
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    // Use regular client with secure database function instead of service role
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('create_user_from_webhook', {
        p_clerk_id: clerkUserId,
        p_email: email,
        p_first_name: firstName || null,
        p_last_name: lastName || null,
        p_avatar_url: avatarUrl || null,
      })

    if (error) {
      console.error('Error creating Supabase user from webhook:', error)
      return {
        isSuccess: false,
        message: `Failed to create user: ${error.message}`
      }
    }

    // Database function returns an array, get the first result
    const user = data?.[0]
    if (!user) {
      return {
        isSuccess: false,
        message: "No user data returned from database function"
      }
    }

    return {
      isSuccess: true,
      message: "User created successfully from webhook",
      data: user
    }
  } catch (error) {
    console.error('Error creating Supabase user from webhook:', error)
    return {
      isSuccess: false,
      message: "Failed to create user"
    }
  }
}

/**
 * Get user by Clerk ID using Clerk authentication token
 */
export async function getSupabaseUser(clerkUserId: string, clerkToken?: string): Promise<User | null> {
  let supabase;
  
  if (clerkToken) {
    // Create Supabase client with Clerk token for RLS authentication
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const headers = new Headers(options.headers)
            headers.set('Authorization', `Bearer ${clerkToken}`)
            
            return fetch(url, {
              ...options,
              headers,
            })
          },
        },
      }
    )
  } else {
    // Fallback to regular client (for backwards compatibility)
    supabase = createServerSupabaseClient()
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // User not found
      return null
    }
    console.error('Error fetching Supabase user:', error)
    throw error
  }

  return data
}

/**
 * Update user in Supabase
 */
export async function updateSupabaseUserAction(
  clerkUserId: string,
  updates: Partial<UserInsert>
): Promise<ActionState<User>> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating Supabase user:', error)
      return {
        isSuccess: false,
        message: `Failed to update user: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "User updated successfully",
      data
    }
  } catch (error) {
    console.error('Error updating Supabase user:', error)
    return {
      isSuccess: false,
      message: "Failed to update user"
    }
  }
}

/**
 * Get user memberships (moved from lib/supabase.ts)
 */
export async function getUserMembershipsAction(userId: number): Promise<ActionState<MembershipWithDetails[]>> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        organization:organizations(*),
        user_roles(
          *,
          role:roles(*)
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user memberships:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch memberships: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Memberships retrieved successfully",
      data: data as MembershipWithDetails[]
    }
  } catch (error) {
    console.error('Error fetching user memberships:', error)
    return {
      isSuccess: false,
      message: "Failed to fetch memberships"
    }
  }
}

/**
 * Get user with all memberships by Clerk ID (moved from lib/supabase.ts)
 */
export async function getUserByClerkIdAction(clerkId: string): Promise<ActionState<UserWithMemberships | null>> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        memberships(
          *,
          organization:organizations(*),
          user_roles(
            *,
            role:roles(*)
          )
        )
      `)
      .eq('clerk_id', clerkId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isSuccess: true,
          message: "User not found",
          data: null
        }
      }
      console.error('Error fetching user with memberships:', error)
      return {
        isSuccess: false,
        message: `Failed to fetch user: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "User retrieved successfully",
      data: data as UserWithMemberships
    }
  } catch (error) {
    console.error('Error fetching user with memberships:', error)
    return {
      isSuccess: false,
      message: "Failed to fetch user"
    }
  }
}

/**
 * Check if current user needs onboarding (missing required profile info)
 * @param providedUserId - Optional userId to use instead of calling auth() (for middleware use)
 */
export async function checkUserNeedsOnboardingAction(providedUserId?: string): Promise<ActionState<boolean>> {
  try {
    let userId: string | null = null
    let clerkToken: string | null = null
    
    if (providedUserId) {
      userId = providedUserId
      // For middleware calls, we can't get the token easily, so we'll rely on the updated RLS policies
    } else {
      const authResult = await auth()
      userId = authResult.userId
      
      if (userId) {
        // Use default Clerk token (no need for Supabase template)
        clerkToken = await authResult.getToken()
      }
    }
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    const user = await getSupabaseUser(userId, clerkToken || undefined)
    
    if (!user) {
      return {
        isSuccess: false,
        message: "User not found in database"
      }
    }

    // User needs onboarding if onboarding_completed is false
    const needsOnboarding = !user.onboarding_completed
    
    return {
      isSuccess: true,
      message: needsOnboarding ? "User needs onboarding" : "User onboarding complete",
      data: needsOnboarding
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return {
      isSuccess: false,
      message: "Failed to check onboarding status"
    }
  }
}

/**
 * Complete user onboarding by updating profile information
 */
export async function completeOnboardingAction(
  firstName: string,
  lastName: string
): Promise<ActionState<User>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Not authenticated"
      }
    }

    // Validate input
    if (!firstName?.trim() || !lastName?.trim()) {
      return {
        isSuccess: false,
        message: "First name and last name are required"
      }
    }

    // Use secure database function to complete onboarding
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('complete_user_onboarding', {
        p_clerk_id: userId,
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
      })

    if (error) {
      console.error('Error completing onboarding:', error)
      return {
        isSuccess: false,
        message: `Failed to complete onboarding: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "Onboarding completed successfully", 
      data
    }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return {
      isSuccess: false,
      message: "Failed to complete onboarding"
    }
  }
}

/**
 * Update user in Supabase using secure database function (for webhooks)
 * This uses SECURITY DEFINER functions instead of service role key for better security
 */
export async function updateSupabaseUserFromWebhookAction(
  clerkUserId: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    // Use regular client with secure database function instead of service role
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('update_user_from_webhook', {
        p_clerk_id: clerkUserId,
        p_email: email || null,
        p_first_name: firstName || null,
        p_last_name: lastName || null,
        p_avatar_url: avatarUrl || null,
      })

    if (error) {
      console.error('Error updating Supabase user from webhook:', error)
      return {
        isSuccess: false,
        message: `Failed to update user: ${error.message}`
      }
    }

    // Database function returns an array, get the first result
    const user = data?.[0]
    if (!user) {
      return {
        isSuccess: false,
        message: "No user data returned from database function"
      }
    }

    return {
      isSuccess: true,
      message: "User updated successfully from webhook",
      data: user
    }
  } catch (error) {
    console.error('Error updating Supabase user from webhook:', error)
    return {
      isSuccess: false,
      message: "Failed to update user"
    }
  }
}

/**
 * Debug action to manually create a user for the current Clerk user
 * This helps us test if the issue is with user creation or authentication
 */
export async function createCurrentUserAction(): Promise<ActionState<User>> {
  try {
    console.log("🔧 createCurrentUserAction: Starting manual user creation...")
    
    const { userId } = await auth()
    console.log("🔧 Clerk userId:", userId)
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Check if user already exists
    const existingUserResult = await getCurrentUserAction()
    if (existingUserResult.isSuccess) {
      console.log("🔧 User already exists, no need to create")
      return existingUserResult
    }

    // Get user info from Clerk
    const clerkUser = await currentUser()
    console.log("🔧 Clerk user data:", {
      id: clerkUser?.id,
      emailAddresses: clerkUser?.emailAddresses?.map((e: any) => e.emailAddress),
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName
    })

    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return {
        isSuccess: false,
        message: "No email address found for user"
      }
    }

    // Create user manually
    const supabase = createServerSupabaseClient()
    const userData: UserInsert = {
      clerk_id: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      first_name: clerkUser.firstName || null,
      last_name: clerkUser.lastName || null,
      avatar_url: clerkUser.imageUrl || null,
      onboarding_completed: false,
    }

    console.log("🔧 Creating user with data:", userData)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating user:", error)
      return {
        isSuccess: false,
        message: `Failed to create user: ${error.message}`
      }
    }

    console.log("✅ User created successfully:", newUser)
    return {
      isSuccess: true,
      message: "User created successfully",
      data: newUser
    }

  } catch (error) {
    console.error('❌ Error in createCurrentUserAction:', error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
} 