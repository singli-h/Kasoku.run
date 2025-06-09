"use server"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { checkUserNeedsOnboardingAction } from "@/actions/auth/user-actions"
import OnboardingForm from "./_components/onboarding-form"
import OnboardingFormSkeleton from "./_components/onboarding-form-skeleton"

async function OnboardingContent() {
  // Check if user has already completed onboarding
  const onboardingResult = await checkUserNeedsOnboardingAction()
  
  if (onboardingResult.isSuccess && !onboardingResult.data) {
    // User has already completed onboarding, redirect to dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Just a few quick details to get you started
          </p>
        </div>
        <Suspense fallback={<OnboardingFormSkeleton />}>
          <OnboardingForm />
        </Suspense>
      </div>
    </div>
  )
}

export default async function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFormSkeleton />}>
      <OnboardingContent />
    </Suspense>
  )
} 