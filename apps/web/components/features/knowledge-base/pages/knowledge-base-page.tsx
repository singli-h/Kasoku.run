"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Paginator } from "@/components/ui/paginator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { KnowledgeBaseSidebar, ArticleCard, KnowledgeBasePageHeader, CategoryManager } from "../components"
import {
  useKnowledgeBaseArticles,
  useKnowledgeBaseCategories
} from "../hooks/use-knowledge-base-queries"

export function KnowledgeBasePage() {
  const router = useRouter()

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const articlesPerPage = 9 // Show 3x3 grid per page

  // Data fetching
  const { 
    data: articles = [], 
    isLoading: isLoadingArticles, 
    error: articlesError 
  } = useKnowledgeBaseArticles()
  
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useKnowledgeBaseCategories()


  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (article.content as string).toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || 
                             (selectedCategory === "uncategorized" && article.category_id === null) ||
                             article.category_id?.toString() === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [articles, searchQuery, selectedCategory])

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const startIndex = (currentPage - 1) * articlesPerPage
  const endIndex = startIndex + articlesPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Event handlers
  const handleFilterChange = (newCategory: string) => {
    setSelectedCategory(newCategory)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleNewArticle = () => {
    router.push('/knowledge-base/new')
  }

  const handleManageCategories = () => {
    setIsCategoryManagerOpen(true)
  }


  // Error handling
  if (articlesError || categoriesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground mb-4">
            {articlesError?.message || categoriesError?.message}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 bg-background -mx-4 -mb-4">
      {/* Left Sidebar - Categories */}
      <KnowledgeBaseSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleFilterChange}
        onManageCategories={handleManageCategories}
        isLoading={isLoadingCategories}
        isMobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Page Header with Actions */}
        <KnowledgeBasePageHeader
          totalArticles={filteredArticles.length}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearchChange}
          onViewModeChange={setViewMode}
          onNewArticle={handleNewArticle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          isLoading={isLoadingArticles || isLoadingCategories}
        />

        {/* Articles Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {isLoadingArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 9 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first article."
                }
              </p>
              <Button onClick={handleNewArticle}>
                Create First Article
              </Button>
            </div>
          ) : (
            <>
              {/* Articles Grid/List */}
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                  : "space-y-4"
              }>
                {paginatedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    category={categories.find(c => c.id === article.category_id)}
                    viewMode={viewMode}
                    onClick={() => router.push(`/knowledge-base/${article.id}`)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>

      {/* Category Manager Dialog */}
      <CategoryManager
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
      />
    </div>
  )
}