/*
<ai_context>
Knowledge base page header component with stable save button placement.
Follows the established page header patterns from the codebase.
Responsive design: stacks on mobile, side-by-side on desktop.
</ai_context>
*/

"use client"

import { Plus, Search, Grid, List, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface KnowledgeBasePageHeaderProps {
  // Data
  totalArticles: number
  searchQuery: string
  viewMode: "grid" | "list"

  // Actions
  onSearchChange: (query: string) => void
  onViewModeChange: (mode: "grid" | "list") => void
  onNewArticle: () => void
  onToggleMobileSidebar?: () => void

  // UI State
  isLoading?: boolean
}

export function KnowledgeBasePageHeader({
  totalArticles,
  searchQuery,
  viewMode,
  onSearchChange,
  onViewModeChange,
  onNewArticle,
  onToggleMobileSidebar,
  isLoading = false
}: KnowledgeBasePageHeaderProps) {
  return (
    <>
      {/* Main Header - Fixed Position */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 gap-2">
          {/* Left Section - Menu + Title and Stats */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile menu trigger */}
            {onToggleMobileSidebar && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden shrink-0 -ml-1"
                onClick={onToggleMobileSidebar}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle categories</span>
              </Button>
            )}
            <h1 className="text-lg sm:text-2xl font-semibold truncate">Knowledge Base</h1>
            <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">
              {isLoading ? "..." : `${totalArticles} articles`}
            </Badge>
          </div>

          {/* Right Section - Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs sm:hidden">
              {isLoading ? "..." : totalArticles}
            </Badge>
            <Button
              size="sm"
              onClick={onNewArticle}
              disabled={isLoading}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Article</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and View Controls - Secondary Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="rounded-r-none"
                disabled={isLoading}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="rounded-l-none"
                disabled={isLoading}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
