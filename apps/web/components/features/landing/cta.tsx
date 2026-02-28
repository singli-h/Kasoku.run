"use client"

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function CTA() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative py-32 flex flex-col items-center justify-center overflow-hidden bg-background border-t border-border/20 z-10 w-full">
      {/* Subtle radial ambient glow + Converging Lines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, hsl(239 84% 67% / 0.05) 0%, transparent 60%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen" viewBox="0 0 1920 1080" fill="none" preserveAspectRatio="xMidYMid slice">
          {/* Left Converging */}
          <motion.path
            d="M 0 0 C 400 300, 600 450, 960 540"
            stroke="hsl(0 0% 25%)" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <motion.path
            d="M 0 1080 C 400 780, 600 630, 960 540"
            stroke="hsl(0 0% 25%)" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
          />
          {/* Right Converging */}
          <motion.path
            d="M 1920 0 C 1520 300, 1320 450, 960 540"
            stroke="hsl(0 0% 25%)" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
          <motion.path
            d="M 1920 1080 C 1520 780, 1320 630, 960 540"
            stroke="hsl(0 0% 25%)" strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
          {/* Indigo Accent */}
          <motion.path
            d="M 0 540 L 1920 540"
            stroke="#6366F1" strokeWidth="1"
            style={{ filter: "drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))" }}
            initial={{ scaleX: 0, opacity: 0 }} whileInView={{ scaleX: 1, opacity: 1 }} transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-foreground"
          >
            Ready to accelerate?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="mt-6 text-xl text-muted-foreground font-sans"
          >
            Start building smarter training plans today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" variant="rose" className="h-14 px-8 text-base font-body tracking-wide rounded-full">
              {isSignedIn ? (
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
