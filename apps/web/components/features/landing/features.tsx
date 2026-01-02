"use client"

import { motion } from 'framer-motion'
import {
  Bot,
  Dumbbell,
  Calendar,
  Timer,
  Trophy,
  BookOpen,
  LucideIcon
} from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  highlight?: string
}

const features: Feature[] = [
  {
    icon: Bot,
    title: "AI Session Assistant",
    description: "Chat with your AI training partner to modify workouts in real-time. Add exercises, swap movements, adjust sets—all through natural conversation.",
    highlight: "Real-time AI"
  },
  {
    icon: Dumbbell,
    title: "Smart Workout Logging",
    description: "Log every rep, set, and personal record with an intuitive interface. Track weight, reps, RPE, and notes for complete training documentation.",
    highlight: "Complete tracking"
  },
  {
    icon: Calendar,
    title: "Training Blocks",
    description: "Structure your training with periodized blocks and weekly plans. Coaches create programs, individuals build their own—all with AI assistance.",
    highlight: "Periodization"
  },
  {
    icon: Timer,
    title: "Sprint & Speed Training",
    description: "Built for track athletes with Freelap timing integration. Auto-detect splits, analyze velocity, and track speed progression over time.",
    highlight: "Timing ready"
  },
  {
    icon: Trophy,
    title: "Personal Best Detection",
    description: "Automatically celebrate new PRs across all exercises. Track historical bests, visualize progress, and never miss a milestone.",
    highlight: "Auto-detect PRs"
  },
  {
    icon: BookOpen,
    title: "Exercise Library",
    description: "Access a comprehensive database of exercises organized by category, muscle group, and equipment. Add custom exercises for your unique training.",
    highlight: "500+ exercises"
  }
]

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  highlight?: string
  index: number
}

const FeatureCard = ({ icon: Icon, title, description, highlight, index }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative p-6 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-primary/30"
    >
      {/* Icon container with gradient */}
      <div className="absolute -top-4 -left-4 p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>

      {/* Highlight badge */}
      {highlight && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground/90">
            {highlight}
          </span>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-xl font-semibold text-foreground mt-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-20 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 mb-6"
          >
            <span className="text-sm font-medium text-primary dark:text-primary-foreground/90">
              Built for Athletes & Coaches
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold text-foreground"
          >
            Train Smarter with
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {" "}AI-Powered Tools
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Whether you're self-coaching or working with a trainer, Kasoku adapts to your workflow with intelligent features that make training effortless.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">For individuals</span>: Create your own Training Blocks with AI guidance.
            {" "}
            <span className="text-foreground font-medium">For coaches</span>: Build programs and assign to athletes.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
