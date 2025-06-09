"use client";

import React, { useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { MesoWizardFormData } from "../hooks/useMesoWizardState";

interface AthleteGroup {
  id: string | number;
  group_name: string;
}

// Define the specific keys from MesoWizardFormData that this component interacts with
type StepMicroFormDataKeys = 
  | 'name' 
  | 'goal' 
  | 'startDate' 
  | 'sessionsPerWeek' 
  | 'duration' 
  | 'planType' 
  | 'athleteGroupId';

interface StepMicroPlanSelectionProps {
  formData: Pick<MesoWizardFormData, StepMicroFormDataKeys>;
  handleInputChange: <K extends StepMicroFormDataKeys>(_field: K, _value: MesoWizardFormData[K]) => void;
  errors: Record<string, string>;
  handleNext: () => void;
  handleBack: () => void;
  groups: AthleteGroup[];
  groupLoading: boolean;
  userRole?: string;
}

const dateInputStyles = `
input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg);
}
`;

const StepMicroPlanSelection: React.FC<StepMicroPlanSelectionProps> = React.memo(({
  formData,
  handleInputChange,
  errors,
  handleNext,
  handleBack,
  groups,
  groupLoading,
  userRole,
}) => {

  useEffect(() => {
    if (formData.planType === "microcycle") { // Ensure this logic only runs for microcycle
      if (!formData.sessionsPerWeek || typeof formData.sessionsPerWeek === 'number') { // ensure it's a string
        handleInputChange("sessionsPerWeek", "3"); // Default to string "3"
      }
      if (formData.duration !== "1") { // Duration for microcycle is always 1 week (string "1")
        handleInputChange("duration", "1");
      }
    }
  }, [formData.planType, formData.duration, formData.sessionsPerWeek, handleInputChange]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    // Ensure name is one of the allowed keys for this component's formData scope
    if (name === 'name' || name === 'goal' || name === 'startDate' || name === 'sessionsPerWeek' || name === 'duration') {
      handleInputChange(name as StepMicroFormDataKeys, value); 
    }
  };

  const handleSelectChange = (fieldName: 'athleteGroupId', value: string) => {
    // athleteGroupId in MesoWizardFormData is string | number | undefined.
    // The Select component value is always string.
    handleInputChange(fieldName, value);
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: dateInputStyles }} />
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3">Microcycle Setup</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Configure your one-week training plan
          </p>
        </div>
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="grid gap-6">
              {userRole === 'coach' && (
                <div>
                  <Label htmlFor="athleteGroupId" className="text-base">Athlete Group</Label>
                  {groupLoading ? (
                    <div>Loading groups...</div>
                  ) : (
                    <Select
                      value={String(formData.athleteGroupId || '')}
                      onValueChange={(value) => handleSelectChange('athleteGroupId', value)}
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
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="e.g., Recovery Week, High Intensity Block..."
                  className={`mt-1 h-12 pl-3 ${errors.name ? "border-red-500" : ""}`}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="goal" className="text-base">Training Goals</Label>
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
                  id="goal"
                  name="goal"
                  value={formData.goal || ""}
                  onChange={handleChange}
                  placeholder="e.g., Focus on recovery, maintain strength, prepare for event..."
                  className={`mt-1 ${errors.goal ? "border-red-500" : ""}`}
                  aria-invalid={errors.goal ? "true" : "false"}
                  aria-describedby={errors.goal ? "goal-error" : undefined}
                />
                {errors.goal && (
                  <p id="goal-error" className="mt-1 text-sm text-red-500" role="alert">
                    {errors.goal}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    value={formData.startDate || ""}
                    onChange={handleChange}
                    className={`mt-1 h-12 text-center ${errors.startDate ? "border-red-500" : ""}`}
                    aria-invalid={errors.startDate ? "true" : "false"}
                    aria-describedby={errors.startDate ? "start-date-error" : undefined}
                  />
                  {errors.startDate && (
                    <p id="start-date-error" className="mt-1 text-sm text-red-500" role="alert">
                      {errors.startDate}
                    </p>
                  )}
                </div>

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
                    type="number" // HTML5 input type number, value is still string from event
                    min="1"
                    max="7"
                    value={String(formData.sessionsPerWeek || "3")} // Ensure value is string for input
                    onChange={handleChange}
                    placeholder="3"
                    className={`mt-1 h-12 text-center ${errors.sessionsPerWeek ? "border-red-500" : ""}`}
                    aria-invalid={errors.sessionsPerWeek ? "true" : "false"}
                    aria-describedby={errors.sessionsPerWeek ? "sessions-per-week-error" : undefined}
                  />
                  {errors.sessionsPerWeek && (
                    <p id="sessions-per-week-error" className="mt-1 text-sm text-red-500" role="alert">
                      {errors.sessionsPerWeek}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
                      <p>Maintaining fitness during busy periods</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                      <p>Introducing variety or new training stimuli</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2">✓</div>
                      <p>Specific short-term skill development</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handleBack} className="px-6">
            Back
          </Button>
          <Button onClick={handleNext} className="px-6 bg-blue-600 hover:bg-blue-700 text-white">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
});

// Add display name for React.memo component
StepMicroPlanSelection.displayName = 'StepMicroPlanSelection';

export default StepMicroPlanSelection; 