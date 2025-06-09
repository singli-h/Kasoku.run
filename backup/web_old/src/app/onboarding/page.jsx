"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import OnboardingFlow from '@/components/onboarding/onboarding-flow'

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoaded, userId, isSignedIn } = useAuth()

  useEffect(() => {
    // Skip auth check if BYPASS_AUTH is true
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      return
    }

    // Check if user is authenticated with Clerk
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <OnboardingFlow />
    </main>
  )
} 