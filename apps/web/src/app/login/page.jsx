"use client"

import Image from "next/image"
import Link from "next/link"
import { SignIn } from "@clerk/nextjs"

const LoginPage = () => {
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
          <h2 className="text-3xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
              Create one
            </Link>
          </p>
        </div>

        {/* Clerk SignIn component */}
        <div className="mt-6">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-gray-700 border border-gray-600 text-white hover:bg-gray-600",
                socialButtonsBlockButtonText: "text-white",
                socialButtonsBlockButtonArrow: "text-white",
                dividerLine: "bg-gray-600",
                dividerText: "text-gray-400",
                formFieldLabel: "text-gray-300",
                formFieldInput: "bg-gray-700 border-gray-600 text-white",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
                footerAction: "text-gray-400",
                footerActionLink: "text-blue-500 hover:text-blue-400",
                form: "gap-4"
              }
            }}
            routing="path"
            path="/login"
            redirectUrl="/dashboard"
            signUpUrl="/register"
          />
        </div>

        <div className="mt-6">
          <p className="text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="font-medium text-blue-500 hover:text-blue-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-blue-500 hover:text-blue-400">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
