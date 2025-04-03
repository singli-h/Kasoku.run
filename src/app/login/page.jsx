"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Image from "next/image"
import Button from "../../components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const LoginPage = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState({
    google: false,
    email: false
  })
  const [error, setError] = useState("")

  const handleProviderSignIn = async (provider) => {
    setError("")
    setIsLoading(prev => ({ ...prev, [provider]: true }))
    try {
      const result = await signIn(provider, {
        callbackUrl: "/dashboard",
        redirect: false,
      })
      
      if (result?.error) {
        setError("Failed to sign in. Please try again.")
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error signing in:", error)
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(prev => ({ ...prev, email: true }))
    const email = e.target.email.value

    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      })

      if (result?.error) {
        setError("Failed to send login link. Please check your email and try again.")
      } else {
        setError("Success! Check your email for the login link.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Error signing in with email:", error)
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }))
    }
  }

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

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleProviderSignIn("google")}
            disabled={isLoading.google}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading.google ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
{/* not implemented yet
          <button
            onClick={() => handleProviderSignIn("apple")}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M17.05,11.97 C17.0368914,10.2609167 18.4014164,9.24274001 18.4711334,9.19793651 C17.4746164,7.77451407 15.9473473,7.54583794 15.4273473,7.52636127 C14.1081779,7.38687785 12.8347914,8.33117972 12.1641334,8.33117972 C11.4789164,8.33117972 10.4244164,7.54421127 9.30766445,7.56693794 C7.83741445,7.58804001 6.47866445,8.43714001 5.72341445,9.78901407 C4.15316445,12.5453974 5.31366445,16.5822641 6.82341445,18.7372641 C7.56991445,19.7937807 8.44991445,20.9734474 9.61991445,20.9328307 C10.7644164,20.8890474 11.1869164,20.2067807 12.5619164,20.2067807 C13.9216584,20.2067807 14.3149164,20.9328307 15.5166584,20.9063974 C16.7509164,20.8859167 17.5166584,19.8400474 18.2416584,18.7729167 C19.1166584,17.5432641 19.4711334,16.3397807 19.4899164,16.2828307 C19.4524164,16.2706474 17.0849164,15.3209167 17.05,11.97 L17.05,11.97 Z M14.8591334,6.05901407 C15.4741334,5.29901407 15.8899164,4.24636127 15.7674164,3.20001407 C14.8711334,3.24058794 13.7674164,3.82901407 13.1274164,4.56901407 C12.5599164,5.22058794 12.0549164,6.30479001 12.1966584,7.31901407 C13.1966584,7.39901407 14.2149164,6.79901407 14.8591334,6.05901407 L14.8591334,6.05901407 Z"
              />
            </svg>
            Sign in with Apple
          </button>
*/}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading.email}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white disabled:opacity-50"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading.email}
            >
              {isLoading.email ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Sign in with Email"
              )}
            </Button>
          </form>
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
