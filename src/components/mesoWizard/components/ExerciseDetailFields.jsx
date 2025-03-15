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
          <DialogTitle>Edit Exercise Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 bg-white max-h-[400px] overflow-y-auto pr-2">
          
          {/* Velocity */}
          <div>
            <Label htmlFor="velocity" className="text-base font-medium">
              Velocity (m/s)
            </Label>
            <Input
              id="velocity"
              type="number"
              min="0"
              step="0.1"
              value={exercise.velocity || ""}
              onChange={(e) => handleInputChange("velocity", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Power */}
          <div>
            <Label htmlFor="power" className="text-base font-medium">
              Power (W)
            </Label>
            <Input
              id="power"
              type="number"
              min="0"
              step="1"
              value={exercise.power || ""}
              onChange={(e) => handleInputChange("power", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Distance */}
          <div>
            <Label htmlFor="distance" className="text-base font-medium">
              Distance (m)
            </Label>
            <Input
              id="distance"
              type="number"
              min="0"
              step="0.1"
              value={exercise.distance || ""}
              onChange={(e) => handleInputChange("distance", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Height */}
          <div>
            <Label htmlFor="height" className="text-base font-medium">
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              min="0"
              step="0.1"
              value={exercise.height || ""}
              onChange={(e) => handleInputChange("height", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Performing Time */}
          <div>
            <Label htmlFor="performing_time" className="text-base font-medium">
              Performing Time (sec)
            </Label>
            <Input
              id="performing_time"
              type="number"
              min="0"
              step="0.1"
              value={exercise.performing_time || ""}
              onChange={(e) => handleInputChange("performing_time", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Resistance Value */}
          <div>
            <Label htmlFor="resistance_value" className="text-base font-medium">
              Resistance Value
            </Label>
            <Input
              id="resistance_value"
              type="number"
              min="0"
              step="0.1"
              value={exercise.resistance_value || ""}
              onChange={(e) => handleInputChange("resistance_value", parseFloat(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
          
          {/* Resistance Unit */}
          <div>
            <Label htmlFor="resistance_unit_id" className="text-base font-medium">
              Resistance Unit
            </Label>
            <Input
              id="resistance_unit_id"
              type="number"
              min="1"
              value={exercise.resistance_unit_id || ""}
              onChange={(e) => handleInputChange("resistance_unit_id", parseInt(e.target.value) || "")}
              className="mt-1 h-12 text-base"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 text-base"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseDetailFields 