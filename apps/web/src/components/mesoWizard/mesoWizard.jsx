"use client"

import { Progress } from "@/components/ui/progress"
import StepOneOverview from "./steps/StepOneOverview"
import StepTwoPlanner from "./steps/StepTwoPlanner"
import StepThreeConfirmation from "./steps/StepThreeConfirmation"
import StepPlanSelection from "./steps/StepPlanSelection"
import StepMicroPlanSelection from "./steps/StepMicroPlanSelection"
import { useMesoWizardState } from "./hooks/useMesoWizardState"
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
    groups,
    groupLoading,
    userRole,
    roleLoading,
    athleteProfile,
    profileLoading,
    
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
        if (formData.planType === "microcycle") {
          return (
            <StepMicroPlanSelection
              formData={formData}
              handleInputChange={handleInputChange}
              errors={errors}
              handleNext={handleNext}
              handleBack={handleBack}
              groups={groups}
              groupLoading={groupLoading}
              userRole={userRole}
              athleteProfile={athleteProfile}
              profileLoading={profileLoading}
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
            groups={groups}
            groupLoading={groupLoading}
            userRole={userRole}
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
            sessionSections={sessionSections}
            handleSetActiveSections={handleSetActiveSections}
            filteredExercises={filteredExercises}
            loadingExercises={loadingExercises}
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            errors={errors}
            handleNext={handleNext}
            handleBack={handleBack}
            userRole={userRole}
            athleteProfile={athleteProfile}
            profileLoading={profileLoading}
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
    <div className="w-full relative">
      <style jsx>{`
        .wizard-container::before {
          content: '';
          position: absolute;
          inset: -100px;
          pointer-events: none;
          z-index: -1;
          background: radial-gradient(
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
            );
          filter: blur(50px);
        }
      `}</style>

      <div className="wizard-container space-y-4 sm:space-y-8">
        <header className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Step {step} of 4: {getStepName()}</span>
            <span className="text-gray-500">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
        </header>

        <main className="relative z-10 bg-white/80 backdrop-blur-sm px-3 py-4 sm:p-6 rounded-lg shadow-sm sm:shadow-md">
          {renderStep()}
        </main>
      </div>
    </div>
  )
}

export default MesoWizard

