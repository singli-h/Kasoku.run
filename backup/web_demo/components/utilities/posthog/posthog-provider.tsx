/*
<ai_context>
This client component provides the PostHog provider for the app.
</ai_context>
*/

"use client"

import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Only initialize PostHog after hydration to prevent SSR/client mismatch
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST &&
      !posthog.__loaded
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
        loaded: () => {
          setIsInitialized(true)
        }
      })
    } else if (posthog.__loaded) {
      setIsInitialized(true)
    }
  }, [])

  // Render children immediately, PostHog will initialize in the background
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
