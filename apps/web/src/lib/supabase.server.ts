"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@clerk/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Simplified hook for Clerk-authenticated Supabase client
export function useSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken();
          
          if (token) {
            const headers = new Headers(options.headers);
            headers.set('Authorization', `Bearer ${token}`);
            options = { ...options, headers };
          }
          
          return fetch(url, options);
        }
      }
    }
  );
}

// Singleton client for non-auth or default access
export default createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to get Supabase environment variables
function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return { supabaseUrl, supabaseKey };
}

// Create a server-side Supabase client with Clerk authentication
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      async fetch(url, options = {}) {
        const authInstance = await auth();
        const token = await authInstance.getToken();
        
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