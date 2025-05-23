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
 * @param {Object} props.exercise - Exercise to edit (or set detail object if isSetDetail is true)
 * @param {Function} props.onChange - Function to handle detail changes, called with { field: value }
 * @param {string} props.mode - Mode of the exercise
 * @param {Object} [props.errors={}] - Validation errors object
 * @param {boolean} [props.isSetDetail=false] - Indicates if these are details for a specific set rather than the main exercise
 * @param {number} [props.setIndex] - The index of the set if isSetDetail is true
 */
const ExerciseDetailFields = ({ 
  exercise, 
  onChange, // Changed from handleExerciseDetailChange
  mode, 
  errors = {}, // Added errors prop
  isSetDetail = false, // Added isSetDetail to potentially customize behavior if needed
  setIndex // Added setIndex, though ExerciseItemFull handles routing for now
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Handle input change
  const handleInputChange = (field, value) => {
    // Calls the onChange prop passed from ExerciseItemFull
    // ExerciseItemFull expects an object of changed fields, or a single field if it's set up to handle it.
    // Here, we pass a single field update. ExerciseItemFull's `updateField` or `updateSetDetail`
    // will then handle updating the correct part of its localExercise state.
    onChange({ [field]: value });
  }
  
  // Helper to get error for a specific field, potentially prefixed for sets
  const getFieldError = (fieldName) => {
    if (isSetDetail && setIndex !== undefined) {
      // This assumes errors for set details might be nested like 'set_details[0].rpe'
      // However, the validation function currently returns flat errors for secondary_details within a set
      // e.g. exercise.secondary_details.rpe. For now, let's assume errors are directly keyed
      // or the parent (ExerciseItemFull) has already provided correctly scoped errors.
      // The 'errors' prop passed to ExerciseDetailFields by ExerciseItemFull
      // for a specific set *should* be errors for that set's secondary_details.
      return errors[fieldName]; 
    }
    // For non-set details, or if setIndex is not applicable for error structure
    return errors[fieldName];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 text-xs sm:text-sm"
        >
          Details {/* Changed from Edit for clarity, as per PRD */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader className="bg-white">
          <DialogTitle>
            {isSetDetail ? `Set ${setIndex + 1} Details` : `Exercise Details: ${exercise.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2 bg-white max-h-[400px] overflow-y-auto pr-2">
          {/* Basic Fields (Sets, Reps) are typically managed in ExerciseItemFull directly now) */}
          {/* Only show fields relevant to secondary_details here */}

          {/* RPE and Tempo are common secondary details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`rpe-${isSetDetail ? setIndex : 'main'}`} className="text-sm font-medium">
                RPE
              </Label>
              <Input
                id={`rpe-${isSetDetail ? setIndex : 'main'}`}
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={exercise.rpe || ""} // Assumes RPE is directly on exercise or set.secondary_details
                onChange={(e) => handleInputChange("rpe", e.target.value)}
                className={`mt-1 h-10 ${getFieldError('rpe') ? 'border-red-500' : ''}`}
              />
              {getFieldError('rpe') && <p className="text-xs text-red-500 mt-1">{getFieldError('rpe')}</p>}
            </div>
            <div>
              <Label htmlFor={`tempo-${isSetDetail ? setIndex : 'main'}`} className="text-sm font-medium">
                Tempo
              </Label>
              <Input
                id={`tempo-${isSetDetail ? setIndex : 'main'}`}
                type="text"
                placeholder="e.g., 4010"
                value={exercise.tempo || ""}
                onChange={(e) => handleInputChange("tempo", e.target.value)}
                className={`mt-1 h-10 ${getFieldError('tempo') ? 'border-red-500' : ''}`}
              />
              {getFieldError('tempo') && <p className="text-xs text-red-500 mt-1">{getFieldError('tempo')}</p>}
            </div>
          </div>
          
          {/* Advanced Fields from original component, now part of secondary details */}
          <div className="pt-2 mt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold mb-3">Additional Metrics</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`velocity-${isSetDetail ? setIndex : 'main'}`} className="text-sm font-medium">
                  Velocity (m/s)
                </Label>
                <Input
                  id={`velocity-${isSetDetail ? setIndex : 'main'}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={exercise.velocity || ""}
                  onChange={(e) => handleInputChange("velocity", e.target.value)}
                  className={`mt-1 h-10 ${getFieldError('velocity') ? 'border-red-500' : ''}`}
                />
                {getFieldError('velocity') && <p className="text-xs text-red-500 mt-1">{getFieldError('velocity')}</p>}
              </div>
              
              <div>
                <Label htmlFor={`power-${isSetDetail ? setIndex : 'main'}`} className="text-sm font-medium">
                  Power (W)
                </Label>
                <Input
                  id={`power-${isSetDetail ? setIndex : 'main'}`}
                  type="number"
                  min="0"
                  step="1"
                  value={exercise.power || ""}
                  onChange={(e) => handleInputChange("power", e.target.value)}
                  className={`mt-1 h-10 ${getFieldError('power') ? 'border-red-500' : ''}`}
                />
                {getFieldError('power') && <p className="text-xs text-red-500 mt-1">{getFieldError('power')}</p>}
              </div>
            </div>
            
            {/* Distance and Time (Performing Time) are typically primary for 'group' mode, */}
            {/* but could be secondary in 'individual' mode if design allows. */}
            {/* For now, assuming they are not primary secondary_details for 'individual' mode here. */}
            {/* If they were, they would be added like RPE/Tempo. */}

          </div>

          {/* Other potential secondary fields can be added here following the same pattern */}

        </div>
        <div className="flex justify-end pt-4 border-t border-gray-200">
           <Button onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExerciseDetailFields; 