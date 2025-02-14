"use client"

import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function Hero() {
  const sectionMessage = {
    title: "Welcome to your ",
    titleHightlight: "Runner Tracker",
    paragraph: "Description",
  }

  const navigationList = [
    { title: "Primary", href: "#primary", secondary: false },
    { title: "Secondary", href: "#secondary", secondary: true },
  ]

  return (
    <section className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -top-32 -left-32" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-pink-100 to-blue-100 rounded-full blur-3xl opacity-50 -bottom-48 -right-48" />
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
            <h1 className="text-5xl font-bold leading-tight">
              Transform Your Fitness Journey with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}AI-Powered Insights
              </span>
            </h1>
            
            <p className="text-xl text-gray-600">
              Smart training plans, real-time performance tracking, and personalized coaching powered by artificial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="gap-2 group">
                Start Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
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
            className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-xl"
          >
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20" />
            <div className="relative h-full flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mix-blend-multiply opacity-20 blur-3xl" />
              <img 
                src="/hero-illustration.png" 
                alt="Fitness Analytics" 
                className="absolute w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}