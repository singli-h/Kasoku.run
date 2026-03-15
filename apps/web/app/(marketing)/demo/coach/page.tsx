"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Lightbulb } from "lucide-react"

const spring = { type: "spring" as const, stiffness: 170, damping: 26 }

interface Step {
  title: string
  description: string
  screenshots: string[]
  tip?: string
}

const STEPS: Step[] = [
  {
    title: "Create Your Account",
    description:
      "Set up your coaching profile with your specializations, experience level, and sport focus.",
    screenshots: [
      "/demo/coach/02-onboarding-role.png",
      "/demo/coach/03-onboarding-coach-details.png",
    ],
  },
  {
    title: "Land on Your Dashboard",
    description:
      "Your coaching hub shows this week's training overview, today's sessions, and active plans at a glance.",
    screenshots: ["/demo/coach/06-dashboard-empty.png"],
  },
  {
    title: "Organize Your Team",
    description:
      "Create training groups, define subgroups by event specialization, and invite athletes.",
    screenshots: [
      "/demo/coach/08-athletes-empty.png",
      "/demo/coach/11-subgroup-manager.png",
    ],
  },
  {
    title: "Explore the Exercise Library",
    description:
      "Browse 300+ pre-loaded exercises or create your own. Filter by type — sprints, drills, gym work, and more.",
    screenshots: ["/demo/coach/14-library-browse.png"],
  },
  {
    title: "Import Training Programs with AI",
    description:
      "Paste any training program text and AI automatically parses it into structured exercises with sets, reps, and rest times.",
    screenshots: [
      "/demo/coach/17-ai-parse-input.png",
      "/demo/coach/18-ai-parse-preview.png",
    ],
    tip: "The AI recognizes sprint-specific notation like distances, percentages, and rest intervals.",
  },
  {
    title: "Build Reusable Templates",
    description:
      "Save parsed programs as templates. Sections like warm-up and cool-down are automatically saved for reuse.",
    screenshots: [
      "/demo/coach/19-ai-parse-resolved.png",
      "/demo/coach/20-template-saved.png",
    ],
  },
  {
    title: "Plan Your Season",
    description:
      "Create a season plan with auto-generated training phases — GPP, SPP, Competition, and Taper.",
    screenshots: [
      "/demo/coach/22-season-wizard.png",
      "/demo/coach/23-season-phases.png",
    ],
  },
  {
    title: "Manage Your Training Workspace",
    description:
      "Navigate phases, add weekly microcycles, and filter sessions by subgroup. Everything connects.",
    screenshots: ["/demo/coach/24-plan-workspace.png"],
  },
]

export default function CoachDemoPage() {
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = (delay = 0) => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { margin: "-40px" as const },
        transition: { duration: 0 },
      }
    }
    return {
      initial: { opacity: 0, y: 18 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-40px" as const },
      transition: { ...spring, delay },
    }
  }

  const fadeSlide = (delay = 0, direction: "left" | "right" = "left") => {
    const x = direction === "left" ? -24 : 24
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1, x: 0 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { margin: "-40px" as const },
        transition: { duration: 0 },
      }
    }
    return {
      initial: { opacity: 0, x },
      whileInView: { opacity: 1, x: 0 },
      viewport: { once: true, margin: "-40px" as const },
      transition: { ...spring, delay },
    }
  }

  return (
    <div className="bg-background">
      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center pt-28 pb-16 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary blur-[130px] opacity-[0.08] -top-40 left-1/2 -translate-x-1/2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-muted-foreground font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            Coach Walkthrough
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="relative z-10 mt-6 font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.06]"
        >
          Your First Day
          <br />
          <span className="text-primary">as a Kasoku Coach.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          className="relative z-10 mt-5 text-base sm:text-lg text-muted-foreground max-w-sm mx-auto font-sans leading-relaxed"
        >
          From signup to your first training plan in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.5 }}
          className="relative z-10 mt-8"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Start Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ════════ WALKTHROUGH STEPS ════════ */}
      {STEPS.map((step, i) => {
        const stepNum = i + 1
        const isOdd = stepNum % 2 !== 0
        const hasAltBg = !isOdd

        return (
          <section
            key={stepNum}
            className={`py-16 sm:py-24 border-t border-border/20 ${hasAltBg ? "bg-surface/30" : ""}`}
          >
            <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
              <div
                className={`flex flex-col gap-10 lg:gap-14 ${
                  isOdd
                    ? "lg:flex-row"
                    : "lg:flex-row-reverse"
                } lg:items-center`}
              >
                {/* Text side */}
                <motion.div
                  {...fadeSlide(0, isOdd ? "left" : "right")}
                  className="lg:w-[38%] shrink-0"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-sm font-mono font-bold text-primary">
                      {stepNum}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Step {stepNum}
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
                    {step.description}
                  </p>

                  {step.tip && (
                    <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-heading font-semibold text-amber-400">
                          Coach Tip
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed pl-6">
                        {step.tip}
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Screenshots side */}
                <motion.div
                  {...fadeSlide(0.1, isOdd ? "right" : "left")}
                  className={`lg:w-[62%] ${
                    step.screenshots.length > 1
                      ? "flex flex-col gap-4"
                      : ""
                  }`}
                >
                  {step.screenshots.map((src) => (
                    <div
                      key={src}
                      className="rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card"
                    >
                      <Image
                        src={src}
                        alt={`${step.title} screenshot`}
                        width={1280}
                        height={720}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ════════ CTA ════════ */}
      <section className="py-16 sm:py-24 border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-md text-center">
          <motion.div {...fadeUp()}>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Ready to get started?
            </h2>
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              Set up your coaching workspace in under 10 minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 rounded-full border border-border bg-surface text-foreground font-body font-semibold text-sm hover:bg-accent/50 transition-colors"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="h-10" />
    </div>
  )
}
