"use client"

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
          {/* Logo Section */}
          <div className="px-8 pt-8 pb-4 bg-gradient-to-b from-blue-600 to-blue-700">
            <div className="text-center">
              <Image 
                src="/logo.svg" 
                alt="RunningApp Logo" 
                className="h-16 w-auto mx-auto mb-4"
                width={64}
                height={64}
                priority
              />
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="p-6">
            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
              redirectUrl="/onboarding"
              appearance={{
                variables: {
                  colorPrimary: '#2563eb',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                },
                elements: {
                  formButtonPrimary: 
                    'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200',
                  card: 'bg-white dark:bg-gray-800 shadow-none',
                  headerTitle: 'text-gray-900 dark:text-white text-2xl font-bold',
                  headerSubtitle: 'text-gray-600 dark:text-gray-400',
                  socialButtonsBlockButton: 
                    'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200',
                  socialButtonsBlockButtonText: 
                    'text-gray-600 dark:text-gray-300 font-medium',
                  formFieldLabel: 'text-gray-700 dark:text-gray-300 font-medium',
                  formFieldInput: 
                    'bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  dividerLine: 'bg-gray-200 dark:bg-gray-700',
                  dividerText: 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800',
                  formFieldInputShowPasswordButton: 'text-gray-600 dark:text-gray-400',
                  footer: 'hidden',
                  alert: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl',
                  formFieldError: 'text-red-600 dark:text-red-400 text-sm'
                }
              }}
            />
          </div>

          {/* Footer Links */}
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-200">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 