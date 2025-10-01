"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Categories */}
      <KnowledgeBaseSidebar 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleFilterChange}
        onManageCategories={handleManageCategories}
        isLoading={isLoadingCategories}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Page Header with Actions */}
        <KnowledgeBasePageHeader
          totalArticles={filteredArticles.length}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearchChange}
          onViewModeChange={setViewMode}
          onNewArticle={handleNewArticle}
          isLoading={isLoadingArticles || isLoadingCategories}
        />

        {/* Articles Content */}
        <div className="flex-1 p-6">
          {isLoadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="flex flex-col items-center justify-center h-64 text-center">
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
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
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