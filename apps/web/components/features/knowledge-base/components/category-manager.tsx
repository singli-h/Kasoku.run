/*
<ai_context>
Clean, professional category manager with streamlined UI.
Follows modern design principles with clear visual hierarchy and intuitive interactions.
</ai_context>
*/

"use client"

import { useState } from "react"
import { X, Plus, Trash2, Edit, Check, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  useKnowledgeBaseCategories,
  useCreateKnowledgeBaseCategory,
  useUpdateKnowledgeBaseCategory,
  useDeleteKnowledgeBaseCategory
} from "../hooks/use-knowledge-base-queries"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: number
  name: string
  color: string
  article_count?: number | null
}

interface CategoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const predefinedColors = [
  { value: "#3B82F6", name: "Blue" },
  { value: "#10B981", name: "Green" },
  { value: "#F59E0B", name: "Amber" },
  { value: "#EF4444", name: "Red" },
  { value: "#8B5CF6", name: "Purple" },
  { value: "#06B6D4", name: "Cyan" },
  { value: "#84CC16", name: "Lime" },
  { value: "#F97316", name: "Orange" },
  { value: "#EC4899", name: "Pink" },
  { value: "#6B7280", name: "Gray" },
]

export function CategoryManager({ open, onOpenChange }: CategoryManagerProps) {
  const { toast } = useToast()
  
  // Data
  const { data: categories = [], isLoading } = useKnowledgeBaseCategories()
  const createCategoryMutation = useCreateKnowledgeBaseCategory()
  const updateCategoryMutation = useUpdateKnowledgeBaseCategory()
  const deleteCategoryMutation = useDeleteKnowledgeBaseCategory()
  
  // Form state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0].value)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<{ id: number; name: string; articleCount: number } | null>(null)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Category Name Required",
        description: "Please enter a name for the category.",
        variant: "destructive"
      })
      return
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      
      toast({
        title: "Category Created",
        description: `"${newCategoryName}" has been created successfully.`,
      })
      
      setNewCategoryName("")
      setNewCategoryColor(predefinedColors[0].value)
      setIsCreating(false)
    } catch (error) {
      toast({
        title: "Failed to Create Category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      })
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({
        title: "Category Name Required",
        description: "Please enter a name for the category.",
        variant: "destructive"
      })
      return
    }

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        data: {
          name: newCategoryName.trim(),
          color: newCategoryColor
        }
      })
      
      toast({
        title: "Category Updated",
        description: `"${newCategoryName}" has been updated successfully.`,
      })
      
      setEditingCategory(null)
      setNewCategoryName("")
    } catch (error) {
      toast({
        title: "Failed to Update Category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      })
    }
  }

  const handleRequestDeleteCategory = (categoryId: number, categoryName: string) => {
    const category = categories.find(c => c.id === categoryId)
    const articleCount = category?.article_count || 0
    setDeletingCategory({ id: categoryId, name: categoryName, articleCount })
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategoryMutation.mutateAsync(deletingCategory.id)

      toast({
        title: "Category Deleted",
        description: deletingCategory.articleCount > 0
          ? `"${deletingCategory.name}" has been deleted. ${deletingCategory.articleCount} article(s) are now uncategorized.`
          : `"${deletingCategory.name}" has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        title: "Failed to Delete Category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setDeletingCategory(null)
    }
  }

  const handleClose = () => {
    setEditingCategory(null)
    setNewCategoryName("")
    setNewCategoryColor(predefinedColors[0].value)
    setIsCreating(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Manage Categories</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Organize your knowledge base articles with categories
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 -mr-2 pb-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {/* Create New Category Section */}
          <Card className="border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
            <CardContent className="p-6">
              {!isCreating ? (
                <div className="text-center py-4">
                  <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">Create New Category</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a new category to organize your knowledge base articles
                  </p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="h-10 px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">Create New Category</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreating(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name" className="text-sm font-medium">
                        Category Name
                      </Label>
                      <Input
                        id="category-name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="h-11"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Choose Color</Label>
                      <div className="grid grid-cols-5 gap-3">
                        {predefinedColors.map(color => (
                          <button
                            key={color.value}
                            onClick={() => setNewCategoryColor(color.value)}
                            className={`
                              relative w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-105
                              ${newCategoryColor === color.value 
                                ? "border-foreground scale-105 shadow-lg ring-2 ring-primary/20" 
                                : "border-border hover:border-foreground/50"
                              }
                            `}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {newCategoryColor === color.value && (
                              <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreating(false)}
                      className="h-10 px-6"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                      className="h-10 px-6"
                    >
                      {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Existing Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">Your Categories</h3>
              <Badge variant="secondary" className="text-xs">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-5 h-5 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-32"></div>
                            <div className="h-3 bg-muted rounded w-20"></div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="h-9 w-9 bg-muted rounded"></div>
                          <div className="h-9 w-9 bg-muted rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <Card className="border-dashed border-muted-foreground/25">
                <CardContent className="p-12 text-center">
                  <div className="text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h4 className="font-medium text-base mb-2">No categories yet</h4>
                    <p className="text-sm text-muted-foreground/70">
                      Create your first category to organize your knowledge base articles
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {categories.map(category => (
                  <Card key={category.id} className="group hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: category.color }}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white" 
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-medium text-base">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {category.article_count || 0} {category.article_count === 1 ? 'article' : 'articles'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-9 w-9 p-0 hover:bg-primary/10"
                            title="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestDeleteCategory(category.id, category.name)}
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Edit Category Section */}
          {editingCategory && (
            <>
              <Separator />
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white" 
                          style={{ backgroundColor: editingCategory.color }}
                        />
                        <h3 className="font-medium text-lg text-primary">Edit Category</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category-name" className="text-sm font-medium">
                          Category Name
                        </Label>
                        <Input
                          id="edit-category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          className="h-11"
                          autoFocus
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Choose Color</Label>
                        <div className="grid grid-cols-5 gap-3">
                          {predefinedColors.map(color => (
                            <button
                              key={color.value}
                              onClick={() => setNewCategoryColor(color.value)}
                              className={`
                                relative w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-105
                                ${newCategoryColor === color.value 
                                  ? "border-foreground scale-105 shadow-lg ring-2 ring-primary/20" 
                                  : "border-border hover:border-foreground/50"
                                }
                              `}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            >
                              {newCategoryColor === color.value && (
                                <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-sm" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingCategory(null)}
                        className="h-10 px-6"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateCategory}
                        disabled={updateCategoryMutation.isPending}
                        className="h-10 px-6"
                      >
                        {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}