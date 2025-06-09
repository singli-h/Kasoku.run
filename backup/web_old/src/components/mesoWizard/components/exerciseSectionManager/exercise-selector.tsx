"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import type { ExerciseDefinitionBase } from "@/types/exercise-planner"

interface ExerciseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ExerciseDefinitionBase[]
  onSelect: (exercise: ExerciseDefinitionBase) => void
}

export function ExerciseSelector({ open, onOpenChange, exercises, onSelect }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  const categories = Array.from(new Set(exercises.map((e) => e.category)))

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gym":
        return "bg-blue-100 text-blue-800"
      case "sprint":
        return "bg-green-100 text-green-800"
      case "plyometric":
        return "bg-purple-100 text-purple-800"
      case "isometric":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelect(exercise)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{exercise.name}</h4>
                      {exercise.description && <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>}
                    </div>
                    <Badge className={getCategoryColor(exercise.category)}>{exercise.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
