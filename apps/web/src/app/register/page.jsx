"use client"

import { useEffect } from "react"
import Image from "next/image"
import { SignUp } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useBrowserSupabaseClient } from "@/lib/supabase"
import supabaseApi from "@/lib/supabase-api"

const RegisterPage = () => {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const supabase = useBrowserSupabaseClient()

  useEffect(() => {
    // If user is already signed in, check their onboarding status
    if (isSignedIn) {
      const checkOnboardingStatus = async () => {
        try {
          const { onboardingCompleted } = await supabaseApi.users.getStatus(supabase)

          if (onboardingCompleted) {
            // If onboarding is completed, go to planner
            router.push('/planner')
          } else {
            // If onboarding is not completed, go to onboarding
            router.push('/onboarding')
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // On error, default to onboarding page
          router.push('/onboarding')
        }
      }

      checkOnboardingStatus()
    }
  }, [isSignedIn, router, supabase])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Image 
          src="/logo.svg" 
          alt="RunningApp Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      
      <SignUp
        appearance={{
          layout: {
            logoPlacement: "none",
            socialButtonsVariant: "iconButton",
          }
        }}
        redirectUrl="/auth/session"
        routing="path"
        path="/register"
        signInUrl="/login"
      />
    </div>
  )
}

export default RegisterPage 