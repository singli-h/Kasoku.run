"use client"

import { useState, useMemo } from "react"
import { Search, X, Star, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Exercise } from "@/types/session"

interface ExerciseLibraryPanelProps {
  isOpen: boolean
  onClose: () => void
  onAddExercises: (exercises: Exercise[]) => void
  exercises: Exercise[]
}

const EXERCISE_CATEGORIES = ["All", "Strength", "Power", "Sprint", "Endurance", "Plyometric", "Accessory"]

export function ExerciseLibraryPanel({ isOpen, onClose, onAddExercises, exercises }: ExerciseLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || ex.type === selectedCategory.toLowerCase()
      const matchesFavorites = !showFavoritesOnly || ex.isFavorite
      return matchesSearch && matchesCategory && matchesFavorites
    })
  }, [exercises, searchQuery, selectedCategory, showFavoritesOnly])

  const handleToggleExercise = (id: number) => {
    const newSelection = new Set(selectedExercises)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedExercises(newSelection)
  }

  const handleAddSelected = () => {
    const toAdd = exercises.filter((ex) => selectedExercises.has(ex.id))
    onAddExercises(toAdd)
    setSelectedExercises(new Set())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Exercise Library</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {EXERCISE_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="text-xs h-8"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="favorites"
              checked={showFavoritesOnly}
              onCheckedChange={(checked) => setShowFavoritesOnly(checked as boolean)}
            />
            <label htmlFor="favorites" className="text-sm cursor-pointer">
              Favorites only
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-2">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercises found</p>
              </div>
            ) : (
              filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedExercises.has(exercise.id) ? "bg-primary/10 border-primary" : "hover:bg-muted",
                  )}
                  onClick={() => handleToggleExercise(exercise.id)}
                >
                  <Checkbox
                    checked={selectedExercises.has(exercise.id)}
                    onCheckedChange={() => handleToggleExercise(exercise.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{exercise.name}</span>
                      {exercise.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                    </div>
                    {exercise.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{exercise.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {exercise.type}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-between shrink-0 bg-background">
          <span className="text-sm text-muted-foreground">{selectedExercises.size} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddSelected} disabled={selectedExercises.size === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add {selectedExercises.size > 0 && `(${selectedExercises.size})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
