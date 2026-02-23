"use client"

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function CTA() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative py-24 overflow-hidden bg-foreground dark:bg-card">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-background dark:text-foreground"
          >
            Ready to train smarter?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-background/60 dark:text-muted-foreground"
          >
            Join the beta and start building better training plans today.
            Free for all beta users.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 gap-2 group h-12 text-base"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 gap-2 group h-12 text-base"
                >
                  Join the Beta
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
