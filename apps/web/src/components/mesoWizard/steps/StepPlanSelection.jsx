"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Info, User, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Step One: Plan Selection
 * 
 * This step allows users to select between different plan types
 */
const StepPlanSelection = ({ formData, handleInputChange, handleNext }) => {
  const [selection, setSelection] = useState(formData.planType || "mesocycle")
  const [showMacrocycleAlert, setShowMacrocycleAlert] = useState(false)
  const [error, setError] = useState("")

  // Handle selection change
  const handleSelectionChange = (value) => {
    if (value === "macrocycle") {
      setShowMacrocycleAlert(true)
      return
    }
    
    setSelection(value)
    setError("")
    
    // Update formData
    handleInputChange({
      target: {
        name: "planType",
        value
      }
    })
  }

  // Handle next button click
  const handleNextClick = () => {
    console.log("handleNextClick called, selection:", selection)
    if (!selection) {
      setError("Please select a plan type to continue")
      return
    }
    
    console.log("Calling handleNext...")
    handleNext()
  }

  return (
    <div className="space-y-1">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">Choose Your Training Plan Type</h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Select how you want to structure your training plan. This will determine the scope and organization of your program.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {/* Mesocycle Card */}
        <div>
          <Card 
            onClick={() => handleSelectionChange("mesocycle")}
            className={`h-full cursor-pointer ${
              selection === "mesocycle" ? "border-2 border-blue-500" : "border border-gray-200"
            }`}
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-blue-500"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-blue-700">Mesocycle Plan</h3>
                <p className="text-gray-600">
                  Plan your training week-by-week with volume and intensity targets.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                  <p>Typically spans 4-8 weeks focused on specific goals</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                  <p>Progressive overload with weekly progression</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                  <p>Ideal for strength, hypertrophy or conditioning focus</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Microcycle Card */}
        <div>
          <Card 
            onClick={() => handleSelectionChange("microcycle")}
            className={`h-full cursor-pointer ${
              selection === "microcycle" ? "border-2 border-blue-500" : "border border-gray-200"
            }`}
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-green-500"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-green-700">Microcycle Plan</h3>
                <p className="text-gray-600">
                  Simple one-week training plan for quick implementation.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                  <p>One-week plan with daily workout structure</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                  <p>Quick setup without complex progression patterns</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                  <p>Perfect for busy schedules or specific short-term goals</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Macrocycle Card */}
        <div className="relative">
          <div className="absolute -top-3 right-6 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Coming Soon
          </div>
          
          <Card 
            onClick={() => handleSelectionChange("macrocycle")}
            className="h-full cursor-pointer border border-gray-200 opacity-80"
          >
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-8 h-8 text-orange-500"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-orange-700">Macrocycle Plan</h3>
                <p className="text-gray-600">
                  Long-term season planning. (Coming soon)
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2">✓</div>
                  <p>Typically spans multiple months or an entire season</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2">✓</div>
                  <p>Periodized approach with phases for different adaptations</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-orange-400 mr-2">✓</div>
                  <p>Ideal for athletes with specific competition seasons</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-center text-red-500 font-medium">
          {error}
        </div>
      )}

      {/* Macrocycle alert modal */}
      {showMacrocycleAlert && (
        <Alert className="mt-4 bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            Macrocycle planning is not yet available. Please select Mesocycle Plan to continue.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto" 
            onClick={() => setShowMacrocycleAlert(false)}
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Continue button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleNextClick} 
          size="lg"
          className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

export default StepPlanSelection 