/**
 * Exercise Library Page
 * Comprehensive exercise library with search, filtering, and management capabilities
 */

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { AnimatePresence, motion } from "framer-motion"
import { BookOpen, Edit, Eye, Filter, Grid3X3, List, Loader2, Play, Plus, Search, Settings, SortAsc, SortDesc, Target, Trash2, X, User } from "lucide-react"

// UI Components
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Paginator } from "@/components/ui/paginator"
import { cn } from "@/lib/utils"

// Actions
import {
  getExercisesAction,
  getExerciseTypesAction,
  getUnitsAction,
  deleteExerciseAction
} from "@/actions/library/exercise-actions"
import { getCurrentUserAction } from "@/actions/auth/user-actions"

// Types
import type { 
  ExerciseWithDetails,
  ExerciseType,
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
  myExercisesOnly?: boolean
}

export function ExerciseLibraryPage() {
  const { toast } = useToast()
  const { user: clerkUser } = useUser()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithDetails | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const exercisesPerPage = 12

  const loadLibraryData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [exercisesResult, typesResult, unitsResult, userResult] = await Promise.all([
        getExercisesAction(),
        getExerciseTypesAction(),
        getUnitsAction(),
        clerkUser ? getCurrentUserAction() : Promise.resolve({ isSuccess: true, data: null, message: "" })
      ])

      if (!exercisesResult.isSuccess) throw new Error(exercisesResult.message)
      if (!typesResult.isSuccess) throw new Error(typesResult.message)
      if (!unitsResult.isSuccess) throw new Error(unitsResult.message)

      setExercises(exercisesResult.data)
      setExerciseTypes(typesResult.data)
      setUnits(unitsResult.data)
      
      // Store current user ID for ownership checks
      if (userResult.isSuccess && userResult.data) {
        setCurrentUserId(userResult.data.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load exercise library"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [clerkUser])

  useEffect(() => {
    void loadLibraryData()
  }, [loadLibraryData])
  
  // Filters
  const [filters, setFilters] = useState<ExerciseLibraryFilters>({
    search: '',
    exercise_type_id: undefined,
    unit_id: undefined,
    sortField: 'name',
    sortOrder: 'asc',
    myExercisesOnly: false
  })

  // Load data
  // Filter and sort exercises
  const processedExercises = useMemo(() => {
    let result = [...exercises]
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(exercise =>
        (exercise.name ?? '').toLowerCase().includes(searchTerm) ||
        exercise.description?.toLowerCase().includes(searchTerm) ||
        exercise.exercise_type?.type?.toLowerCase().includes(searchTerm)
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
    
    // Apply "My Exercises" filter
    if (filters.myExercisesOnly && currentUserId) {
      result = result.filter(exercise => exercise.owner_user_id === currentUserId)
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortField) {
        case 'name':
          comparison = (a.name ?? '').localeCompare(b.name ?? '')
          break
        case 'type':
          comparison = (a.exercise_type?.type || '').localeCompare(b.exercise_type?.type || '')
          break
        case 'created_at':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          break
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison
    })
    
    return result
  }, [exercises, filters, currentUserId])

  // Pagination calculations
  const totalPages = Math.ceil(processedExercises.length / exercisesPerPage)
  const paginatedExercises = useMemo(() => {
    const startIndex = (currentPage - 1) * exercisesPerPage
    return processedExercises.slice(startIndex, startIndex + exercisesPerPage)
  }, [processedExercises, currentPage, exercisesPerPage])

  // Handle filter changes - reset page when filter changes
  const updateFilter = (key: keyof ExerciseLibraryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
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
    setCurrentPage(1)
  }

  // Handle exercise deletion and refresh data
  const handleDeleteExercise = async (exerciseId: number) => {
    try {
      const result = await deleteExerciseAction(exerciseId)

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      await loadLibraryData()

      toast({
        title: "Exercise Deleted",
        description: "Exercise was successfully deleted"
      })
    } catch (error) {
      console.error("Error deleting exercise:", error)
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive"
      })
    }
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

  // Handle exercise form close
  const handleExerciseFormClose = () => {
    setShowExerciseForm(false)
    setEditingExercise(null)
  }

  // Refresh list after creating or updating an exercise
  const handleExerciseFormSave = async () => {
    await loadLibraryData()
    setShowExerciseForm(false)
    setEditingExercise(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={() => void loadLibraryData()}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          {/* Mobile: Stack layout, Desktop: Single row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Search - Full width on mobile */}
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Controls row - wraps on tablet */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 shrink-0">
              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("shrink-0", showFilters && "bg-muted")}
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filters</span>
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md shrink-0">
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

              {/* Sort - hidden on very small screens, shown in filters */}
              <div className="hidden xs:flex items-center gap-2">
                <Select value={filters.sortField} onValueChange={(value) => updateFilter('sortField', value as SortField)}>
                  <SelectTrigger className="w-[110px] sm:w-[140px]">
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
                  className="shrink-0"
                >
                  {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Exercise Type</Label>
                    <Select
                      value={filters.exercise_type_id?.toString() || ''}
                      onValueChange={(value) => updateFilter('exercise_type_id', value && value !== 'all' ? parseInt(value) : undefined)}
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
                      onValueChange={(value) => updateFilter('unit_id', value && value !== 'all' ? parseInt(value) : undefined)}
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

                  {/* Sort controls - visible in filters on mobile */}
                  <div className="space-y-2 xs:hidden">
                    <Label>Sort By</Label>
                    <div className="flex items-center gap-2">
                      <Select value={filters.sortField} onValueChange={(value) => updateFilter('sortField', value as SortField)}>
                        <SelectTrigger className="flex-1">
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
                        className="shrink-0 h-9"
                      >
                        {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Filter & Actions</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={filters.myExercisesOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('myExercisesOnly', !filters.myExercisesOnly)}
                        className="flex-1 h-9"
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Exercises
                      </Button>
                      <Button variant="outline" onClick={clearFilters} size="sm" className="h-9" title="Clear all filters">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {processedExercises.length} of {exercises.length} exercises
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Active filters - scrollable on mobile */}
          {(filters.search || filters.exercise_type_id || filters.unit_id || filters.myExercisesOnly) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              <span className="text-sm text-muted-foreground shrink-0 hidden sm:inline">Active:</span>
              {filters.search && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <span className="max-w-[100px] truncate">Search: {filters.search}</span>
                  <X
                    className="h-3 w-3 cursor-pointer shrink-0"
                    onClick={() => updateFilter('search', '')}
                  />
                </Badge>
              )}
              {filters.exercise_type_id && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  Type: {exerciseTypes.find(t => t.id === filters.exercise_type_id)?.type}
                  <X
                    className="h-3 w-3 cursor-pointer shrink-0"
                    onClick={() => updateFilter('exercise_type_id', undefined)}
                  />
                </Badge>
              )}
              {filters.unit_id && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  Unit: {units.find(u => u.id === filters.unit_id)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer shrink-0"
                    onClick={() => updateFilter('unit_id', undefined)}
                  />
                </Badge>
              )}
              {filters.myExercisesOnly && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  My Exercises
                  <X
                    className="h-3 w-3 cursor-pointer shrink-0"
                    onClick={() => updateFilter('myExercisesOnly', false)}
                  />
                </Badge>
              )}
            </div>
          )}

          <Button size="sm" onClick={handleCreateExercise} className="w-full sm:w-auto sm:ml-auto shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>
        </div>
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
        <>
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid'
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}>
            {paginatedExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                viewMode={viewMode}
                currentUserId={currentUserId}
                onView={() => setSelectedExercise(exercise)}
                onEdit={() => handleEditExercise(exercise)}
                onDelete={() => handleDeleteExercise(exercise.id)}
              />
            ))}
          </div>

          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-6"
          />
        </>
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
  currentUserId: number | null
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function ExerciseCard({ exercise, viewMode, currentUserId, onView, onEdit, onDelete }: ExerciseCardProps) {
  const isGlobal = exercise.visibility === 'global' || !exercise.owner_user_id
  const isCustom = currentUserId && exercise.owner_user_id === currentUserId
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
                {isCustom && (
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    <User className="h-3 w-3 mr-1" />
                    Custom
                  </Badge>
                )}
                {isGlobal && !isCustom && (
                  <Badge variant="secondary">Default</Badge>
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
              {!isGlobal && (
                <>
                  <Button variant="ghost" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
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
              {!isGlobal && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{exercise.exercise_type?.type}</Badge>
            {isCustom && (
              <Badge variant="default" className="bg-primary/10 text-primary">
                <User className="h-3 w-3 mr-1" />
                Custom
              </Badge>
            )}
            {isGlobal && !isCustom && (
              <Badge variant="secondary">Default</Badge>
            )}
          </div>
          
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
        
      </CardContent>
    </Card>
  )
}
