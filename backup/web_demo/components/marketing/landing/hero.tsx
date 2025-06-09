/*
<ai_context>
This client component provides the hero section for the landing page for GuideLayer AI, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronRight, MessageSquareText, Play, Users, BrainCircuit } from "lucide-react"
import Link from "next/link"
import posthog from "posthog-js"
import Image from "next/image"

export const HeroSection = () => {
  const handleGetStartedClick = () => {
    posthog.capture("clicked_get_started")
  }

  const featuredLogos = [
    "https://cdn.prod.website-files.com/63adcdf69738009a0bd71e08/6536cc52a12184974f96d614_ecommerce-tech%20logo.webp",
    "https://cdn.prod.website-files.com/63adcdf69738009a0bd71e08/6536cc77fb4a22d910198ef4_gorgias-logo.webp",
    "https://cdn.prod.website-files.com/63adcdf69738009a0bd71e08/6536cc778fec3429c40e51de_convertcart-logo.webp",
    "https://cdn.prod.website-files.com/63adcdf69738009a0bd71e08/6532cbf1de8fd495a36b6d70_shopify%402x.png.webp",
    "https://cdn.prod.website-files.com/63adcdf69738009a0bd71e08/6532cbf1de8fd495a36b6d62_magento%402x.png.webp"
  ]

  return (
    <section className="relative pt-20 pb-16 overflow-hidden bg-white dark:bg-slate-800">
      <div className="container mx-auto px-4">
        {/* Badge and Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-block">
            <Badge variant="secondary" className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
              $500M+ in Direct Revenue, since 2015
            </Badge>
          </div>
        </motion.div>

        {/* Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-5xl lg:text-6xl font-bold text-slate-800 dark:text-slate-100 mb-6 leading-tight"
            >
              AI-Powered{" "}
              <span className="text-blue-600 dark:text-blue-400">Virtual Assistant</span>{" "}
              Solutions That Actually Work
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              We shepherd businesses through AI Transformation by automating & streamlining operations 
              with <span className="font-semibold text-slate-800 dark:text-slate-200">intelligent virtual assistants</span> that "wow!" customers, free up teams, and unlock revenue & profit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/signup"
                onClick={handleGetStartedClick}
              >
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 font-medium"
                >
                  <MessageSquareText className="mr-2 size-5" />
                  Get Started
                </Button>
              </Link>
              <Link href="#demo">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Play className="mr-2 size-4" />
                  See Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative aspect-square rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-8 border border-slate-200 dark:border-slate-600">
              {/* AI Visual Representation */}
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                    <BrainCircuit className="w-16 h-16 text-white" />
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <MessageSquareText className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  GuideLayer® AI
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Smart Staff Supercharged by AI
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Featured Logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="mt-20"
        >
          <div className="text-center mb-8">
            <p className="text-slate-600 dark:text-slate-400 font-medium">As featured on:</p>
          </div>
          
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-8 items-center opacity-60 hover:opacity-80 transition-opacity">
              {featuredLogos.map((logo, index) => (
                <div key={index} className="flex justify-center">
                  <Image
                    src={logo}
                    alt={`Featured logo ${index + 1}`}
                    width={120}
                    height={60}
                    className="h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
