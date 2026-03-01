"use client"

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion'
import type { Transition } from 'framer-motion'
import ElectricArcs from './electric-arcs'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function Hero() {
  const { isSignedIn } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const smoothScroll = useSpring(scrollYProgress, { damping: 20, stiffness: 100 })
  const bgOpacity = useTransform(smoothScroll, [0, 0.75, 1], [1, 0.6, 0])

  const springTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 170, damping: 26 }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.4 },
    },
  }

  const wordVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: springTransition },
  }

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-background h-screen flex flex-col items-center pt-32 pb-24"
    >
      {/* Background — indigo ambient orbs + grain texture */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
        style={{ opacity: prefersReducedMotion ? 0.5 : bgOpacity }}
      >
        {/* Orb 1 — indigo, top-right, slow drift */}
        <motion.div
          className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] lg:w-[700px] lg:h-[700px] rounded-full bg-indigo-500 blur-[60px] sm:blur-[90px] lg:blur-[115px]"
          style={{ right: '-40px', top: '-60px', opacity: 0.12 }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, 120, -80, 0],
            y: [0, -70, 50, 0],
            scale: [1, 1.08, 0.94, 1],
          }}
          transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
        />

        {/* Orb 2 — indigo, bottom-left, counter-drift */}
        <motion.div
          className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full bg-indigo-600 blur-[50px] sm:blur-[80px] lg:blur-[100px]"
          style={{ left: '-30px', bottom: '-20px', opacity: 0.08 }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, -100, 80, 0],
            y: [0, 60, -90, 0],
            scale: [1, 0.92, 1.1, 1],
          }}
          transition={{ repeat: Infinity, duration: 25, ease: 'easeInOut' }}
        />

        {/* Grain noise — physical surface texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.035] dark:mix-blend-overlay mix-blend-multiply"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="hero-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>
      </motion.div>

      {/* Content */}
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
            <motion.span variants={wordVariants} className="inline-block mr-4">
              <ElectricArcs disabled={!!prefersReducedMotion} />
              <span
                className="hero-electric-text"
                style={prefersReducedMotion ? undefined : { filter: 'url(#electric-crackle)' }}
              >
                Accelerate
              </span>
            </motion.span>
            <br />
            <motion.span variants={wordVariants} className="inline-block mr-4">Your</motion.span>
            <motion.span variants={wordVariants} className="inline-block text-primary">Training</motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 170, damping: 26, delay: 0.8 }}
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
      </div>

    </section>
  )
}
