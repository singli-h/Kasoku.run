/**
 * Training Prompt Examples
 * Pre-built prompts for fitness and training assistance
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dumbbell, 
  Timer, 
  Target, 
  TrendingUp, 
  Heart, 
  Apple,
  Moon,
  AlertTriangle
} from "lucide-react"

interface TrainingPromptExamplesProps {
  onSelectPrompt: (prompt: string) => void
  className?: string
}

const promptCategories = [
  {
    title: "Exercise Form & Technique",
    icon: Dumbbell,
    color: "bg-blue-500",
    prompts: [
      "How do I improve my squat depth and form?",
      "What are the key cues for a proper deadlift setup?",
      "Can you analyze my bench press technique issues?",
      "How should I progress from bodyweight to weighted pull-ups?"
    ]
  },
  {
    title: "Training Programs",
    icon: Timer,
    color: "bg-green-500",
    prompts: [
      "Design a 4-day upper/lower split for strength gains",
      "Create a beginner running program for a 5K race",
      "I need a home workout routine with minimal equipment",
      "How do I structure a powerlifting peaking program?"
    ]
  },
  {
    title: "Progress & Goals",
    icon: Target,
    color: "bg-purple-500",
    prompts: [
      "I've plateaued on my bench press, what should I do?",
      "How do I track progress beyond just weight on the scale?",
      "Set realistic strength goals for my first year of training",
      "My running times aren't improving, what's wrong?"
    ]
  },
  {
    title: "Performance Analytics",
    icon: TrendingUp,
    color: "bg-orange-500",
    prompts: [
      "Analyze my training volume trends over the past month",
      "What does my RPE data tell me about recovery?",
      "How do I interpret my heart rate variability?",
      "Should I be concerned about my training load?"
    ]
  },
  {
    title: "Recovery & Health",
    icon: Heart,
    color: "bg-red-500",
    prompts: [
      "I'm feeling overtrained, what should I do?",
      "How much sleep do I need for optimal recovery?",
      "What are signs I need a deload week?",
      "How do I manage training around work stress?"
    ]
  },
  {
    title: "Nutrition & Supplementation",
    icon: Apple,
    color: "bg-yellow-500",
    prompts: [
      "What should I eat before and after workouts?",
      "How much protein do I need for muscle growth?",
      "Design a meal plan for my training goals",
      "Which supplements are actually worth taking?"
    ]
  },
  {
    title: "Injury Prevention",
    icon: AlertTriangle,
    color: "bg-gray-500",
    prompts: [
      "I have lower back pain during squats, what should I check?",
      "How do I prevent running injuries?",
      "What's a good warm-up routine for strength training?",
      "My shoulder hurts during overhead movements"
    ]
  },
  {
    title: "Sleep & Lifestyle",
    icon: Moon,
    color: "bg-indigo-500",
    prompts: [
      "How does sleep affect my training performance?",
      "I work night shifts, how should I time my workouts?",
      "What's the best way to manage training and work stress?",
      "How do I maintain consistency with a busy schedule?"
    ]
  }
]

export function TrainingPromptExamples({ onSelectPrompt, className }: TrainingPromptExamplesProps) {
  return (
    <div className={className}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Ask Kasoku AI</h3>
        <p className="text-muted-foreground text-sm">
          Get expert training advice, form tips, and personalized recommendations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {promptCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <Card key={category.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm">{category.title}</h4>
                </div>
                
                <div className="space-y-2">
                  {category.prompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-2 text-xs hover:bg-muted/50"
                      onClick={() => onSelectPrompt(prompt)}
                    >
                      <span className="text-muted-foreground mr-2">•</span>
                      <span className="line-clamp-2">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">🏋️ Exercise Form</Badge>
          <Badge variant="secondary" className="text-xs">📊 Progress Tracking</Badge>
          <Badge variant="secondary" className="text-xs">🍎 Nutrition</Badge>
          <Badge variant="secondary" className="text-xs">😴 Recovery</Badge>
          <Badge variant="secondary" className="text-xs">🎯 Goal Setting</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Or ask your own question about training, nutrition, recovery, or performance
        </p>
      </div>
    </div>
  )
} 