/*
<ai_context>
This client component provides the problem/solution section for the GuideLayer AI landing page, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export const ProblemSolutionSection = () => {
  return (
    <section id="problem-solution" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
            THE VIRTUAL ASSISTANT MODEL IS BROKEN
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-6 dark:text-slate-100">
            Why Traditional VA Collaboration Fails
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-slate-600 dark:text-slate-400">
            Working with Virtual Assistants should be easy, but businesses face common challenges that make delegation inefficient and costly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Problems Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Common VA Problems
              </h3>
            </div>

            <Card className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <XCircle className="w-6 h-6 text-red-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      Excessive Documentation Required
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Businesses spend countless hours creating detailed SOPs, videos, and instructions for every single task, only to have VAs ask the same questions anyway.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <XCircle className="w-6 h-6 text-red-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      Constant Micromanagement Needed
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      VAs need constant hand-holding and repeated explanations about task details, requiring business owners to always be available for questions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <XCircle className="w-6 h-6 text-red-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      Inefficient Tool Switching
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Moving between communication tools, task systems, and knowledge bases creates confusion and wastes valuable time for both parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Solutions Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                GuideLayer AI Solutions
              </h3>
            </div>

            <Card className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      5-Minute Task Briefs
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Our AI interviews you for just 5 minutes and automatically creates comprehensive task briefs with all necessary details, workflows, and resources.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      AI-Guided Independent Work
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      VAs work independently with AI Copilot providing real-time guidance, answering questions, and offering step-by-step workflow support.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      Seamless Tool Integration
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Works with your existing tools through our browser extension - no need to change your workflow, platforms, or learn new systems.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="text-center bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-8"
        >
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Stop the Inefficiency. Start Smart Delegation.
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            GuideLayer AI eliminates the friction in client-VA relationships, making delegation effortless and execution independent.
          </p>
          <Link href="#how-it-works">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              See How It Works <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
} 