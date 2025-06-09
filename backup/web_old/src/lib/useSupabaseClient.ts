"use client";

/*
  ⚠️ DEPRECATED PATTERN - MIGRATING TO NEW 2025 IMPLEMENTATION
  
  This hook is being replaced by the new 2025 Supabase + Clerk integration.
  
  🔄 NEW PATTERN - For client components:
  
  ```typescript
  import { useAuth } from "@clerk/nextjs"
  import { createClientSupabaseClient } from "@/lib/supabase-client"
  
  function MyComponent() {
    const { getToken } = useAuth()
    const supabase = createClientSupabaseClient(getToken)
    // ... use supabase
  }
  ```
  
  🔄 BETTER APPROACH - Use server actions:
  - Move data fetching to server actions
  - Use server components for data loading
  - Pass data as props to client components
  
  This file remains for backward compatibility during migration.
*/

import { useAuth } from "@clerk/nextjs"
import { createClientSupabaseClient } from "@/lib/supabase-client"

/**
 * Hook to get Supabase client for client components using 2025 pattern
 * @deprecated Use server actions instead of client-side data fetching
 */
export const useSupabaseClient = () => {
  console.warn("useSupabaseClient is deprecated. Use server actions for data fetching instead.");
  
  const { getToken } = useAuth()
  return createClientSupabaseClient(getToken)
} 