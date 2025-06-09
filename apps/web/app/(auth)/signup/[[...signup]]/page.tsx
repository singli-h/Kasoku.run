/*
<ai_context>
This client page provides the signup form from Clerk.
</ai_context>
*/

"use client"

import { SignUp } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function SignUpPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a basic SignUp component during SSR to prevent hydration mismatch
    return <SignUp forceRedirectUrl="/onboarding" />
  }

  return (
    <SignUp
      forceRedirectUrl="/onboarding"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  )
}
