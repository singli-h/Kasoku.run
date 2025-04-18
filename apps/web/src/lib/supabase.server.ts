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
  const { getToken } = await auth();
  const token = await getToken({ template: 'supabase' });
  
  // Create client with global settings
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : undefined,
    },
  };
  
  return createClient(supabaseUrl, supabaseKey, options);
} 