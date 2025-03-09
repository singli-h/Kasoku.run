"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import StepOneOverview from "./steps/StepOneOverview"
import StepTwoPlanner from "./steps/StepTwoPlanner"
import StepThreeConfirmation from "./steps/StepThreeConfirmation"
import { useMesoWizardState } from "./hooks/useMesoWizardState"
import { progressionModels } from "./sampledata"

/**
 * MesoWizard Component
 * 
 * A 3-step wizard for creating mesocycles:
 * 1. Mesocycle Overview - Basic parameters
 * 2. Session & Exercise Planning - Configure sessions and exercises
 * 3. Confirmation & AI Review - Review and finalize
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback function when wizard is completed
 */
const MesoWizard = ({ onComplete }) => {
  // Use the custom hook for state management
  const {
    step,
    formData,
    searchTerm,
    filteredExercises,
    activeSession,
    isLoading,
    aiSuggestions,
    errors,
    sessionSections,
    progressPercentage,
    
    setSearchTerm,
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
          <StepOneOverview
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            handleNext={handleNext}
          />
        )
      case 2:
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
      case 3:
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {step} of 3: {step === 1 ? "Overview" : step === 2 ? "Planning" : "Confirmation"}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step content */}
      {renderStep()}
    </div>
  )
}

export default MesoWizard

