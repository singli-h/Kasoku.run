"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Activity, Users } from "lucide-react"

export default function RoleSelectionStep({ onNext, onPrevious, updateUserData }) {
  const roles = [
    {
      id: "athlete",
      title: "Athlete",
      description: "Track your performance, set goals, and follow training plans",
      icon: Activity,
    },
    {
      id: "coach",
      title: "Coach",
      description: "Manage athletes, analyze performance data, and create training plans",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl font-bold text-white">
          I am a...
        </h2>
        <p className="text-lg text-white/70">
          Select your role to personalize your experience
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid md:grid-cols-2 gap-6"
      >
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card
              key={role.id}
              className={`group p-8 cursor-pointer transition-all duration-300 bg-[#262C3A] hover:bg-[#2E364A] border-2 border-white/[0.08] hover:border-[#2563EB] rounded-xl`}
              onClick={() => {
                updateUserData({ role: role.id })
                onNext()
              }}
            >
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="p-4 bg-[#2563EB]/10 rounded-full ring-2 ring-[#2563EB]/20 group-hover:ring-[#2563EB]/40 transition-all duration-300">
                  <Icon className="w-8 h-8 text-[#2563EB]" />
                </div>
                <div className="space-y-2.5">
                  <h3 className="text-xl font-semibold text-white">
                    {role.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-between pt-4"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 px-8"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-600/20 px-8"
        >
          Continue
        </Button>
      </motion.div>
    </div>
  )
} 