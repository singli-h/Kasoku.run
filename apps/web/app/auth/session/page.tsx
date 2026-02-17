/*
 <ai_context>
 Post-auth session handler. Decides final redirect based on onboarding status and user role.
 This page is used by Clerk after_sign_in_url / after_sign_up_url.

 Redirect logic:
 - Not onboarded → /onboarding
 - Individual role → /plans
 - Coach/Athlete roles → /dashboard
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
        // Check onboarding status first
        const onboardingRes = await fetch("/api/users/onboarding-status", { cache: "no-store" })
        if (onboardingRes.ok) {
          const onboardingJson = await onboardingRes.json()
          if (onboardingJson?.onboarding_completed !== true) {
            router.replace("/onboarding")
            return
          }
        }

        // User is onboarded — check role for redirect destination
        try {
          const roleRes = await fetch("/api/user/role", { cache: "no-store" })
          if (roleRes.ok) {
            const roleJson = await roleRes.json()
            if (roleJson?.role === "individual") {
              router.replace("/plans")
              return
            }
          }
        } catch {
          // Role fetch failed — fall through to default
        }

        // Default: coach and athlete roles go to dashboard
        router.replace("/dashboard")
      } catch {
        // Fallback if onboarding check fails entirely
        router.replace("/dashboard")
      }
    }

    if (isLoaded && isSignedIn) {
      decide()
    }
  }, [isLoaded, isSignedIn, router])

  return null
}


