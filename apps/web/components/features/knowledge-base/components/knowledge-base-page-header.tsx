/*
<ai_context>
Knowledge base page header component with stable save button placement.
Follows the established page header patterns from the codebase.
</ai_context>
*/

"use client"

import { Plus, Search, Grid, List } from "lucide-react"
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
  isLoading = false
}: KnowledgeBasePageHeaderProps) {
  return (
    <>
      {/* Main Header - Fixed Position */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left Section - Title and Stats */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold">Knowledge Base</h1>
            <Badge variant="secondary" className="text-xs">
              {isLoading ? "..." : `${totalArticles} articles`}
            </Badge>
          </div>
          
          {/* Right Section - Primary Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={onNewArticle}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>
      </div>

      {/* Search and View Controls - Secondary Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section - Search */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Right Section - View Controls */}
          <div className="flex items-center space-x-2">
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
