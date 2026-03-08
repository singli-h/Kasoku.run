"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function About() {
  return (
    <section id="about" className="py-20 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-foreground">
              Transforming Athletes with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {" "}AI Technology
              </span>
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              We&apos;re on a mission to revolutionize athletic training by combining cutting-edge AI technology with proven sports science principles.
            </p>
            <p className="mt-4 text-muted-foreground">
              Our platform adapts to your unique needs, providing personalized training plans that evolve as you progress. Whether you&apos;re a beginner or a professional athlete, we&apos;re here to help you achieve your peak performance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 rounded-3xl transform rotate-6 blur-lg opacity-30 dark:opacity-20" />
            <div className="relative bg-card rounded-3xl shadow-xl overflow-hidden border border-border/50">
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  src="/hero.png"
                  alt="About Kasoku"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                  <div className="text-sm font-medium text-foreground">Built for serious training</div>
                  <div className="mt-1 text-sm text-muted-foreground">Periodized plans, real-time workout tracking, and coach-athlete collaboration powered by AI</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 