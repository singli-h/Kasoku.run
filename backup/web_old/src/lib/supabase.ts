/*
  ⚠️ DEPRECATED FILE - MIGRATING TO NEW 2025 IMPLEMENTATION
  
  This file is being replaced by the new 2025 Supabase + Clerk integration:
  
  🔄 REPLACEMENT FILES:
  - Server-side: @/lib/supabase-server.ts
  - Client-side: @/lib/supabase-client.ts
  - Actions: @/actions/[domain]/[name]-actions.ts
  
  🚨 DO NOT USE THIS FILE FOR NEW CODE!
  
  This file remains temporarily for backward compatibility while migrating
  existing components to use the new server actions pattern.
*/

// Removed "use client" to allow server-side imports

import { createBrowserClient as supabaseCreateBrowserClient } from "@supabase/ssr";
import { createClient as supabaseCreateClient, SupabaseClientOptions } from "@supabase/supabase-js";
import { useSession } from '@clerk/nextjs';
import { useMemo } from 'react';

// Environment variables - ensure these are correctly set in your .env files
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.");
}
if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.");
}

/**
 * Unauthenticated Supabase Client (Singleton)
 * 
 * Use this client for accessing public data that doesn't require user authentication.
 * It can be imported and used in both client-side and server-side components/modules.
 * It uses the public anonymous key.
 */
const unauthenticatedSupabaseClient = supabaseCreateClient(supabaseUrl as string, supabaseAnonKey as string);

/**
 * Hook to get an authenticated Supabase client for Client Components.
 * 
 * This hook leverages Clerk's session management to provide a Supabase client
 * that is authenticated with the current user's session.
 * 
 * IMPORTANT: This hook uses React hooks (`useSession`, `useMemo`) and therefore
 *            MUST ONLY be used within Client Components (files with "use client" directive).
 *            DO NOT import or use this in Server Components or API routes.
 */
export function useAuthenticatedSupabaseClient() {
  const { session, isLoaded, isSignedIn } = useSession();

  return useMemo(() => {
    if (!isLoaded) {
      // console.log("[useAuthenticatedSupabaseClient] Clerk session not yet loaded. Returning unauthenticated client as fallback.");
      return unauthenticatedSupabaseClient; 
    }
    
    if (!isSignedIn || !session) {
      // console.log("[useAuthenticatedSupabaseClient] User not signed in or no Clerk session. Returning unauthenticated client as fallback.");
      return unauthenticatedSupabaseClient;
    }

    // console.log("[useAuthenticatedSupabaseClient] Clerk session active. Creating Supabase client with Clerk accessToken factory.");
    
    const options: SupabaseClientOptions<"public"> = {
      auth: {
        // autoRefreshToken: true, // Default
        // persistSession: true,   // Default
        // detectSessionInUrl: true, // Default
        // @ts-ignore Argument of type '{ accessToken: () => Promise<string | null>; }' is not assignable to parameter of type 'SupabaseAuthClientOptions'.
        accessToken: async () => {
          try {
            const token = await session.getToken();
            if (!token) {
              // console.warn("[useAuthenticatedSupabaseClient.accessToken] Clerk session active but no token found.");
              return null;
            }
            return token;
          } catch (error) {
            console.error('[useAuthenticatedSupabaseClient.accessToken] Error fetching Clerk token:', error);
            return null;
          }
        },
      },
    };

    return supabaseCreateClient(supabaseUrl as string, supabaseAnonKey as string, options);

  }, [session, isLoaded, isSignedIn]);
}

/**
 * @deprecated Use useAuthenticatedSupabaseClient() which implements the recommended native Clerk integration.
 */
export function useBrowserSupabaseClient() {
  console.warn("`useBrowserSupabaseClient` is deprecated. Use `useAuthenticatedSupabaseClient` instead.");
  return useAuthenticatedSupabaseClient();
}

/**
 * Creates a basic, unauthenticated Supabase client for client-side scenarios.
 * This is typically used for components that do not require user-specific data
 * or before authentication state is known.
 * It uses the public anonymous key.
 */
export const createBrowserClient = () => {
  // console.log("[Supabase] createBrowserClient (basic, unauthenticated SSR-compatible) called.");
  return supabaseCreateBrowserClient(
    supabaseUrl as string,
    supabaseAnonKey as string
  );
};

/**
 * Server-Side Supabase Admin Client
 * 
 * Use this client for server-side operations that require admin privileges
 * (e.g., in API routes, server-side data fetching, cron jobs).
 * It uses the Supabase Service Role Key, which has bypass RLS capabilities.
 * 
 * IMPORTANT: This client MUST ONLY be used on the server-side.
 *            The SUPABASE_SERVICE_ROLE_KEY should never be exposed to the client.
 */
export function createServerAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set. This key is required for server-side admin operations.");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Cannot create server admin client.");
  }
  if (typeof window !== 'undefined') {
    console.error("createServerAdminClient was called on the client-side. This is insecure and not allowed.");
    throw new Error("createServerAdminClient should not be called on the client-side.");
  }
  return supabaseCreateClient(
    supabaseUrl as string,
    serviceRoleKey,
    { auth: { persistSession: false } } // No session persistence for service role clients
  );
}

/**
 * Alias for createServerAdminClient for backward compatibility
 * @deprecated Use createServerAdminClient instead for clearer intent
 */
export const createServerSupabaseClient = createServerAdminClient;

// Default export: The unauthenticated singleton client.
// This provides a convenient way to get a basic client for public data access.
export default unauthenticatedSupabaseClient; 