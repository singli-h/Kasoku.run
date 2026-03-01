/*
 <ai_context>
 Server-only Supabase client using the service role key.
 Used exclusively for trusted back-end processes like webhooks and scripts
 where Row Level Security must be bypassed. NEVER import this in client code
 or user-triggered server actions.
 </ai_context>
*/

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Lazy initialization to prevent build failures when env vars are not set.
// Fails fast at runtime if env vars are missing.
let _supabaseService: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseService() {
  if (!_supabaseService) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
    }

    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (required for webhooks)")
    }

    // Service-role client. DO NOT attach accessToken callbacks here.
    _supabaseService = createClient<Database>(url, serviceRoleKey)
  }
  return _supabaseService
}

const supabaseService = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseService(), prop, receiver)
  },
})

export default supabaseService


