"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import OnboardingFlow from '@/components/onboarding/onboarding-flow'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    // Skip auth check if BYPASS_AUTH is true
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      return
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <OnboardingFlow />
    </main>
  )
} 