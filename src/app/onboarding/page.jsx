"use client"

import OnboardingFlow from '@/components/onboarding/onboarding-flow'

export default function OnboardingPage() {
  // Auth checks will be implemented with Clerk
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <OnboardingFlow />
    </main>
  )
} 