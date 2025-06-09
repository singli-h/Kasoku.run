"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function Hero() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-50 dark:opacity-30 -top-32 -left-32" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-50 dark:opacity-30 -bottom-48 -right-48" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl font-bold leading-tight text-gray-900 dark:text-gray-100">
              Transform Your Fitness Journey with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {" "}AI-Powered Insights
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Smart training plans, real-time performance tracking, and personalized coaching powered by artificial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button className="gap-2 group">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button className="gap-2 group">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                See Features
              </Button>
            </div>
          </motion.div>

          {/* Visual element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-3xl p-8 shadow-xl dark:shadow-2xl"
          >
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 dark:border-white/10" />
            <div className="relative h-full flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 rounded-full mix-blend-multiply dark:mix-blend-normal opacity-20 dark:opacity-30 blur-3xl" />
              <Image 
                src="/logo.svg" 
                alt="Kasoku Logo" 
                className="absolute w-full h-full object-contain dark:brightness-110"
                width={512}
                height={512}
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 