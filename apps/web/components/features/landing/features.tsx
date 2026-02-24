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
}

const features: Feature[] = [
  {
    icon: Bot,
    title: "AI Session Assistant",
    description: "Chat with AI to modify workouts in real-time. Add exercises, swap movements, adjust sets — all through natural conversation.",
  },
  {
    icon: Dumbbell,
    title: "Smart Workout Logging",
    description: "Log every rep, set, and personal record. Track weight, reps, RPE, and notes for complete training documentation.",
  },
  {
    icon: Calendar,
    title: "Periodized Training Blocks",
    description: "Structure training with periodized blocks and weekly plans. Coaches create programs, individuals build their own — with AI assistance.",
  },
  {
    icon: Timer,
    title: "Sprint & Speed Training",
    description: "Built for track athletes with Freelap timing integration. Auto-detect splits, analyze velocity, and track speed progression.",
  },
  {
    icon: Trophy,
    title: "Personal Best Detection",
    description: "Automatically detect new PRs across all exercises. Track historical bests, visualize progress, and never miss a milestone.",
  },
  {
    icon: BookOpen,
    title: "Exercise Library",
    description: "Browse a comprehensive database organized by category, muscle group, and equipment. Add custom exercises for your unique training.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — left-aligned for editorial feel */}
        <div className="max-w-2xl mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-3"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
          >
            Everything you need to train smarter
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Whether you&apos;re self-coaching or working with a trainer, Kasoku adapts to your workflow.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-orange-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Role callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span><strong className="text-foreground">Self-coaching</strong> — Build your own plans with AI guidance</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span><strong className="text-foreground">Coach &amp; Athletes</strong> — Create programs and assign to your team</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
