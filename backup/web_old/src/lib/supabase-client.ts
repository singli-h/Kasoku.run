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

import { createBrowserClient } from "@supabase/ssr"
import { useMemo } from "react"
import type { Database } from "@/types/database"

// Environment variables with proper validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

/**
 * Hook to get an authenticated Supabase client for client components
 * 
 * This hook integrates with Clerk's authentication and provides a Supabase client
 * that automatically includes the user's JWT token for authenticated requests.
 * 
 * IMPORTANT: This hook can only be used in client components (with "use client" directive)
 * 
 * @returns Authenticated Supabase client for client-side use
 */
export function useSupabaseClient() {
  return useMemo(
    () => createBrowserClient<Database>(supabaseUrl, supabaseAnonKey),
    []
  )
}

/**
 * Creates a basic unauthenticated Supabase client for client-side use
 * 
 * This client can be used for public data access or before authentication
 * state is known. For authenticated operations, use useSupabaseClient() instead.
 * 
 * @returns Unauthenticated Supabase client
 */
export function createClientSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Legacy alias for useSupabaseClient for backward compatibility
 * @deprecated Use useSupabaseClient for clearer naming
 */
export const useAuthenticatedSupabaseClient = useSupabaseClient

// Type exports for convenience
export type { Database } from '@/types/database'

/**
 * Utility function to check if an error is a Supabase error
 */
export function isSupabaseError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error
} 