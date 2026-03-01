"use client"

import { motion } from 'framer-motion'
import {
  Bot,
  Dumbbell,
  Calendar,
  Timer,
  Trophy,
  BookOpen,
  Zap,
  LineChart,
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
    <section id="features" className="py-32 bg-background border-t border-border/20 z-10 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — left-aligned for editorial feel */}
        <div className="max-w-2xl mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 26 }}
            className="font-heading text-4xl sm:text-5xl font-semibold text-foreground tracking-tight"
          >
            What makes Kasoku different
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 170, damping: 26, delay: 0.08 }}
            className="mt-6 text-xl text-muted-foreground font-sans max-w-[680px]"
          >
            A training platform built by coaches,<br />for coaches and their athletes.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-80px" }}
                transition={{ type: "spring", stiffness: 170, damping: 26, delay: index * 0.06 }}
                className="group p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="mb-6 relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl translate-y-1" />
                  <div className="relative rounded-xl bg-surface p-2.5 border border-border/50 shadow-sm">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed font-sans">
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
          transition={{ type: "spring", stiffness: 170, damping: 26, delay: 0.3 }}
          className="mt-20 flex flex-col md:flex-row rounded-2xl overflow-hidden border border-border/50 bg-surface"
        >
          {/* For Athletes */}
          <div className="flex-1 p-10 border-b md:border-b-0 md:border-r border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Athlete Icon */}
            <div className="absolute -top-6 -right-6 w-32 h-32 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none flex items-center justify-center transform rotate-12" aria-hidden="true">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
              <Zap className="w-24 h-24 text-primary relative z-10" />
            </div>

            <h3 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-3 relative z-10">
              I'm an Athlete
              <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
            </h3>
            <ul className="space-y-4 text-muted-foreground font-sans relative z-10">
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Track every rep effortlessly</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> See your progress in real-time</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Beat your personal bests</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Get AI coaching suggestions</li>
            </ul>
          </div>

          {/* For Coaches */}
          <div className="flex-1 p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Coach Icon */}
            <div className="absolute -top-6 -right-6 w-32 h-32 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none flex items-center justify-center transform -rotate-12" aria-hidden="true">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
              <LineChart className="w-24 h-24 text-primary relative z-10" />
            </div>

            <h3 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-3 relative z-10">
              I'm a Coach
              <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
            </h3>
            <ul className="space-y-4 text-muted-foreground font-sans relative z-10">
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Build periodized plans visually</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Monitor your entire roster at once</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Make data-driven training decisions</li>
              <li className="flex items-start gap-3"><span className="text-primary mt-1">&bull;</span> Communicate seamlessly with athletes</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
