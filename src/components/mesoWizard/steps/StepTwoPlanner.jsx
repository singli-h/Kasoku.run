"use client"

import { ChevronRight, ChevronLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ExerciseSectionManager from "../components/ExerciseSectionManager"
import ExerciseTimeline from "../components/ExerciseTimeline"
import ProgressionModelSelector from "../components/ProgressionModelSelector"

/**
 * Step Two: Session & Exercise Planning
 * 
 * This step allows users to:
 * - Configure session details
 * - Select progression models
 * - Manage exercise sections
 * - Add and configure exercises
 * - Set special constraints
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {Function} props.handleSessionInputChange - Function to handle session input changes
 * @param {Function} props.handleAddExercise - Function to add an exercise
 * @param {Function} props.handleRemoveExercise - Function to remove an exercise
 * @param {Function} props.handleExerciseDetailChange - Function to handle exercise detail changes
 * @param {Function} props.handleExerciseReorder - Function to handle exercise reordering
 * @param {Function} props.getOrderedExercises - Function to get ordered exercises for a section
 * @param {Function} props.handleProgressionModelChange - Function to handle progression model changes
 * @param {Function} props.handleProgressionValueChange - Function to handle progression value changes
 * @param {Object} props.sessionSections - Session sections data
 * @param {Function} props.handleSetActiveSections - Function to set active sections
 * @param {Array} props.filteredExercises - Filtered exercises
 * @param {number} props.activeSession - Active session ID
 * @param {Function} props.setActiveSession - Function to set active session
 * @param {Object} props.errors - Validation errors
 * @param {Array} props.progressionModels - Available progression models
 * @param {Function} props.handleNext - Function to go to the next step
 * @param {Function} props.handleBack - Function to go to the previous step
 */
const StepTwoPlanner = ({
  formData,
  handleInputChange,
  handleSessionInputChange,
  handleAddExercise,
  handleRemoveExercise,
  handleExerciseDetailChange,
  handleExerciseReorder,
  getOrderedExercises,
  handleProgressionModelChange,
  handleProgressionValueChange,
  sessionSections,
  handleSetActiveSections,
  filteredExercises,
  activeSession,
  setActiveSession,
  errors,
  progressionModels,
  handleNext,
  handleBack,
}) => {
  // Get section name from ID
  const getSectionName = (sectionId) => {
    const sectionTypes = [
      { id: "warmup", name: "Warm-up" },
      { id: "gym", name: "Gym" },
      { id: "circuit", name: "Circuits" },
      { id: "plyometric", name: "Plyometrics" },
      { id: "isometric", name: "Isometrics" },
      { id: "sprint", name: "Sprints" },
      { id: "drill", name: "Drills" },
    ]
    
    const section = sectionTypes.find(s => s.id === sectionId)
    return section ? section.name : sectionId
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session & Exercise Planning</h2>
      <p className="text-gray-600">
        Configure your training sessions and add exercises to each section.
      </p>

      {/* Session Tabs */}
      <Tabs
        value={activeSession.toString()}
        onValueChange={(value) => setActiveSession(parseInt(value))}
        className="w-full"
      >
        <TabsList className="mb-4 flex flex-wrap">
          {formData.sessions.map((session) => (
            <TabsTrigger key={session.id} value={session.id.toString()} className="flex-grow">
              {session.name || `Session ${session.id}`}
            </TabsTrigger>
          ))}
        </TabsList>

        {formData.sessions.map((session) => (
          <TabsContent key={session.id} value={session.id.toString()} className="space-y-6">
            {/* Session Details */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`session-name-${session.id}`} className="text-base font-medium">
                        Session Name
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Give this session a descriptive name (e.g., &quot;Upper Body Strength&quot;)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id={`session-name-${session.id}`}
                      value={session.name}
                      onChange={(e) => handleSessionInputChange(session.id, "name", e.target.value)}
                      placeholder="e.g., Lower Body Power"
                      className={`mt-1 ${errors[`session-${session.id}-name`] ? "border-red-500" : ""}`}
                    />
                    {errors[`session-${session.id}-name`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`session-${session.id}-name`]}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progression Model Selector */}
            <ProgressionModelSelector
              session={session}
              progressionModels={progressionModels}
              handleProgressionModelChange={handleProgressionModelChange}
              handleProgressionValueChange={handleProgressionValueChange}
              errors={errors}
            />

            {/* Exercise Section Manager */}
            <ExerciseSectionManager
              sessionId={session.id}
              exercises={formData.exercises}
              filteredExercises={filteredExercises}
              handleAddExercise={handleAddExercise}
              handleRemoveExercise={handleRemoveExercise}
              handleExerciseDetailChange={handleExerciseDetailChange}
              handleExerciseReorder={handleExerciseReorder}
              getOrderedExercises={getOrderedExercises}
              errors={errors}
              activeSections={sessionSections[session.id] || []}
              setActiveSections={(sections) => handleSetActiveSections(session.id, sections)}
            />
            
            {/* Exercise Timeline */}
            <ExerciseTimeline
              sessionId={session.id}
              exercises={formData.exercises}
              activeSections={sessionSections[session.id] || []}
              handleExerciseDetailChange={handleExerciseDetailChange}
              errors={errors}
              getSectionName={getSectionName}
              getOrderedExercises={getOrderedExercises}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Special Constraints */}
      <Card className="overflow-visible">
        <CardContent className="pt-6 overflow-visible">
          <div className="space-y-4 overflow-visible">
            <div className="overflow-visible">
              <div className="flex items-center gap-2 overflow-visible">
                <Label htmlFor="specialConstraints" className="text-base font-medium">
                  Special Constraints
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="w-80 max-w-lg">
                      <p>
                        Add any special constraints or considerations for this mesocycle (e.g., injuries,
                        equipment limitations, scheduling constraints).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="specialConstraints"
                name="specialConstraints"
                value={formData.specialConstraints}
                onChange={handleInputChange}
                placeholder="e.g., Limited equipment at home, recovering from shoulder injury"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button onClick={handleBack} variant="outline" className="px-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="px-6">
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default StepTwoPlanner 