'use client'

/**
 * Demo Page: First Experience Plan Review
 *
 * Navigation hub for testing different UI options.
 *
 * Route: /demo/first-experience
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Layout, ListOrdered, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const options = [
  {
    id: 'integrated',
    title: 'Integrated Flow (Recommended)',
    description: 'Full wizard: Block Settings \u2192 Week Setup \u2192 AI Review. Seamless transition.',
    href: '/plans/new',
    icon: Layers,
  },
  {
    id: 'option-d',
    title: 'Option D: Vertical Stepper',
    description: 'Standalone review screen with expandable week steps.',
    href: '/demo/first-experience/option-d',
    icon: ListOrdered,
  },
  {
    id: 'option-c',
    title: 'Option C: Segmented Control',
    description: 'Compact pill-style week tabs inside a single card.',
    href: '/demo/first-experience/option-c',
    icon: Layout,
  },
  {
    id: 'original',
    title: 'Original Design',
    description: 'Full-width week carousel with swipe gestures.',
    href: '/demo/first-experience/original',
    icon: Layout,
  },
]

export default function FirstExperienceDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">First Experience Prototypes</h1>
          <p className="text-muted-foreground">
            Choose a UI option to preview the Plan Review flow
          </p>
        </motion.div>

        <div className="space-y-4">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={option.href}>
                <Card className="hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <option.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold mb-0.5">{option.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
