"use client"

/*
  🚨 CRITICAL 2025 SETUP REQUIRED:
  
  Before using this client, you MUST configure Clerk as a third-party auth provider:
  
  1. Clerk Dashboard → Integrations → Supabase → Activate integration
  2. Copy your Clerk domain (e.g., https://included-sawfly-62.clerk.accounts.dev)
  3. Supabase Dashboard → Authentication → Sign In / Up → Add provider → Clerk
  4. Paste domain and enable the provider
  
  Without this setup, all authentication will fail with 401 errors!
  
  ✅ 2025 APPROACH - Client-side native integration:
  - Uses Clerk's default JWT tokens (no templates)
  - Seamless token flow via getToken callback
  - Native Supabase recognition of Clerk tokens
  - RLS policies work automatically with auth.jwt()
  
  ❌ DEPRECATED PATTERNS - Not used in 2025:
  - JWT templates or token transformation
  - Custom authentication headers
  - Token modification or custom logic
  - Service role key usage
*/

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * Create a Supabase client for client-side operations using 2025 native Clerk integration
 * 
 * REQUIRES: Clerk configured as third-party auth provider in Supabase dashboard
 * 
 * Usage:
 * ```typescript
 * const { getToken } = useAuth()
 * const supabase = createClientSupabaseClient(getToken)
 * ```
 * 
 * This leverages:
 * - Native third-party auth (no JWT templates needed)
 * - Clerk's default tokens (no modification required)
 * - Seamless token flow via provided getToken callback
 * - Automatic RLS authentication via auth.jwt()
 */
export function createClientSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        // Native integration: Clerk token automatically recognized by Supabase
        return await getToken()
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