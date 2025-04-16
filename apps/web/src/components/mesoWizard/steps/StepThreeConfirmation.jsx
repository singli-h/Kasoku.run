"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AIRecommendations from "../components/AIRecommendations"
import { useErrorToast } from "../hooks/useErrorToast"

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
const StepThreeConfirmation = ({
  formData,
  aiSuggestions,
  handleAcceptSuggestion,
  isLoading,
  handleBack,
  handleSubmit,
  errors,
}) => {
  // Group exercises by session
  const exercisesBySession = formData.sessions.map((session) => {
    const sessionExercises = formData.exercises.filter((ex) => ex.session === session.id)
    return {
      ...session,
      exercises: sessionExercises,
    }
  })

  // Use error toast hook for notifications
  const { Toast, showError, showSuccess } = useErrorToast()
  const [isSubmitted, setIsSubmitted] = useState(false)

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
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsSubmitted(true)
      
      // Log the data being submitted
      console.log(`Submitting ${planTypeText} plan:`, formData);
      
      // Submit the form data
      await handleSubmit(e)
      
      // Show success message
      showSuccess(`${planTypeText} plan saved successfully! You can now view it in your dashboard.`)
    } catch (error) {
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{confirmationTitle}</h2>
      <p className="text-gray-600">
        {confirmationText}
      </p>

      {/* Toast for success/error notifications */}
      <Toast />

      {/* AI Recommendations */}
      <AIRecommendations
        aiSuggestions={aiSuggestions}
        handleAcceptSuggestion={handleAcceptSuggestion}
        isLoading={isLoading}
      />

      {/* Mesocycle Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{planTypeText} Summary</CardTitle>
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

      {/* Session Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{sessionTitle}</h3>
        {exercisesBySession.map((session) => (
          <Card key={session.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{session.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium mb-2">Exercises</h4>
              {session.exercises.length === 0 ? (
                <p className="text-sm text-gray-500">No exercises added to this session.</p>
              ) : (
                <div className="space-y-2">
                  {/* Group exercises by part/section */}
                  {Array.from(new Set(session.exercises.map((ex) => ex.part))).map((part) => {
                    const partExercises = session.exercises.filter((ex) => ex.part === part)
                    return (
                      <div key={part} className="border rounded-md p-3">
                        <h5 className="text-sm font-medium mb-2 capitalize">{part}</h5>
                        <div className="space-y-2">
                          {partExercises.map((exercise) => (
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

      {/* Error message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button onClick={handleBack} variant="outline" className="px-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleFormSubmit} 
          className="px-6"
          disabled={isLoading || isSubmitted}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : isSubmitted ? (
            `${planTypeText} Created`
          ) : (
            `Create ${planTypeText}`
          )}
        </Button>
      </div>
    </div>
  )
}

export default StepThreeConfirmation 