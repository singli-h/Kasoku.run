"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, Clock, Dumbbell, Plus, Search, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExerciseLibraryItem } from "../types"

export interface ExercisePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelectExercise: (exercise: ExerciseLibraryItem, section: string) => void
  exercises: ExerciseLibraryItem[]
  categories?: string[]
  recentExerciseIds?: string[]
}

const DEFAULT_CATEGORIES = ["All", "Speed", "Strength", "Plyometric", "Warmup", "Conditioning"]
const DEFAULT_SECTIONS = ["Warmup", "Speed", "Plyometric", "Strength", "Conditioning", "Cooldown"]

/**
 * ExercisePickerSheet - Full-screen bottom sheet for selecting exercises
 *
 * Features:
 * - Search by name, muscle groups, or equipment
 * - Category filter tabs
 * - Section selector for where to add the exercise
 * - Recent exercises section
 */
export function ExercisePickerSheet({
  isOpen,
  onClose,
  onSelectExercise,
  exercises,
  categories = DEFAULT_CATEGORIES,
  recentExerciseIds = []
}: ExercisePickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSection, setSelectedSection] = useState("Warmup")

  const filteredExercises = useMemo(() => {
    let filtered = exercises

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.muscleGroups.some(m => m.toLowerCase().includes(query)) ||
        e.equipment.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [exercises, searchQuery, selectedCategory])

  const recentExercisesList = useMemo(() => {
    return exercises.filter(e => recentExerciseIds.includes(e.id)).slice(0, 5)
  }, [exercises, recentExerciseIds])

  if (!isOpen) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Speed": return "bg-blue-500/10 text-blue-500"
      case "Strength": return "bg-red-500/10 text-red-500"
      case "Plyometric": return "bg-orange-500/10 text-orange-500"
      case "Warmup": return "bg-green-500/10 text-green-500"
      case "Conditioning": return "bg-purple-500/10 text-purple-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
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
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
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

      {/* Section Selector */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
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
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
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
                    <p className="text-xs text-muted-foreground truncate">{exercise.muscleGroups.join(", ")}</p>
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
            {filteredExercises.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exercises found</p>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
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
                      {exercise.equipment} · {exercise.muscleGroups.join(", ")}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
