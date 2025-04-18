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
          // Use Clerk session to get Supabase-specific JWT
          const clerkToken = await session?.getToken({ template: 'supabase' });
          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
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