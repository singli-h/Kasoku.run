"use client"

import React, { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion'
import type { Transition } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

/* ── Filled chevron paths — solid triangles, not thin strokes ── */
const CHEVRON_LG = 'M 0 1 L 12 8 L 0 15 Z'   // 12×15
const CHEVRON_MD = 'M 0 0.5 L 8 5 L 0 9.5 Z'  // 8×10
const CHEVRON_SM = 'M 0 0.5 L 5 3.5 L 0 6.5 Z' // 5×7

/* ── Pattern tile widths — animation loops by exactly this distance ── */
const TILE_BACK = 160
const TILE_MID = 200
const TILE_FRONT = 240

/* ── Manga speed streak positions [x, y, width, height] ── */
const STREAK_TILE_W = 600
const STREAK_TILE_H = 360

/* Primary: foreground-colored, raw kinetic energy */
const STREAKS_A: number[][] = [
  [0, 18, 140, 1.5],
  [200, 52, 80, 1],
  [80, 88, 220, 2],
  [340, 130, 55, 1],
  [160, 168, 180, 1.5],
  [20, 210, 100, 2.5],
  [400, 250, 130, 1],
  [120, 290, 60, 1.5],
  [480, 335, 90, 1],
  [50, 150, 40, 1],
  [520, 72, 70, 1.5],
  [280, 310, 160, 2],
]

/* Accent: indigo brand marks, sparser */
const STREAKS_B: number[][] = [
  [40, 45, 200, 2],
  [300, 120, 120, 1.5],
  [100, 200, 260, 2.5],
  [420, 270, 90, 1.5],
  [180, 330, 150, 2],
]

/* ── Flowing chevron layer ── */
function ChevronStream({
  id,
  chevron,
  tileW,
  tileH,
  chevronFill,
  opacity,
  speed,
  prefersReducedMotion,
}: {
  id: string
  chevron: string
  tileW: number
  tileH: number
  chevronFill: string
  opacity: number
  speed: number
  prefersReducedMotion: boolean | null
}) {
  return (
    <motion.div
      className="absolute inset-[-40%] w-[180%] h-[180%]"
      style={{ transform: 'rotate(-12deg)' }}
      animate={
        prefersReducedMotion
          ? undefined
          : { x: [0, tileW] }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { repeat: Infinity, duration: speed, ease: 'linear' }
      }
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={id}
            x="0"
            y="0"
            width={tileW}
            height={tileH}
            patternUnits="userSpaceOnUse"
          >
            {/* Primary chevron */}
            <path d={chevron} fill={chevronFill} opacity={opacity} />
            {/* Offset second chevron for richer density */}
            <path
              d={chevron}
              fill={chevronFill}
              opacity={opacity * 0.6}
              transform={`translate(${tileW * 0.55}, ${tileH * 0.45})`}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </motion.div>
  )
}

/* ── Manga-style speed streaks — tapered brush-stroke lines ── */
function SpeedStreaks({
  id,
  streaks,
  tileW,
  tileH,
  color,
  opacity,
  speed,
  prefersReducedMotion,
}: {
  id: string
  streaks: number[][]
  tileW: number
  tileH: number
  color: string
  opacity: number
  speed: number
  prefersReducedMotion: boolean | null
}) {
  return (
    <motion.div
      className="absolute inset-[-20%] w-[140%] h-[140%]"
      animate={
        prefersReducedMotion
          ? undefined
          : { x: [0, tileW] }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { repeat: Infinity, duration: speed, ease: 'linear' }
      }
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Brush-stroke taper: bold start → fades to nothing */}
          <linearGradient id={`${id}-taper`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="5%" stopColor={color} stopOpacity={String(opacity)} />
            <stop offset="40%" stopColor={color} stopOpacity={String(opacity)} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <pattern
            id={id}
            x="0"
            y="0"
            width={tileW}
            height={tileH}
            patternUnits="userSpaceOnUse"
          >
            {streaks.map((s, i) => (
              <rect
                key={i}
                x={s[0]}
                y={s[1]}
                width={s[2]}
                height={s[3]}
                rx={s[3] / 2}
                fill={`url(#${id}-taper)`}
              />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </motion.div>
  )
}

export default function Hero() {
  const { isSignedIn } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLElement>(null)

  // ── Scroll tracking ──
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const smoothScroll = useSpring(scrollYProgress, { damping: 20, stiffness: 100 })

  // ── Fade entire background as hero scrolls out ──
  const bgOpacity = useTransform(smoothScroll, [0, 0.75, 1], [1, 0.6, 0])

  // ── Animation settings ──
  const springTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 100, damping: 15 }

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
      {/* ════════════════════════════════════════════════════
          ACCELERATION STREAM — behind all content
          4 layers of filled chevrons flowing rightward
          at aggressive speeds — parallax depth illusion.
         ════════════════════════════════════════════════════ */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        aria-hidden="true"
        style={{ opacity: prefersReducedMotion ? 0.5 : bgOpacity }}
      >
        {/* Subtle center glow — draws eye to headline */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-[100%] bg-primary/5 blur-[100px]" />

        {/* Radial vignette — fades chevrons at edges */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 55% 50% at 50% 42%, transparent 0%, hsl(var(--background)) 100%)',
          }}
        />

        {/* Back layer — small, fast, faint */}
        <ChevronStream
          id="chv-back"
          chevron={CHEVRON_SM}
          tileW={TILE_BACK}
          tileH={100}
          chevronFill="hsl(var(--foreground))"
          opacity={0.03}
          speed={8}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Mid layer — medium, aggressive */}
        <ChevronStream
          id="chv-mid"
          chevron={CHEVRON_MD}
          tileW={TILE_MID}
          tileH={120}
          chevronFill="hsl(var(--foreground))"
          opacity={0.045}
          speed={5}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Front layer — large, fastest, most visible */}
        <ChevronStream
          id="chv-front"
          chevron={CHEVRON_LG}
          tileW={TILE_FRONT}
          tileH={140}
          chevronFill="hsl(var(--foreground))"
          opacity={0.055}
          speed={3}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Accent layer — sparse indigo brand marks */}
        <ChevronStream
          id="chv-accent"
          chevron={CHEVRON_LG}
          tileW={320}
          tileH={220}
          chevronFill="hsl(var(--primary))"
          opacity={0.1}
          speed={6}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* ── Manga speed streaks — raw kinetic energy ── */}
        {/* Primary streaks — fast, thin, foreground */}
        <SpeedStreaks
          id="spd-primary"
          streaks={STREAKS_A}
          tileW={STREAK_TILE_W}
          tileH={STREAK_TILE_H}
          color="hsl(var(--foreground))"
          opacity={0.08}
          speed={2}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Accent streaks — indigo, slightly slower */}
        <SpeedStreaks
          id="spd-accent"
          streaks={STREAKS_B}
          tileW={STREAK_TILE_W}
          tileH={STREAK_TILE_H}
          color="hsl(var(--primary))"
          opacity={0.12}
          speed={3}
          prefersReducedMotion={prefersReducedMotion}
        />
      </motion.div>

      {/* Content — above background */}
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
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.8 }}
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
