/*
<ai_context>
Knowledge base query hooks using the established useSupabaseQuery pattern.
Provides standardized data fetching with proper error handling, caching, and type safety.
</ai_context>
*/

"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { 
  getKnowledgeBaseCategoriesAction,
  getKnowledgeBaseArticlesAction,
  getKnowledgeBaseArticleAction,
  createKnowledgeBaseCategoryAction,
  updateKnowledgeBaseCategoryAction,
  deleteKnowledgeBaseCategoryAction,
  createKnowledgeBaseArticleAction,
  updateKnowledgeBaseArticleAction,
  deleteKnowledgeBaseArticleAction
} from '@/actions/knowledge-base'
import type { Database } from '@/types/database'

// Type definitions from database schema
type KnowledgeBaseCategory = Database['public']['Tables']['knowledge_base_categories']['Row']
type KnowledgeBaseCategoryInsert = Database['public']['Tables']['knowledge_base_categories']['Insert']
type KnowledgeBaseCategoryUpdate = Database['public']['Tables']['knowledge_base_categories']['Update']

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base_articles']['Row']
type KnowledgeBaseArticleInsert = Database['public']['Tables']['knowledge_base_articles']['Insert']
type KnowledgeBaseArticleUpdate = Database['public']['Tables']['knowledge_base_articles']['Update']

// Extended types with relationships
type ArticleWithCategory = KnowledgeBaseArticle & {
  category: KnowledgeBaseCategory | null
}

// Query keys for consistent caching
export const KNOWLEDGE_BASE_QUERY_KEYS = {
  CATEGORIES: ['knowledge-base-categories'] as const,
  ARTICLES: ['knowledge-base-articles'] as const,
  ARTICLE: (id: number) => ['knowledge-base-article', id] as const,
  ARTICLES_BY_CATEGORY: (categoryId: number) => ['knowledge-base-articles', 'category', categoryId] as const,
} as const

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all knowledge base categories for the current coach
 */
export function useKnowledgeBaseCategories() {
  return useSupabaseQuery(
    KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES,
    async (_supabase, _dbUserId) => {
      const result = await getKnowledgeBaseCategoriesAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return { data: result.data, error: null }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

/**
 * Fetch all knowledge base articles for the current coach
 */
export function useKnowledgeBaseArticles() {
  return useSupabaseQuery(
    KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES,
    async (_supabase, _dbUserId) => {
      const result = await getKnowledgeBaseArticlesAction()
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return { data: result.data, error: null }
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - articles change more frequently
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

/**
 * Fetch a single knowledge base article by ID
 */
export function useKnowledgeBaseArticle(articleId: number, enabled: boolean = true) {
  return useSupabaseQuery(
    KNOWLEDGE_BASE_QUERY_KEYS.ARTICLE(articleId),
    async (_supabase, _dbUserId) => {
      const result = await getKnowledgeBaseArticleAction(articleId)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return { data: result.data, error: null }
    },
    {
      enabled: enabled && articleId > 0,
      staleTime: 1 * 60 * 1000, // 1 minute - individual articles change frequently
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new knowledge base category
 */
export function useCreateKnowledgeBaseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<KnowledgeBaseCategoryInsert, 'coach_id'>) => {
      const result = await createKnowledgeBaseCategoryAction(data)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate categories query to refetch
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES 
      })
    },
  })
}

/**
 * Update an existing knowledge base category
 */
export function useUpdateKnowledgeBaseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number
      data: KnowledgeBaseCategoryUpdate 
    }) => {
      const result = await updateKnowledgeBaseCategoryAction(id, data)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate categories query to refetch
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES 
      })
    },
  })
}

/**
 * Delete a knowledge base category
 */
export function useDeleteKnowledgeBaseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteKnowledgeBaseCategoryAction(id)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidate both categories and articles queries
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES 
      })
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
      })
    },
  })
}

/**
 * Create a new knowledge base article
 */
export function useCreateKnowledgeBaseArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<KnowledgeBaseArticleInsert, 'coach_id'>) => {
      const result = await createKnowledgeBaseArticleAction(data)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (newArticle) => {
      // Invalidate articles query to refetch
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
      })
      
      // If article has a category, invalidate category-specific queries
      if (newArticle.category_id) {
        queryClient.invalidateQueries({ 
          queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES_BY_CATEGORY(newArticle.category_id)
        })
      }
    },
  })
}

/**
 * Update an existing knowledge base article
 */
export function useUpdateKnowledgeBaseArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number
      data: KnowledgeBaseArticleUpdate 
    }) => {
      const result = await updateKnowledgeBaseArticleAction(id, data)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (updatedArticle) => {
      // Invalidate articles query to refetch
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
      })
      
      // Invalidate specific article query
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLE(updatedArticle.id)
      })
      
      // If article has a category, invalidate category-specific queries
      if (updatedArticle.category_id) {
        queryClient.invalidateQueries({ 
          queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES_BY_CATEGORY(updatedArticle.category_id)
        })
      }
    },
  })
}

/**
 * Delete a knowledge base article
 */
export function useDeleteKnowledgeBaseArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteKnowledgeBaseArticleAction(id)
      if (!result.isSuccess) {
        throw new Error(result.message)
      }
      return result.data
    },
    onSuccess: (_, deletedId) => {
      // Invalidate articles query to refetch
      queryClient.invalidateQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
      })
      
      // Remove specific article from cache
      queryClient.removeQueries({ 
        queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLE(deletedId)
      })
    },
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch knowledge base data for better performance
 */
export function useKnowledgeBasePrefetch() {
  const queryClient = useQueryClient()

  const prefetchCategories = () => {
    queryClient.prefetchQuery({
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES,
      queryFn: async () => {
        const result = await getKnowledgeBaseCategoriesAction()
        if (!result.isSuccess) {
          throw new Error(result.message)
        }
        return result.data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchArticles = () => {
    queryClient.prefetchQuery({
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES,
      queryFn: async () => {
        const result = await getKnowledgeBaseArticlesAction()
        if (!result.isSuccess) {
          throw new Error(result.message)
        }
        return result.data
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  return {
    prefetchCategories,
    prefetchArticles,
  }
}

/**
 * Cache management utilities
 */
export function useKnowledgeBaseCache() {
  const queryClient = useQueryClient()

  const clearCache = () => {
    queryClient.removeQueries({ 
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES 
    })
    queryClient.removeQueries({ 
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
    })
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ 
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.CATEGORIES 
    })
    queryClient.invalidateQueries({ 
      queryKey: KNOWLEDGE_BASE_QUERY_KEYS.ARTICLES 
    })
  }

  return {
    clearCache,
    invalidateAll,
  }
}
