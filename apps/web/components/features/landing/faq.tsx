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
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 26, delay: 0.05 }}
              className="font-heading text-4xl sm:text-5xl font-semibold text-foreground tracking-tight"
            >
              Frequently asked questions
            </motion.h2>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 170, damping: 26, delay: index * 0.08 }}
                  className="border-b border-border/50 bg-background"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full py-6 text-left flex items-start justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="mt-1"
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.div>
                  </button>

                  <motion.div
                    id={`faq-answer-${index}`}
                    role="region"
                    initial={false}
                    animate={{
                      height: isOpen ? 'auto' : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 170, damping: 26 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 pr-8">
                      <p className="text-base text-muted-foreground leading-relaxed font-sans">
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
