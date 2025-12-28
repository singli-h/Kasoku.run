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
    <section className="relative overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-3xl opacity-40 -top-32 -left-32 will-change-transform" />
        <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-primary/10 rounded-full blur-3xl opacity-40 -bottom-48 -right-48 will-change-transform" />
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Transform Your Fitness Journey with
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {" "}AI-Powered Insights
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Smart training plans, real-time performance tracking, and personalized coaching powered by artificial intelligence. Join thousands of athletes achieving their goals.
            </p>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>10,000+ Active Athletes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>4.9★ Rating</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button className="gap-2 group">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-up">
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
            className="relative aspect-square bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-3xl p-8 shadow-xl border border-border/50"
          >
            <div className="absolute inset-0 rounded-3xl border border-border/30" />
            <div className="relative h-full flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-primary to-purple-500 rounded-full opacity-20 blur-3xl" />
              <Image
                src="/hero.png"
                alt="Kasoku Hero Image"
                className="absolute w-full h-full object-contain"
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
