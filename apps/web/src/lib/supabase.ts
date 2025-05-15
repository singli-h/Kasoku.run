// Removed "use client" to allow server-side imports

import { createBrowserClient } from "@supabase/ssr";
import { createClient, SupabaseClientOptions } from "@supabase/supabase-js";
import { useSession } from '@clerk/nextjs';
import { useMemo } from 'react';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// The Clerk documentation refers to this as SUPABASE_KEY, ensure it's the public ANON key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Unauthenticated singleton instance - for cases where no user session is expected or needed.
const unauthenticatedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook to get an authenticated Supabase client using Clerk's native integration.
 * The Supabase client is configured to use Clerk session tokens directly.
 */
export function useAuthenticatedSupabaseClient() {
  const { session, isLoaded, isSignedIn } = useSession();
  
  return useMemo(() => {
    if (!isLoaded) {
      console.log("[SupabaseClient] Clerk session not yet loaded. Returning unauthenticated client.");
      return unauthenticatedSupabaseClient; 
    }
    
    if (!isSignedIn || !session) {
      console.log("[SupabaseClient] User not signed in or no Clerk session. Returning unauthenticated client.");
      return unauthenticatedSupabaseClient;
    }

    console.log("[SupabaseClient] Clerk session active. Creating Supabase client with Clerk accessToken factory.");
    
    // Define the options for the Supabase client
    // Explicitly type the auth options to help with type checking
    const options: SupabaseClientOptions<"public"> = {
      auth: {
        // autoRefreshToken: true, // Default
        // persistSession: true,   // Default
        // detectSessionInUrl: true, // Default
        // As per Clerk's documentation for native Supabase integration:
        // Provide an async function that returns the Clerk token.
        // @ts-ignore // Ignore if type doesn't explicitly list accessToken but Clerk docs say to use it.
        accessToken: async () => {
          try {
            const token = await session.getToken(); // Fetches Clerk's standard token
            if (!token) {
              console.warn("[SupabaseClient.accessToken] Clerk session active but no token found.");
              return null;
            }
            return token;
          } catch (error) {
            console.error('[SupabaseClient.accessToken] Error fetching Clerk token:', error);
            return null;
          }
        },
      },
      // global: { // Not using global headers for auth token if accessToken in auth options is used
      //   headers: { Authorization: `Bearer ${initialToken}` }, // Only if initial token known and static
      // }
    };

    return createClient(supabaseUrl, supabaseAnonKey, options);

  }, [session, isLoaded, isSignedIn]);
}

/**
 * @deprecated Use useAuthenticatedSupabaseClient() which now implements the recommended native Clerk integration.
 */
export function useBrowserSupabaseClient() {
  console.warn("`useBrowserSupabaseClient` is deprecated. Use `useAuthenticatedSupabaseClient` instead.")
  return useAuthenticatedSupabaseClient();
}

// Export the unauthenticated singleton client as the default export
// This might be useful for parts of the app that don't require authentication
// or before the auth state is known.
export default unauthenticatedSupabaseClient;

/**
 * Client-side Supabase client (for use in client components)
 * This creates a basic client without Clerk authentication, similar to the default export.
 * Consider if this is still needed or if `useAuthenticatedSupabaseClient` (which falls back to unauth) is sufficient.
 */
export const createBrowserSupabaseClient = () => {
  console.log("[Supabase] createBrowserSupabaseClient (basic, unauthenticated) called.")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
/**
 * Server-side Supabase client (for use in API route handlers or Server Components)
 * This version uses the SERVICE_ROLE_KEY for admin-level access and should ONLY be used server-side.
 * It is NOT directly related to the Clerk client-side authentication discussed here.
 */
export function createServerSupabaseClient() {
  // Ensure this is only called server-side by checking for the service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. createServerSupabaseClient is for server-side use with admin privileges only.");
  }
  if (typeof window !== 'undefined') {
    throw new Error("createServerSupabaseClient should not be called on the client-side.");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for server-side admin actions
    { auth: { persistSession: false } } // Typically no session persistence for service role clients
  );
} 