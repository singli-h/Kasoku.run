/**
 * Clerk helper functions
 * 
 * Contains utilities for working with Clerk authentication and user data
 */
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

/**
 * Synchronizes a Clerk user profile to Supabase
 * 
 * This ensures that the user's profile exists in our database
 * and is kept up-to-date with their authentication info.
 * 
 * @param clerkId - The Clerk user ID
 * @param userData - User data from Clerk (optional)
 * @returns The Supabase user data or null if there was an error
 */
export async function syncUserToProfile(
  clerkId: string, 
  userData?: { 
    firstName?: string | null; 
    lastName?: string | null; 
    email?: string | null; 
    imageUrl?: string | null;
    metadata?: {
      public?: any;
      private?: any;
      unsafe?: any;
    };
  }
) {
  try {
    // Check if user already exists in our database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error fetching user:", fetchError);
      return null;
    }
    
    const user = {
      clerk_id: clerkId,
      name: [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || null,
      email: userData?.email || '',
      avatar_url: userData?.imageUrl || '',
      metadata: userData?.metadata || {},
      // Don't overwrite existing values for these fields
      ...(existingUser && {
        username: existingUser.username,
        sex: existingUser.sex,
        birthdate: existingUser.birthdate,
        subscription_status: existingUser.subscription_status,
        timezone: existingUser.timezone,
        onboarding_completed: existingUser.onboarding_completed,
        created_at: existingUser.created_at,
      }),
      // Always update these fields
      updated_at: new Date().toISOString(),
    };
    
    // If user exists, update it, otherwise create it
    if (existingUser) {
      const { data, error } = await supabase
        .from('users')
        .update(user)
        .eq('clerk_id', clerkId)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating user:", error);
        return null;
      }
      
      return data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...user,
          username: userData?.email?.split('@')[0] || `user_${Date.now()}`, // Generate a username
          subscription_status: 'free',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating user:", error);
        return null;
      }
      
      return data;
    }
  } catch (error) {
    console.error("Error in syncUserToProfile:", error);
    return null;
  }
}

/**
 * Gets the current user authentication info
 * 
 * @returns The current user auth object or null
 */
export async function getCurrentAuth() {
  try {
    return await auth();
  } catch (error) {
    console.error("Error in getCurrentAuth:", error);
    return null;
  }
} 