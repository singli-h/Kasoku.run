"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Landing page for Clerk invitation links.
 * Clerk appends __clerk_ticket to the redirect URL — the SignUp component
 * picks it up automatically and processes the invitation.
 * After sign-up, the user is redirected to /onboarding where publicMetadata
 * (groupId, role) is read server-side.
 */
export default function AcceptInvitationPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <SignUp forceRedirectUrl="/onboarding" signInUrl="/sign-in" />
  }

  return (
    <SignUp
      forceRedirectUrl="/onboarding"
      signInUrl="/sign-in"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  )
}
