/*
<ai_context>
This client component provides the about section for the GuideLayer AI landing page, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BrainCircuit, Target, Users, Zap } from "lucide-react"
import Image from "next/image"

const features = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-blue-600" />,
    title: "Technical Expertise",
    description: "We are builders with a deep understanding of AI. This enables us to drive results with new technology."
  },
  {
    icon: <Target className="w-8 h-8 text-green-600" />,
    title: "Platform Agnostic", 
    description: "We choose the best AI platform per client, use case, and tech stack - not per partnership or referral fee."
  },
  {
    icon: <Users className="w-8 h-8 text-purple-600" />,
    title: "AI Like Humans",
    description: "AI can replace human processes when you architect and manage it similarly to how humans work."
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
            ABOUT GUIDELAYER AI
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-6 dark:text-slate-100">
            Our AI Mindset
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto dark:text-slate-400">
            We embrace AI while others see fear. We cut through the noise of a crowded marketplace, 
            providing clear and actionable AI solutions that are easy to understand and implement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-50 border border-slate-200 dark:bg-slate-700 dark:border-slate-600">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-4 h-4 mr-2" />
                Proven Track Record
              </Badge>
              <h3 className="text-3xl font-bold text-slate-800 mb-4 dark:text-slate-100">
                $500M+ in Direct Revenue, since 2015
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                We shepherd businesses through AI Transformation by automating & streamlining operations 
                in a way that "wows!" customers, frees up teams, and unlocks revenue & profit.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-3"></div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">Nearly A Decade of Experience</h4>
                  <p className="text-slate-600 dark:text-slate-400">Building and managing remote teams since 2009 with proven results.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-3"></div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">AI-First Approach</h4>
                  <p className="text-slate-600 dark:text-slate-400">We proactively implement AI automation to increase efficiency and reduce costs.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-3"></div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">Focus on Results</h4>
                  <p className="text-slate-600 dark:text-slate-400">We align strategy with marketing to drive revenue and lifetime value, not just process tickets.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <div className="text-center p-8">
                <BrainCircuit className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  GuideLayer® AI
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                  Our proprietary AI system that makes working with Virtual Assistants effortless
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 