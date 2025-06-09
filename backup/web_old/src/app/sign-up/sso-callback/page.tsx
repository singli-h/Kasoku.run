"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { Suspense } from "react"
import Image from "next/image"

/**
 * Loading fallback component for sign-up SSO callback
 */
function SignUpSSOLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-8 animate-pulse">
        <Image 
          src="/logo.svg" 
          alt="Kasoku Logo" 
          width={80}
          height={80}
          priority
        />
      </div>
      <h1 className="text-xl text-center">Completing sign up...</h1>
    </div>
  )
}

/**
 * Sign-up SSO callback content component
 * Uses Clerk's built-in redirect callback handler
 */
function SignUpSSOCallbackContent() {
  return (
    <AuthenticateWithRedirectCallback 
      signUpFallbackRedirectUrl="/auth/session"
      signInFallbackRedirectUrl="/auth/session"
    />
  )
}

/**
 * Main sign-up SSO callback page component
 * Properly wraps the content with Suspense for React 19 compatibility
 */
export default function SignUpSSOCallbackPage() {
  return (
    <Suspense fallback={<SignUpSSOLoadingFallback />}>
      <SignUpSSOCallbackContent />
    </Suspense>
  )
} 