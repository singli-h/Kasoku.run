"use client"

import React from 'react'; // Import React for FC type
import { Progress } from "@/components/ui/progress"
import StepOneOverview from "./steps/StepOneOverview"
import StepTwoPlanner from "./steps/StepTwoPlanner"
import type { StepTwoPlannerProps } from "./steps/StepTwoPlanner"
import StepThreeConfirmation from "./steps/StepThreeConfirmation"
import StepPlanSelection from "./steps/StepPlanSelection"
import StepMicroPlanSelection from "./steps/StepMicroPlanSelection"
import { useMesoWizardState, MesoWizardStateReturn } from "./hooks/useMesoWizardState"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useSaveTrainingPlan } from "./hooks/useSaveCycle"
// FormData import might be redundant if not used directly here
// import { FormData } from "@/types/exercise-planner"
// import { Loader2 } from "lucide-react" // Loader2 not used, can be removed

/**
 * MesoWizard Component
 * 
 * A multi-step wizard for creating training plans:
 * 1. Plan Selection - Choose between Mesocycle, Microcycle, or Macrocycle
 * 2. Plan Overview - Basic parameters (varies by plan type)
 * 3. Session & Exercise Planning - Configure sessions and exercises
 * 4. Confirmation & AI Review - Review and finalize
 * 
 * @param props - Component props
 * @param props.onComplete - Callback function when wizard is completed
 */

// Define prop types for MesoWizard
interface MesoWizardProps {
  onComplete?: (_id: string) => void;
}

// These interface definitions might be redundant if not used directly in this component
// interface Errors {
//   [key: string]: string;
// }
// 
// interface SessionSections {
//   [key: string]: string[];
// }

const MesoWizard: React.FC<MesoWizardProps> = ({ onComplete }) => {
  // Use the custom hook for state management
  const wizardState: MesoWizardStateReturn = useMesoWizardState({ 
    onFormSubmitSuccess: onComplete || (() => {}), 
    allAvailableExercises: [] // Fixed: use correct prop name
  });

  // Use the save training plan hook for proper API integration
  const saveTrainingPlanHook = useSaveTrainingPlan() as any;

  // Create a unified submit handler that chooses the right API based on plan type
  const handleUnifiedSubmit = async (e: any) => {
    e?.preventDefault();
    
    try {
      if (wizardState.formData.planType === "microcycle") {
        // Use the new API for microcycles
        console.log("Using NEW API for microcycle submission");
        const result = await saveTrainingPlanHook.saveMesocycle(wizardState.formData, []);
        console.log("Microcycle saved successfully:", result);
        
        if (onComplete && result?.id) {
          onComplete(result.id);
        }
      } else {
        // Use the old API for mesocycles
        console.log("Using OLD API for mesocycle submission");
        await wizardState.handleSubmit();
      }
    } catch (error) {
      console.error("Error in unified submit handler:", error);
      throw error; // Re-throw to be handled by the confirmation step
    }
  };

  // Render the appropriate step
  const renderStep = () => {
    switch (wizardState.currentStep) {
      case 1:
        return (
          <StepPlanSelection
            formData={wizardState.formData}
            handleInputChange={wizardState.handleInputChange}
            handleNext={wizardState.nextStep}
          />
        )
      case 2:
        if (wizardState.formData.planType === "microcycle") {
          return (
            <StepMicroPlanSelection
              formData={wizardState.formData}
              handleInputChange={wizardState.handleInputChange as any}
              errors={wizardState.errors}
              handleNext={wizardState.nextStep}
              handleBack={wizardState.prevStep}
              groups={[]}
              groupLoading={false}
              userRole={''}
            />
          )
        }
        // For mesocycle, show the standard overview
        return (
          <StepOneOverview
            formData={wizardState.formData}
            handleInputChange={wizardState.handleInputChange as any}
            errors={wizardState.errors}
            handleNext={wizardState.nextStep}
            handleBack={wizardState.prevStep}
            groups={[]}
            groupLoading={false}
            userRole={''}
          />
        )
      case 3:
        // Create comprehensive props object for StepTwoPlanner
        const stepTwoProps: StepTwoPlannerProps = {
          // Core wizard props
          onCompleteStep: wizardState.nextStep,
          onGoBack: wizardState.prevStep,
          
          // Form data and state
          initialFormData: wizardState.formData,
          
          // Active session and filtering
          initialActiveSession: wizardState.formData.sessions.find(s => s.ui_id === wizardState.activeSessionId) || null,
          initialFilteredExercises: wizardState.sessionPlannerState.filteredExercisesForDisplay || [],
          initialSessionSections: wizardState.formData.sessionSections,
          initialExerciseOrder: wizardState.formData.exerciseOrder,
          _initialExerciseOrder: wizardState.formData.exerciseOrder,
          
          // Error handling
          initialErrors: wizardState.errors,
          
          // User context
          initialUserRole: undefined, // Fallback: property doesn't exist in interface
          _initialUserRole: undefined, // Fallback: property doesn't exist in interface
          initialAthleteProfile: undefined, // Fallback: property doesn't exist in interface
          _initialAthleteProfile: undefined, // Fallback: property doesn't exist in interface
          initialFeedbackText: wizardState.feedbackText || "",
          _initialFeedbackText: wizardState.feedbackText || "",
          
          // Loading states
          initialLoadingExercises: wizardState.isLoading,
          _initialLoadingExercises: wizardState.isLoading,
          initialProfileLoading: false, // Fallback: property doesn't exist in interface
          _initialProfileLoading: false, // Fallback: property doesn't exist in interface
          
          // Session management handlers
          setActiveSessionId: wizardState.setActiveSessionId,
          handleSessionInputChange: wizardState.updateSessionDetails,
          _handleSessionInputChange: wizardState.updateSessionDetails,
          handleAddSession: wizardState.addSession,
          
          // Exercise handlers from sessionPlannerState
          onRemoveExercise: wizardState.sessionPlannerState.handleDeleteExercise,
          onExerciseDetailChange: wizardState.sessionPlannerState.handleSetDetailChange,
          handleAddSet: wizardState.sessionPlannerState.handleAddSet,
          handleRemoveSet: wizardState.sessionPlannerState.handleRemoveSet,
          handleExerciseFieldChange: wizardState.sessionPlannerState.handleExerciseFieldChange,
          handleReplaceExerciseDefinition: wizardState.sessionPlannerState.handleReplaceExerciseDefinition,
          
          // Section handlers from sessionPlannerState
          handleAddSection: wizardState.sessionPlannerState.handleAddSection,
          handleDeleteSection: wizardState.sessionPlannerState.handleDeleteSection,
          
          // Superset handlers from sessionPlannerState
          handleCreateSuperset: wizardState.sessionPlannerState.handleCreateSuperset,
          handleDissolveSuperset: wizardState.sessionPlannerState.handleDissolveSuperset,
          
          // Progression handlers
          onProgressionModelChange: wizardState.handleProgressionModelChange,
          _onProgressionModelChange: wizardState.handleProgressionModelChange,
          onProgressionValueChange: wizardState.handleProgressionValueChange,
          _onProgressionValueChange: wizardState.handleProgressionValueChange,
          
          // Session mode change handler
          handleSessionModeChange: (sessionId: string, newMode: "individual" | "group") => {
            const session = wizardState.formData.sessions.find(s => s.ui_id === sessionId);
            if (session) {
              wizardState.updateSessionDetails(sessionId, { ...session, type: newMode, sessionMode: newMode });
            }
          },
          
          // Placeholder/incomplete handlers that need implementation
          getOrderedExercises: wizardState.sessionPlannerState.getOrderedExercises,
          _getOrderedExercises: wizardState.sessionPlannerState.getOrderedExercises,
          onAddExercise: wizardState.sessionPlannerState.handleAddExercise,
          onExerciseReorder: (sessionId: string, sectionId: string, newOrder: string[]) => {
            wizardState.sessionPlannerState.handleReorder({
              operationType: "reorder-items-in-section",
              sessionId: sessionId,
              sectionId: sectionId,
              newSectionOrder: newOrder, // This should align with ReorderPayload's newSectionOrder
            });
          },
          _onExerciseReorder: (sessionId: string, sectionId: string, newOrder: string[]) => {
            wizardState.sessionPlannerState.handleReorder({
              operationType: "reorder-items-in-section",
              sessionId: sessionId,
              sectionId: sectionId,
              newSectionOrder: newOrder, // This should align with ReorderPayload's newSectionOrder
            });
          },
        };
        
        return <StepTwoPlanner {...stepTwoProps} />;
      case 4:
        return (
          <StepThreeConfirmation
            formData={wizardState.formData}
            aiSuggestions={wizardState.aiSuggestions} 
            handleAcceptSuggestion={() => {}} // Placeholder if not in hook
            isLoading={wizardState.isLoading}
            handleBack={wizardState.prevStep}
            handleSubmit={handleUnifiedSubmit}
            errors={wizardState.errors}
          />
        )
      default:
        return null
    }
  }

  // Get step name based on current step and plan type
  const getStepName = () => {
    if (wizardState.currentStep === 1) return "Plan Selection";
    
    if (wizardState.currentStep === 2) {
      return wizardState.formData.planType === "microcycle" ? "Microcycle Setup" : "Overview";
    }
    
    if (wizardState.currentStep === 3) return "Planning";
    if (wizardState.currentStep === 4) return "Confirmation";
    
    return "";
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('MesoWizard Error:', error, errorInfo);
        // Could add error reporting here
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className="w-full relative">
        <div className="wizard-container space-y-4 sm:space-y-8 px-4 sm:px-6 py-4 sm:py-6">
          <header className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-sm sm:text-base">Step {wizardState.currentStep} of 4: {getStepName()}</span>
              <span className="text-gray-500 text-xs sm:text-sm">{Math.round(((wizardState.currentStep - 1) / 4) * 100)}%</span>
            </div>
            <Progress value={((wizardState.currentStep - 1) / 4) * 100} className="h-2 sm:h-3" />
          </header>

          <main className="relative z-10 bg-white/80 backdrop-blur-sm px-3 py-4 sm:p-6 rounded-lg shadow-sm sm:shadow-md">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error('Wizard Step Error:', error, errorInfo);
              }}
              showDetails={process.env.NODE_ENV === 'development'}
            >
              {renderStep()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default MesoWizard 