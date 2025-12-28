"use client"

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How does AI-powered training work?',
    answer: 'Our AI analyzes your performance data, goals, and preferences to create personalized training plans. It continuously adapts based on your progress, recovery status, and feedback to optimize your results while preventing overtraining.'
  },
  {
    id: '2',
    question: 'Can I use Kasoku with my existing coach?',
    answer: 'Absolutely! Kasoku is designed to enhance coach-athlete relationships. Your coach can access your data, modify training plans, and communicate with you through the platform. Many coaches use Kasoku to manage multiple athletes more efficiently.'
  },
  {
    id: '3',
    question: 'What sports and training types are supported?',
    answer: 'Kasoku supports a wide range of activities including strength training, running, cycling, swimming, CrossFit, powerlifting, and more. Our AI adapts to different training methodologies and can handle multi-sport athletes like triathletes.'
  },
  {
    id: '4',
    question: 'How accurate is the performance tracking?',
    answer: 'Our tracking system integrates with popular fitness devices and apps to ensure accurate data collection. The AI uses advanced algorithms to analyze patterns and provide insights that are validated by sports science research.'
  },
  {
    id: '5',
    question: 'Is my data secure and private?',
    answer: 'Yes, we take data security seriously. All data is encrypted in transit and at rest. We comply with GDPR and other privacy regulations. Your personal information is never shared without your explicit consent, and you have full control over your data.'
  },
  {
    id: '6',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. You\'ll continue to have access to your paid features until the end of your current billing period. You can also downgrade to our free plan to keep your data.'
  },
  {
    id: '7',
    question: 'What devices and platforms are supported?',
    answer: 'Kasoku works on web browsers, iOS, and Android devices. We integrate with popular fitness trackers, smartwatches, and apps including Garmin, Fitbit, Apple Health, Google Fit, Strava, and many others.'
  },
  {
    id: '8',
    question: 'How long does it take to see results?',
    answer: 'Most users see improvements in their training consistency and data insights immediately. Performance improvements typically become noticeable within 2-4 weeks as the AI learns your patterns and optimizes your training plan.'
  },
  {
    id: '9',
    question: 'Do you offer team or group plans?',
    answer: 'Yes, we offer special pricing for teams, clubs, and organizations. Team plans include additional features like group analytics, coach dashboards, and administrative tools. Contact us for custom pricing based on your team size.'
  },
  {
    id: '10',
    question: 'What if I need help getting started?',
    answer: 'We provide comprehensive onboarding, tutorial videos, and 24/7 customer support. Pro and Elite users get priority support, and Elite users have access to dedicated account managers for personalized assistance.'
  }
]

interface FAQItemProps {
  faq: FAQItem
  index: number
  isOpen: boolean
  onToggle: () => void
}

const FAQItemComponent = ({ faq, index, isOpen, onToggle }: FAQItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-border rounded-2xl overflow-hidden bg-card"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground pr-4">
            {faq.question}
          </h3>
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4">
          <p className="text-muted-foreground leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-foreground"
            >
              Frequently Asked
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {" "}Questions
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Everything you need to know about Kasoku and how it can transform your training
            </motion.p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItemComponent
                key={faq.id}
                faq={faq}
                index={index}
                isOpen={openItems.has(faq.id)}
                onToggle={() => toggleItem(faq.id)}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center p-8 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-3xl border border-border"
          >
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our support team is here to help you get the most out of Kasoku. 
              Reach out anytime for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                Contact Support
              </button>
              <button className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-semibold">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 