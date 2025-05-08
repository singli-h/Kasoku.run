"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BarChart2, Calendar, Users, Settings, Activity } from "lucide-react"

export default function DashboardTourStep({ onNext, onPrev }) {
  const features = [
    {
      icon: Activity,
      title: "Activity Feed",
      description: "Track your daily runs and workouts in real-time",
    },
    {
      icon: BarChart2,
      title: "Analytics",
      description: "View detailed performance metrics and progress over time",
    },
    {
      icon: Calendar,
      title: "Training Calendar",
      description: "Plan and schedule your upcoming training sessions",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with other runners and share your achievements",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Customize your experience and manage your account",
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your Dashboard Overview
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s what you&apos;ll find in your personalized dashboard
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid gap-4 md:grid-cols-2"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
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
          onClick={onPrev}
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