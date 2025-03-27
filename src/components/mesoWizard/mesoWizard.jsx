"use client"

import { Progress } from "@/components/ui/progress"
import StepOneOverview from "./steps/StepOneOverview"
import StepTwoPlanner from "./steps/StepTwoPlanner"
import StepThreeConfirmation from "./steps/StepThreeConfirmation"
import StepPlanSelection from "./steps/StepPlanSelection"
import StepMicroPlanSelection from "./steps/StepMicroPlanSelection"
import { useMesoWizardState } from "./hooks/useMesoWizardState"
import { progressionModels } from "./sampledata"
import { Loader2 } from "lucide-react"

/**
 * MesoWizard Component
 * 
 * A multi-step wizard for creating training plans:
 * 1. Plan Selection - Choose between Mesocycle, Microcycle, or Macrocycle
 * 2. Plan Overview - Basic parameters (varies by plan type)
 * 3. Session & Exercise Planning - Configure sessions and exercises
 * 4. Confirmation & AI Review - Review and finalize
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback function when wizard is completed
 */
const MesoWizard = ({ onComplete }) => {
  // Use the custom hook for state management
  const {
    step,
    formData,
    filteredExercises,
    activeSession,
    isLoading,
    loadingExercises,
    aiSuggestions,
    errors,
    sessionSections,
    progressPercentage,
    
    setActiveSession,
    handleInputChange,
    handleSessionInputChange,
    handleAddExercise,
    handleRemoveExercise,
    handleExerciseDetailChange,
    handleExerciseReorder,
    handleProgressionModelChange,
    handleProgressionValueChange,
    handleAcceptSuggestion,
    handleSetActiveSections,
    getOrderedExercises,
    handleNext,
    handleBack,
    handleSubmit,
  } = useMesoWizardState(onComplete)

  // Render the appropriate step
  const renderStep = () => {
    if (loadingExercises && step === 3) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Loading exercise library...</p>
        </div>
      )
    }
    
    switch (step) {
      case 1:
        return (
          <StepPlanSelection
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            handleNext={handleNext}
          />
        )
      case 2:
        // For microcycle, show the microcycle setup page instead of the standard overview
        if (formData.planType === "microcycle") {
          return (
            <StepMicroPlanSelection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
              handleNext={handleNext}
              handleBack={handleBack}
            />
          )
        }
        // For mesocycle, show the standard overview
        return (
          <StepOneOverview
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        )
      case 3:
        return (
          <StepTwoPlanner
            formData={formData}
            handleInputChange={handleInputChange}
            handleSessionInputChange={handleSessionInputChange}
            handleAddExercise={handleAddExercise}
            handleRemoveExercise={handleRemoveExercise}
            handleExerciseDetailChange={handleExerciseDetailChange}
            handleExerciseReorder={handleExerciseReorder}
            getOrderedExercises={getOrderedExercises}
            handleProgressionModelChange={handleProgressionModelChange}
            handleProgressionValueChange={handleProgressionValueChange}
            sessionSections={sessionSections}
            handleSetActiveSections={handleSetActiveSections}
            filteredExercises={filteredExercises}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            errors={errors}
            progressionModels={progressionModels}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        )
      case 4:
        return (
          <StepThreeConfirmation
            formData={formData}
            aiSuggestions={aiSuggestions}
            handleAcceptSuggestion={handleAcceptSuggestion}
            isLoading={isLoading}
            handleBack={handleBack}
            handleSubmit={handleSubmit}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  // Get step name based on current step and plan type
  const getStepName = () => {
    if (step === 1) return "Plan Selection";
    
    if (step === 2) {
      return formData.planType === "microcycle" ? "Microcycle Setup" : "Overview";
    }
    
    if (step === 3) return "Planning";
    if (step === 4) return "Confirmation";
    
    return "";
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Extended gradient that connects with page gradient */}
      <div
        className="absolute -z-10 pointer-events-none"
        style={{
          top: '-100px',
          left: '-100px',
          right: '-100px',
          bottom: '-100px',
          background: `
            radial-gradient(
              circle at 30% 30%, 
              rgba(147, 51, 234, 0.06), 
              rgba(147, 51, 234, 0.02) 40%, 
              transparent 70%
            ),
            radial-gradient(
              circle at 70% 70%, 
              rgba(37, 99, 235, 0.06), 
              rgba(37, 99, 235, 0.02) 40%, 
              transparent 70%
            )
          `,
          filter: 'blur(50px)',
        }}
      ></div>
      
      {/* Progress bar */}
      <div className="mb-8 relative">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {step} of 4: {getStepName()}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step content with slightly improved contrast */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md">
        {renderStep()}
      </div>
    </div>
  )
}

export default MesoWizard

