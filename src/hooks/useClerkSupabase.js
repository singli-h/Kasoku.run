"use client";

import { useSession } from "@clerk/nextjs";
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
  
  return supabase;
} 