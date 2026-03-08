/*
<ai_context>
Enhanced UserButton component for Clerk's UserProfile.
Updates appearance when theme changes in real-time.
Fixed hydration issues by ensuring client-side only rendering.
Note: Notification settings are now in the main Settings page, not here.
</ai_context>
*/

"use client"

import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function EnhancedUserButton() {
  const { theme, resolvedTheme } = useTheme()
  const [key, setKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Ensure component only renders on client side to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Force re-render when theme changes to update UserButton appearance
  useEffect(() => {
    if (mounted) {
      setKey(prev => prev + 1)
    }
  }, [theme, resolvedTheme, mounted])

  // Don't render until component is mounted on client
  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <UserButton
      key={key} // Force re-mount when theme changes
      afterSignOutUrl="/"
      appearance={{
        baseTheme: isDark ? dark : undefined,
        elements: {
          avatarBox: "h-8 w-8"
        }
      }}
      userProfileMode="modal"
      userProfileProps={{
        appearance: {
          baseTheme: isDark ? dark : undefined,
        }
      }}
    />
  )
} 