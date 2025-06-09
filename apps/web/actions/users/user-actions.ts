"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"

export interface UserProfileData {
  firstName?: string
  lastName?: string
  email?: string
  sex?: 'M' | 'F' | 'OTHER'
  birthdate?: string
  timezone: string
  role: 'athlete' | 'coach'
  avatarUrl?: string
  metadata?: Record<string, any>
}

/**
 * Get user profile data from Supabase
 */
export async function getUserProfileAction(): Promise<ActionState<any>> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        athletes(*),
        coaches(*)
      `)
      .eq('clerk_id', clerkId)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return { isSuccess: false, message: "Failed to fetch user profile" }
    }

    return {
      isSuccess: true,
      message: "User profile fetched successfully",
      data: user
    }
  } catch (error) {
    console.error("Error in getUserProfileAction:", error)
    return { isSuccess: false, message: "An unexpected error occurred" }
  }
}

/**
 * Update user profile data
 */
export async function updateUserProfileAction(
  profileData: Partial<UserProfileData>
): Promise<ActionState<any>> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (profileData.firstName) updateData.first_name = profileData.firstName
    if (profileData.lastName) updateData.last_name = profileData.lastName
    if (profileData.email) updateData.email = profileData.email
    if (profileData.sex) updateData.sex = profileData.sex
    if (profileData.birthdate) updateData.birthdate = profileData.birthdate
    if (profileData.timezone) updateData.timezone = profileData.timezone
    if (profileData.role) updateData.role = profileData.role
    if (profileData.avatarUrl) updateData.avatar_url = profileData.avatarUrl
    if (profileData.metadata) updateData.metadata = profileData.metadata

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_id', clerkId)
      .select()
      .single()

    if (error) {
      console.error("Error updating user profile:", error)
      return { isSuccess: false, message: "Failed to update user profile" }
    }

    return {
      isSuccess: true,
      message: "User profile updated successfully",
      data
    }
  } catch (error) {
    console.error("Error in updateUserProfileAction:", error)
    return { isSuccess: false, message: "An unexpected error occurred" }
  }
}

/**
 * Complete user onboarding
 */
export async function completeOnboardingAction(): Promise<ActionState<any>> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return { isSuccess: false, message: "Not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update({ 
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkId)
      .select()
      .single()

    if (error) {
      console.error("Error completing onboarding:", error)
      return { isSuccess: false, message: "Failed to complete onboarding" }
    }

    return {
      isSuccess: true,
      message: "Onboarding completed successfully",
      data
    }
  } catch (error) {
    console.error("Error in completeOnboardingAction:", error)
    return { isSuccess: false, message: "An unexpected error occurred" }
  }
} 