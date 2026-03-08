/*
<ai_context>
Server actions for knowledge base management.
Handles knowledge base categories and articles for coaches.
</ai_context>
*/

"use server"

import { auth } from "@clerk/nextjs/server"
import supabase from "@/lib/supabase-server"
import { getDbUserId } from "@/lib/user-cache"
import { ActionState } from "@/types"
import type { Database } from "@/types/database"

// Cached helper: resolves Clerk userId -> coach ID in a single call
// (getDbUserId is already LRU-cached, so this adds only one DB round-trip)
async function getCoachId(userId: string): Promise<number | null> {
  const dbUserId = await getDbUserId(userId)
  if (!dbUserId) return null
  const { data } = await supabase
    .from('coaches')
    .select('id')
    .eq('user_id', dbUserId)
    .maybeSingle()
  return data?.id ?? null
}

// Define knowledge base types from database
type KnowledgeBaseCategory = Database['public']['Tables']['knowledge_base_categories']['Row']
type KnowledgeBaseCategoryInsert = Database['public']['Tables']['knowledge_base_categories']['Insert']
type KnowledgeBaseCategoryUpdate = Database['public']['Tables']['knowledge_base_categories']['Update']

type KnowledgeBaseArticle = Database['public']['Tables']['knowledge_base_articles']['Row']
type KnowledgeBaseArticleInsert = Database['public']['Tables']['knowledge_base_articles']['Insert']
type KnowledgeBaseArticleUpdate = Database['public']['Tables']['knowledge_base_articles']['Update']

// Extended types with relationships
type CategoryWithArticles = KnowledgeBaseCategory & {
  articles?: KnowledgeBaseArticle[]
}

type ArticleWithCategory = KnowledgeBaseArticle & {
  category?: KnowledgeBaseCategory | null
}

// ============================================================================
// CATEGORY ACTIONS
// ============================================================================

/**
 * Get all knowledge base categories for the current coach
 */
export async function getKnowledgeBaseCategoriesAction(): Promise<ActionState<KnowledgeBaseCategory[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: categories, error } = await supabase
      .from('knowledge_base_categories')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true })

    if (error) {
      console.error("Error fetching knowledge base categories:", error)
      return {
        isSuccess: false,
        message: "Failed to fetch categories"
      }
    }

    return {
      isSuccess: true,
      message: "Categories fetched successfully",
      data: categories || []
    }
  } catch (error) {
    console.error("Error in getKnowledgeBaseCategoriesAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Create a new knowledge base category
 */
export async function createKnowledgeBaseCategoryAction(
  data: Omit<KnowledgeBaseCategoryInsert, 'coach_id'>
): Promise<ActionState<KnowledgeBaseCategory>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: category, error } = await supabase
      .from('knowledge_base_categories')
      .insert({
        ...data,
        coach_id: coachId
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating knowledge base category:", error)
      return {
        isSuccess: false,
        message: "Failed to create category"
      }
    }

    return {
      isSuccess: true,
      message: "Category created successfully",
      data: category
    }
  } catch (error) {
    console.error("Error in createKnowledgeBaseCategoryAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Update a knowledge base category
 */
export async function updateKnowledgeBaseCategoryAction(
  id: number,
  data: KnowledgeBaseCategoryUpdate
): Promise<ActionState<KnowledgeBaseCategory>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: category, error } = await supabase
      .from('knowledge_base_categories')
      .update(data)
      .eq('id', id)
      .eq('coach_id', coachId) // Ensure coach owns this category
      .select()
      .single()

    if (error) {
      console.error("Error updating knowledge base category:", error)
      return {
        isSuccess: false,
        message: "Failed to update category"
      }
    }

    return {
      isSuccess: true,
      message: "Category updated successfully",
      data: category
    }
  } catch (error) {
    console.error("Error in updateKnowledgeBaseCategoryAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Delete a knowledge base category
 */
export async function deleteKnowledgeBaseCategoryAction(id: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { error } = await supabase
      .from('knowledge_base_categories')
      .delete()
      .eq('id', id)
      .eq('coach_id', coachId) // Ensure coach owns this category

    if (error) {
      console.error("Error deleting knowledge base category:", error)
      return {
        isSuccess: false,
        message: "Failed to delete category"
      }
    }

    return {
      isSuccess: true,
      message: "Category deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error in deleteKnowledgeBaseCategoryAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

// ============================================================================
// ARTICLE ACTIONS
// ============================================================================

/**
 * Get all knowledge base articles for the current coach
 */
export async function getKnowledgeBaseArticlesAction(): Promise<ActionState<ArticleWithCategory[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: articles, error } = await supabase
      .from('knowledge_base_articles')
      .select(`
        *,
        category:knowledge_base_categories(*)
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching knowledge base articles:", error)
      return {
        isSuccess: false,
        message: "Failed to fetch articles"
      }
    }

    return {
      isSuccess: true,
      message: "Articles fetched successfully",
      data: articles || []
    }
  } catch (error) {
    console.error("Error in getKnowledgeBaseArticlesAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get articles by category
 */
export async function getKnowledgeBaseArticlesByCategoryAction(
  categoryId: number
): Promise<ActionState<ArticleWithCategory[]>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: articles, error } = await supabase
      .from('knowledge_base_articles')
      .select(`
        *,
        category:knowledge_base_categories(*)
      `)
      .eq('coach_id', coachId)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching articles by category:", error)
      return {
        isSuccess: false,
        message: "Failed to fetch articles"
      }
    }

    return {
      isSuccess: true,
      message: "Articles fetched successfully",
      data: articles || []
    }
  } catch (error) {
    console.error("Error in getKnowledgeBaseArticlesByCategoryAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Get a single knowledge base article
 */
export async function getKnowledgeBaseArticleAction(id: number): Promise<ActionState<ArticleWithCategory | null>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: article, error } = await supabase
      .from('knowledge_base_articles')
      .select(`
        *,
        category:knowledge_base_categories(*)
      `)
      .eq('id', id)
      .eq('coach_id', coachId)
      .single()

    if (error) {
      console.error("Error fetching knowledge base article:", error)
      return {
        isSuccess: false,
        message: "Failed to fetch article"
      }
    }

    return {
      isSuccess: true,
      message: "Article fetched successfully",
      data: article
    }
  } catch (error) {
    console.error("Error in getKnowledgeBaseArticleAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Create a new knowledge base article
 */
export async function createKnowledgeBaseArticleAction(
  data: Omit<KnowledgeBaseArticleInsert, 'coach_id'>
): Promise<ActionState<KnowledgeBaseArticle>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: article, error } = await supabase
      .from('knowledge_base_articles')
      .insert({
        ...data,
        coach_id: coachId
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating knowledge base article:", error)
      return {
        isSuccess: false,
        message: "Failed to create article"
      }
    }

    return {
      isSuccess: true,
      message: "Article created successfully",
      data: article
    }
  } catch (error) {
    console.error("Error in createKnowledgeBaseArticleAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Update a knowledge base article
 */
export async function updateKnowledgeBaseArticleAction(
  id: number,
  data: KnowledgeBaseArticleUpdate
): Promise<ActionState<KnowledgeBaseArticle>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { data: article, error } = await supabase
      .from('knowledge_base_articles')
      .update(data)
      .eq('id', id)
      .eq('coach_id', coachId) // Ensure coach owns this article
      .select()
      .single()

    if (error) {
      console.error("Error updating knowledge base article:", error)
      return {
        isSuccess: false,
        message: "Failed to update article"
      }
    }

    return {
      isSuccess: true,
      message: "Article updated successfully",
      data: article
    }
  } catch (error) {
    console.error("Error in updateKnowledgeBaseArticleAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}

/**
 * Delete a knowledge base article
 */
export async function deleteKnowledgeBaseArticleAction(id: number): Promise<ActionState<void>> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        isSuccess: false,
        message: "User not authenticated"
      }
    }

    const coachId = await getCoachId(userId)
    if (!coachId) {
      return {
        isSuccess: false,
        message: "Coach profile not found"
      }
    }

    const { error } = await supabase
      .from('knowledge_base_articles')
      .delete()
      .eq('id', id)
      .eq('coach_id', coachId) // Ensure coach owns this article

    if (error) {
      console.error("Error deleting knowledge base article:", error)
      return {
        isSuccess: false,
        message: "Failed to delete article"
      }
    }

    return {
      isSuccess: true,
      message: "Article deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error in deleteKnowledgeBaseArticleAction:", error)
    return {
      isSuccess: false,
      message: "An unexpected error occurred"
    }
  }
}
