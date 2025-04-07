/**
 * Supabase Client with Clerk JWT Integration
 * 
 * This module provides a function to create a Supabase client that uses
 * Clerk's JWT tokens for authentication with Supabase.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with Clerk JWT authentication
 * 
 * @param {Object} session - The Clerk session object from useSession() hook
 * @returns {Object} - Configured Supabase client
 */
export function createClerkSupabaseClient(session) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: async (url, options = {}) => {
          // Get the Clerk token using the JWT template named 'supabase'
          const clerkToken = await session?.getToken({
            template: 'supabase',
          });

          // Add the token to the Authorization header
          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          // Make the request with the Authorization header
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    }
  );
}

/**
 * Server-side Supabase client with admin privileges
 * CAUTION: This should only be used in server components or API routes
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
); 