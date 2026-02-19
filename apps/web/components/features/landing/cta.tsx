"use client"

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function CTA() {
  const { isSignedIn } = useAuth()

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700" />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
      
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
        <div className="absolute w-64 h-64 bg-white/5 rounded-full blur-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Now in Beta
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Ready to Transform
            <br />
            Your Training?
          </motion.h2>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto"
          >
            Start building smarter training plans with AI-powered periodization and real-time workout tracking
          </motion.p>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <span className="font-medium">Instant Setup</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-medium">Free Plan Available</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <span className="font-medium">Cancel Anytime</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
                              <Link href="/sign-up">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Platform Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 pt-8 border-t border-white/20"
          >
            <p className="text-white/70 text-sm mb-4">Built for athletes and coaches</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-white font-semibold">Periodized Plans</div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="text-white font-semibold">Coach Dashboard</div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="text-white font-semibold">AI Powered</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 