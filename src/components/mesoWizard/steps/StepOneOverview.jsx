"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Step One: Mesocycle Overview
 * 
 * This step collects basic information about the mesocycle:
 * - Goals
 * - Start date
 * - Duration (in weeks)
 * - Sessions per week
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.handleNext - Function to go to the next step
 */
const StepOneOverview = ({ formData, handleInputChange, errors, handleNext }) => {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  
  // Mock AI recommendations
  const aiRecommendations = {
    duration: "4-6 weeks is optimal for a strength-focused mesocycle",
    sessionsPerWeek: "3-4 sessions per week allows for adequate recovery",
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mesocycle Overview</h2>
      <p className="text-gray-600">
        Define the basic parameters of your mesocycle. This will help structure your training plan.
      </p>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Goals */}
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="goals" className="text-base font-medium">
                  Goals
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        Define what you want to achieve with this mesocycle. Be specific about strength, hypertrophy, 
                        power, or other goals.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                placeholder="e.g., Increase squat 1RM by 10kg, improve upper body hypertrophy"
                className={`mt-1 ${errors.goals ? "border-red-500" : ""}`}
              />
              {errors.goals && <p className="mt-1 text-sm text-red-500">{errors.goals}</p>}
            </div>
            
            {/* Start Date */}
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="text-base font-medium">
                  Start Date
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>When will you start this mesocycle?</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`mt-1 ${errors.startDate ? "border-red-500" : ""}`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>
            
            {/* Duration */}
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="duration" className="text-base font-medium">
                  Duration (weeks)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many weeks will this mesocycle last? Typically 4-8 weeks.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="16"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 6"
                  className={`mt-1 ${errors.duration ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1"
                  onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                >
                  AI Suggest
                </Button>
              </div>
              {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
              {showAIRecommendations && (
                <p className="mt-2 text-sm text-blue-600">{aiRecommendations.duration}</p>
              )}
            </div>
            
            {/* Sessions Per Week */}
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sessionsPerWeek" className="text-base font-medium">
                  Sessions Per Week
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many training sessions will you have each week?</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="sessionsPerWeek"
                  name="sessionsPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.sessionsPerWeek}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                  className={`mt-1 ${errors.sessionsPerWeek ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-1"
                  onClick={() => setShowAIRecommendations(!showAIRecommendations)}
                >
                  AI Suggest
                </Button>
              </div>
              {errors.sessionsPerWeek && (
                <p className="mt-1 text-sm text-red-500">{errors.sessionsPerWeek}</p>
              )}
              {showAIRecommendations && (
                <p className="mt-2 text-sm text-blue-600">{aiRecommendations.sessionsPerWeek}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleNext} className="px-6">
          Next Step
        </Button>
      </div>
    </div>
  )
}

export default StepOneOverview 