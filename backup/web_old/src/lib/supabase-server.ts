/*
<ai_context>
Supabase server client configuration for Clerk authentication integration using 2025 native third-party auth.
Uses anon key with Clerk session tokens for secure RLS-based access.
CRITICAL: Requires Clerk configured as third-party auth provider in Supabase dashboard.
Uses Clerk's default JWT token (NO custom templates required).
</ai_context>
*/

/*
  🚨 CRITICAL 2025 SETUP REQUIRED:
  
  Before using this client, you MUST configure Clerk as a third-party auth provider:
  
  1. Clerk Dashboard → Integrations → Supabase → Activate integration
  2. Copy your Clerk domain (e.g., https://included-sawfly-62.clerk.accounts.dev)
  3. Supabase Dashboard → Authentication → Sign In / Up → Add provider → Clerk
  4. Paste domain and enable the provider
  
  Without this setup, all authentication will fail with 401 errors!
  
  ✅ 2025 APPROACH - What this file provides:
  - Native third-party auth integration (no JWT templates)
  - Server-side client setup with seamless token flow
  - Pure utility functions for error handling
  - Infrastructure helpers only
  
  ❌ DEPRECATED PATTERNS - Not used in 2025:
  - JWT templates or token transformation
  - Service role key usage
  - Custom authentication logic
  - Token modification or custom headers
  
  📝 IMPORTANT: This file should ONLY contain server-side infrastructure and utilities!
  
  ✅ CORRECT - What belongs here:
  - Server-side client setup (createServerSupabaseClient)
  - Pure utility functions (isSupabaseError, type guards)
  - Server infrastructure helpers (type exports)
  
  ❌ WRONG - What should be moved to actions:
  - Business logic (user management, organization operations)
  - Complex queries (data fetching, mutations)
  - Authentication operations (sign in/out, user creation)
  
  📝 CLIENT-SIDE CODE: Use @/lib/supabase-client.ts for client components
  
  If you're adding business logic, move it to the appropriate actions file:
  - User operations → @/actions/auth/user-actions.ts
  - Organization operations → @/actions/auth/organization-actions.ts
  - Task operations → @/actions/tasks/task-actions.ts
  - etc.
*/ 

"use server"

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type { CookieOptions } from "@supabase/ssr"

// Environment variables with proper validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable") 
}
if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
}

/**
 * Utility function to check if an error is a Supabase error
 */
export function isSupabaseError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error
}

/**
 * Creates a server-side Supabase client with Clerk authentication
 * 
 * This client automatically integrates with Clerk's JWT tokens through cookies
 * and should be used in server components, server actions, and API routes.
 * 
 * @returns Authenticated Supabase client for server-side use
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options || {})
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a server-side admin Supabase client with service role privileges
 * 
 * This client bypasses Row Level Security (RLS) and should only be used
 * for admin operations, data migrations, or when RLS needs to be bypassed.
 * 
 * SECURITY WARNING: This client has elevated privileges and should be used carefully.
 * 
 * @returns Admin Supabase client with service role privileges
 */
export function createAdminClient() {
  // Ensure this is only called on the server
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient should not be called on the client-side')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Legacy alias for createAdminClient for backward compatibility
 * @deprecated Use createAdminClient for clearer naming
 */
export const createServerAdminClient = createAdminClient

// Type exports for convenience
export type { Database } from '@/types/database' 