// Create a Supabase client helper for Clerk integration
import { auth } from '@clerk/nextjs/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get environment variables
const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return { supabaseUrl, supabaseKey };
};

// Server-side Supabase client with Clerk session JWT
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Use the new Clerk-Supabase integration method
      async fetch(url, options = {}) {
        const { getToken } = await auth();
        // Get the session token directly without specifying a template
        const token = await getToken();
        
        if (token) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          options = { ...options, headers };
        }
        
        return fetch(url, options);
      }
    },
  });
} 