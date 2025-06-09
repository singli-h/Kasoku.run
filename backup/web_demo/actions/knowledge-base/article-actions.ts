"use server"

import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { ActionState } from "@/types"
import { 
  Article, 
  ArticleCreateInput, 
  ArticleUpdateInput, 
  ArticleFilters,
  ArticleSort,
  SearchResult,
  PaginationParams
} from "@/components/features/knowledge-base/types"
import { 
  filterArticles, 
  sortArticles, 
  generateArticleExcerpt,
  generateSlug 
} from "@/components/features/knowledge-base/utils"

// Mock data for development - replace with actual database calls
const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "Getting Started with GuideLayer AI",
    content: "# Getting Started with GuideLayer AI\n\nWelcome to GuideLayer AI! This guide will help you understand how to use our AI-powered collaboration platform...",
    excerpt: "Learn the basics of GuideLayer AI and how to get started with AI-powered collaboration between businesses and virtual assistants.",
    category: "getting-started",
    tags: ["onboarding", "basics", "tutorial"],
    status: "published",
    authorId: "user_123",
    authorName: "John Doe",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-20T14:30:00Z"),
    publishedAt: new Date("2024-01-16T09:00:00Z"),
    viewCount: 245,
    isBookmarked: false
  },
  {
    id: "2",
    title: "Setting Up Your First AI Interview",
    content: "# Setting Up Your First AI Interview\n\nThe AI Interview feature is the core of GuideLayer AI...",
    excerpt: "Step-by-step guide to creating your first AI-powered task interview for better VA collaboration.",
    category: "tutorials",
    tags: ["ai-interview", "setup", "workflow"],
    status: "published",
    authorId: "user_456",
    authorName: "Jane Smith",
    authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    createdAt: new Date("2024-01-18T11:00:00Z"),
    updatedAt: new Date("2024-01-22T16:45:00Z"),
    publishedAt: new Date("2024-01-19T10:00:00Z"),
    viewCount: 189,
    isBookmarked: true
  },
  {
    id: "3",
    title: "API Reference: Task Management",
    content: "# API Reference: Task Management\n\n## Overview\nThis document covers the Task Management API endpoints...",
    excerpt: "Complete API documentation for managing tasks and workflows in GuideLayer AI.",
    category: "api-reference",
    tags: ["api", "tasks", "reference"],
    status: "published",
    authorId: "user_789",
    authorName: "Mike Johnson",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
    createdAt: new Date("2024-01-20T09:30:00Z"),
    updatedAt: new Date("2024-01-25T11:15:00Z"),
    publishedAt: new Date("2024-01-21T08:00:00Z"),
    viewCount: 156,
    isBookmarked: false
  },
  {
    id: "4",
    title: "Troubleshooting Common Integration Issues",
    content: "# Troubleshooting Common Integration Issues\n\n## Problem Description\nUsers may encounter various issues when setting up integrations...",
    excerpt: "Solutions for common problems when integrating GuideLayer AI with third-party tools.",
    category: "troubleshooting",
    tags: ["troubleshooting", "integrations", "support"],
    status: "published",
    authorId: "user_123",
    authorName: "John Doe",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
    createdAt: new Date("2024-01-22T14:00:00Z"),
    updatedAt: new Date("2024-01-26T10:20:00Z"),
    publishedAt: new Date("2024-01-23T09:00:00Z"),
    viewCount: 98,
    isBookmarked: false
  },
  {
    id: "5",
    title: "Best Practices for VA Collaboration",
    content: "# Best Practices for VA Collaboration\n\nEffective collaboration with virtual assistants requires...",
    excerpt: "Learn proven strategies for maximizing productivity when working with virtual assistants.",
    category: "best-practices",
    tags: ["collaboration", "productivity", "best-practices"],
    status: "draft",
    authorId: "user_456",
    authorName: "Jane Smith",
    authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    createdAt: new Date("2024-01-25T13:00:00Z"),
    updatedAt: new Date("2024-01-27T15:30:00Z"),
    viewCount: 12,
    isBookmarked: false
  }
];

/**
 * Get articles with optional filtering, sorting, and pagination
 */
export async function getArticlesAction(
  filters?: ArticleFilters,
  sort: ArticleSort = 'date_updated',
  pagination?: PaginationParams
): Promise<ActionState<SearchResult<Article>>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    // For now, use mock data with client-side filtering and sorting
    let articles = [...MOCK_ARTICLES]

    // Apply filters
    if (filters) {
      articles = filterArticles(articles, filters)
    }

    // Apply sorting
    articles = sortArticles(articles, sort)

    // Apply pagination
    const page = pagination?.page || 1
    const limit = pagination?.limit || 12
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedArticles = articles.slice(startIndex, endIndex)
    const total = articles.length
    const hasMore = endIndex < total

    return {
      isSuccess: true,
      message: "Articles retrieved successfully",
      data: {
        items: paginatedArticles,
        total,
        page,
        limit,
        hasMore
      }
    }
  } catch (error) {
    console.error('Error in getArticlesAction:', error)
    return {
      isSuccess: false,
      message: "Failed to retrieve articles"
    }
  }
}

/**
 * Get a single article by ID
 */
export async function getArticleByIdAction(id: string): Promise<ActionState<Article>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    const article = MOCK_ARTICLES.find(a => a.id === id)

    if (!article) {
      return {
        isSuccess: false,
        message: "Article not found"
      }
    }

    // Increment view count (in real implementation, this would be a separate action)
    article.viewCount = (article.viewCount || 0) + 1

    return {
      isSuccess: true,
      message: "Article retrieved successfully",
      data: article
    }
  } catch (error) {
    console.error('Error in getArticleByIdAction:', error)
    return {
      isSuccess: false,
      message: "Failed to retrieve article"
    }
  }
}

/**
 * Create a new article
 */
export async function createArticleAction(input: ArticleCreateInput): Promise<ActionState<Article>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Get user details from database
    const authorName = "Current User" // Replace with actual user name
    const authorAvatar = undefined // Replace with actual user avatar

    // Generate excerpt if not provided
    const excerpt = input.excerpt || generateArticleExcerpt(input.content)

    // Create new article
    const newArticle: Article = {
      id: `article_${Date.now()}`, // TODO: Use proper UUID generation
      title: input.title,
      content: input.content,
      excerpt,
      category: input.category,
      tags: input.tags,
      status: input.status,
      authorId: userId,
      authorName,
      authorAvatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: input.status === 'published' ? new Date() : undefined,
      viewCount: 0,
      isBookmarked: false
    }

    // TODO: Save to database
    MOCK_ARTICLES.push(newArticle)

    return {
      isSuccess: true,
      message: "Article created successfully",
      data: newArticle
    }
  } catch (error) {
    console.error('Error in createArticleAction:', error)
    return {
      isSuccess: false,
      message: "Failed to create article"
    }
  }
}

/**
 * Update an existing article
 */
export async function updateArticleAction(input: ArticleUpdateInput): Promise<ActionState<Article>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    const articleIndex = MOCK_ARTICLES.findIndex(a => a.id === input.id)
    
    if (articleIndex === -1) {
      return {
        isSuccess: false,
        message: "Article not found"
      }
    }

    const existingArticle = MOCK_ARTICLES[articleIndex]

    // Check if user has permission to edit (author or admin)
    if (existingArticle.authorId !== userId) {
      // TODO: Add admin role check
      return {
        isSuccess: false,
        message: "Permission denied"
      }
    }

    // Update article
    const updatedArticle: Article = {
      ...existingArticle,
      ...input,
      id: existingArticle.id, // Ensure ID doesn't change
      authorId: existingArticle.authorId, // Ensure author doesn't change
      createdAt: existingArticle.createdAt, // Ensure creation date doesn't change
      updatedAt: new Date(),
      publishedAt: input.status === 'published' && !existingArticle.publishedAt 
        ? new Date() 
        : existingArticle.publishedAt,
      excerpt: input.content ? generateArticleExcerpt(input.content) : existingArticle.excerpt
    }

    // TODO: Save to database
    MOCK_ARTICLES[articleIndex] = updatedArticle

    return {
      isSuccess: true,
      message: "Article updated successfully",
      data: updatedArticle
    }
  } catch (error) {
    console.error('Error in updateArticleAction:', error)
    return {
      isSuccess: false,
      message: "Failed to update article"
    }
  }
}

/**
 * Delete an article (soft delete)
 */
export async function deleteArticleAction(id: string): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    const articleIndex = MOCK_ARTICLES.findIndex(a => a.id === id)
    
    if (articleIndex === -1) {
      return {
        isSuccess: false,
        message: "Article not found"
      }
    }

    const article = MOCK_ARTICLES[articleIndex]

    // Check if user has permission to delete (author or admin)
    if (article.authorId !== userId) {
      // TODO: Add admin role check
      return {
        isSuccess: false,
        message: "Permission denied"
      }
    }

    // TODO: Implement soft delete in database (set status to 'archived' or add deleted_at field)
    // For now, just remove from mock array
    MOCK_ARTICLES.splice(articleIndex, 1)

    return {
      isSuccess: true,
      message: "Article deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error('Error in deleteArticleAction:', error)
    return {
      isSuccess: false,
      message: "Failed to delete article"
    }
  }
}

/**
 * Toggle bookmark status for an article
 */
export async function toggleBookmarkAction(articleId: string): Promise<ActionState<boolean>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query
    const article = MOCK_ARTICLES.find(a => a.id === articleId)
    
    if (!article) {
      return {
        isSuccess: false,
        message: "Article not found"
      }
    }

    // Toggle bookmark status
    article.isBookmarked = !article.isBookmarked

    // TODO: Save bookmark status to user preferences in database

    return {
      isSuccess: true,
      message: `Article ${article.isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully`,
      data: article.isBookmarked
    }
  } catch (error) {
    console.error('Error in toggleBookmarkAction:', error)
    return {
      isSuccess: false,
      message: "Failed to toggle bookmark"
    }
  }
}

/**
 * Get related articles based on category and tags
 */
export async function getRelatedArticlesAction(
  articleId: string, 
  limit: number = 3
): Promise<ActionState<Article[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    // TODO: Replace with actual database query with proper relevance scoring
    const currentArticle = MOCK_ARTICLES.find(a => a.id === articleId)
    
    if (!currentArticle) {
      return {
        isSuccess: false,
        message: "Article not found"
      }
    }

    // Simple related articles logic - same category or shared tags
    const relatedArticles = MOCK_ARTICLES
      .filter(article => 
        article.id !== articleId && 
        article.status === 'published' &&
        (
          article.category === currentArticle.category ||
          article.tags.some(tag => currentArticle.tags.includes(tag))
        )
      )
      .slice(0, limit)

    return {
      isSuccess: true,
      message: "Related articles retrieved successfully",
      data: relatedArticles
    }
  } catch (error) {
    console.error('Error in getRelatedArticlesAction:', error)
    return {
      isSuccess: false,
      message: "Failed to retrieve related articles"
    }
  }
}

/**
 * Search articles with full-text search
 */
export async function searchArticlesAction(
  query: string,
  filters?: Omit<ArticleFilters, 'search'>,
  pagination?: PaginationParams
): Promise<ActionState<SearchResult<Article>>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "Authentication required"
      }
    }

    if (!query || query.trim().length < 2) {
      return {
        isSuccess: false,
        message: "Search query must be at least 2 characters"
      }
    }

    // Combine search query with other filters
    const searchFilters: ArticleFilters = {
      ...filters,
      search: query.trim()
    }

    // Use existing getArticlesAction with search filters
    return await getArticlesAction(searchFilters, 'relevance', pagination)
  } catch (error) {
    console.error('Error in searchArticlesAction:', error)
    return {
      isSuccess: false,
      message: "Search failed"
    }
  }
} 