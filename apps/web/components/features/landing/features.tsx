"use client"

import { motion } from 'framer-motion'
import { Activity, Brain, Calendar, ChartLine, Clock, Users, LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI-Powered Training Plans",
    description: "Get personalized workout plans that adapt to your progress and goals using advanced machine learning algorithms."
  },
  {
    icon: ChartLine,
    title: "Real-time Performance Tracking",
    description: "Monitor your progress with detailed analytics, insights, and performance metrics in real-time."
  },
  {
    icon: Calendar,
    title: "Smart Periodization",
    description: "Optimize your training cycles with intelligent workout scheduling and load management."
  },
  {
    icon: Activity,
    title: "Health Monitoring",
    description: "Track vital metrics like heart rate, recovery, and training load to prevent overtraining."
  },
  {
    icon: Clock,
    title: "Automated Progression",
    description: "Experience systematic progression in your training with auto-adjusted workout intensities."
  },
  {
    icon: Users,
    title: "Coach Integration",
    description: "Seamlessly collaborate with your coach or train independently with AI guidance."
  }
]

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  index: number
}

const FeatureCard = ({ icon: Icon, title, description, index }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative p-6 bg-white dark:bg-card rounded-2xl shadow-xl dark:shadow-2xl hover:shadow-2xl dark:hover:shadow-3xl transition-shadow duration-300 border border-transparent dark:border-border/50"
    >
      <div className="absolute -top-4 -left-4 p-3 bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 rounded-xl shadow-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{title}</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-900 dark:text-gray-100"
          >
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {" "}Optimal Training
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Everything you need to optimize your training and achieve your fitness goals
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
} 