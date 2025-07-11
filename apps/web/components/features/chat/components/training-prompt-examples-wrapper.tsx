"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Heart, Apple, Timer, Users, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrainingPromptExamplesWrapperProps {
  className?: string
}

export function TrainingPromptExamplesWrapper({ className }: TrainingPromptExamplesWrapperProps) {
  const promptExamples = [
    {
      category: "Strength Training",
      icon: Dumbbell,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      prompts: [
        "Create a 4-week strength training program for a beginner",
        "How do I properly perform a deadlift?",
        "What's the best rep range for building muscle mass?"
      ]
    },
    {
      category: "Running & Cardio",
      icon: Heart,
      color: "bg-red-500/10 text-red-600 border-red-200",
      prompts: [
        "Design a 12-week marathon training plan",
        "How do I improve my 5K time?",
        "What's the best way to prevent running injuries?"
      ]
    },
    {
      category: "Nutrition",
      icon: Apple,
      color: "bg-green-500/10 text-green-600 border-green-200",
      prompts: [
        "What should I eat before and after workouts?",
        "Help me create a meal plan for muscle gain",
        "How much protein do I need daily?"
      ]
    },
    {
      category: "Recovery",
      icon: Timer,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      prompts: [
        "How much sleep do I need for optimal recovery?",
        "What are the best stretches for post-workout?",
        "When should I take rest days?"
      ]
    },
    {
      category: "Coaching",
      icon: Users,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      prompts: [
        "How do I motivate athletes during tough training?",
        "What's the best way to track athlete progress?",
        "How do I modify workouts for different skill levels?"
      ]
    },
    {
      category: "Performance",
      icon: Target,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      prompts: [
        "How do I set realistic fitness goals?",
        "What metrics should I track for improvement?",
        "How do I break through a performance plateau?"
      ]
    }
  ]

  const handlePromptClick = (prompt: string) => {
    // TODO: Handle prompt selection
    // For now, just log the prompt
    console.log('Selected prompt:', prompt)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {promptExamples.map((category, index) => (
        <Card key={index} className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <category.icon className="h-5 w-5 mr-2" />
              {category.category}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {category.prompts.map((prompt, promptIndex) => (
                <Button
                  key={promptIndex}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50 transition-colors"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <div className="flex items-start space-x-2">
                    <Badge className={cn("shrink-0", category.color)} variant="secondary">
                      {promptIndex + 1}
                    </Badge>
                    <span className="text-sm">{prompt}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 