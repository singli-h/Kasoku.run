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
  const [openTooltip, setOpenTooltip] = useState(null);
  
  const handleTooltipClick = (tooltipId) => {
    setOpenTooltip(openTooltip === tooltipId ? null : tooltipId);
  };
  
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
                  <Tooltip open={openTooltip === "goals"}>
                    <TooltipTrigger asChild onClick={() => handleTooltipClick("goals")}>
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent 
                      className="bg-white border border-gray-200 shadow-md z-50" 
                      sideOffset={5}
                    >
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
                className={`mt-1 min-h-[100px] ${errors.goals ? "border-red-500" : ""}`}
              />
              {errors.goals && <p className="mt-1 text-sm text-red-500">{errors.goals}</p>}
            </div>
            
            {/* Start Date, Duration, Sessions Per Week in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDate" className="text-base font-medium">
                    Start Date
                  </Label>
                  <TooltipProvider>
                    <Tooltip open={openTooltip === "startDate"}>
                      <TooltipTrigger asChild onClick={() => handleTooltipClick("startDate")}>
                        <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent 
                        className="bg-white border border-gray-200 shadow-md z-50" 
                        sideOffset={5}
                      >
                        <p>When will you start this mesocycle?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`mt-1 h-12 ${errors.startDate ? "border-red-500" : ""} cursor-pointer`}
                    onClick={(e) => {
                      // Focus and open the date picker when clicking anywhere in the input
                      e.target.showPicker();
                    }}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="duration" className="text-base font-medium">
                    Duration (weeks)
                  </Label>
                  <TooltipProvider>
                    <Tooltip open={openTooltip === "duration"}>
                      <TooltipTrigger asChild onClick={() => handleTooltipClick("duration")}>
                        <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent 
                        className="bg-white border border-gray-200 shadow-md z-50" 
                        sideOffset={5}
                      >
                        <p>How many weeks will this mesocycle last? Typically 4-8 weeks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="16"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 6"
                  className={`mt-1 h-12 ${errors.duration ? "border-red-500" : ""}`}
                />
                {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
              </div>
              
              {/* Sessions Per Week */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sessionsPerWeek" className="text-base font-medium">
                    Sessions Per Week
                  </Label>
                  <TooltipProvider>
                    <Tooltip open={openTooltip === "sessionsPerWeek"}>
                      <TooltipTrigger asChild onClick={() => handleTooltipClick("sessionsPerWeek")}>
                        <Info className="h-4 w-4 text-gray-400 cursor-pointer hover:text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent 
                        className="bg-white border border-gray-200 shadow-md z-50" 
                        sideOffset={5}
                      >
                        <p>How many training sessions will you have each week?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="sessionsPerWeek"
                  name="sessionsPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.sessionsPerWeek}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                  className={`mt-1 h-12 ${errors.sessionsPerWeek ? "border-red-500" : ""}`}
                />
                {errors.sessionsPerWeek && (
                  <p className="mt-1 text-sm text-red-500">{errors.sessionsPerWeek}</p>
                )}
              </div>
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