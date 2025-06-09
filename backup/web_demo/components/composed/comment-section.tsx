"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
  createdAt: Date
  updatedAt?: Date
}

export interface CommentSectionProps {
  comments?: Comment[]
  placeholder?: string
  submitLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  onAddComment?: (content: string) => void | Promise<void>
  isSubmitting?: boolean
  className?: string
  variant?: 'task' | 'article' | 'default'
}

export function CommentSection({
  comments = [],
  placeholder = "Add a comment...",
  submitLabel = "Add Comment",
  emptyTitle = "No comments yet",
  emptyDescription,
  onAddComment,
  isSubmitting = false,
  className,
  variant = 'default'
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const getEmptyDescription = () => {
    if (emptyDescription) return emptyDescription
    switch (variant) {
      case 'task':
        return "Start a conversation about this task"
      case 'article':
        return "Start a conversation about this article"
      default:
        return "Be the first to leave a comment"
    }
  }

  const handleSubmit = async () => {
    if (!commentText.trim() || !onAddComment) return
    
    setIsLoading(true)
    try {
      await onAddComment(commentText.trim())
      setCommentText("")
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // If there are no comments and it's a simple variant (like the task detail), 
  // show the basic empty state
  const showSimpleEmptyState = comments.length === 0 && !onAddComment

  return (
    <Card className={cn("border-border", className)}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Comments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {getEmptyDescription()}
            </p>
            
            {showSimpleEmptyState ? (
              <Button variant="outline">Add Comment</Button>
            ) : onAddComment && (
              <div className="space-y-3">
                <Textarea
                  placeholder={placeholder}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full"
                  disabled={isLoading || isSubmitting}
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isLoading || isSubmitting}
                  className="w-full"
                >
                  {isLoading || isSubmitting ? 'Adding...' : submitLabel}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Existing comments */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                    <AvatarFallback className="text-xs">
                      {comment.author.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new comment */}
            {onAddComment && (
              <div className="border-t pt-4 space-y-3">
                <Textarea
                  placeholder={placeholder}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full"
                  disabled={isLoading || isSubmitting}
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isLoading || isSubmitting}
                  size="sm"
                >
                  {isLoading || isSubmitting ? 'Adding...' : submitLabel}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 