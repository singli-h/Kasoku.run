"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"
import { WelcomeStep } from "./steps/welcome-step"
import { RoleSelectionStep } from "./steps/role-selection-step"
import { AthleteDetailsStep } from "./steps/athlete-details-step"
import { CoachDetailsStep } from "./steps/coach-details-step"
import { IndividualDetailsStep } from "./steps/individual-details-step"
import { SubscriptionStep } from "./steps/subscription-step"
import { DashboardTourStep } from "./steps/dashboard-tour-step"
import { CompletionStep } from "./steps/completion-step"
import { completeOnboardingAction } from "@/actions/onboarding/onboarding-actions"

// Versioned localStorage keys - increment version when OnboardingData interface changes
const ONBOARDING_STORAGE_KEY = "kasoku_onboarding_data_v2"
const ONBOARDING_STEP_KEY = "kasoku_onboarding_step_v2"

export interface OnboardingData {
  firstName: string
  lastName: string
  email: string
  role: "athlete" | "coach" | "individual" | ""
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

  // Individual-specific fields (self-coaching)
  individualTrainingGoals: string
  individualExperienceLevel: string
  availableEquipment: string[]

  // Common fields
  subscription: "free" | "paid"
}

export default function OnboardingWizard() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const { toast } = useToast()
  
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

    // Individual-specific fields (self-coaching)
    individualTrainingGoals: "",
    individualExperienceLevel: "",
    availableEquipment: [],

    // Common fields
    subscription: "free",
  })

  // Check if user was invited (publicMetadata set server-side by Clerk)
  const invitedRole = (user?.publicMetadata as { role?: string } | undefined)?.role
  const isInvitedAthlete = invitedRole === 'athlete'

  // Update user data when Clerk user is loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      // Clerk user loaded — PII intentionally omitted from logs

      setUserData(prevData => ({
        ...prevData,
        firstName: user.firstName || prevData.firstName,
        lastName: user.lastName || prevData.lastName,
        email: user.primaryEmailAddress?.emailAddress || prevData.email,
        // Pre-select athlete role if invited
        ...(isInvitedAthlete && { role: 'athlete' as const }),
      }))
    } else if (isUserLoaded && !user) {
      console.error('Clerk user loaded but null in onboarding wizard')
    }
  }, [isUserLoaded, user, userId, isInvitedAthlete])

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved onboarding data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY)

      if (savedData) {
        const parsed = JSON.parse(savedData)
        // Don't restore profilePicture as File objects can't be serialized
        setUserData(prev => ({ ...prev, ...parsed, profilePicture: null }))
      }

      if (savedStep) {
        const step = parseInt(savedStep, 10)
        // Use steps array length for validation instead of hard-coded value
        const maxStep = 6 // Must match steps.length defined below
        if (!isNaN(step) && step >= 0 && step < maxStep) {
          setCurrentStep(step)
        }
      }
    } catch (error) {
      console.error("Error loading onboarding data from localStorage:", error)
    }
    setIsHydrated(true)
  }, [])

  // Save onboarding data to localStorage when it changes
  useEffect(() => {
    if (!isHydrated) return

    try {
      // Don't save profilePicture as File objects can't be serialized
      const dataToSave = { ...userData, profilePicture: null }
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Error saving onboarding data to localStorage:", error)
    }
  }, [userData, isHydrated])

  // Save current step to localStorage when it changes
  useEffect(() => {
    if (!isHydrated) return

    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString())
    } catch (error) {
      console.error("Error saving onboarding step to localStorage:", error)
    }
  }, [currentStep, isHydrated])

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
      setOnboardingError(null)
      console.log('Completing onboarding for role:', userData.role)
      
      const result = await completeOnboardingAction({
        clerkId: userId,
        username: userData.firstName.toLowerCase() + (userData.lastName ? userData.lastName.charAt(0).toLowerCase() : ''),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as "athlete" | "coach" | "individual",
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

        ...(userData.role === "individual" && {
          individualData: {
            trainingGoals: userData.individualTrainingGoals,
            experienceLevel: userData.individualExperienceLevel,
            availableEquipment: userData.availableEquipment,
          }
        }),
      })

      if (result.isSuccess) {
        // Clear localStorage on successful onboarding
        localStorage.removeItem(ONBOARDING_STORAGE_KEY)
        localStorage.removeItem(ONBOARDING_STEP_KEY)

        toast({
          title: "Welcome to Kasoku!",
          description: "Your profile has been set up successfully.",
        })

        // Redirect based on role: individuals go to plans to create first training block
        const redirectPath = userData.role === 'individual' ? '/plans' : '/dashboard'
        router.push(redirectPath)
      } else {
        console.error('Onboarding failed:', result.message)
        const errorMsg = result.message || "Failed to complete onboarding. Please try again."
        setOnboardingError(errorMsg)
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error completing onboarding:', error)
      const errorMsg = error?.message || "Something went wrong. Please try again."
      setOnboardingError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
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
            lockedRole={isInvitedAthlete ? 'athlete' : undefined}
          />
        )
      case 2:
        if (userData.role === "athlete") {
          return (
            <AthleteDetailsStep
              userData={userData}
              updateUserData={updateUserData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )
        } else if (userData.role === "individual") {
          return (
            <IndividualDetailsStep
              userData={userData}
              updateUserData={updateUserData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )
        } else if (userData.role === "coach") {
          return (
            <CoachDetailsStep
              userData={userData}
              updateUserData={updateUserData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )
        } else {
          // Edge case: role is empty (e.g., corrupted localStorage)
          // Redirect back to role selection step
          setCurrentStep(1)
          return (
            <RoleSelectionStep
              userData={userData}
              updateUserData={updateUserData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )
        }
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
        return <DashboardTourStep role={userData.role} onNext={nextStep} onPrev={prevStep} />
      case 5:
        return (
          <CompletionStep
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
            role={userData.role}
            error={onboardingError}
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