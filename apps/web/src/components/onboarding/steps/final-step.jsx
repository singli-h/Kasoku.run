"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"

export default function FinalStep({ userData, onComplete }) {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white">
          You&apos;re All Set!
        </h2>
        <p className="text-lg text-white/70">
          Your account has been created successfully
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="p-6 rounded-lg border bg-white/5 border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Account Summary</h3>
          <div className="space-y-3">
            <div>
              <p className="text-white/70">Name</p>
              <p className="text-white font-medium">{userData.firstName} {userData.lastName}</p>
            </div>
            <div>
              <p className="text-white/70">Plan</p>
              <p className="text-white font-medium">{userData.plan || "Basic"}</p>
            </div>
            {userData.role === "athlete" && (
              <div>
                <p className="text-white/70">Goals</p>
                <p className="text-white font-medium">{userData.sprintGoals}</p>
              </div>
            )}
            {userData.role === "coach" && (
              <>
                <div>
                  <p className="text-white/70">Specialization</p>
                  <p className="text-white font-medium">{userData.specialization}</p>
                </div>
                <div>
                  <p className="text-white/70">Experience</p>
                  <p className="text-white font-medium">{userData.experience}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </div>
  )
} 