"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AIRecommendations from "../components/AIRecommendations"
import { useErrorToast } from "../hooks/useErrorToast"
import React from "react"

/**
 * Step Four: Confirmation & AI Review
 * 
 * This step shows the complete mesocycle details and provides:
 * - AI suggestions and feedback on the plan
 * - Option to apply AI suggestions
 * - Final submission button
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Object} props.aiSuggestions - AI suggestions data
 * @param {Function} props.handleAcceptSuggestion - Function to handle accepting a suggestion
 * @param {boolean} props.isLoading - Whether suggestions are loading
 * @param {Function} props.handleBack - Function to go to the previous step
 * @param {Function} props.handleSubmit - Function to submit the form
 * @param {Object} props.errors - Validation errors
 */
interface StepThreeConfirmationProps {
  formData: any;
  aiSuggestions: any;
  handleAcceptSuggestion: (_suggestionId: string) => void;
  isLoading: boolean;
  handleBack: () => void;
  handleSubmit: (_e: Event) => Promise<void>;
  errors: Record<string, string>;
}

const StepThreeConfirmation = React.memo(({
  formData,
  aiSuggestions,
  handleAcceptSuggestion,
  isLoading,
  handleBack,
  handleSubmit,
  errors,
}: StepThreeConfirmationProps) => {
  // Group exercises by session
  const exercisesBySession = formData.sessions.map((session: any) => {
    const sessionExercises = formData.exercises.filter((ex: any) => ex.session === session.id)
    return {
      ...session,
      exercises: sessionExercises,
    }
  })

  // Use error toast hook for notifications
  const { Toast, showError, showSuccess } = useErrorToast() as any
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Temporarily type AIRecommendations as any to allow passing props without TS errors
  const AISuggestionsComponent: any = AIRecommendations

  // Determine plan type text and styling
  const planTypeText = formData.planType === "microcycle" ? "Microcycle" : "Mesocycle";
  const planTypeDuration = formData.planType === "microcycle" ? "1 week" : `${formData.duration} weeks`;
  
  // Adapt title based on plan type
  const confirmationTitle = `${planTypeText} Plan Summary`;
  
  // Adapt session title based on plan type
  const sessionTitle = formData.planType === "microcycle" 
    ? "Your Weekly Schedule" 
    : "Your Training Schedule";

  // Handle submit with error notification
  const handleFormSubmit = async (e: any) => {
    e.preventDefault()
    
    try {
      setIsSubmitted(true)
      
      // Log the data being submitted
      console.log(`Submitting ${planTypeText} plan:`, formData);
      
      // Submit the form data
      await handleSubmit(e)
      
      // Show success message
      showSuccess(`${planTypeText} plan saved successfully! You can now view it in your Workout page.`)
    } catch (error: any) {
      console.error('Error submitting plan:', error);
      showError(error.message || `Failed to save ${planTypeText.toLowerCase()} plan. Please try again.`)
      setIsSubmitted(false)
    }
  }

  // Add text to explain what the user is confirming:
  const confirmationText = formData.planType === "microcycle"
    ? "Review your one-week training plan before saving. This plan focuses on short-term training goals without complex progression patterns."
    : "Review your mesocycle plan before saving. Your plan includes progressive overload patterns designed to achieve your training goals over multiple weeks.";

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{confirmationTitle}</h1>
        <p className="text-gray-600">
          {confirmationText}
        </p>
      </header>

      {/* Toast for success/error notifications */}
      <div aria-live="polite" aria-atomic="true">
        <Toast />
      </div>

      {/* AI Recommendations */}
      <section aria-labelledby="ai-recommendations-heading">
        <h2 id="ai-recommendations-heading" className="sr-only">AI Recommendations</h2>
        <AISuggestionsComponent
          aiSuggestions={aiSuggestions}
          handleAcceptSuggestion={handleAcceptSuggestion}
          isLoading={isLoading}
        />
      </section>

      {/* Mesocycle Summary */}
      <section aria-labelledby="plan-summary-heading">
        <Card>
          <CardHeader>
            <CardTitle id="plan-summary-heading">{planTypeText} Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Goals</h3>
                <p className="text-sm">{formData.goals}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Start Date</h3>
                  <p className="text-sm">{new Date(formData.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Duration</h3>
                  <p className="text-sm">{planTypeDuration}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Sessions Per Week</h3>
                  <p className="text-sm">{formData.sessionsPerWeek}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Total Sessions</h3>
                  <p className="text-sm">{formData.sessions.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Session Details */}
      <section aria-labelledby="session-details-heading">
        <div className="space-y-4">
          <h2 id="session-details-heading" className="text-lg font-medium">{sessionTitle}</h2>
          {exercisesBySession.map((session: any) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{session.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-sm font-medium mb-2">Exercises</h3>
                {session.sessionMode === 'group' ? (
                  <div className="text-base font-semibold text-blue-700">
                    {session.exercises.length} Sprint (total: {session.exercises.reduce((sum: any, ex: any) => sum + (Number(ex.distance) || 0), 0)}m)
                  </div>
                ) : session.exercises.length === 0 ? (
                  <p className="text-sm text-gray-500">No exercises added to this session.</p>
                ) : (
                  <div className="space-y-2">
                    {/* Group exercises by part/section */}
                    {Array.from(new Set<string>(session.exercises.map((ex: any) => ex.part as string))).map((part) => {
                      const partExercises = session.exercises.filter((ex: any) => ex.part === part)
                      return (
                        <div key={part} className="border rounded-md p-3">
                          <h4 className="text-sm font-medium mb-2 capitalize">{part.split('-')[0]}</h4>
                          <div className="space-y-2">
                            {partExercises.map((exercise: any) => (
                              <div key={exercise.id} className="flex items-center justify-between text-sm">
                                <span>{exercise.name}</span>
                                <span>
                                  {exercise.sets} × {exercise.reps}
                                  {exercise.oneRepMax && ` @ ${exercise.oneRepMax}%`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Error message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" aria-live="assertive">
          {errors.submit}
        </div>
      )}

      {/* Navigation and Save Button */}
      <nav className="flex justify-between pt-6" aria-label="Step navigation">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          disabled={isLoading || isSubmitted}
          aria-label="Go back to previous step"
        >
          <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <Button 
          type="submit" 
          onClick={handleFormSubmit} 
          disabled={isLoading || isSubmitted}
          aria-label={isLoading || isSubmitted ? 'Saving plan in progress' : 'Save training plan'}
          aria-describedby={isLoading || isSubmitted ? "save-status" : undefined}
        >
          {isLoading || isSubmitted ? 'Saving...' : 'Save Plan'}
        </Button>
        {(isLoading || isSubmitted) && (
          <span id="save-status" className="sr-only">
            Plan is being saved, please wait
          </span>
        )}
      </nav>
    </main>
  )
})

// Add display name for React.memo component
StepThreeConfirmation.displayName = 'StepThreeConfirmation';

export default StepThreeConfirmation 