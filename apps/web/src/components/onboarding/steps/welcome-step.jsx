"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Zap, Shield, Users } from "lucide-react"

export default function WelcomeStep({ onNext }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <Zap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome to Running Website
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Let&apos;s get you set up to start tracking and improving your performance
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto"
      >
        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg text-left">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">For Athletes & Coaches</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalized experiences based on your role, whether you&apos;re training or coaching
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg text-left">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Secure & Private</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your data is protected with enterprise-grade security and privacy controls
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="pt-4 flex justify-center"
      >
        <Button 
          size="lg" 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8 py-3"
        >
          Get Started
        </Button>
      </motion.div>
    </div>
  )
} 