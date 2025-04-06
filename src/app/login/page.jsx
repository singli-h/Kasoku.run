"use client"

import Image from "next/image"
import Link from "next/link"

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
          <h2 className="text-3xl font-bold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
              Sign up
            </Link>
          </p>
        </div>

        {/* Clerk authentication UI will be implemented here */}
        <div className="mt-8 p-4 bg-gray-700 rounded-md text-center">
          <p className="text-gray-300">
            Clerk authentication will be implemented here
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
