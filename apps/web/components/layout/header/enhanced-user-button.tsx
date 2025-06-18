/*
<ai_context>
Enhanced UserButton component that integrates custom settings pages with Clerk's UserProfile.
Adds Theme Settings and Notification Settings to the default Clerk account management.
Now properly updates appearance when theme changes in real-time.
Fixed hydration issues by ensuring client-side only rendering.
</ai_context>
*/

"use client"

import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import { Palette, Bell } from "lucide-react"
import { ThemeSettingsPage, NotificationSettingsPage } from "@/components/features/settings"
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
    >
      <UserButton.UserProfilePage
        label="Theme"
        labelIcon={<Palette className="h-4 w-4" />}
        url="theme"
      >
        <ThemeSettingsPage />
      </UserButton.UserProfilePage>
      
      <UserButton.UserProfilePage
        label="Notifications"
        labelIcon={<Bell className="h-4 w-4" />}
        url="notifications"
      >
        <NotificationSettingsPage />
      </UserButton.UserProfilePage>
    </UserButton>
  )
} 