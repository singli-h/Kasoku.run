"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, BarChart3, Calendar, Users, Trophy, Target, Dumbbell, ClipboardList, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardTourStepProps {
  role: "athlete" | "coach" | "individual" | ""
  onNext: () => void
  onPrev: () => void
}

// Role-specific features
const ATHLETE_FEATURES = [
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "Monitor your progress with splits, times, and PRs",
  },
  {
    icon: Calendar,
    title: "Training Schedule",
    description: "View workouts assigned by your coach",
  },
  {
    icon: Trophy,
    title: "Competitions",
    description: "Log meets and track your race results",
  },
]

const COACH_FEATURES = [
  {
    icon: Users,
    title: "Set Up Your Team",
    description: "Head to Athletes to create groups and invite your team",
  },
  {
    icon: Dumbbell,
    title: "Build Your Playbook",
    description: "Paste a training program — AI parses it into reusable templates",
  },
  {
    icon: Calendar,
    title: "Plan Your Season",
    description: "Create phases, assign sessions, and track progress",
  },
]

const INDIVIDUAL_FEATURES = [
  {
    icon: Dumbbell,
    title: "Workout Plans",
    description: "AI-generated plans tailored to your goals",
  },
  {
    icon: Target,
    title: "Track Progress",
    description: "Log workouts and see your improvements",
  },
  {
    icon: Sparkles,
    title: "AI Coach",
    description: "Get personalized guidance and adjustments",
  },
]

export function DashboardTourStep({ role, onNext, onPrev }: DashboardTourStepProps) {
  const getFeatures = () => {
    switch (role) {
      case "athlete":
        return ATHLETE_FEATURES
      case "coach":
        return COACH_FEATURES
      case "individual":
        return INDIVIDUAL_FEATURES
      default:
        return ATHLETE_FEATURES
    }
  }

  const getTitle = () => {
    switch (role) {
      case "athlete":
        return "Your Athlete Dashboard"
      case "coach":
        return "Your Coaching Dashboard"
      case "individual":
        return "Your Training Dashboard"
      default:
        return "Your Dashboard"
    }
  }

  const getDescription = () => {
    switch (role) {
      case "athlete":
        return "Everything you need to train smarter and compete better"
      case "coach":
        return "Tools to manage your team and optimize their performance"
      case "individual":
        return "Your personal AI-powered training companion"
      default:
        return "Here's what you'll have access to"
    }
  }

  const features = getFeatures()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          {getTitle()}
        </h2>
        <p className="text-muted-foreground">
          {getDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center text-center p-5 rounded-xl",
                "bg-muted/50 border border-border"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between max-w-2xl mx-auto pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button onClick={onNext} className="min-w-[120px]">
          Finish Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
