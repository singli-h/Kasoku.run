"use client"

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'How does AI-powered training work?',
    answer: 'Kasoku uses AI to help you build and modify training plans through natural conversation. During a workout, you can chat with the AI assistant to add exercises, swap movements, or adjust sets and reps in real-time. The AI understands training principles and adapts suggestions to your context.',
  },
  {
    question: 'Can I use Kasoku with my existing coach?',
    answer: 'Yes. Kasoku supports coach-athlete relationships natively. Your coach can create training programs, assign them to you, and monitor your progress. Athletes log workouts and the data flows back to the coach in real-time. Both roles work within the same platform.',
  },
  {
    question: 'What sports and training types are supported?',
    answer: 'Kasoku supports strength training, running, sprinting, and general athletic training. It includes Freelap timing integration for sprint athletes, periodized training blocks for structured programs, and a comprehensive exercise library. The platform is designed to handle any training that involves sets, reps, or timed efforts.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. We use Supabase for our backend infrastructure with row-level security policies. Your training data is private by default — coaches can only see data from athletes who have explicitly connected with them.',
  },
  {
    question: 'What devices can I use Kasoku on?',
    answer: 'Kasoku is a web application that works on any modern browser — desktop, tablet, or mobile. It is built as a progressive web app (PWA), so you can install it on your home screen for a native app-like experience on iOS and Android.',
  },
  {
    question: 'Is Kasoku free during the beta?',
    answer: 'Yes. Kasoku is completely free during the beta period. All features are available to beta users at no cost. We are focused on building the best training platform possible and your feedback during the beta is invaluable.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-sm font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-3"
            >
              FAQ
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
            >
              Common questions
            </motion.h2>
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-foreground">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? 'auto' : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
