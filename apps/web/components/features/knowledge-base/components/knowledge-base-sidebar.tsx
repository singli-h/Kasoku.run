"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeBaseSidebarProps {
  categories: Array<{ id: number; name: string; color: string }>
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
  onManageCategories: () => void
  isLoading?: boolean
}

export function KnowledgeBaseSidebar({ 
  categories, 
  selectedCategory, 
  onCategorySelect,
  onManageCategories,
  isLoading = false
}: KnowledgeBaseSidebarProps) {
  return (
    <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
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
            onClick={() => onCategorySelect("all")}
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
            onClick={() => onCategorySelect("uncategorized")}
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
                  onClick={() => onCategorySelect(category.id.toString())}
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
    </div>
  )
}
