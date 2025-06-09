/*
<ai_context>
This client component provides an Asana-style header for protected pages.
Includes centered search bar, notification bell, and enhanced user profile button with custom settings.
</ai_context>
*/

"use client"

import { Search, Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedUserButton } from "./enhanced-user-button"

export function ProtectedHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left section - Sidebar toggle */}
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>

      {/* Center section - Search bar */}
      <div className="flex-1 max-w-md mx-auto px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search tasks, projects, or knowledges..."
            className="w-full pl-10 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Right section - Actions and user */}
      <div className="flex items-center gap-2 px-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium min-w-5"
          >
            3
          </Badge>
        </Button>

        <Separator orientation="vertical" className="h-4 mx-2" />

        {/* Enhanced User Profile with Settings */}
        <div className="flex items-center">
          <EnhancedUserButton />
        </div>
      </div>
    </header>
  )
} 