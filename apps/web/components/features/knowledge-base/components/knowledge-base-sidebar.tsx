"use client"

import { Plus, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface KnowledgeBaseSidebarProps {
  categories: Array<{ id: number; name: string; color: string }>
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
  onManageCategories: () => void
  isLoading?: boolean
  isMobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

// Extracted sidebar content for reuse
function SidebarContent({
  categories,
  selectedCategory,
  onCategorySelect,
  onManageCategories,
  isLoading = false,
  onItemSelect,
  isMobile = false
}: Omit<KnowledgeBaseSidebarProps, 'isMobileOpen' | 'onMobileOpenChange'> & { onItemSelect?: () => void; isMobile?: boolean }) {
  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId)
    onItemSelect?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - extra top padding on mobile to avoid Sheet close button */}
      <div className={cn("p-4 border-b", isMobile && "pt-12")}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground">CATEGORIES</h2>
          <button
            onClick={onManageCategories}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Manage Categories"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* All Articles */}
        <button
          onClick={() => handleCategoryClick("all")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-1",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <span>All Articles</span>
        </button>

        {/* Uncategorized Articles */}
        <button
          onClick={() => handleCategoryClick("uncategorized")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-2",
            selectedCategory === "uncategorized"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>Uncategorized</span>
          </div>
        </button>

        {/* Category Items */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-8 bg-muted rounded-md"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id.toString())}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                  selectedCategory === category.id.toString()
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          Knowledge Base
        </div>
      </div>
    </div>
  )
}

export function KnowledgeBaseSidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  onManageCategories,
  isLoading = false,
  isMobileOpen = false,
  onMobileOpenChange
}: KnowledgeBaseSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <div className="hidden lg:block w-56 xl:w-64 shrink-0 border-r bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <SidebarContent
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          onManageCategories={onManageCategories}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile/Tablet Sidebar - Sheet drawer */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Categories</SheetTitle>
          </SheetHeader>
          <SidebarContent
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={onCategorySelect}
            onManageCategories={onManageCategories}
            isLoading={isLoading}
            onItemSelect={() => onMobileOpenChange?.(false)}
            isMobile
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

// Export a trigger button for use in the header
export function KnowledgeBaseSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle categories</span>
    </Button>
  )
}
