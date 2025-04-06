"use client"

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

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

        <div className="p-4">
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            redirectUrl="/onboarding"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                borderRadius: '0.375rem',
              },
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
                card: 'bg-transparent',
                headerTitle: 'text-white',
                headerSubtitle: 'text-gray-400',
                formFieldLabel: 'text-gray-300',
                footerActionText: 'text-gray-400',
                footerActionLink: 'text-blue-500 hover:text-blue-400',
                dividerText: 'text-gray-400',
                dividerLine: 'bg-gray-600',
                formFieldInput: 'bg-gray-700 border border-gray-600 text-white rounded-md'
              }
            }}
          />
        </div>

        <div className="mt-6">
          <p className="text-center text-xs text-gray-400">
            By signing up, you agree to our{" "}
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
  );
};

export default RegisterPage; 