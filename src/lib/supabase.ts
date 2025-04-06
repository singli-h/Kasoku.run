import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a basic Supabase client for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a Supabase admin client only if service role key is available (server-side only)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

/**
 * Creates a Supabase client with Clerk authentication
 * 
 * This should be used for authorized requests on the server side
 */
export async function createClerkSupabaseClient() {
  try {
    // Get the Clerk token for Supabase
    const authObject = await auth()
    const token = await authObject.getToken({ template: 'supabase' })
    
    if (!token) {
      throw new Error('No token available')
    }
    
    // Create a Supabase client with the Clerk token
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
  } catch (error) {
    console.error('Error creating Clerk Supabase client:', error)
    // Fall back to anonymous client
    return supabase
  }
}

/**
 * Client-side utility for creating a Supabase client
 * with Clerk authentication
 */
export function createClientSideClerkSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        try {
          const token = await getToken()
          
          if (token) {
            // Add the Clerk token to the request headers
            const headers = new Headers(options?.headers)
            headers.set('Authorization', `Bearer ${token}`)
            
            // Return the fetch with the updated headers
            return fetch(url, {
              ...options,
              headers,
            })
          }
        } catch (error) {
          console.error('Error adding Clerk token to Supabase request:', error)
        }
        
        // Fallback to regular fetch if token is not available
        return fetch(url, options)
      },
    },
  })
}

/**
 * Verifies that a user with the given Clerk ID exists in the users table
 * and creates one if it doesn't exist
 */
export async function ensureUserExists(clerkId: string, userData: any) {
  if (!supabaseAdmin) {
    console.error('Service role key is not available for admin operations')
    return null
  }

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error, any other error is unexpected
      console.error('Error checking for existing user:', fetchError)
      return null
    }

    if (existingUser) {
      return existingUser
    }

    // Create new user if doesn't exist
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: clerkId,
        email: userData.email,
        username: userData.username || `user_${clerkId.substring(0, 8)}`,
        name: userData.name,
        avatar_url: userData.imageUrl,
        timezone: userData.timezone || 'UTC',
        subscription_status: 'free',
        metadata: userData
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating new user:', insertError)
      return null
    }

    return newUser
  } catch (error) {
    console.error('Error in ensureUserExists:', error)
    return null
  }
}

// Helper to get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
} 