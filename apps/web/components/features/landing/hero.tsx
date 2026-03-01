"use client"

import React, { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion'
import type { Transition } from 'framer-motion'
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
      {/* Background — aurora orbs + dot grid + grain */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
        style={{ opacity: prefersReducedMotion ? 0.5 : bgOpacity }}
      >
        {/* Orb 1 — indigo, top-right, drift */}
        <motion.div
          className="absolute w-[700px] h-[700px] rounded-full bg-indigo-600 blur-[115px]"
          style={{ right: '-60px', top: '-40px', opacity: 0.16 }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, 190, -135, 0],
            y: [0, -110, 90, 0],
            scale: [1, 1.16, 0.88, 1],
          }}
          transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
        />

        {/* Orb 2 — violet, bottom-left, counter-drift */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-violet-600 blur-[100px]"
          style={{ left: '-20px', bottom: '0px', opacity: 0.12 }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, -165, 130, 0],
            y: [0, 100, -140, 0],
            scale: [1, 0.85, 1.17, 1],
          }}
          transition={{ repeat: Infinity, duration: 19, ease: 'easeInOut' }}
        />

        {/* Orb 3 — cyan accent, wanders center */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500 blur-[90px]"
          style={{ left: '50%', bottom: '5%', opacity: 0.07 }}
          animate={prefersReducedMotion ? undefined : {
            x: [0, 110, -90, 0],
            y: [0, -80, 70, 0],
            scale: [1, 1.22, 0.83, 1],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        />

        {/* Dot grid — reads as depth/space, faded via radial mask */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="hsl(var(--foreground))" />
            </pattern>
            <radialGradient id="grid-fade" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="35%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="grid-mask">
              <rect width="100%" height="100%" fill="url(#grid-fade)" />
            </mask>
          </defs>
          <rect
            width="100%" height="100%"
            fill="url(#dot-grid)"
            mask="url(#grid-mask)"
            opacity="0.04"
          />
        </svg>

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
            <motion.span variants={wordVariants} className="inline-block mr-4">Accelerate</motion.span>
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

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent z-20 pointer-events-none" />
    </section>
  )
}
