"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, dateInputStyles } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import IntensityVolumePicker from "../components/IntensityVolumePicker"
import WeeklyProgressionChart from "../components/WeeklyProgressionChart"
import ProgressionTemplates from "../components/ProgressionTemplates"

/**
 * Step One: Mesocycle Overview
 * 
 * This step collects basic information about the mesocycle:
 * - Goals
 * - Start date
 * - Duration (in weeks)
 * - Sessions per week
 * - Intensity & Volume settings
 * - Weekly progression
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.handleNext - Function to go to the next step
 * @param {Function} props.handleBack - Function to go to the previous step
 */
const StepOneOverview = ({ formData = {}, handleInputChange = () => {}, errors = {}, handleNext = () => {}, handleBack = () => {} }) => {
  // Set default values for formData
  const defaultFormData = {
    goals: "",
    startDate: "",
    duration: "4", // Default: 4 weeks
    sessionsPerWeek: "3", // Default: 3 sessions per week
    intensity: "5",
    volume: "5",
    weeklyProgression: [],
    ...formData
  };

  // Create weekly progression data based on duration
  const [weeklyProgression, setWeeklyProgression] = useState(() => {
    const duration = parseInt(defaultFormData.duration) || 4;
    return Array.from({ length: duration }, (_, i) => ({
      week: i + 1,
      intensity: parseInt(defaultFormData.intensity) || 5,
      volume: parseInt(defaultFormData.volume) || 5
    }));
  });
  
  // Track the selected model type
  const [selectedModel, setSelectedModel] = useState(null);

  // Initialize intensity and volume in formData when component mounts
  useEffect(() => {
    // Initialize the intensity and volume in formData 
    if (defaultFormData.intensity && (!formData.intensity || formData.intensity === "")) {
      handleInputChange({
        target: {
          name: "intensity",
          value: defaultFormData.intensity.toString()
        }
      });
    }
    
    if (defaultFormData.volume && (!formData.volume || formData.volume === "")) {
      handleInputChange({
        target: {
          name: "volume",
          value: defaultFormData.volume.toString()
        }
      });
    }
  }, []);

  // Initialize or update weekly progression data when duration, intensity, or volume changes
  useEffect(() => {
    const duration = parseInt(defaultFormData.duration) || 4;
    // Only update if weeklyProgression is empty or duration changed
    if (weeklyProgression.length !== duration) {
      const initialData = Array.from({ length: duration }, (_, i) => ({
        week: i + 1,
        intensity: parseInt(defaultFormData.intensity) || 5,
        volume: parseInt(defaultFormData.volume) || 5
      }));
      setWeeklyProgression(initialData);
      setSelectedModel(null); // Reset selected model on duration change

      // Update form data with the initial progression data
      handleInputChange({
        target: {
          name: "weeklyProgression",
          value: initialData
        }
      });
    }
  }, [defaultFormData.duration, defaultFormData.intensity, defaultFormData.volume]);

  // Handle intensity/volume changes
  const handleIntensityChange = (value) => {
    handleInputChange({
      target: {
        name: "intensity",
        value: value.toString()
      }
    });
  };

  const handleVolumeChange = (value) => {
    handleInputChange({
      target: {
        name: "volume",
        value: value.toString()
      }
    });
  };

  // Handle weekly progression changes
  const handleProgressionChange = (newData) => {
    setWeeklyProgression(newData);
    setSelectedModel(null); // Reset model when manually editing
    handleInputChange({
      target: {
        name: "weeklyProgression",
        value: newData
      }
    });
  };

  // Handle applying a progression template
  const handleApplyTemplate = (template, modelType) => {
    setWeeklyProgression(template);
    setSelectedModel(modelType);
    handleInputChange({
      target: {
        name: "weeklyProgression",
        value: template
      }
    });
    
    // Also update the progressionModel field if it exists
    if (handleInputChange) {
      handleInputChange({
        target: {
          name: "progressionModel",
          value: modelType
        }
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Add date input styles */}
      <style dangerouslySetInnerHTML={{ __html: dateInputStyles }} />
      
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3">Mesoycle Setup</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Configure your training parameters and progression pattern
          </p>
        </div>

        {/* Basic Parameters Card */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="grid gap-6">
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
                        <p>Specific objectives you want to achieve (strength, hypertrophy, endurance, etc.)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="goals"
                  name="goals"
                  value={defaultFormData.goals}
                  onChange={handleInputChange}
                  placeholder="e.g., Increase squat 1RM, build upper body mass..."
                  className={`mt-1 ${errors.goals ? "border-red-500" : ""}`}
                />
                {errors.goals && (
                  <p className="mt-1 text-sm text-red-500">{errors.goals}</p>
                )}
              </div>

              {/* Timeline and Frequency */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
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
                          <p>When you&apos;ll begin this training cycle</p>
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

                {/* Duration */}
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="duration" className="text-base">Duration</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Length of your training cycle (4-8 weeks optimal for most goals)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="2"
                    max="12"
                    value={defaultFormData.duration}
                    onChange={handleInputChange}
                    placeholder="4"
                    className={`mt-1 h-12 text-center ${errors.duration ? "border-red-500" : ""}`}
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
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
                          <p>Number of training sessions per week (consider your recovery capacity)</p>
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

        {/* Intensity & Volume Card */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Training Intensity & Volume</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Intensity refers to how heavy/challenging each set is. Volume is the total workload (sets × reps × weight).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 cursor-help w-fit">
                        <Info className="h-3.5 w-3.5" />
                        <span>What these mean</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Intensity refers to how heavy/challenging each set is. Volume is the total workload (sets × reps × weight).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-gray-600">
                Set your baseline training levels to establish starting points for progression
              </p>
              
              <div className="space-y-6 md:space-y-8">
                <IntensityVolumePicker
                  label="Intensity"
                  value={parseInt(defaultFormData.intensity) || 5}
                  onChange={handleIntensityChange}
                  description="How heavy or challenging each set will be relative to your maximum capacity"
                />
                
                <IntensityVolumePicker
                  label="Volume"
                  value={parseInt(defaultFormData.volume) || 5}
                  onChange={handleVolumeChange}
                  description="Total workload per session (sets × reps × weight)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progression Card */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-4 sm:px-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Progression Planning</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Strategic progression of intensity and volume keeps your body adapting throughout the training cycle.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1 cursor-help w-fit">
                        <Info className="h-3.5 w-3.5" />
                        <span>Why progression matters</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Strategic progression is key to continued adaptation. Different models suit different training goals and experience levels.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid gap-8">
                <div className="max-w-full overflow-x-hidden">
                  <ProgressionTemplates
                    duration={parseInt(defaultFormData.duration) || 4}
                    baseIntensity={parseInt(defaultFormData.intensity) || 5}
                    baseVolume={parseInt(defaultFormData.volume) || 5}
                    onApplyTemplate={handleApplyTemplate}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Weekly Progression Chart Card - Separated for better mobile layout */}
        <Card className="border border-gray-200">
          <CardContent className="pt-6 px-0 sm:px-6">
            <div className="px-4 sm:px-0">
              <WeeklyProgressionChart 
                data={weeklyProgression} 
                onChange={handleProgressionChange} 
                modelType={selectedModel}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button variant="outline" onClick={handleBack} className="px-6 order-2 sm:order-1">
            Back
          </Button>
          <Button 
            onClick={() => {
              console.log("Next button clicked, calling handleNext...");
              if (typeof handleNext === 'function') {
                handleNext();
              } else {
                console.error("handleNext is not a function:", handleNext);
              }
            }} 
            className="px-6 order-1 sm:order-2"
          >
            Next: Plan Workouts
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StepOneOverview 