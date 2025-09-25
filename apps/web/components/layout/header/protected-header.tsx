/*
<ai_context>
This client component provides an Asana-style header for protected pages.
Enhanced for mobile responsiveness with touch-friendly interfaces, optimized search, and mobile navigation patterns.
</ai_context>
*/

"use client"

import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedUserButton } from "./enhanced-user-button"
import { useIsMobile } from "@/hooks/use-mobile"

export function ProtectedHeader() {
  const isMobile = useIsMobile()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      {/* Left section - Sidebar toggle */}
      <div className="flex items-center gap-2 px-3 md:px-4">
        <SidebarTrigger className="-ml-1 h-9 w-9 md:h-8 md:w-8" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
      </div>

      {/* Center section left intentionally minimal until global actions are defined */}
      <div className="flex-1 px-2 md:px-4" />

      {/* Right section - Actions and user with mobile optimization */}
      <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4">
        {/* Notifications with mobile-friendly touch target */}
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${
            isMobile 
              ? 'h-10 w-10 min-w-10' // 44px minimum touch target
              : 'h-9 w-9'
          }`}
          aria-label="Notifications"
        >
          <Bell className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          <Badge
            variant="destructive"
            className={`absolute -top-1 -right-1 rounded-full flex items-center justify-center text-xs font-medium ${
              isMobile 
                ? 'h-6 w-6 min-w-6 text-xs' 
                : 'h-5 w-5 min-w-5 text-xs'
            }`}
          >
            3
          </Badge>
        </Button>

        <Separator orientation="vertical" className="h-4 mx-1 md:mx-2 hidden sm:block" />

        {/* Enhanced User Profile with mobile considerations */}
        <div className="flex items-center">
          <EnhancedUserButton />
        </div>
      </div>
    </header>
  )
} 