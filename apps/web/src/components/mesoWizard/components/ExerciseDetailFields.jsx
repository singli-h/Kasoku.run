"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

/**
 * Exercise Detail Fields Component
 * 
 * Allows users to edit exercise details such as sets, reps, weight, etc.
 * Display all available fields from the API format to match microcycle requirements
 * 
 * @param {Object} props - Component props
 * @param {Object} props.exercise - Exercise to edit
 * @param {Function} props.handleExerciseDetailChange - Function to handle detail changes
 */
const ExerciseDetailFields = ({ exercise, handleExerciseDetailChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Handle input change
  const handleInputChange = (field, value) => {
    handleExerciseDetailChange(exercise.id, exercise.session, exercise.part, field, value)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 text-xs sm:text-sm"
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="bg-white">
          <DialogTitle>Exercise Details: {exercise.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 bg-white max-h-[400px] overflow-y-auto pr-2">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sets" className="text-sm font-medium">
                Sets
              </Label>
              <Input
                id="sets"
                type="number"
                min="1"
                value={exercise.sets || ""}
                onChange={(e) => handleInputChange("sets", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="reps" className="text-sm font-medium">
                Reps
              </Label>
              <Input
                id="reps"
                type="number"
                min="0"
                value={exercise.reps || ""}
                onChange={(e) => handleInputChange("reps", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="text-sm font-medium">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.5"
                value={exercise.weight || ""}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="rest" className="text-sm font-medium">
                Rest (sec)
              </Label>
              <Input
                id="rest"
                type="number"
                min="0"
                value={exercise.rest || ""}
                onChange={(e) => handleInputChange("rest", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effort" className="text-sm font-medium">
                Effort (%)
              </Label>
              <Input
                id="effort"
                type="number"
                min="1"
                max="150"
                step="1"
                value={exercise.effort || ""}
                onChange={(e) => handleInputChange("effort", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="rpe" className="text-sm font-medium">
                RPE
              </Label>
              <Input
                id="rpe"
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={exercise.rpe || ""}
                onChange={(e) => handleInputChange("rpe", e.target.value)}
                className="mt-1 h-10"
              />
            </div>
          </div>
          
          {/* Advanced Fields */}
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-sm font-semibold mb-3">Advanced Metrics</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="velocity" className="text-sm font-medium">
                  Velocity (m/s)
                </Label>
                <Input
                  id="velocity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.velocity || ""}
                  onChange={(e) => handleInputChange("velocity", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="power" className="text-sm font-medium">
                  Power (W)
                </Label>
                <Input
                  id="power"
                  type="number"
                  min="0"
                  step="1"
                  value={exercise.power || ""}
                  onChange={(e) => handleInputChange("power", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="distance" className="text-sm font-medium">
                  Distance (m)
                </Label>
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.distance || ""}
                  onChange={(e) => handleInputChange("distance", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="height" className="text-sm font-medium">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.height || ""}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="performing_time" className="text-sm font-medium">
                  Performing Time (sec)
                </Label>
                <Input
                  id="performing_time"
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.performing_time || ""}
                  onChange={(e) => handleInputChange("performing_time", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="tempo" className="text-sm font-medium">
                  Tempo (e.g., 3-1-2-0)
                </Label>
                <Input
                  id="tempo"
                  type="text"
                  value={exercise.tempo || ""}
                  onChange={(e) => handleInputChange("tempo", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="resistance_value" className="text-sm font-medium">
                  Resistance Value
                </Label>
                <Input
                  id="resistance_value"
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.resistance_value || ""}
                  onChange={(e) => handleInputChange("resistance_value", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="resistance_unit_id" className="text-sm font-medium">
                  Resistance Unit ID
                </Label>
                <Input
                  id="resistance_unit_id"
                  type="number"
                  min="1"
                  value={exercise.resistance_unit_id || ""}
                  onChange={(e) => handleInputChange("resistance_unit_id", e.target.value)}
                  className="mt-1 h-10"
                />
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="pt-2 border-t border-gray-200">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Input
              id="notes"
              type="text"
              value={exercise.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            onClick={() => setIsOpen(false)}
            className="px-6 py-2"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseDetailFields 