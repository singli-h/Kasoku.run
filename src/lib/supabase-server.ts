import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import 'server-only'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with Clerk session for server components
export async function createServerSupabaseClient() {
  const session = await auth()
  const supabaseAccessToken = await session?.getToken({ template: 'supabase' })
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`
      }
    }
  })
}

// Create a Supabase admin client for server-side operations (webhooks, etc)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper to get user profile using Clerk session (server-side only)
export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single()

  if (error) throw error
  return data
} 