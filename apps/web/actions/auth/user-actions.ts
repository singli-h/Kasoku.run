"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// Import user types from database
type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

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

    // Optional diagnostics during development only
    if (process.env.NODE_ENV === "development") {
      try {
        const token = await getToken()
        console.log("🔍 Clerk token obtained:", token ? "✅ Yes" : "❌ No")
      } catch (tokenError) {
        console.error("❌ Error getting Clerk token:", tokenError)
      }
    }

    // Use the correct 2025 approach with createServerSupabaseClient
    // Using singleton supabase client and cached user lookup
    console.log("🔍 Supabase client created successfully")
    
    const dbUserId = await getDbUserId(userId)
    console.log("🔍 Querying users table with db user id:", dbUserId)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
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
 * Check if the current user exists in the database
 */
export async function checkUserExistsAction(): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: true,
        message: "User not authenticated",
        data: false
      }
    }

    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(userId)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', dbUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user existence:', error)
      return {
        isSuccess: false,
        message: "Failed to check user existence"
      }
    }

    return {
      isSuccess: true,
      message: user ? "User exists in database" : "User does not exist in database",
      data: !!user
    }
  } catch (error) {
    console.error('Error in checkUserExistsAction:', error)
    return {
      isSuccess: false,
      message: "Failed to check user existence"
    }
  }
}

/**
 * Create a new user in Supabase from Clerk data
 */
export async function createSupabaseUserAction(
  clerkUserId: string, 
  email: string, 
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    // Using singleton supabase client

    const userData: UserInsert = {
      clerk_id: clerkUserId,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      avatar_url: avatarUrl || null,
      username: email.split('@')[0], // Use email prefix as default username
      role: 'athlete', // Default role
      subscription_status: 'trial',
      timezone: 'UTC',
      onboarding_completed: false
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return {
        isSuccess: false,
        message: `Failed to create user: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "User created successfully",
      data: user
    }
  } catch (error) {
    console.error('Error in createSupabaseUserAction:', error)
    return {
      isSuccess: false,
      message: "Failed to create user"
    }
  }
}

/**
 * Create a new user from webhook data (used by Clerk webhooks)
 */
export async function createSupabaseUserFromWebhookAction(
  clerkUserId: string, 
  email: string, 
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    // Check if user already exists
    const existsResult = await checkUserExistsAction()
    if (existsResult.isSuccess && existsResult.data) {
      // User already exists, return existing user
      const userResult = await getCurrentUserAction()
      if (userResult.isSuccess) {
        return userResult
      }
    }

    // Create new user
    return await createSupabaseUserAction(clerkUserId, email, firstName, lastName, avatarUrl)
  } catch (error) {
    console.error('Error in createSupabaseUserFromWebhookAction:', error)
    return {
      isSuccess: false,
      message: "Failed to create user from webhook"
    }
  }
}

/**
 * Update user information in Supabase
 */
export async function updateSupabaseUserAction(
  clerkUserId: string,
  updates: Partial<UserInsert>
): Promise<ActionState<User>> {
  try {
    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(clerkUserId)

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', dbUserId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return {
        isSuccess: false,
        message: `Failed to update user: ${error.message}`
      }
    }

    return {
      isSuccess: true,
      message: "User updated successfully",
      data: user
    }
  } catch (error) {
    console.error('Error in updateSupabaseUserAction:', error)
    return {
      isSuccess: false,
      message: "Failed to update user"
    }
  }
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkIdAction(clerkId: string): Promise<ActionState<User | null>> {
  try {
    // Using singleton supabase client and cached user lookup
    const dbUserId = await getDbUserId(clerkId)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbUserId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user by Clerk ID:', error)
      return {
        isSuccess: false,
        message: "Failed to fetch user"
      }
    }

    return {
      isSuccess: true,
      message: user ? "User found" : "User not found",
      data: user || null
    }
  } catch (error) {
    console.error('Error in getUserByClerkIdAction:', error)
    return {
      isSuccess: false,
      message: "Failed to fetch user"
    }
  }
}

/**
 * Check if the current user needs onboarding
 */
export async function checkUserNeedsOnboardingAction(providedUserId?: string): Promise<ActionState<boolean>> {
  try {
    let userId = providedUserId
    
    if (!userId) {
      const { userId: authUserId } = await auth()
      userId = authUserId || undefined
    }
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const userResult = await getUserByClerkIdAction(userId)
    
    if (!userResult.isSuccess || !userResult.data) {
      return {
        isSuccess: true,
        message: "User not found, needs onboarding",
        data: true
      }
    }

    const needsOnboarding = !userResult.data.onboarding_completed

    return {
      isSuccess: true,
      message: needsOnboarding ? "User needs onboarding" : "User has completed onboarding",
      data: needsOnboarding
    }
  } catch (error) {
    console.error('Error in checkUserNeedsOnboardingAction:', error)
    return {
      isSuccess: false,
      message: "Failed to check onboarding status"
    }
  }
}

/**
 * Complete user onboarding
 */
export async function completeOnboardingAction(
  firstName: string,
  lastName: string,
  role?: string
): Promise<ActionState<User>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const updates: Partial<UserInsert> = {
      first_name: firstName,
      last_name: lastName,
      onboarding_completed: true
    }

    if (role) {
      updates.role = role as string
    }

    return await updateSupabaseUserAction(userId, updates)
  } catch (error) {
    console.error('Error in completeOnboardingAction:', error)
    return {
      isSuccess: false,
      message: "Failed to complete onboarding"
    }
  }
}

/**
 * Update user from webhook (used by Clerk webhooks)
 */
export async function updateSupabaseUserFromWebhookAction(
  clerkUserId: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
): Promise<ActionState<User>> {
  try {
    const updates: Partial<UserInsert> = {}
    
    if (email) updates.email = email
    if (firstName) updates.first_name = firstName
    if (lastName) updates.last_name = lastName
    if (avatarUrl) updates.avatar_url = avatarUrl

    return await updateSupabaseUserAction(clerkUserId, updates)
  } catch (error) {
    console.error('Error in updateSupabaseUserFromWebhookAction:', error)
    return {
      isSuccess: false,
      message: "Failed to update user from webhook"
    }
  }
}

/**
 * Create current user if they don't exist
 */
export async function createCurrentUserAction(): Promise<ActionState<User>> {
  try {
    const { userId } = await auth()
    const clerkUser = await currentUser()
    
    if (!userId || !clerkUser) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    // Check if user already exists
    const existsResult = await checkUserExistsAction()
    if (existsResult.isSuccess && existsResult.data) {
      // User exists, return current user
      return await getCurrentUserAction()
    }

    // Create new user
    return await createSupabaseUserAction(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || '',
      clerkUser.firstName || undefined,
      clerkUser.lastName || undefined,
      clerkUser.imageUrl || undefined
    )
  } catch (error) {
    console.error('Error in createCurrentUserAction:', error)
    return {
      isSuccess: false,
      message: "Failed to create current user"
    }
  }
}

// Extended type for user with profile relations
type Athlete = Database['public']['Tables']['athletes']['Row']
type Coach = Database['public']['Tables']['coaches']['Row']
type AthleteGroup = Database['public']['Tables']['athlete_groups']['Row']

export type UserWithProfile = User & {
  athlete?: (Athlete & { athlete_group?: AthleteGroup | null }) | null
  coach?: Coach | null
}

/**
 * Get the current user with athlete and coach profile data
 */
export async function getCurrentUserWithProfileAction(): Promise<ActionState<UserWithProfile>> {
  try {
    console.log("🔍 getCurrentUserWithProfileAction: Starting user with profile fetch...")

    const { userId } = await auth()

    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated with Clerk"
      }
    }

    const dbUserId = await getDbUserId(userId)

    // Fetch user with athlete and coach profiles in a single query
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        athlete:athletes(
          *,
          athlete_group:athlete_groups(*)
        ),
        coach:coaches(*)
      `)
      .eq('id', dbUserId)
      .single()

    if (error) {
      console.error("❌ Error fetching user with profile:", error)

      if (error.code === 'PGRST116') {
        return {
          isSuccess: false,
          message: "User not found in database"
        }
      }

      return {
        isSuccess: false,
        message: `Failed to fetch user data: ${error.message}`
      }
    }

    // Transform the response to match expected type
    // Supabase returns arrays for one-to-one relations when using select
    const userWithProfile: UserWithProfile = {
      ...user,
      athlete: Array.isArray(user.athlete) ? user.athlete[0] || null : user.athlete,
      coach: Array.isArray(user.coach) ? user.coach[0] || null : user.coach
    }

    console.log("✅ User with profile fetched successfully")
    return {
      isSuccess: true,
      message: "User with profile retrieved successfully",
      data: userWithProfile
    }
  } catch (error) {
    console.error('❌ Error in getCurrentUserWithProfileAction:', error)
    return {
      isSuccess: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 