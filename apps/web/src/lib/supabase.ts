"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { useSession } from '@clerk/nextjs';
import { useMemo } from 'react';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Singleton instance - only create once
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook to get an authenticated Supabase client.
 * Wraps the singleton client with Clerk authentication.
 * Only attaches auth headers once the session is fully ready.
 */
export function useAuthenticatedSupabaseClient() {
  const { session, isLoaded, isSignedIn } = useSession();
  
  return useMemo(() => {
    // Don't try to use the session until Clerk has fully loaded
    if (!isLoaded) {
      console.log("[Supabase] Clerk session not yet loaded, using unauthenticated client");
      return supabaseClient;
    }
    
    // If user is not signed in, return the unauthenticated client
    if (!isSignedIn || !session) {
      console.log("[Supabase] User not signed in, using unauthenticated client");
      return supabaseClient;
    }

    console.log("[Supabase] Creating authenticated client with Clerk session");
    
    // Create a client with auth configuration
    // We use the same URL and key but with custom fetch behavior
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          try {
            const token = await session.getToken();
            if (token) {
              const headers = new Headers(options.headers);
              headers.set('Authorization', `Bearer ${token}`);
              options = { ...options, headers };
              
              // Debug log to confirm token is being added to the request
              console.debug("[Supabase] Adding auth token to request:", url);
            } else {
              console.warn("[Supabase] Session exists but no token available");
            }
            return fetch(url, options);
          } catch (error) {
            console.error('[Supabase] Error getting auth token:', error);
            return fetch(url, options);
          }
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    });
  }, [session, isLoaded, isSignedIn]);
}

/**
 * @deprecated Use useAuthenticatedSupabaseClient() instead
 */
export function useBrowserSupabaseClient() {
  return useAuthenticatedSupabaseClient();
}

// Export the unauthenticated singleton client as the default export
export default supabaseClient;

/**
 * Client-side Supabase client (for use in client components)
 */
export const createBrowserSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

/**
 * Server-side Supabase client (for use in API route handlers)
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
} 