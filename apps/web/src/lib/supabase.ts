"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create a single Supabase browser client instance
const supabase: SupabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Hook to access the Supabase client in React components
 */
export function useBrowserSupabaseClient(): SupabaseClient {
  return supabase;
}

export default supabase; 