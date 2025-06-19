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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-2xl opacity-30 dark:opacity-20 -top-32 -left-32 will-change-transform" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-900/10 dark:to-blue-900/10 rounded-full blur-2xl opacity-30 dark:opacity-20 -bottom-48 -right-48 will-change-transform" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="relative aspect-square bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-3xl p-8 shadow-xl dark:shadow-2xl"
          >
            <div className="absolute inset-0 rounded-3xl border-2 border-white/20 dark:border-white/10" />
            <div className="relative h-full flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 rounded-full mix-blend-multiply dark:mix-blend-normal opacity-20 dark:opacity-30 blur-3xl" />
              <Image 
                src="/hero.png" 
                alt="Kasoku Hero Image" 
                className="absolute w-full h-full object-contain dark:brightness-110"
                width={512}
                height={512}
                priority
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLq4QfHJ2rdvFhm+1KE/tPP4ixnhFrVd2lzaLJd+VTzklnuVd3O32wS4/yIl9cYhQIAqC8MZ+5+3xhX15vwNNGSN3fWJhD+VIYiJZHZlOPYKOfVOgPlI1fkCqelqSpPPLfcrmIwHyblOtqcDNBVWDZeBgYSNSJpCjPRGqZPgz/2Q=="
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 