/*
<ai_context>
Article editor page with stable save button placement in the header.
Follows the established patterns for editor pages with fixed action buttons.
</ai_context>
*/

"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import dynamic from "next/dynamic"

const ArticleEditor = dynamic(
  () => import("../editor/article-editor").then((mod) => mod.ArticleEditor),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-[600px] bg-muted rounded-lg" />,
  }
)
import { useToast } from "@/hooks/use-toast"
import { 
  useKnowledgeBaseArticle,
  useUpdateKnowledgeBaseArticle,
  useCreateKnowledgeBaseArticle,
  useKnowledgeBaseCategories
} from "../hooks/use-knowledge-base-queries"
import { TipTapContent } from '@/types/tiptap'
import { Json } from '@/types/database'

interface ArticleEditorPageProps {
  articleId?: number
  mode: "create" | "edit"
}

export function ArticleEditorPage({ articleId, mode }: ArticleEditorPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<TipTapContent>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [categoryId, setCategoryId] = useState<string>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // Queries
  const { data: article, isLoading: isLoadingArticle } = useKnowledgeBaseArticle(
    articleId || 0, 
    mode === "edit" && !!articleId
  )
  
  const { data: categories, isLoading: isLoadingCategories } = useKnowledgeBaseCategories()
  
  const updateArticleMutation = useUpdateKnowledgeBaseArticle()
  const createArticleMutation = useCreateKnowledgeBaseArticle()

  // Load article data when editing
  useEffect(() => {
    if (mode === "edit" && article) {
      setTitle(article.title)
      setContent(article.content as TipTapContent) // TipTap JSON format
      setCategoryId(article.category_id?.toString() || "")
    }
  }, [mode, article])

  // Track unsaved changes
  useEffect(() => {
    if (mode === "edit" && article) {
      const hasChanges = 
        title !== article.title ||
        JSON.stringify(content) !== JSON.stringify(article.content) ||
        categoryId !== (article.category_id?.toString() || "")
      setHasUnsavedChanges(hasChanges)
    } else if (mode === "create") {
      const hasChanges = title.trim() !== "" || JSON.stringify(content) !== JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })
      setHasUnsavedChanges(hasChanges)
    }
  }, [title, content, categoryId, article, mode])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your article.",
        variant: "destructive"
      })
      return
    }

    if (!categoryId) {
      toast({
        title: "Category Required",
        description: "Please select a category for your article.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      if (mode === "edit" && articleId) {
        await updateArticleMutation.mutateAsync({
          id: articleId,
          data: {
            title: title.trim(),
            content: content as Json, // TipTap JSON format
            category_id: parseInt(categoryId),
          }
        })
        
        toast({
          title: "Article Updated",
          description: "Your article has been saved successfully.",
        })
      } else {
        // Create new article
        const newArticle = await createArticleMutation.mutateAsync({
          title: title.trim(),
          content: content as Json, // TipTap JSON format
          category_id: parseInt(categoryId),
        })
        
        toast({
          title: "Article Created",
          description: "Your article has been created successfully.",
        })
        
        // Redirect to the new article
        router.push(`/knowledge-base/${newArticle.id}`)
      }
      
      setHasUnsavedChanges(false)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save article.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // TODO: Implement preview functionality
    toast({
      title: "Preview",
      description: "Preview functionality will be implemented next.",
    })
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true)
      return
    }
    router.back()
  }

  const confirmLeave = useCallback(() => {
    setShowLeaveConfirm(false)
    router.back()
  }, [router])

  if (mode === "edit" && isLoadingArticle) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header with Save Button */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left Section - Back and Title */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">
                {mode === "create" ? "New Article" : "Edit Article"}
              </h1>
              {hasUnsavedChanges && (
                <div className="h-2 w-2 bg-orange-500 rounded-full" />
              )}
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isSaving || !title.trim()}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content))}>
                  Copy Content
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Article Metadata */}
        <div className="border-b bg-background/50 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title</Label>
              <Input
                id="title"
                placeholder="Enter article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={categoryId} 
                  onValueChange={setCategoryId}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto p-6">
            <ArticleEditor
              content={content}
              onChange={setContent}
              onSave={handleSave}
              placeholder="Start writing your article..."
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
