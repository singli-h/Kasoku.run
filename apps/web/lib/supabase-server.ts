/*
<ai_context>
Singleton Supabase client for server-side operations using 2025 native Clerk integration.
This shared instance avoids recreating the client on every server action call while maintaining
proper JWT token flow via the accessToken callback.

CRITICAL: This replaces direct usage of createServerSupabaseClient() in server actions.
All server actions should import this singleton instead of creating their own clients.
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
*/

import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/database"

/**
 * Singleton Supabase client for server-side operations
 * 
 * This shared instance:
 * - Avoids object construction overhead on every server action call
 * - Maintains proper JWT token flow via accessToken callback
 * - Leverages Supabase's internal connection pooling
 * - Uses native Clerk → Supabase integration (2025 approach)
 * 
 * USAGE:
 * ```typescript
 * import supabase from "@/lib/supabase-server"
 * 
 * export async function someAction() {
 *   const { data, error } = await supabase
 *     .from('users')
 *     .select('*')
 * }
 * ```
 * 
 * SECURITY NOTE: 
 * - JWT tokens are NOT cached - fresh token retrieved per request
 * - Each request gets proper user context via auth() call
 * - RLS policies work correctly with this approach
 */
let _supabase: ReturnType<typeof createClient<Database>> | null = null

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // Fresh JWT token for each request - NEVER cache this
        async accessToken() {
          try {
            return (await auth()).getToken()
          } catch {
            // Not in a request context (e.g., module initialization, Realtime setup)
            // Return null to proceed without auth - actual requests will have context
            return null
          }
        },
      }
    )
  }
  return _supabase
}

// Proxy that lazily initializes the Supabase client on first property access.
// This prevents build failures when env vars are not set during Next.js static analysis.
const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase(), prop, receiver)
  },
})

export default supabase

/**
 * Type exports for convenience
 */
export type { Database } from '@/types/database'

/**
 * Utility function to check if an error is a Supabase error
 * Moved here from the old supabase.ts for consistency
 */
export function isSupabaseError(error: any): boolean {
  return error && typeof error === 'object' && 'code' in error
} 