"use client"

import { motion } from 'framer-motion'

export default function SocialProof() {
  return (
    <section className="py-16 border-t border-border/20 bg-background relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 26 }}
          className="text-center text-lg text-muted-foreground font-sans max-w-xl mx-auto leading-relaxed"
        >
          Purpose-built for track &amp; field coaches and their athletes.
          <br />
          <span className="text-sm">Currently in beta — join the early adopters.</span>
        </motion.p>
      </div>
    </section>
  )
}
