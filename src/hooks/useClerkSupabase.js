"use client";

import { useSession, useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClientSideClerkSupabaseClient } from "@/lib/supabase";

/**
 * Hook to create a Supabase client with Clerk authentication
 * 
 * This hook should be used in client components that need
 * to make authenticated requests to Supabase.
 * 
 * @returns {Object} Supabase client with Clerk authentication
 */
export default function useClerkSupabase() {
  const { session } = useSession();
  const { user } = useUser();
  
  // Create a Supabase client with Clerk authentication
  const supabase = useMemo(() => {
    const getToken = async () => {
      try {
        return session ? await session.getToken({ template: "supabase" }) : null;
      } catch (error) {
        console.error("Error getting token:", error);
        return null;
      }
    };
    
    return createClientSideClerkSupabaseClient(getToken);
  }, [session]);
  
  // Helper to get the current user by clerk_id
  const getCurrentUser = async () => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };
  
  return {
    supabase,
    getCurrentUser,
    clerkUserId: user?.id
  };
} 