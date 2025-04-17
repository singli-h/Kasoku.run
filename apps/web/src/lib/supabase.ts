// Create a Supabase client helper for Clerk integration
import { auth } from '@clerk/nextjs/server';
import { useSession } from '@clerk/nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

// Helper to get environment variables
const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
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

// Browser-side Supabase client hook that auto-refreshes with session changes
export function useBrowserSupabaseClient(): SupabaseClient {
  const { session } = useSession();
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  
  // Keep the token in sync with Clerk session
  useEffect(() => {
    const updateToken = async () => {
      if (session) {
        try {
          const token = await session.getToken({ template: 'supabase' });
          setSupabaseToken(token);
        } catch (err) {
          console.error('Error getting Supabase token from Clerk:', err);
          setSupabaseToken(null);
        }
      } else {
        setSupabaseToken(null);
      }
    };

    updateToken();
  }, [session]);

  // Re-create client whenever URL, key, or token changes
  const supabase = useMemo(() => {
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: supabaseToken
          ? { Authorization: `Bearer ${supabaseToken}` }
          : undefined,
      },
    };

    return createClient(supabaseUrl, supabaseKey, options);
  }, [supabaseUrl, supabaseKey, supabaseToken]);

  return supabase;
} 