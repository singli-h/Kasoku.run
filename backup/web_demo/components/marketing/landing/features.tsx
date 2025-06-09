/*
<ai_context>
This client component provides the features section for the GuideLayer AI landing page, styled to match HelpFlow's branding.
</ai_context>
*/

"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  BrainCircuit,
  Chrome,
  LucideIcon,
  MessageSquareText,
  Network,
  Puzzle
} from "lucide-react"

interface FeatureProps {
  title: string
  description: string
  details: string
  icon: LucideIcon
  bgColor: string
}

const features: FeatureProps[] = [
  {
    title: "AI Task Interviewer",
    description: "Create detailed task briefs in under 5 minutes",
    details: "Our AI conversationally interviews you to create comprehensive task briefs with workflows, resources, and timelines - without extensive documentation.",
    icon: MessageSquareText,
    bgColor: "bg-blue-50 dark:bg-blue-900/20"
  },
  {
    title: "AI Copilot for VAs",
    description: "Guided workflow support for virtual assistants",
    details: "VAs get AI-powered guidance on tasks, with answers to company questions and workflow assistance, enabling more independent work.",
    icon: BrainCircuit,
    bgColor: "bg-purple-50 dark:bg-purple-900/20"
  },
  {
    title: "Browser Extension",
    description: "Use GuideLayer AI in your existing tools",
    details: "Our browser extension works with Slack, Asana, Basecamp and more - no need to switch platforms or change your workflow.",
    icon: Chrome,
    bgColor: "bg-green-50 dark:bg-green-900/20"
  },
  {
    title: "Knowledge Base",
    description: "Centralized company information",
    details: "AI-accessible knowledge base with company processes, team info, and documentation - created through a simple kickoff interview.",
    icon: Puzzle,
    bgColor: "bg-orange-50 dark:bg-orange-900/20"
  },
  {
    title: "MCP Integrations",
    description: "Connect to your existing platforms",
    details: "Access information from your CRM, documentation, and other tools through Model Context Protocol (MCP) integrations.",
    icon: Network,
    bgColor: "bg-teal-50 dark:bg-teal-900/20"
  }
]

const FeatureCard = ({ title, description, details, icon: Icon, bgColor }: FeatureProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="transform-gpu"
  >
    <Card className={`group h-full transition-all duration-200 hover:shadow-lg border border-slate-200 dark:border-slate-700 ${bgColor}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 shadow-md flex items-center justify-center">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-slate-600 dark:text-slate-400">{details}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">
              AI FEATURES
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-6 dark:text-slate-100">
              Powerful AI Tools for Better Collaboration
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-slate-600 dark:text-slate-400">
              GuideLayer AI provides everything you need for seamless collaboration between businesses and virtual assistants, 
              powered by advanced artificial intelligence.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
