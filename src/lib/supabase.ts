import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a Supabase client for client-side usage with Clerk session
export async function createClerkSupabaseClient() {
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

// Helper to get user profile using Clerk session
export async function getUserProfile(userId: string) {
  const supabase = await createClerkSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single()

  if (error) throw error
  return data
} 