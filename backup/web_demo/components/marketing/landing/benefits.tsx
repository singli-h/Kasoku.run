/*
<ai_context>
This client component showcases the dual persona benefits for the GuideLayer AI landing page.
</ai_context>
*/

"use client"

import { motion } from "framer-motion"
import {
  Clock,
  Headphones,
  LucideIcon,
  MessageSquareText,
  Rocket,
  Sparkles,
  UserRound,
  Zap
} from "lucide-react"

interface BenefitProps {
  title: string
  description: string
  icon: LucideIcon
  delay: number
}

const Benefit = ({ title, description, icon: Icon, delay }: BenefitProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className="flex items-start"
  >
    <div className="mr-4 mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
      <Icon className="size-5" />
    </div>
    <div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </motion.div>
)

export const BenefitsSection = () => {
  const clientBenefits: Omit<BenefitProps, "delay">[] = [
    {
      title: "No More Over-Explaining",
      description:
        "Spend just 5 minutes with our AI Interviewer instead of hours creating detailed documentation.",
      icon: Clock
    },
    {
      title: "Reduced Micromanagement",
      description:
        "VAs work independently with AI guidance, freeing you from constant questions and oversight.",
      icon: Rocket
    },
    {
      title: "Faster Task Delegation",
      description:
        "Quickly delegate tasks through conversation rather than writing extensive instructions.",
      icon: Zap
    },
    {
      title: "Better VA Productivity",
      description:
        "VAs complete tasks more efficiently with AI support, improving overall productivity.",
      icon: Sparkles
    }
  ]

  const vaBenefits: Omit<BenefitProps, "delay">[] = [
    {
      title: "Clear, Detailed Task Briefs",
      description:
        "Receive comprehensive task briefs with all the information you need to succeed.",
      icon: MessageSquareText
    },
    {
      title: "AI Guidance During Work",
      description:
        "Get instant answers and guidance from AI Copilot without waiting for client responses.",
      icon: Headphones
    },
    {
      title: "Reduced Back-and-Forth",
      description:
        "Work more independently without constant clarification questions to your client.",
      icon: UserRound
    },
    {
      title: "More Independent Work",
      description:
        "Build confidence and autonomy with AI support, leading to greater job satisfaction.",
      icon: Sparkles
    }
  ]

  return (
    <section id="benefits" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="mb-6 text-4xl font-bold">Benefits for Everyone</h2>
          <p className="mb-16 text-xl text-muted-foreground">
            GuideLayer AI transforms how businesses and virtual assistants work together, creating value for both sides.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 md:grid-cols-2">
          {/* Client Benefits */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8 text-center"
            >
              <h3 className="text-2xl font-bold">For Business Clients</h3>
              <div className="mx-auto mt-2 h-1 w-16 rounded bg-purple-600"></div>
            </motion.div>
            <div className="space-y-8">
              {clientBenefits.map((benefit, index) => (
                <Benefit
                  key={index}
                  {...benefit}
                  delay={0.2 + index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* VA Benefits */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8 text-center"
            >
              <h3 className="text-2xl font-bold">For Virtual Assistants</h3>
              <div className="mx-auto mt-2 h-1 w-16 rounded bg-purple-600"></div>
            </motion.div>
            <div className="space-y-8">
              {vaBenefits.map((benefit, index) => (
                <Benefit
                  key={index}
                  {...benefit}
                  delay={0.4 + index * 0.1}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-2xl rounded-lg border bg-purple-50 p-8 text-center shadow-lg dark:bg-purple-900/20"
        >
          <h3 className="mb-4 text-2xl font-bold">The Perfect Partnership</h3>
          <p className="text-lg">
            GuideLayer AI creates a more efficient, productive, and satisfying working relationship between businesses and their virtual assistants.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 