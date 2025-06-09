/*
<ai_context>
This client component provides the CTA section for the GuideLayer AI landing page.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { ArrowRight, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export const CTASection = () => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the email to your backend
    console.log("Email submitted:", email)
    setSubmitted(true)
    setEmail("")
  }

  return (
    <section id="cta" className="bg-gradient-to-br from-purple-900 to-indigo-900 py-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="mb-6 text-4xl font-bold">
              Ready to Transform Your VA Collaboration?
            </h2>
            <p className="mb-12 text-xl text-purple-100">
              Join GuideLayer AI today and experience the future of business-VA relationships.
              No more over-explaining. No more micromanagement. Just efficient delegation and execution.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column - Get Started */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center justify-center rounded-lg bg-white/10 p-8 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-2xl font-bold">Get Started Now</h3>
              <p className="mb-6 text-center text-purple-100">
                Create your account and start delegating tasks more efficiently today.
              </p>
              <Link href="/signup" className="w-full">
                <Button size="lg" className="w-full bg-white text-purple-900 hover:bg-purple-100">
                  Start Free Trial <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <p className="mt-4 text-sm text-purple-200">
                No credit card required. 14-day free trial.
              </p>
            </motion.div>

            {/* Right Column - Newsletter */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center rounded-lg bg-white/10 p-8 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-2xl font-bold">Stay Updated</h3>
              <p className="mb-6 text-center text-purple-100">
                Join our newsletter to receive updates, tips, and exclusive offers.
              </p>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex flex-col space-y-4">
                    <div className="flex">
                      <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="border-r-0 bg-white pl-10 text-gray-900"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="rounded-l-none bg-purple-600 hover:bg-purple-700">
                        Subscribe
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="rounded-md bg-purple-800/50 p-4 text-center">
                  <p className="text-white">
                    Thanks for subscribing! We'll keep you updated.
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-purple-200">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </motion.div>
          </div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="mt-16 text-center"
          >
            <p className="mb-6 text-lg font-medium">Trusted by businesses and VAs worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {/* Replace with actual customer logos */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-32 rounded-md bg-white/20 backdrop-blur-sm"
                ></div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 