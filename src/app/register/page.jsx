"use client"

import Image from "next/image"
import Link from "next/link"
import { SignUp } from "@clerk/nextjs"

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <Image 
            src="/logo.svg" 
            alt="RunningApp Logo" 
            className="h-16 w-auto mx-auto mb-4"
            width={64}
            height={64}
            priority
          />
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
              Sign in
            </Link>
          </p>
        </div>

        {/* Clerk SignUp component */}
        <div className="mt-8">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-white",
                card: "bg-transparent shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formFieldLabel: "text-gray-400",
                formFieldInput: "bg-gray-700 text-white border-gray-600",
                footerActionLink: "text-blue-500 hover:text-blue-400",
              }
            }}
            redirectUrl="/onboarding"
            signInUrl="/login"
          />
        </div>
      </div>
    </div>
  )
}

export default RegisterPage 