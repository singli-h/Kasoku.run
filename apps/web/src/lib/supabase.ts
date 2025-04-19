"use client";

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Unauthenticated client (uses anon key only)
// Use this for public operations that don't require auth
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook to get an authenticated Supabase client.
 * Automatically includes the Clerk session JWT in all requests.
 * Use this client for operations that require authentication and proper RLS enforcement.
 */
export function useAuthenticatedSupabaseClient() {
  const { session } = useSession();
  
  // If no session exists, return the public client
  if (!session) {
    return supabase;
  }

  // Create a client that includes the auth token in all requests
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await session.getToken();
        
        if (token) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          options = { ...options, headers };
        }
        
        return fetch(url, options);
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

/**
 * @deprecated Use useAuthenticatedSupabaseClient() instead
 */
export function useBrowserSupabaseClient() {
  return useAuthenticatedSupabaseClient();
}

// Export the unauthenticated client as the default export
export default supabase; 