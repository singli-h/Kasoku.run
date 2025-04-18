"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useSession } from "@clerk/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create a custom browser client that injects Clerk auth token
export function useBrowserSupabaseClient(): SupabaseClient {
  const { session } = useSession();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options: any = {}) => {
          // Fetch a fresh Clerk Supabase JWT for each request
          let token: string | null = null;
          try {
            token = await session?.getToken({ template: 'supabase' }) ?? null;
            console.log('🚩 Clerk token (should not decode to role: "anon"):', token);
          } catch (e) {
            console.error('[auth] Error fetching Clerk token:', e);
          }
          const headers = new Headers(options.headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          // Log fallback anon key usage
          console.log('[auth] Using anon key prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20));
          return fetch(url, { ...options, headers });
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