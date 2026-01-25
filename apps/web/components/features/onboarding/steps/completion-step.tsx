"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Sparkles } from "lucide-react"

type UserRole = "athlete" | "coach" | "individual" | ""

interface CompletionStepProps {
  onComplete: () => void
  isSubmitting: boolean
  role: UserRole
}

// Role-specific next steps content
const ROLE_NEXT_STEPS: Record<Exclude<UserRole, "">, { items: string[]; buttonText: string }> = {
  individual: {
    items: [
      "Create your first Training Block with AI assistance",
      "Set your weekly workout schedule and available equipment",
      "Review and approve your AI-generated workouts",
      "Start logging workouts and track your progress",
    ],
    buttonText: "Create Your First Plan",
  },
  athlete: {
    items: [
      "Your dashboard is ready with your training overview",
      "View training plans assigned by your coach",
      "Start logging workouts and track your progress",
      "Check your performance analytics anytime",
    ],
    buttonText: "Go to Dashboard",
  },
  coach: {
    items: [
      "Set up your first athlete or training group",
      "Create training programs and assign to athletes",
      "Track athlete progress from your dashboard",
      "Use the exercise library to build custom workouts",
    ],
    buttonText: "Go to Dashboard",
  },
}

export function CompletionStep({ onComplete, isSubmitting, role }: CompletionStepProps) {
  // Fallback to individual if role is empty (shouldn't happen)
  const effectiveRole = role || "individual"
  const { items, buttonText } = ROLE_NEXT_STEPS[effectiveRole]

  return (
    <div className="text-center space-y-8">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            You're all set!
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Welcome to Kasoku! Your account has been configured and you're ready to start your training journey.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 max-w-lg mx-auto">
          <h3 className="font-semibold text-foreground mb-4">What happens next?</h3>
          <div className="space-y-3 text-sm text-muted-foreground text-left">
            {items.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={onComplete}
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up your account...
            </>
          ) : (
            <>
              {buttonText}
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {isSubmitting && (
          <p className="text-xs text-muted-foreground">
            This may take a few moments while we configure your account.
          </p>
        )}
      </div>
    </div>
  )
} 