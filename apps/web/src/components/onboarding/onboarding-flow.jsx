"use client"

import { useState, useEffect } from "react"
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

export default function OnboardingFlow() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    profilePicture: null,
    birthdate: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    
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

  // Update user data when Clerk user is loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      console.log('Clerk user loaded in onboarding flow:', {
        userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress?.emailAddress
      })
      
      setUserData(prevData => ({
        ...prevData,
        firstName: user.firstName || prevData.firstName,
        lastName: user.lastName || prevData.lastName,
        email: user.primaryEmailAddress?.emailAddress || prevData.email
      }))
    } else if (isUserLoaded && !user) {
      console.error('Clerk user loaded but null in onboarding flow')
    }
  }, [isUserLoaded, user, userId])

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
        router.push('/workout')
        return
      }

      // Get current user from Clerk
      if (!userId) {
        console.error('No userId found from Clerk useAuth()')
        throw new Error('No user found')
      }
      
      console.log('User authentication info:', { 
        userId, 
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      })

      // Prepare payload for server API
      const userDataForApi = {
        clerk_id: userId,
        username: userData.firstName.toLowerCase() + (userData.lastName ? userData.lastName.charAt(0).toLowerCase() : ''),
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        birthdate: userData.birthdate,
        timezone: userData.timezone,
        subscription_status: userData.subscription,
        onboarding_completed: true,
        metadata: { role: userData.role },
        // athlete and coach fields passed as extras
        athlete_height: userData.height,
        athlete_weight: userData.weight,
        athlete_training_history: userData.trainingHistory,
        athlete_training_goals: userData.trainingGoals,
        athlete_events: userData.events,
        coach_specialization: userData.specialization,
        coach_experience: userData.experience,
        coach_philosophy: userData.coachingPhilosophy,
        coach_sport_focus: userData.sportFocus
      }

      console.log('Sending onboarding data to server API', userDataForApi)
      const res = await fetch('/api/users/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDataForApi)
      })
      const result = await res.json()
      if (!res.ok || result.status !== 'success') {
        console.error('Onboarding API error:', result)
        throw new Error(result.message || 'Onboarding failed')
      }
    } catch (error) {
      console.error('Error saving user data:', error)
      console.log('Actual error object:', error)
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