"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase";

/**
 * Hook to initialize and return the Supabase client for client components.
 */
export const useSupabaseClient = () => createBrowserSupabaseClient(); 