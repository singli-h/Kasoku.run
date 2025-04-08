"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { SignIn } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const LoginPage = () => {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsChecking(false)
      return
    }

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
        // On error, default to planner page
        router.push('/planner')
      } finally {
        setIsChecking(false)
      }
    }

    if (isSignedIn) {
      checkOnboardingStatus()
    }
  }, [isSignedIn, isLoaded, router])

  // Don't render anything while checking to avoid flickering
  if (isLoaded && isSignedIn && isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-pulse">
          <Image 
            src="/logo.svg" 
            alt="RunningApp Logo" 
            width={80}
            height={80}
            priority
          />
        </div>
      </div>
    )
  }

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
      
      <SignIn
        appearance={{
          layout: {
            logoPlacement: "none",
            socialButtonsVariant: "iconButton",
          }
        }}
        redirectUrl="/login"
      />
    </div>
  )
}

export default LoginPage
