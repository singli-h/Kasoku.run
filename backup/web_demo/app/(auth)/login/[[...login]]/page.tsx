/*
<ai_context>
This client page provides the login form from Clerk.
</ai_context>
*/

"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a basic SignIn component during SSR to prevent hydration mismatch
    return <SignIn forceRedirectUrl="/dashboard" />
  }

  return (
    <SignIn
      forceRedirectUrl="/dashboard"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  )
}
