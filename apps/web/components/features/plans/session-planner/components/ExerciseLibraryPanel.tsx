"use client"

import { useState, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Star, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ExerciseLibraryItem } from "../types"
import { EXERCISE_TYPE_MAP } from "../types"

interface ExerciseLibraryPanelProps {
  isOpen: boolean
  onClose: () => void
  onAddExercises: (exercises: ExerciseLibraryItem[]) => void
  exercises: ExerciseLibraryItem[]
}

export function ExerciseLibraryPanel({
  isOpen,
  onClose,
  onAddExercises,
  exercises,
}: ExerciseLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<string>("all")

  // Filter exercises based on search and tab
  const filteredExercises = useMemo(() => {
    let filtered = exercises

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "favorites") {
        filtered = filtered.filter((ex) => ex.isFavorite)
      } else {
        filtered = filtered.filter((ex) => ex.type === activeTab)
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.description?.toLowerCase().includes(query) ||
          ex.category?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [exercises, searchQuery, activeTab])

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    const groups: Record<string, ExerciseLibraryItem[]> = {}

    filteredExercises.forEach((ex) => {
      const category = ex.category || "Other"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(ex)
    })

    return groups
  }, [filteredExercises])

  const handleToggleExercise = (exerciseId: number) => {
    setSelectedExercises((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedExercises(new Set(filteredExercises.map((ex) => ex.id)))
  }

  const handleDeselectAll = () => {
    setSelectedExercises(new Set())
  }

  const handleAddSelected = () => {
    const selected = exercises.filter((ex) => selectedExercises.has(ex.id))
    onAddExercises(selected)
    setSelectedExercises(new Set())
    setSearchQuery("")
    onClose()
  }

  const handleClose = () => {
    setSelectedExercises(new Set())
    setSearchQuery("")
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Exercise Library</SheetTitle>
          <SheetDescription>Search and select exercises to add to your session</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full py-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">
                <Star className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="gym">Gym</TabsTrigger>
              <TabsTrigger value="sprint">Sprint</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 mt-4">
              {/* Selection Actions */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  {selectedExercises.size > 0 ? (
                    <span>
                      {selectedExercises.size} exercise{selectedExercises.size !== 1 ? "s" : ""} selected
                    </span>
                  ) : (
                    <span>{filteredExercises.length} exercises</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedExercises.size > 0 ? (
                    <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                      Clear
                    </Button>
                  ) : (
                    filteredExercises.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        Select All
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Exercise List */}
              <ScrollArea className="h-[calc(100vh-360px)]">
                {Object.keys(groupedExercises).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No exercises found matching your search
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
                      <div key={category}>
                        <h3 className="text-sm font-medium mb-2">{category}</h3>
                        <div className="space-y-2">
                          {categoryExercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                                selectedExercises.has(exercise.id) ? "bg-primary/5 border-primary" : ""
                              }`}
                              onClick={() => handleToggleExercise(exercise.id)}
                            >
                              <Checkbox
                                checked={selectedExercises.has(exercise.id)}
                                onCheckedChange={() => handleToggleExercise(exercise.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{exercise.name}</span>
                                  {exercise.isFavorite && (
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  )}
                                </div>
                                {exercise.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {exercise.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {exercise.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddSelected} disabled={selectedExercises.size === 0} className="flex-1">
              Add {selectedExercises.size > 0 ? `(${selectedExercises.size})` : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
