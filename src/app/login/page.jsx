"use client"

import { signIn } from "next-auth/react"
import Button from "../../components/ui/button"

const LoginPage = () => {
  const handleProviderSignIn = async (provider) => {
    try {
      await signIn(provider, {
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    const email = e.target.email.value

    try {
      await signIn("email", {
        email,
        callbackUrl: "/dashboard",
      })
    } catch (error) {
      console.error("Error signing in with email:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <img 
            src="/logo.svg" 
            alt="RunningApp Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
              create a new account
            </a>
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleProviderSignIn("google")}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Sign in with Google
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
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Sign in with Email
            </Button>
          </form>
        </div>

        <div className="mt-6">
          <p className="text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
            <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
