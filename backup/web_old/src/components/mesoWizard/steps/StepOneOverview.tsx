"use client";

import React, { useState, useEffect } from "react"; // Imported React
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import IntensityVolumePicker from "../components/IntensityVolumePicker";
import WeeklyProgressionChart from "../components/WeeklyProgressionChart";
import ProgressionTemplates from "../components/ProgressionTemplates";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { MesoWizardFormData } from "../hooks/useMesoWizardState"; // Import formData type
import type { WeeklyProgressionData } from "@/types/exercise-planner"; // Import type

// Define the specific keys from MesoWizardFormData that this component interacts with
type StepOneOverviewFormDataKeys =
  | "name" // Added name, as it's often part of step 1
  | "goal"
  | "startDate"
  | "duration"
  | "sessionsPerWeek"
  | "intensity"
  | "volume"
  | "weeklyProgression" // This will be handled by specific updater, not general handleInputChange
  | "progressionModel"
  | "athleteGroupId";

interface AthleteGroup { // Keep a local stub if not importing a global one
  id: string | number;
  group_name: string;
}

interface StepOneOverviewProps {
  formData: Pick<MesoWizardFormData, StepOneOverviewFormDataKeys>;
  handleInputChange: <K extends keyof MesoWizardFormData>( // Changed to keyof MesoWizardFormData for broader use
    _field: K,
    _value: MesoWizardFormData[K]
  ) => void;
  errors: Partial<Record<StepOneOverviewFormDataKeys, string>>; // Typed errors
  handleNext: () => void;
  handleBack: () => void;
  groups: AthleteGroup[]; // Assuming AthleteGroup might come from a global type eventually
  groupLoading: boolean;
  userRole?: "coach" | "athlete" | string; // Made userRole optional and more specific
}

// Dummy date input styles for now
const dateInputStyles = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    background: transparent;
    bottom: 0;
    color: transparent;
    cursor: pointer;
    height: auto;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: auto;
  }
`;

const StepOneOverview: React.FC<StepOneOverviewProps> = React.memo(({ // Typed as React.FC
  formData,
  handleInputChange,
  errors,
  handleNext,
  handleBack,
  groups = [],
  groupLoading = false,
  userRole,
}) => {
  // Define default values for this step
  const defaultStepData = {
    name: "",
    goal: "strength" as MesoWizardFormData['goal'], // Cast for specific literal type
    startDate: new Date().toISOString().split("T")[0],
    duration: "4",
    sessionsPerWeek: "3",
    intensity: "5",
    volume: "5",
    weeklyProgression: [] as WeeklyProgressionData[],
    progressionModel: "",
    athleteGroupId: undefined as (string | number | undefined),
  };

  // Merge formData prop with defaults. Props take precedence.
  const currentFormData = { ...defaultStepData, ...formData };
  

  const [localWeeklyProgression, setLocalWeeklyProgression] = useState<WeeklyProgressionData[]>(() => {
      const durationNum = parseInt(currentFormData.duration?.toString() || "4", 10);
      const intensityNum = parseInt(currentFormData.intensity?.toString() || "5", 10);
      const volumeNum = parseInt(currentFormData.volume?.toString() || "5", 10);
      
      if (currentFormData.weeklyProgression && currentFormData.weeklyProgression.length === durationNum) {
        return currentFormData.weeklyProgression;
      }
      return Array.from({ length: durationNum }, (_, i) => ({
        week: i + 1,
        intensity: intensityNum,
        volume: volumeNum,
      }));
    }
  );

  const [selectedModel, setSelectedModel] = useState<string | null>(currentFormData.progressionModel || null);

  // Initialize intensity and volume in formData when component mounts if not already set
  useEffect(() => {
    if (currentFormData.intensity && (formData.intensity === undefined || formData.intensity === "")) {
      handleInputChange("intensity", currentFormData.intensity.toString());
    }
    if (currentFormData.volume && (formData.volume === undefined || formData.volume === "")) {
      handleInputChange("volume", currentFormData.volume.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // formData.intensity and formData.volume are not stable dependencies from props, currentFormData covers initial state

  // Initialize or update weekly progression data when duration, intensity, or volume changes
   useEffect(() => {
    const durationNum = parseInt(currentFormData.duration?.toString() || "4", 10);
    const intensityNum = parseInt(currentFormData.intensity?.toString() || "5", 10);
    const volumeNum = parseInt(currentFormData.volume?.toString() || "5", 10);

    // Only update if weeklyProgression length mismatches duration or if it's the initial empty array from formData
    if (localWeeklyProgression.length !== durationNum || (formData.weeklyProgression && formData.weeklyProgression.length === 0 && localWeeklyProgression.length === 0) ) {
      const initialData = Array.from({ length: durationNum }, (_, i) => ({
        week: i + 1,
        intensity: intensityNum,
        volume: volumeNum,
      }));
      setLocalWeeklyProgression(initialData);
      setSelectedModel(null); // Reset selected model on duration change

      handleInputChange("weeklyProgression", initialData);
      if (currentFormData.progressionModel){ // if model exists, keep it.
         handleInputChange("progressionModel", currentFormData.progressionModel);
      } else {
         handleInputChange("progressionModel", ""); // Clear model if duration changed
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFormData.duration, currentFormData.intensity, currentFormData.volume, formData.weeklyProgression]);


  const handleIntensityChange = (value: number | string) => {
    handleInputChange("intensity", value.toString());
  };

  const handleVolumeChange = (value: number | string) => {
    handleInputChange("volume", value.toString());
  };

  const handleProgressionChange = (newData: WeeklyProgressionData[]) => {
    setLocalWeeklyProgression(newData);
    setSelectedModel(null); 
    handleInputChange("weeklyProgression", newData);
    handleInputChange("progressionModel", ""); // Clear model when manually editing
  };

  const handleApplyTemplate = (template: WeeklyProgressionData[], modelType: string) => {
    setLocalWeeklyProgression(template);
    setSelectedModel(modelType);
    handleInputChange("weeklyProgression", template);
    handleInputChange("progressionModel", modelType);
  };
  
  const handleGenericInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    handleInputChange(name as keyof MesoWizardFormData, value);
  };

  const handleSelectChange = (name: keyof MesoWizardFormData, value: string | number) => {
    handleInputChange(name, value);
  };


  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto px-4 sm:px-6">
      <style dangerouslySetInnerHTML={{ __html: dateInputStyles }} />
      <div className="space-y-6 sm:space-y-8">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Mesocycle Setup</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Configure your training parameters and progression pattern
          </p>
        </header>
        
        <section aria-labelledby="basic-info-heading">
          <Card className="border border-gray-200">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <h2 id="basic-info-heading" className="sr-only">Basic Information</h2>
              <div className="grid gap-4 sm:gap-6">
                {userRole === "coach" && (
                  <div>
                    <Label htmlFor="athleteGroupId" className="text-base">
                      Athlete Group
                    </Label>
                    {groupLoading ? (
                      <div>Loading groups...</div>
                    ) : (
                      <Select
                        value={currentFormData.athleteGroupId?.toString() || ""}
                        onValueChange={(value) =>
                          handleSelectChange("athleteGroupId", value)
                        }
                      >
                        <SelectTrigger
                          id="athleteGroupId"
                          className={`w-full mt-1${
                            errors.athleteGroupId ? " border-red-500" : ""
                          }`}
                          aria-invalid={errors.athleteGroupId ? "true" : "false"}
                          aria-describedby={errors.athleteGroupId ? "athlete-group-error" : undefined}
                        >
                          <SelectValue placeholder="Select a group (Optional)" />
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
                    {errors.athleteGroupId && (
                      <p id="athlete-group-error" className="text-red-500 text-sm mt-1" role="alert">
                        {errors.athleteGroupId}
                      </p>
                    )}
                  </div>
                )}

                {/* Mesocycle Name */}
                <div>
                  <Label htmlFor="name" className="text-base">
                    Mesocycle Name
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline w-4 h-4 ml-1.5 text-gray-400 cursor-help" aria-hidden="true" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A descriptive name for your training plan (e.g., &quot;Strength Block - Fall 2024&quot;).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentFormData.name}
                    onChange={handleGenericInputChange}
                    placeholder="e.g., Hypertrophy Phase 1"
                    className={`w-full mt-1${errors.name ? " border-red-500" : ""}`}
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">{errors.name}</p>
                  )}
                </div>

                {/* Goal */}
                <div>
                  <Label htmlFor="goal" className="text-base">
                    Primary Goal
                  </Label>
                  <Select
                    value={currentFormData.goal}
                    onValueChange={(value) =>
                      handleSelectChange("goal", value as MesoWizardFormData['goal'])
                    }
                  >
                    <SelectTrigger
                      id="goal"
                      className={`w-full mt-1${errors.goal ? " border-red-500" : ""}`}
                      aria-invalid={errors.goal ? "true" : "false"}
                      aria-describedby={errors.goal ? "goal-error" : undefined}
                    >
                      <SelectValue placeholder="Select primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="power">Power</SelectItem>
                      <SelectItem value="sport_specific">Sport Specific</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.goal && (
                    <p id="goal-error" className="text-red-500 text-sm mt-1" role="alert">{errors.goal}</p>
                  )}
                </div>

                {/* Start Date and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="startDate" className="text-base">
                      Start Date
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={currentFormData.startDate}
                        onChange={handleGenericInputChange}
                        className={`w-full mt-1 pr-10${errors.startDate ? " border-red-500" : ""}`}
                        aria-invalid={errors.startDate ? "true" : "false"}
                        aria-describedby={errors.startDate ? "start-date-error" : undefined}
                      />
                    </div>
                    {errors.startDate && (
                      <p id="start-date-error" className="text-red-500 text-sm mt-1" role="alert">
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-base">
                      Duration (Weeks)
                    </Label>
                    <Input
                      type="number"
                      id="duration"
                      name="duration"
                      value={currentFormData.duration?.toString()}
                      onChange={handleGenericInputChange}
                      min="1"
                      max="12" // Common mesocycle length
                      placeholder="e.g., 4"
                      className={`w-full mt-1${errors.duration ? " border-red-500" : ""}`}
                      aria-invalid={errors.duration ? "true" : "false"}
                      aria-describedby={errors.duration ? "duration-error" : undefined}
                    />
                    {errors.duration && (
                      <p id="duration-error" className="text-red-500 text-sm mt-1" role="alert">
                        {errors.duration}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sessions Per Week */}
                 <div>
                  <Label htmlFor="sessionsPerWeek" className="text-base">
                    Sessions Per Week
                  </Label>
                  <Input
                    type="number"
                    id="sessionsPerWeek"
                    name="sessionsPerWeek"
                    value={currentFormData.sessionsPerWeek?.toString()}
                    onChange={handleGenericInputChange}
                    min="1"
                    max="7"
                    placeholder="e.g., 3"
                    className={`w-full mt-1${errors.sessionsPerWeek ? " border-red-500" : ""}`}
                    aria-invalid={errors.sessionsPerWeek ? "true" : "false"}
                    aria-describedby={errors.sessionsPerWeek ? "sessions-per-week-error" : undefined}
                  />
                  {errors.sessionsPerWeek && (
                    <p id="sessions-per-week-error" className="text-red-500 text-sm mt-1" role="alert">
                      {errors.sessionsPerWeek}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Intensity & Volume Card */}
        <section aria-labelledby="intensity-volume-heading">
          <Card className="border border-gray-200">
            <CardContent className="pt-6 px-4 sm:px-6">
              <h2 id="intensity-volume-heading" className="text-xl font-semibold mb-1">Intensity & Volume</h2>
              <p className="text-sm text-gray-500 mb-4">
                Set the overall training load for the mesocycle. This will serve as the baseline.
              </p>
              <div className="space-y-6"> {/* Added a div to space the two pickers */}
                <IntensityVolumePicker
                  label="Overall Intensity"
                  value={parseInt(currentFormData.intensity?.toString() || "5")}
                  onChange={handleIntensityChange}
                  description="Set the general intensity for the mesocycle (1-10). Low: focus on recovery/technique. Moderate: balanced development. High: peak performance/overreaching."
                />
                <IntensityVolumePicker
                  label="Overall Volume"
                  value={parseInt(currentFormData.volume?.toString() || "5")}
                  onChange={handleVolumeChange}
                  description="Set the general training volume for the mesocycle (1-10). Low: suitable for deloads or beginners. Moderate: typical for sustained progress. High: for advanced athletes or specific high-volume phases."
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Weekly Progression Card */}
        <section aria-labelledby="weekly-progression-heading">
          <Card className="border border-gray-200">
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                <div>
                  <h2 id="weekly-progression-heading" className="text-xl font-semibold mb-1">Weekly Progression</h2>
                  <p className="text-sm text-gray-500">
                    Define how intensity and volume change week over week.
                  </p>
                </div>
                 <ProgressionTemplates
                    duration={parseInt(currentFormData.duration?.toString() || "4")}
                    baseIntensity={parseInt(currentFormData.intensity?.toString() || "5")}
                    baseVolume={parseInt(currentFormData.volume?.toString() || "5")}
                    onApplyTemplate={handleApplyTemplate}
                    currentModel={selectedModel}
                  />
              </div>
              <WeeklyProgressionChart
                data={localWeeklyProgression}
                onChange={handleProgressionChange}
              />
              {errors.weeklyProgression && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.weeklyProgression}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
        
        <nav className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8" aria-label="Step navigation">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={true}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            aria-label="Go to previous step (disabled - this is the first step)"
          > {/* Step 1 has no back */}
            Back
          </Button>
          <Button 
            onClick={handleNext}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            aria-label="Continue to next step: Plan Sessions"
          >
            Next: Plan Sessions
          </Button>
        </nav>
      </div>
    </main>
  );
});

// Add display name for React.memo component
StepOneOverview.displayName = 'StepOneOverview';

export default StepOneOverview; 