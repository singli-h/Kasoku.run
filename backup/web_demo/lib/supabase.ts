/*
<ai_context>
Supabase client configuration for Clerk authentication integration using 2025 native third-party auth.
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

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/database"

/**
 * Create a Supabase client for server-side operations using 2025 native Clerk integration
 * 
 * REQUIRES: Clerk configured as third-party auth provider in Supabase dashboard
 * 
 * This leverages:
 * - Native third-party auth (no JWT templates needed)
 * - Clerk's default tokens (no modification required)
 * - Seamless token flow via accessToken callback
 * - Automatic RLS authentication via auth.jwt()
 */
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        // Native integration: Clerk token automatically recognized by Supabase
        return (await auth()).getToken()
      },
    }
  )
}

/**
 * Utility function to check if an error is a Supabase error
 */
export function isSupabaseError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error
}

// Type exports for convenience
export type { Database } from '@/types'

