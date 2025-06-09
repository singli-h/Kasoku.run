/*
<ai_context>
This client component provides the "How It Works" section for the GuideLayer AI landing page.
</ai_context>
*/

"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  BrainCircuit,
  MessageSquareText,
  Puzzle,
  Slack,
  UserRound
} from "lucide-react"

interface StepProps {
  number: number
  title: string
  description: string
  icon: React.ReactNode
  delay: number
}

const Step = ({ number, title, description, icon, delay }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className="relative flex flex-col items-center"
  >
    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
      {icon}
    </div>
    <div className="absolute -right-8 top-8 hidden md:block">
      <ArrowRight className="size-6 text-gray-300 dark:text-gray-600" />
    </div>
    <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-purple-600 text-white">
      {number}
    </div>
    <h3 className="mb-2 mt-2 text-center text-xl font-bold">{title}</h3>
    <p className="text-center text-muted-foreground">{description}</p>
  </motion.div>
)

export const HowItWorksSection = () => {
  const steps: Omit<StepProps, "delay">[] = [
    {
      number: 1,
      title: "Client Creates Task",
      description:
        "Client uses AI Interviewer for a 5-minute conversation about the task they need completed.",
      icon: <MessageSquareText className="size-8" />
    },
    {
      number: 2,
      title: "AI Generates Task Brief",
      description:
        "AI automatically creates a detailed task brief with workflow, resources, and timeline.",
      icon: <Puzzle className="size-8" />
    },
    {
      number: 3,
      title: "VA Receives Task",
      description:
        "VA receives the task in their preferred system (Slack, Asana, etc.) with all necessary details.",
      icon: <Slack className="size-8" />
    },
    {
      number: 4,
      title: "VA Uses AI Copilot",
      description:
        "VA works with AI Copilot for guidance, answers to questions, and workflow support.",
      icon: <BrainCircuit className="size-8" />
    },
    {
      number: 5,
      title: "Task Completed",
      description:
        "VA completes the task independently without constant client input or micromanagement.",
      icon: <UserRound className="size-8" />
    }
  ]

  return (
    <section id="how-it-works" className="bg-gray-50 py-24 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="mb-6 text-4xl font-bold">How GuideLayer AI Works</h2>
          <p className="mb-16 text-xl text-muted-foreground">
            Our AI-powered platform streamlines the entire delegation process from task creation to completion.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-5">
          {steps.map((step, index) => (
            <Step
              key={index}
              {...step}
              delay={0.2 + index * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-2xl rounded-lg border bg-white p-8 text-center shadow-lg dark:bg-gray-800"
        >
          <h3 className="mb-4 text-2xl font-bold">The Result</h3>
          <p className="text-lg text-muted-foreground">
            Clients save hours on task delegation while VAs work more independently.
            No more excessive documentation or constant back-and-forth questions.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 