"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { 
  Article, 
  Integration, 
  ArticleFilters, 
  ArticleSort, 
  PaginationParams,
  SearchResult 
} from "../types"
import {
  getArticlesAction,
  getArticleByIdAction,
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  toggleBookmarkAction,
  getRelatedArticlesAction,
  searchArticlesAction,
  getIntegrationsAction,
  connectIntegrationAction,
  disconnectIntegrationAction,
  updateIntegrationStatusAction,
  testIntegrationConnectionAction,
  syncIntegrationDataAction
} from "@/actions/knowledge-base"

// Hook for managing articles
export function useArticles(
  initialFilters?: ArticleFilters,
  initialSort: ArticleSort = 'date_updated'
) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ArticleFilters | undefined>(initialFilters)
  const [sort, setSort] = useState<ArticleSort>(initialSort)
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, limit: 12 })
  const [searchResult, setSearchResult] = useState<SearchResult<Article> | null>(null)
  const { toast } = useToast()

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getArticlesAction(filters, sort, pagination)
      
      if (result.isSuccess) {
        setArticles(result.data.items)
        setSearchResult(result.data)
      } else {
        setError(result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      const errorMessage = "Failed to fetch articles"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, sort, pagination, toast])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const updateFilters = useCallback((newFilters: ArticleFilters | undefined) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const updateSort = useCallback((newSort: ArticleSort) => {
    setSort(newSort)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }, [])

  const updatePagination = useCallback((newPagination: Partial<PaginationParams>) => {
    setPagination(prev => ({ ...prev, ...newPagination }))
  }, [])

  const refresh = useCallback(() => {
    fetchArticles()
  }, [fetchArticles])

  return {
    articles,
    loading,
    error,
    filters,
    sort,
    pagination,
    searchResult,
    updateFilters,
    updateSort,
    updatePagination,
    refresh
  }
}

// Hook for managing a single article
export function useArticle(articleId: string | null) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const { toast } = useToast()

  const fetchArticle = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getArticleByIdAction(id)
      
      if (result.isSuccess) {
        setArticle(result.data)
        
        // Fetch related articles
        const relatedResult = await getRelatedArticlesAction(id)
        if (relatedResult.isSuccess) {
          setRelatedArticles(relatedResult.data)
        }
      } else {
        setError(result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      const errorMessage = "Failed to fetch article"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (articleId) {
      fetchArticle(articleId)
    } else {
      setArticle(null)
      setRelatedArticles([])
    }
  }, [articleId, fetchArticle])

  const toggleBookmark = useCallback(async () => {
    if (!article) return

    try {
      const result = await toggleBookmarkAction(article.id)
      
      if (result.isSuccess) {
        setArticle(prev => prev ? { ...prev, isBookmarked: result.data } : null)
        toast({
          title: "Success",
          description: result.message
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      })
    }
  }, [article, toast])

  return {
    article,
    loading,
    error,
    relatedArticles,
    toggleBookmark,
    refresh: () => articleId && fetchArticle(articleId)
  }
}

// Hook for managing integrations
export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchIntegrations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getIntegrationsAction()
      
      if (result.isSuccess) {
        setIntegrations(result.data)
      } else {
        setError(result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      const errorMessage = "Failed to fetch integrations"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  const connectIntegration = useCallback(async (integrationId: string) => {
    try {
      const result = await connectIntegrationAction(integrationId)
      
      if (result.isSuccess) {
        setIntegrations(prev => 
          prev.map(integration => 
            integration.id === integrationId ? result.data : integration
          )
        )
        toast({
          title: "Success",
          description: result.message
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect integration",
        variant: "destructive"
      })
    }
  }, [toast])

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    try {
      const result = await disconnectIntegrationAction(integrationId)
      
      if (result.isSuccess) {
        setIntegrations(prev => 
          prev.map(integration => 
            integration.id === integrationId ? result.data : integration
          )
        )
        toast({
          title: "Success",
          description: result.message
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive"
      })
    }
  }, [toast])

  const testConnection = useCallback(async (integrationId: string) => {
    try {
      const result = await testIntegrationConnectionAction(integrationId)
      
      if (result.isSuccess) {
        // Refresh integrations to get updated status
        await fetchIntegrations()
        toast({
          title: result.data ? "Success" : "Warning",
          description: result.message,
          variant: result.data ? "default" : "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive"
      })
    }
  }, [fetchIntegrations, toast])

  const syncData = useCallback(async (integrationId: string) => {
    try {
      const result = await syncIntegrationDataAction(integrationId)
      
      if (result.isSuccess) {
        // Refresh integrations to get updated sync time
        await fetchIntegrations()
        toast({
          title: "Success",
          description: result.message
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to sync data",
        variant: "destructive"
      })
    }
  }, [fetchIntegrations, toast])

  const configureIntegration = useCallback((integrationId: string) => {
    // This would typically open a configuration modal or navigate to a config page
    // For now, we'll just show a placeholder toast
    toast({
      title: "Configuration",
      description: "Integration configuration would open here"
    })
  }, [toast])

  return {
    integrations,
    loading,
    error,
    connectIntegration,
    disconnectIntegration,
    testConnection,
    syncData,
    configureIntegration,
    refresh: fetchIntegrations
  }
}

// Hook for search functionality
export function useArticleSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult<Article> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const search = useCallback(async (
    query: string, 
    filters?: Omit<ArticleFilters, 'search'>,
    pagination?: PaginationParams
  ) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await searchArticlesAction(query, filters, pagination)
      
      if (result.isSuccess) {
        setSearchResults(result.data)
      } else {
        setError(result.message)
        toast({
          title: "Search Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (err) {
      const errorMessage = "Search failed"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setSearchResults(null)
    setError(null)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    search,
    clearSearch
  }
} 