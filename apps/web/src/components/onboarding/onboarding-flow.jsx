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
import { useBrowserSupabaseClient } from "@/lib/supabase"

export default function OnboardingFlow() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user, isLoaded: isUserLoaded } = useUser()
  const supabase = useBrowserSupabaseClient();
  
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

      // Prepare user data for the API with proper field prefixes
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
        metadata: {
          role: userData.role,
        },
      }

      // Check if critical fields are present
      if (!userDataForApi.clerk_id || !userDataForApi.email) {
        console.error('Critical data missing:', {
          hasClerkId: !!userDataForApi.clerk_id,
          hasEmail: !!userDataForApi.email
        })
      }

      // Log the onboarding completed value being sent
      console.log('Setting onboarding_completed to:', userDataForApi.onboarding_completed)

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

      // Debugging - Log the request data
      console.log('Sending onboarding data to API:', JSON.stringify(userDataForApi, null, 2))

      // Onboard user via direct Supabase client
      const { data: response, error } = await supabase
        .from('users')
        .upsert(userDataForApi, { onConflict: ['clerk_id'], returning: 'representation' })
      if (error) {
        console.error('Error onboarding user:', error)
        throw error
      }
      console.log('Supabase upsert response:', response)

      // Extract new user ID
      const [userRecord] = response || [];
      const newUserId = userRecord?.id;

      // Always create athlete record
      const sanitizedEvents = userData.events.map(event => ({
        id: event.id,
        name: event.name,
        type: event.type,
        category: event.category
      }));
      const { error: athleteError } = await supabase
        .from('athletes')
        .insert({
          user_id: newUserId,
          height: userData.height,
          weight: userData.weight,
          training_goals: userData.trainingGoals,
          experience: userData.trainingHistory,
          events: sanitizedEvents
        });
      if (athleteError) {
        console.error('Error creating athlete record:', athleteError);
        throw athleteError;
      }

      // If coach role, also create coach record
      if (userData.role === 'coach') {
        const coachPayload = {
          user_id: newUserId,
          speciality: userData.specialization,
          experience: userData.experience,
          philosophy: userData.coachingPhilosophy,
          sport_focus: userData.sportFocus
        };
        const { error: coachError } = await supabase
          .from('coaches')
          .insert(coachPayload);
        if (coachError) {
          console.error('Error creating coach record:', coachError);
          throw coachError;
        }
      }
      
      // Verify onboarding status after completion
      console.log('Verifying onboarding status after completion...')
      try {
        const { data: statusData, error: statusError } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('clerk_id', userId)
          .single();
        if (statusError) {
          console.error('Error fetching onboarding status:', statusError);
        } else {
          console.log('Onboarding status check result:', statusData.onboarding_completed);
        }
      } catch (verifyError) {
        console.error('Error verifying onboarding status:', verifyError);
      }

      console.log('Onboarding complete, redirecting to dashboard...')
      // Timeout and redirect happens in completion-step.jsx
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