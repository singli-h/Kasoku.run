import { Suspense } from "react"

// Force dynamic rendering - this page requires auth and user-specific data
export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation"
import { checkUserNeedsOnboardingAction } from "@/actions/auth/user-actions"
import OnboardingWizard from "@/components/features/onboarding/onboarding-wizard"
import { OnboardingFormSkeleton } from "@/components/features/onboarding"

async function OnboardingContent() {
  // Check if user has already completed onboarding
  const onboardingResult = await checkUserNeedsOnboardingAction()
  
  if (onboardingResult.isSuccess && !onboardingResult.data) {
    // User has already completed onboarding, redirect to dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<OnboardingFormSkeleton />}>
          <OnboardingWizard />
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