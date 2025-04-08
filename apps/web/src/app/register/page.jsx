"use client"

import { useEffect } from "react"
import Image from "next/image"
import { SignUp } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const RegisterPage = () => {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already signed in, check their onboarding status
    if (isSignedIn) {
      const checkOnboardingStatus = async () => {
        try {
          const response = await fetch('/api/user-status')
          const data = await response.json()

          if (data.onboardingCompleted) {
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
  }, [isSignedIn, router])

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
        redirectUrl="/onboarding"
      />
    </div>
  )
}

export default RegisterPage 