"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { auth } from "@clerk/nextjs/server"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database"

export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never }

/**
 * Create or update user record in Supabase using Clerk data
 */
export async function upsertUserAction(
  userData: Partial<TablesInsert<'users'>>
): Promise<ActionState<Tables<'users'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('clerk_id', userId)
        .select()
        .single()

      if (error) throw error

      return {
        isSuccess: true,
        message: "User updated successfully",
        data
      }
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          clerk_id: userId
        })
        .select()
        .single()

      if (error) throw error

      return {
        isSuccess: true,
        message: "User created successfully",
        data
      }
    }
  } catch (error) {
    console.error("Error upserting user:", error)
    return { isSuccess: false, message: "Failed to save user data" }
  }
}

/**
 * Get current user data from Supabase
 */
export async function getCurrentUserAction(): Promise<ActionState<Tables<'users'> | null>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return {
      isSuccess: true,
      message: data ? "User found" : "User not found",
      data: data || null
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return { isSuccess: false, message: "Failed to get user data" }
  }
}

/**
 * Update user profile data
 */
export async function updateUserProfileAction(
  updates: TablesUpdate<'users'>
): Promise<ActionState<Tables<'users'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('clerk_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Profile updated successfully",
      data
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { isSuccess: false, message: "Failed to update profile" }
  }
}

/**
 * Complete user onboarding
 */
export async function completeOnboardingAction(): Promise<ActionState<Tables<'users'>>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "User not authenticated" }
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('clerk_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      isSuccess: true,
      message: "Onboarding completed successfully",
      data
    }
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return { isSuccess: false, message: "Failed to complete onboarding" }
  }
} 