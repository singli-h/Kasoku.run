"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function CompletionStep({ onComplete }) {
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

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="pt-4"
      >
        <Button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  )
}
 