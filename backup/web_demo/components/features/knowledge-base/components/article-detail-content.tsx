"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Edit, MoreHorizontal, Calendar, User, Clock, Eye, Bookmark, BookmarkCheck, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CommentSection } from "@/components/composed"
import { getArticleByIdAction, toggleBookmarkAction, getCommentsAction, createCommentAction } from "@/actions/knowledge-base"
import { ARTICLE_STATUS_CONFIG } from "../constants"
import type { Article } from "../types"
import type { CommentWithAuthor } from "@/types/database"
import type { Comment } from "@/components/composed"

interface ArticleDetailContentProps {
  articleId: string
}

// Transform database comments to UI comment format
const transformCommentsForUI = (dbComments: CommentWithAuthor[]): Comment[] => {
  return dbComments.map(comment => ({
    id: comment.id.toString(),
    content: comment.content,
    author: {
      id: comment.author?.id?.toString() || '',
      name: comment.author ? `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() : 'Unknown',
      avatar: comment.author?.avatar_url || undefined,
      initials: comment.author 
        ? `${comment.author.first_name?.[0] || ''}${comment.author.last_name?.[0] || ''}`.toUpperCase()
        : 'U'
    },
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at)
  }))
}

export function ArticleDetailContent({ articleId }: ArticleDetailContentProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      
      // Load article
      const articleResult = await getArticleByIdAction(articleId)
      if (articleResult.isSuccess) {
        setArticle(articleResult.data)
        
        // Load comments for the article
        const commentsResult = await getCommentsAction('kb_article', parseInt(articleId))
        if (commentsResult.isSuccess) {
          setComments(transformCommentsForUI(commentsResult.data))
        }
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [articleId])

  const handleBookmarkToggle = async () => {
    if (!article) return
    setIsBookmarking(true)
    
    const result = await toggleBookmarkAction(article.id)
    if (result.isSuccess) {
      setArticle(prev => prev ? { ...prev, isBookmarked: result.data } : null)
    }
    setIsBookmarking(false)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  const handleAddComment = async (content: string) => {
    if (!content.trim() || !article) return
    
    setIsSubmittingComment(true)
    
    const result = await createCommentAction({
      entity_type: 'kb_article',
      entity_id: parseInt(articleId),
      content,
      organization_id: 1 // TODO: Get from context
    })
    
    if (result.isSuccess) {
      // Reload comments
      const commentsResult = await getCommentsAction('kb_article', parseInt(articleId))
      if (commentsResult.isSuccess) {
        setComments(transformCommentsForUI(commentsResult.data))
      }
    }
    
    setIsSubmittingComment(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!article) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Article not found</p>
          <Link href="/knowledge-base" className="text-primary hover:text-primary/80">
            Return to Knowledge Base
          </Link>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = ARTICLE_STATUS_CONFIG[article.status] || ARTICLE_STATUS_CONFIG.draft

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Link href="/knowledge-base">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
              
              {/* Status Badge */}
              <Badge 
                variant={statusConfig.variant}
                className={cn("text-xs", statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>

              {/* Category Badge */}
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
              
              <span className="text-sm text-muted-foreground">
                Updated {article.updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBookmarkToggle}
            disabled={isBookmarking}
          >
            {article.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            {article.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Link href={`/knowledge-base/articles/${article.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Duplicate Article</DropdownMenuItem>
              <DropdownMenuItem>Archive Article</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Article</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Article content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none text-foreground">
                {/* TODO: Implement proper markdown rendering */}
                <div className="whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>
            </CardContent>
          </Card>

          <CommentSection 
            variant="article"
            comments={comments}
            onAddComment={handleAddComment}
            isSubmitting={isSubmittingComment}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Article Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Author</span>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={article.authorAvatar} alt={article.authorName} />
                    <AvatarFallback className="text-xs">
                      {article.authorName?.split(' ').map(n => n[0]).join('') || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">{article.authorName}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge 
                  variant={statusConfig.variant}
                  className={cn("text-xs", statusConfig.className)}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {article.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {article.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Views</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {article.viewCount || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 