"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function Hero() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background: subtle dot grid + warm gradient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-orange-500/[0.06] dark:bg-orange-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Beta badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.06] dark:bg-orange-500/[0.1] text-sm font-medium text-orange-600 dark:text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Now in Beta
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground"
          >
            Accelerate
            <br />
            <span className="text-orange-500">Your Training</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered workout logging, periodized training plans, and real-time
            coaching — built for athletes and coaches who take training seriously.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 gap-2 group h-12 text-base">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 gap-2 group h-12 text-base">
                  Join the Beta
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            )}
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                See Features
              </Button>
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <span>Free during beta</span>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
            <span>AI-powered</span>
            <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
            <span>For athletes &amp; coaches</span>
          </motion.div>
        </div>
      </div>

      {/* Bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  )
}
