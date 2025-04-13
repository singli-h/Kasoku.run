"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useUser, useAuth } from "@clerk/nextjs"

export default function CompletionStep({ onComplete }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const { user } = useUser()
  const { userId } = useAuth()
  
  // Debug Clerk user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('Clerk user data available in completion step:', {
        userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress?.emailAddress,
        hasEmail: !!user.primaryEmailAddress?.emailAddress
      })
    } else {
      console.error('No Clerk user data available in completion step')
    }
  }, [user, userId])

  const handleComplete = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      
      console.log('Completion step: Starting onboarding completion')
      
      // Call the onComplete callback first and wait for it to finish
      if (onComplete) {
        await onComplete()
      }
      
      console.log('Completion step: Onboarding data submitted successfully')
      setSuccessMessage('Onboarding completed successfully. Data has been saved, but redirect is disabled for debugging purposes.')
      
      // Force a hard reload to clear any cached states
      // Commented out for debugging
      // window.location.href = '/planner'
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError('Failed to complete onboarding. Please try again. Error: ' + (error.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          You&apos;re All Set!
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Your profile is ready. Let&apos;s start your running journey.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-md mx-auto bg-gray-50 dark:bg-slate-900 p-6 rounded-lg"
      >
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          What&apos;s Next?
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 text-left space-y-2">
          <li>• Explore your personalized dashboard</li>
          <li>• Set up your first running goal</li>
          <li>• Connect with other runners</li>
          <li>• Track your progress</li>
        </ul>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
        >
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="pt-4 flex justify-center"
      >
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8 py-3 relative"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Go to Dashboard'
          )}
        </Button>
      </motion.div>
    </div>
  )
}
 