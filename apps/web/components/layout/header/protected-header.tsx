/*
<ai_context>
This client component provides a minimal header for protected pages.
Enhanced for mobile responsiveness with touch-friendly interfaces.
</ai_context>
*/

"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { EnhancedUserButton } from "./enhanced-user-button"

export function ProtectedHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 z-40 md:sticky md:left-auto md:right-auto">
      {/* Left section - Sidebar toggle */}
      <div className="flex items-center gap-2 px-3 md:px-4">
        <SidebarTrigger className="-ml-1 h-9 w-9 md:h-8 md:w-8" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
      </div>

      {/* Center section - spacer */}
      <div className="flex-1" />

      {/* Right section - User profile */}
      <div className="flex items-center px-3 md:px-4">
        <EnhancedUserButton />
      </div>
    </header>
  )
} 