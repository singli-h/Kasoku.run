/**
 * Exercise Library Page
 * Comprehensive exercise library with search, filtering, and management capabilities
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  Plus, 
  Grid3X3, 
  List, 
  Eye,
  Edit,
  Trash2,
  Play,
  BookOpen,
  Target,
  Clock,
  Settings,
  ChevronDown,
  X,
  Loader2,
  SortAsc,
  SortDesc
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Actions
import { 
  getExercisesAction,
  getExerciseTypesAction,
  getTagsAction,
  getUnitsAction,
  deleteExerciseAction
} from "@/actions/training/exercise-actions"

// Types
import type { 
  ExerciseWithDetails,
  ExerciseType,
  Tag,
  Unit,
  ExerciseFilters
} from "@/types/training"

// Components
import { ExerciseForm } from "./exercise-form"

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'type' | 'created_at'
type SortOrder = 'asc' | 'desc'

interface ExerciseLibraryFilters extends ExerciseFilters {
  sortField: SortField
  sortOrder: SortOrder
}

export function ExerciseLibraryPage() {
  const { toast } = useToast()
  
  // State
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseWithDetails[]>([])
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithDetails | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseWithDetails | null>(null)
  
  // Filters
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({
    search: '',
    exercise_type_id: undefined,
    unit_id: undefined,
    sortField: 'name',
    sortOrder: 'asc'
  })

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const [exercisesResult, typesResult, tagsResult, unitsResult] = await Promise.all([
        getExercisesAction(),
        getExerciseTypesAction(),
        getTagsAction(),
        getUnitsAction()
      ])
      
      if (exercisesResult.isSuccess) {
        setExercises(exercisesResult.data)
      }
      
      if (typesResult.isSuccess) {
        setExerciseTypes(typesResult.data)
      }
      
      if (tagsResult.isSuccess) {
        setTags(tagsResult.data)
      }
      
      if (unitsResult.isSuccess) {
        setUnits(unitsResult.data)
      }
    } catch (error) {
      console.error('Error loading exercise library data:', error)
      toast({
        title: "Error",
        description: "Failed to load exercise library data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Filter and sort exercises
  const processedExercises = useMemo(() => {
    let result = [...exercises]
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.description?.toLowerCase().includes(searchTerm) ||
        exercise.exercise_type?.type.toLowerCase().includes(searchTerm) ||
        exercise.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm))
      )
    }
    
    // Apply type filter
    if (filters.exercise_type_id) {
      result = result.filter(exercise => exercise.exercise_type_id === filters.exercise_type_id)
    }
    
    // Apply unit filter
    if (filters.unit_id) {
      result = result.filter(exercise => exercise.unit_id === filters.unit_id)
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          comparison = (a.exercise_type?.type || '').localeCompare(b.exercise_type?.type || '')
          break
        case 'created_at':
          comparison = new Date(a.id).getTime() - new Date(b.id).getTime() // Using ID as proxy for creation order
          break
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })
    
    return result
  }, [exercises, filters])

  // Handle filter changes
  const updateFilter = (key: keyof ExerciseLibraryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle exercise deletion
  const handleDeleteExercise = async (exerciseId: number) => {
    try {
      const result = await deleteExerciseAction(exerciseId)
      
      if (result.isSuccess) {
        setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
        toast({
          title: "Exercise Deleted",
          description: "Exercise was successfully deleted"
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive"
      })
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      exercise_type_id: undefined,
      unit_id: undefined,
      sortField: 'name',
      sortOrder: 'asc'
    })
  }

  // Handle creating new exercise
  const handleCreateExercise = () => {
    setEditingExercise(null)
    setShowExerciseForm(true)
  }

  // Handle editing exercise
  const handleEditExercise = (exercise: ExerciseWithDetails) => {
    setEditingExercise(exercise)
    setShowExerciseForm(true)
  }

  // Handle exercise form save
  const handleExerciseFormSave = (exercise: any) => {
    // Refresh exercises list
    loadData()
    setShowExerciseForm(false)
    setEditingExercise(null)
  }

  // Handle exercise form close
  const handleExerciseFormClose = () => {
    setShowExerciseForm(false)
    setEditingExercise(null)
  }

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Loading state
  if (isLoading) {
    return <ExerciseLibraryPageSkeleton />
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercise Library</h1>
          <p className="text-muted-foreground">
            Browse and manage your exercise collection
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateExercise}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Library Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise Type
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Import Exercises
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-muted")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Sort */}
            <Select value={filters.sortField} onValueChange={(value) => updateFilter('sortField', value as SortField)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise Type</Label>
                    <Select 
                      value={filters.exercise_type_id?.toString() || ''} 
                      onValueChange={(value) => updateFilter('exercise_type_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {exerciseTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select 
                      value={filters.unit_id?.toString() || ''} 
                      onValueChange={(value) => updateFilter('unit_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All units</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {processedExercises.length} of {exercises.length} exercises
        </p>
        
        {/* Active Filters */}
        {(filters.search || filters.exercise_type_id || filters.unit_id) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {filters.exercise_type_id && (
              <Badge variant="secondary" className="gap-1">
                Type: {exerciseTypes.find(t => t.id === filters.exercise_type_id)?.type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('exercise_type_id', undefined)}
                />
              </Badge>
            )}
            {filters.unit_id && (
              <Badge variant="secondary" className="gap-1">
                Unit: {units.find(u => u.id === filters.unit_id)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('unit_id', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Exercise Grid/List */}
      {processedExercises.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.exercise_type_id || filters.unit_id
                ? "Try adjusting your filters or search terms"
                : "Get started by adding your first exercise"
              }
            </p>
            <Button onClick={handleCreateExercise}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        )}>
          {processedExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              viewMode={viewMode}
              onView={() => setSelectedExercise(exercise)}
              onEdit={() => handleEditExercise(exercise)}
              onDelete={() => handleDeleteExercise(exercise.id)}
            />
          ))}
        </div>
      )}

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExercise?.name}</DialogTitle>
            <DialogDescription>
              {selectedExercise?.exercise_type?.type} • {selectedExercise?.unit?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExercise && (
            <div className="space-y-4">
              {selectedExercise.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedExercise.description}</p>
                </div>
              )}
              
              {selectedExercise.tags && selectedExercise.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedExercise.video_url && (
                <div>
                  <h4 className="font-medium mb-2">Video</h4>
                  <Button variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Form Dialog */}
      <ExerciseForm
        isOpen={showExerciseForm}
        onClose={handleExerciseFormClose}
        exercise={editingExercise}
        onSave={handleExerciseFormSave}
      />
    </div>
  )
}

// Exercise Card Component
interface ExerciseCardProps {
  exercise: ExerciseWithDetails
  viewMode: ViewMode
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function ExerciseCard({ exercise, viewMode, onView, onEdit, onDelete }: ExerciseCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold">{exercise.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{exercise.exercise_type?.type}</Badge>
                {exercise.unit && (
                  <Badge variant="secondary">{exercise.unit.name}</Badge>
                )}
              </div>
              {exercise.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {exercise.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onView}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {exercise.name}
          </h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2">
          <Badge variant="outline">{exercise.exercise_type?.type}</Badge>
          
          {exercise.unit && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              {exercise.unit.name}
            </div>
          )}
          
          {exercise.video_url && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Play className="h-3 w-3" />
              Video available
            </div>
          )}
        </div>
        
        {exercise.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {exercise.description}
          </p>
        )}
        
        {exercise.tags && exercise.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {exercise.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {exercise.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{exercise.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Loading skeleton component
function ExerciseLibraryPageSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="flex-1 h-10" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-10" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 