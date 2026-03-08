"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ChevronLeft, Clock, Dumbbell, Loader2, Plus, Search, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useExerciseSearch, useExerciseTypes, useEquipmentTags } from "../hooks/useExerciseSearch"
import type { ExerciseLibraryItem } from "../types"

export interface ExercisePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: ExerciseLibraryItem, section: string) => void
  /**
   * Optional pre-loaded exercises (for backward compatibility).
   * If not provided, uses server-side search via useExerciseSearch hook.
   */
  exercises?: ExerciseLibraryItem[]
  categories?: string[]
  recentExerciseIds?: string[]
  /** Pre-select a section when opening (from section [+ Add] buttons) */
  defaultSection?: string | null
}

const DEFAULT_CATEGORIES = [
  "All",
  "Warmup",
  "Mobility",
  "Gym",
  "Isometric",
  "Plyometric",
  "Sprint",
  "Drill",
  "Circuit",
  "Recovery",
]
const DEFAULT_SECTIONS = [
  "Warmup",
  "Mobility",
  "Gym",
  "Isometric",
  "Plyometric",
  "Sprint",
  "Drill",
  "Circuit",
  "Recovery",
]

/**
 * Capitalize first letter of a string for display
 * e.g., "warmup" -> "Warmup", "plyometric" -> "Plyometric"
 */
function capitalizeFirst(str: string): string {
  if (!str) return "Other"
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * ExercisePickerSheet - Full-screen bottom sheet for selecting exercises
 *
 * Features:
 * - Server-side search with debouncing (if exercises prop not provided)
 * - Category filter tabs
 * - Section selector for where to add the exercise
 * - Recent exercises section
 * - Efficient loading for large exercise libraries
 */
export function ExercisePickerSheet({
  isOpen,
  onClose,
  onSelectExercise,
  exercises: propExercises,
  categories = DEFAULT_CATEGORIES,
  recentExerciseIds = [],
  defaultSection = null
}: ExercisePickerSheetProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSection, setSelectedSection] = useState("Warmup")
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null)

  // Fetch equipment tags for filter dropdown
  const { data: equipmentTags } = useEquipmentTags()

  // Set default section when opening with a pre-selected section
  useEffect(() => {
    if (isOpen && defaultSection && DEFAULT_SECTIONS.includes(defaultSection)) {
      setSelectedSection(defaultSection)
    }
  }, [isOpen, defaultSection])

  // Determine if we should use server-side search
  const useServerSearch = !propExercises || propExercises.length === 0

  // Server-side search hook
  const {
    searchQuery,
    setSearchQuery,
    exercises: serverExercises,
    isLoading,
    hasMore,
    fetchNextPage,
    resetSearch
  } = useExerciseSearch({
    enabled: isOpen && useServerSearch,
    equipmentTagIds: selectedEquipmentId ? [selectedEquipmentId] : undefined,
    pageSize: 30,
    debounceMs: 300,
  })

  // Get exercise types for category filtering
  const { data: exerciseTypes } = useExerciseTypes()

  // Get category directly from exercise type (e.g., "warmup" -> "Warmup")
  const getCategoryFromTypeId = useCallback((typeId?: number | null): string => {
    if (!typeId || !exerciseTypes) return "Other"
    const type = exerciseTypes.find(t => t.id === typeId)
    if (!type || !type.type) return "Other"
    // Use the exercise type directly, capitalized for display
    return capitalizeFirst(type.type)
  }, [exerciseTypes])

  // Transform server exercises to ExerciseLibraryItem format
  const transformedServerExercises = useMemo((): ExerciseLibraryItem[] => {
    return serverExercises
      .filter(ex => ex.name) // Filter out exercises without names
      .map(ex => ({
        id: String(ex.id),
        name: ex.name!, // Safe after filter
        category: getCategoryFromTypeId(ex.exercise_type_id),
        equipment: "", // Not stored in DB
        muscleGroups: [], // Not stored in DB
        exerciseTypeId: ex.exercise_type_id ?? undefined, // Pass through for section assignment
      }))
  }, [serverExercises, getCategoryFromTypeId])

  // Choose which exercises to display
  const baseExercises = useServerSearch ? transformedServerExercises : (propExercises || [])

  // Local filtering (only used when not using server search for categories)
  const filteredExercises = useMemo(() => {
    let filtered = baseExercises

    // Filter by category (client-side for both modes)
    if (selectedCategory !== "All") {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }

    // Client-side search only when using prop exercises
    if (!useServerSearch && searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.muscleGroups?.some(m => m.toLowerCase().includes(query)) ||
        e.equipment?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [baseExercises, searchQuery, selectedCategory, useServerSearch])

  // Recent exercises
  const recentExercisesList = useMemo(() => {
    return baseExercises.filter(e => recentExerciseIds.includes(e.id)).slice(0, 5)
  }, [baseExercises, recentExerciseIds])

  // Reset search when closing
  useEffect(() => {
    if (!isOpen) {
      resetSearch()
      setSelectedCategory("All")
      setSelectedEquipmentId(null)
    }
  }, [isOpen, resetSearch])

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const nearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200

    if (nearBottom && hasMore && !isLoading && useServerSearch) {
      fetchNextPage()
    }
  }, [hasMore, isLoading, fetchNextPage, useServerSearch])

  if (!isOpen) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Warmup": return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "Mobility": return "bg-teal-500/10 text-teal-700 dark:text-teal-400"
      case "Gym": return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "Isometric": return "bg-slate-500/10 text-slate-700 dark:text-slate-400"
      case "Plyometric": return "bg-orange-500/10 text-orange-800 dark:text-orange-400"
      case "Sprint": return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "Drill": return "bg-amber-500/10 text-amber-800 dark:text-amber-400"
      case "Circuit": return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      case "Recovery": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      case "Speed": return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "Strength": return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "Conditioning": return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Half-sheet (70% height) */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background flex flex-col rounded-t-2xl shadow-2xl max-h-[70vh] animate-in slide-in-from-bottom duration-300">
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold flex-1">Add Exercise</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-muted/50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Section Selector & Equipment Filter */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Add to:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="text-sm font-medium bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {DEFAULT_SECTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Equipment:</span>
            <select
              value={selectedEquipmentId ?? ""}
              onChange={(e) => setSelectedEquipmentId(e.target.value ? Number(e.target.value) : null)}
              className="text-sm font-medium bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="">All</option>
              {equipmentTags?.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        {/* Recent Exercises */}
        {recentExercisesList.length > 0 && !searchQuery && selectedCategory === "All" && (
          <div className="px-4 py-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Recent</h3>
            <div className="space-y-1">
              {recentExercisesList.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    onSelectExercise(exercise, selectedSection)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {exercise.muscleGroups?.length > 0 ? exercise.muscleGroups.join(", ") : exercise.category}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Exercises */}
        <div className="px-4 py-3">
          {!searchQuery && selectedCategory === "All" && recentExercisesList.length > 0 && (
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">All Exercises</h3>
          )}
          <div className="space-y-1">
            {/* Loading state for initial load */}
            {isLoading && filteredExercises.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading exercises...</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exercises found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              <>
                {filteredExercises.map((exercise, idx) => (
                  <button
                    key={`${exercise.id}-${idx}`}
                    onClick={() => {
                      onSelectExercise(exercise, selectedSection)
                      onClose()
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      getCategoryColor(exercise.category)
                    )}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {exercise.equipment && exercise.muscleGroups?.length > 0
                          ? `${exercise.equipment} · ${exercise.muscleGroups.join(", ")}`
                          : exercise.category
                        }
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}

                {/* Loading more indicator */}
                {isLoading && filteredExercises.length > 0 && (
                  <div className="py-4 text-center">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Load more hint */}
                {hasMore && !isLoading && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Scroll for more exercises
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
