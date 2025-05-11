"use client"

import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, dateInputStyles } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useSession } from "@clerk/nextjs"

/**
 * Step: Microcycle Plan Setup
 * 
 * This step allows users to configure the basic information for a one-week microcycle plan
 */
const StepMicroPlanSelection = ({ formData = {}, handleInputChange = () => {}, errors = {}, handleNext = () => {}, handleBack = () => {}, groups = [], groupLoading = false, userRole }) => {
  // Set default values for formData
  const defaultFormData = {
    goals: "",
    startDate: "",
    sessionsPerWeek: "3", // Default: 3 sessions per week
    ...formData
  };

  // Initialize fields in formData when component mounts
  useEffect(() => {
    // Initialize the sessions per week in formData if not already set
    if (!formData.sessionsPerWeek || formData.sessionsPerWeek === "") {
      handleInputChange({
        target: {
          name: "sessionsPerWeek",
          value: defaultFormData.sessionsPerWeek
        }
      });
    }
    
    // Set duration to 1 week for microcycle
    handleInputChange({
      target: {
        name: "duration",
        value: "1"
      }
    });
  }, []);

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Add date input styles */}
      <style dangerouslySetInnerHTML={{ __html: dateInputStyles }} />
      
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3">Microcycle Setup</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Configure your one-week training plan
          </p>
        </div>
        {/* Basic Parameters Card */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="grid gap-6">
               {/* Athlete Group Selector (coach only) */}
               {userRole === 'coach' && (
                 <div>
                   <Label htmlFor="athleteGroupId" className="text-base">Athlete Group</Label>
                   {groupLoading ? (
                     <div>Loading groups...</div>
                   ) : (
                     <Select
                       value={formData.athleteGroupId || ''}
                       onValueChange={(value) => handleInputChange({ target: { name: 'athleteGroupId', value } })}
                     >
                       <SelectTrigger id="athleteGroupId" className="w-full mt-1">
                         <SelectValue placeholder="Select a group" />
                       </SelectTrigger>
                       <SelectContent>
                         {groups.map((g) => (
                           <SelectItem key={g.id} value={String(g.id)}>
                             {g.group_name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   )}
                 </div>
               )}
              {/* Plan Name */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-base">Plan Name</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>A short, descriptive name for your one-week plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="name"
                  name="name"
                  value={defaultFormData.name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Recovery Week, High Intensity Block..."
                  className={`mt-1 h-12 pl-3 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Goals */}
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="goals" className="text-base">Training Goals</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Specific objectives you want to achieve in this week</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="goals"
                  name="goals"
                  value={defaultFormData.goals}
                  onChange={handleInputChange}
                  placeholder="e.g., Focus on recovery, maintain strength, prepare for event..."
                  className={`mt-1 ${errors.goals ? "border-red-500" : ""}`}
                />
                {errors.goals && (
                  <p className="mt-1 text-sm text-red-500">{errors.goals}</p>
                )}
              </div>

              {/* Timeline and Frequency */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Start Date */}
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="startDate" className="text-base">Start Date</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>When you&apos;ll begin this one-week plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={defaultFormData.startDate}
                    onChange={handleInputChange}
                    className={`mt-1 h-12 text-center ${errors.startDate ? "border-red-500" : ""}`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>

                {/* Sessions per Week */}
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sessionsPerWeek" className="text-base">Weekly Frequency</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of training sessions this week</p>
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
                    value={defaultFormData.sessionsPerWeek}
                    onChange={handleInputChange}
                    placeholder="3"
                    className={`mt-1 h-12 text-center ${errors.sessionsPerWeek ? "border-red-500" : ""}`}
                  />
                  {errors.sessionsPerWeek && (
                    <p className="mt-1 text-sm text-red-500">{errors.sessionsPerWeek}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Microcycle Info Card */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Microcycle Overview</h3>
              <p className="text-sm text-gray-600">
                A microcycle is a short training plan that typically spans one week. It&apos;s ideal for:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-700 mb-2">Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                      <p>Quick implementation without complex planning</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                      <p>Perfect for deload weeks or special focus periods</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</div>
                      <p>Easily adaptable to your current schedule</p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-700 mb-2">Best Used For</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                      <p>Testing new exercises or training approaches</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                      <p>Recovery weeks within a larger training program</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                      <p>Short-term goals or event preparation</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button variant="outline" onClick={handleBack} className="px-6 order-2 sm:order-1">
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="px-6 order-1 sm:order-2"
          >
            Next: Plan Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StepMicroPlanSelection 