"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import WelcomeStep from "./steps/welcome-step"
import RoleSelectionStep from "./steps/role-selection-step"
import AthleteDetailsStep from "./steps/athlete-details-step"
import CoachDetailsStep from "./steps/coach-details-step"
import SubscriptionStep from "./steps/subscription-step"
import CompletionStep from "./steps/completion-step"
import DashboardTourStep from "./steps/dashboard-tour-step"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { edgeFunctions } from "@/lib/edge-functions"

export default function OnboardingFlow() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user } = useUser()
  
  const [userData, setUserData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    role: "",
    profilePicture: null,
    birthday: "",
    
    // Athlete-specific fields
    height: "",
    weight: "",
    trainingHistory: "",
    trainingGoals: "",
    events: [],
    
    // Coach-specific fields
    specialization: "",
    experience: "",
    coachingPhilosophy: "",
    sportFocus: "",
    
    // Common fields
    subscription: "free",
  })

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { id: "welcome", label: "Welcome" },
    { id: "role", label: "Role Selection" },
    { id: "details", label: "Role Details" },
    { id: "subscription", label: "Subscription" },
    { id: "tour", label: "Dashboard Tour" },
    { id: "complete", label: "Complete" },
  ]

  const updateUserData = async (data) => {
    setUserData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = (index) => {
    setCurrentStep(index)
  }

  const handleComplete = async () => {
    try {
      // In development mode with BYPASS_AUTH, skip profile update
      if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
        router.push('/dashboard')
        return
      }

      // Get current user from Clerk
      if (!userId) {
        throw new Error('No user found')
      }

      // Prepare user data for the API with proper field prefixes
      const userDataForApi = {
        clerk_id: userId,
        username: userData.firstName.toLowerCase() + (userData.lastName ? userData.lastName.charAt(0).toLowerCase() : ''),
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        birthday: userData.birthday,
        subscription_status: userData.subscription,
        onboarding_completed: true,
        metadata: {
          role: userData.role,
        },
      }

      // Add athlete-specific fields
      if (userData.role === 'athlete') {
        // Ensure events are properly serializable by extracting only the needed fields
        const sanitizedEvents = userData.events.map(event => ({
          id: event.id,
          name: event.name,
          type: event.type,
          category: event.category
        }))
        
        userDataForApi.athlete_height = userData.height
        userDataForApi.athlete_weight = userData.weight
        userDataForApi.athlete_training_history = userData.trainingHistory
        userDataForApi.athlete_training_goals = userData.trainingGoals
        userDataForApi.athlete_events = sanitizedEvents
      }

      // Add coach-specific fields
      if (userData.role === 'coach') {
        userDataForApi.coach_specialization = userData.specialization
        userDataForApi.coach_experience = userData.experience
        userDataForApi.coach_philosophy = userData.coachingPhilosophy
        userDataForApi.coach_sport_focus = userData.sportFocus
      }

      // Use edge functions utility to call the API
      await edgeFunctions.users.onboard(userDataForApi)

      // Redirect to dashboard after successful onboarding
      router.push('/planner')
    } catch (error) {
      console.error('Error saving user data:', error)
      // You might want to show an error message to the user here
    }
  }

  const progressPercentage = (currentStep / (steps.length - 1)) * 100

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />
      case 1:
        return (
          <RoleSelectionStep
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 2:
        return userData.role === "athlete" ? (
          <AthleteDetailsStep
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        ) : (
          <CoachDetailsStep
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 3:
        return (
          <SubscriptionStep
            userData={userData}
            updateUserData={updateUserData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )
      case 4:
        return <DashboardTourStep onNext={nextStep} onPrev={prevStep} />
      case 5:
        return <CompletionStep onComplete={handleComplete} />
      default:
        return <WelcomeStep onNext={nextStep} />
    }
  }

  return (
    <div className="container mx-auto px-6 max-w-[1000px]">
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-medium text-white/90">
            Step {currentStep + 1} of {steps.length}
          </h2>
          <span className="text-base font-medium text-white/90">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2.5 bg-white/[0.12] rounded-full overflow-hidden" 
          indicatorClassName="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]" 
        />
      </div>

      <div className="bg-[#1E1E2E] rounded-2xl shadow-2xl border-2 border-white/[0.08] shadow-[#4F46E5]/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-10"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex space-x-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index <= currentStep && goToStep(index)}
              disabled={index > currentStep}
              className={`h-2.5 transition-all duration-200 rounded-full ${
                index === currentStep
                  ? "w-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
                  : index < currentStep
                    ? "w-2.5 bg-[#4F46E5]/40"
                    : "w-2.5 bg-white/[0.12]"
              } ${index <= currentStep ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed"}`}
              aria-label={`Go to ${step.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 