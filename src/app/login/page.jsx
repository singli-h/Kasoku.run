"use client"

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

const LoginPage = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectTo') || '/dashboard';

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
        </div>

        <div className="p-4">
          <SignIn 
            routing="path" 
            path="/login" 
            signUpUrl="/register" 
            redirectUrl={redirectUrl}
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                borderRadius: '0.375rem',
              },
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white text-3xl font-bold',
                headerSubtitle: 'text-gray-400',
                formFieldLabel: 'text-gray-300',
                footerActionText: 'text-gray-400',
                footerActionLink: 'text-blue-500 hover:text-blue-400',
                dividerText: 'text-gray-400',
                dividerLine: 'bg-gray-600',
                formFieldInput: 'bg-gray-700 border border-gray-600 text-white rounded-md',
                alert: 'bg-red-500/10 border border-red-500/20 text-red-500',
                formFieldError: 'text-red-500 text-sm'
              }
            }}
          />
        </div>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
              Create one
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-4">
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
  );
};

export default LoginPage;
