/*
<ai_context>
This client component provides an Asana-style header for protected pages.
Enhanced for mobile responsiveness with touch-friendly interfaces, optimized search, and mobile navigation patterns.
</ai_context>
*/

"use client"

import { Search, Bell, Menu, X } from "lucide-react"
import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { EnhancedUserButton } from "./enhanced-user-button"
import { useIsMobile } from "@/hooks/use-mobile"

export function ProtectedHeader() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      {/* Left section - Sidebar toggle */}
      <div className="flex items-center gap-2 px-3 md:px-4">
        <SidebarTrigger className="-ml-1 h-9 w-9 md:h-8 md:w-8" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
      </div>

      {/* Center section - Search bar with mobile optimization */}
      <div className="flex-1 max-w-md mx-auto px-2 md:px-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors ${
            isSearchFocused ? 'text-primary' : ''
          } ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
          <Input
            type="search"
            placeholder={isMobile ? "Search..." : "Search exercises, workouts, or athletes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full pl-10 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${
              isMobile 
                ? 'h-10 text-base pr-10' // 16px font-size prevents iOS zoom, increased height for touch
                : 'h-9 text-sm pr-4'
            } ${isSearchFocused ? 'bg-background shadow-sm' : ''}`}
            style={{ fontSize: isMobile ? '16px' : undefined }} // Explicit iOS zoom prevention
          />
          {/* Clear search button for mobile */}
          {isMobile && searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

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