"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@clerk/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create a custom browser client that injects Clerk auth token
export function useBrowserSupabaseClient(): SupabaseClient {
  const { getToken } = useAuth();
  
  const supabase = createBrowserClient(
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
  
  return supabase;
}

// Default export uses singleton pattern for non-hook usage
export default createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
); 