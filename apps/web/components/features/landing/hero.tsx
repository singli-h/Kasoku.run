"use client"

import { motion, useReducedMotion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function Hero() {
  const { isSignedIn } = useAuth()
  const prefersReducedMotion = useReducedMotion()

  // Spring animation transition settings
  const springTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 100, damping: 15 }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      }
    }
  }

  const wordVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springTransition
    }
  }

  return (
    <section className="relative overflow-hidden bg-background h-screen flex flex-col items-center pt-32 pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.2 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface shadow-sm text-sm font-medium text-muted-foreground tracking-wide font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
              Beta &middot; Track & Field
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-heading text-6xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-foreground"
          >
            <motion.span variants={wordVariants} className="inline-block mr-4">Accelerate</motion.span>
            <br />
            <motion.span variants={wordVariants} className="inline-block mr-4">Your</motion.span>
            <motion.span variants={wordVariants} className="inline-block text-primary">Training</motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.8 }}
            className="mt-8 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans"
          >
            Periodization that adapts to your athletes.<br /> Built for coaches who demand precision.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 1.0 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {isSignedIn ? (
              <Button asChild size="lg" variant="rose" className="h-14 px-8 text-base font-body tracking-wide rounded-full">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="rose" className="h-14 px-8 text-base font-body tracking-wide rounded-full">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="ghost" className="h-14 px-8 text-base font-body tracking-wide rounded-full border border-border/50 hover:border-primary/50 transition-colors">
              <Link href="#features">
                See How It Works
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Abstract SVG Track Lines with Continuous Acceleration Ambient Motion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="absolute bottom-0 left-0 w-full h-full opacity-60 mix-blend-screen" viewBox="0 0 1920 1080" fill="none" preserveAspectRatio="xMidYMax slice">

            {/* Base Lines (Static after draw-in) */}
            <motion.path d="M -100 1080 C 400 1080, 800 600, 1920 0" stroke="hsl(0 0% 12%)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeOut" }} />
            <motion.path d="M -100 1120 C 450 1120, 850 630, 1920 30" stroke="hsl(0 0% 12%)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "easeOut", delay: 0.1 }} />
            <motion.path d="M -100 1200 C 550 1200, 950 690, 1920 90" stroke="hsl(0 0% 12%)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.6, ease: "easeOut", delay: 0.3 }} />
            <motion.path d="M -100 1160 C 500 1160, 900 660, 1920 60" stroke="#6366F1" strokeOpacity="0.3" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: "easeOut", delay: 0.2 }} />

            {/* Continuous Pulse Animations (Representing acceleration/momentum) */}
            <motion.path d="M -100 1080 C 400 1080, 800 600, 1920 0" stroke="white" strokeWidth="1.5" style={{ filter: "blur(1px)" }}
              initial={{ pathLength: 0.1, pathOffset: 0, opacity: 0 }} animate={{ pathOffset: [0, 1], opacity: [0, 0.4, 0.4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0 }} />

            <motion.path d="M -100 1120 C 450 1120, 850 630, 1920 30" stroke="white" strokeWidth="1.5" style={{ filter: "blur(1px)" }}
              initial={{ pathLength: 0.08, pathOffset: 0, opacity: 0 }} animate={{ pathOffset: [0, 1], opacity: [0, 0.3, 0.3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1.5 }} />

            <motion.path d="M -100 1200 C 550 1200, 950 690, 1920 90" stroke="white" strokeWidth="1.5" style={{ filter: "blur(1px)" }}
              initial={{ pathLength: 0.12, pathOffset: 0, opacity: 0 }} animate={{ pathOffset: [0, 1], opacity: [0, 0.2, 0.2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 0.5 }} />

            {/* Electric Indigo Energy Pulse */}
            <motion.path d="M -100 1160 C 500 1160, 900 660, 1920 60" stroke="#6366F1" strokeWidth="4"
              style={{ filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)) blur(1px)" }}
              initial={{ pathLength: 0.15, pathOffset: 0, opacity: 0 }}
              animate={{ pathOffset: [0, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 1 }} />
          </svg>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  )
}
