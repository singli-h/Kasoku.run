"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import Image from "next/image"
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from "next/link"

const RegisterPage = () => {
  const router = useRouter()

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

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#374151',
                  defaultButtonBackgroundHover: '#4b5563',
                  inputBackground: '#374151',
                  inputBorder: '#4b5563',
                  inputBorderHover: '#6b7280',
                  inputBorderFocus: '#2563eb',
                  inputText: 'white',
                  inputPlaceholder: '#9ca3af',
                }
              },
              dark: {
                colors: {
                  brandButtonText: 'white',
                  defaultButtonBackground: '#374151',
                  defaultButtonBackgroundHover: '#4b5563',
                  inputBackground: '#374151',
                  inputBorder: '#4b5563',
                  inputBorderHover: '#6b7280',
                  inputBorderFocus: '#2563eb',
                  inputText: 'white',
                }
              }
            },
            className: {
              container: 'supabase-container',
              label: 'text-gray-400 text-sm font-medium',
              button: 'rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              input: 'rounded-md shadow-sm font-medium',
            }
          }}
          theme="dark"
          providers={['google']}
          redirectTo={`${window.location.origin}/auth/callback`}
          view="sign_up"
          onlyThirdPartyProviders={false}
          magicLink={true}
          showLinks={true}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in ...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Sign up',
                loading_button_label: 'Signing up ...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: "Don't have an account? Sign up",
              },
            },
          }}
        />

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
  )
}

export default RegisterPage 