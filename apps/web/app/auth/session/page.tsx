/*
 <ai_context>
 Post-auth session handler. Decides final redirect based on onboarding status.
 This page is used by Clerk after_sign_in_url / after_sign_up_url.
 </ai_context>
*/

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

export default function SessionHandler() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    async function decide() {
      try {
        // Ask our API or server action for onboarding status; lightweight approach here via API
        const res = await fetch("/api/users/onboarding-status", { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          if (json?.onboarding_completed === true) {
            router.replace("/dashboard")
          } else {
            router.replace("/onboarding")
          }
          return
        }
      } catch {}
      // Fallback if anything fails
      router.replace("/dashboard")
    }

    if (isLoaded && isSignedIn) {
      decide()
    }
  }, [isLoaded, isSignedIn, router])

  return null
}


