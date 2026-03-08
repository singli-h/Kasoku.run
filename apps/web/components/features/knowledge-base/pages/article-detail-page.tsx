"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, FileText, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArticleEditor } from "../editor/article-editor"
import { KeyboardShortcuts } from "../components/keyboard-shortcuts"
import { TipTapContent } from '@/types/tiptap'
import { Json } from '@/types/database'
import { useKnowledgeBaseArticle, useUpdateKnowledgeBaseArticle } from "../hooks/use-knowledge-base-queries"

interface ArticleDetailPageProps {
  articleId: string
}

export function ArticleDetailPage({ articleId }: ArticleDetailPageProps) {
  const router = useRouter()
  
  // Fetch the article by ID
  const { 
    data: article, 
    isLoading: isLoadingArticle, 
    error: articleError 
  } = useKnowledgeBaseArticle(parseInt(articleId))
  
  const [articleContent, setArticleContent] = useState<TipTapContent>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Mutations
  const updateArticleMutation = useUpdateKnowledgeBaseArticle()

  // Initialize content when article loads
  useEffect(() => {
    if (article?.content) {
      // TipTap content is already in the correct JSON format
      setArticleContent(article.content as TipTapContent)
    }
  }, [article])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Debounced auto-save function
  const debouncedAutoSave = useCallback((content: TipTapContent) => {
    const timeoutId = setTimeout(async () => {
      if (!hasUnsavedChanges || !article) return
      
      setIsSaving(true)
      try {
        await updateArticleMutation.mutateAsync({
          id: parseInt(articleId),
          data: {
            title: article.title,
            content: content as Json,
            category_id: article.category_id,
          }
        })
        
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, 2000) // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timeoutId)
  }, [hasUnsavedChanges, articleId, article, updateArticleMutation])

  const handleContentChange = (content: TipTapContent) => {
    setArticleContent(content)
    setHasUnsavedChanges(true)
    debouncedAutoSave(content)
  }

  const handleManualSave = async () => {
    if (!article) return
    
    setIsSaving(true)
    try {
      await updateArticleMutation.mutateAsync({
        id: parseInt(articleId),
        data: {
          title: article.title,
          content: articleContent as Json,
          category_id: article.category_id,
        }
      })
      
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save article:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoadingArticle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (articleError || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-semibold mb-4">Article Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The article you're looking for doesn't exist or has been moved.
              </p>
              <Button onClick={() => router.push('/knowledge-base')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/knowledge-base')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{article.title}</h1>
                {article.category && (
                  <Badge variant="secondary">
                    {article.category.name}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Updated {formatDate(article.updated_at)}
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Created {formatDate(article.created_at)}
                </div>
                {lastSaved && (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-1" />
                    Saved {formatLastSaved(lastSaved)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4 flex items-center space-x-2">
              <KeyboardShortcuts />
              {isSaving && (
                <div className="text-sm text-muted-foreground">
                  Saving...
                </div>
              )}
              {hasUnsavedChanges && !isSaving && (
                <div className="text-sm text-orange-600">
                  Unsaved changes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content - Always in Edit Mode */}
        <Card>
          <CardContent className="p-0">
            <ArticleEditor
              content={articleContent}
              onChange={handleContentChange}
              onSave={handleManualSave}
              placeholder="Start writing your article..."
              className=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
