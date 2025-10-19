"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { WelcomeStep } from "./steps/welcome-step"
import { RoleSelectionStep } from "./steps/role-selection-step"
import { AthleteDetailsStep } from "./steps/athlete-details-step"
import { CoachDetailsStep } from "./steps/coach-details-step"
import { SubscriptionStep } from "./steps/subscription-step"
import { DashboardTourStep } from "./steps/dashboard-tour-step"
import { CompletionStep } from "./steps/completion-step"
import { completeOnboardingAction } from "@/actions/onboarding/onboarding-actions"

export interface OnboardingData {
  firstName: string
  lastName: string
  email: string
  role: "athlete" | "coach" | ""
  profilePicture: File | null
  birthdate: string
  timezone: string
  
  // Athlete-specific fields
  height: string
  weight: string
  trainingHistory: string
  trainingGoals: string
  events: string[]
  
  // Coach-specific fields
  specialization: string
  experience: string
  coachingPhilosophy: string
  sportFocus: string
  
  // Common fields
  subscription: "free" | "paid"
}

export default function OnboardingWizard() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  
  const [userData, setUserData] = useState<OnboardingData>({
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
      console.log('Clerk user loaded in onboarding wizard:', {
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
      console.error('Clerk user loaded but null in onboarding wizard')
    }
  }, [isUserLoaded, user, userId])

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { id: "welcome", label: "Welcome" },
    { id: "role", label: "Role Selection" },
    { id: "details", label: "Role Details" },
    { id: "subscription", label: "Subscription" },
    { id: "tour", label: "Dashboard Tour" },
    { id: "complete", label: "Complete" },
  ]

  const updateUserData = (data: Partial<OnboardingData>) => {
    setUserData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = (index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index)
    }
  }

  const handleComplete = async () => {
    if (!userId) {
      console.error('No userId found from Clerk useAuth()')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('Completing onboarding with data:', userData)
      
      const result = await completeOnboardingAction({
        clerkId: userId,
        username: userData.firstName.toLowerCase() + (userData.lastName ? userData.lastName.charAt(0).toLowerCase() : ''),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as "athlete" | "coach",
        birthdate: userData.birthdate,
        timezone: userData.timezone,
        subscription: userData.subscription,
        
        // Role-specific fields
        ...(userData.role === "athlete" && {
          athleteData: {
            height: userData.height ? parseFloat(userData.height) : null,
            weight: userData.weight ? parseFloat(userData.weight) : null,
            trainingGoals: userData.trainingGoals,
            experience: userData.trainingHistory,
            events: userData.events,
          }
        }),
        
        ...(userData.role === "coach" && {
          coachData: {
            speciality: userData.specialization,
            experience: userData.experience,
            philosophy: userData.coachingPhilosophy,
            sportFocus: userData.sportFocus,
          }
        }),
      })

      if (result.isSuccess) {
        console.log('Onboarding completed successfully')
        router.push('/dashboard')
      } else {
        console.error('Onboarding failed:', result.message)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false)
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
        return (
          <CompletionStep 
            onComplete={handleComplete} 
            isSubmitting={isSubmitting}
          />
        )
      default:
        return <WelcomeStep onNext={nextStep} />
    }
  }

  return (
    <div className="container mx-auto px-6 max-w-[1000px]">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-medium text-foreground">
            Step {currentStep + 1} of {steps.length}
          </h2>
          <span className="text-base font-medium text-muted-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2.5" 
        />
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-2xl shadow-lg border">
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

      {/* Step Indicators */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              disabled={index > currentStep}
              className={`h-2.5 transition-all duration-200 rounded-full ${
                index === currentStep
                  ? "w-10 bg-primary"
                  : index < currentStep
                  ? "w-6 bg-primary/70 hover:bg-primary"
                  : "w-4 bg-muted hover:bg-muted-foreground/20"
              } ${
                index <= currentStep ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              aria-label={`${step.label} - ${
                index < currentStep ? "Completed" : 
                index === currentStep ? "Current" : "Upcoming"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 