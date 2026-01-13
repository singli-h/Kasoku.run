"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Users, Trophy, User, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingData } from "../onboarding-wizard"

interface RoleSelectionStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

const ROLES = [
  {
    id: "athlete" as const,
    icon: Trophy,
    title: "Train with a Coach",
    description: "Follow your coach's plans and track your progress",
  },
  {
    id: "individual" as const,
    icon: User,
    title: "Train Myself",
    description: "Create AI-powered plans and train independently",
  },
  {
    id: "coach" as const,
    icon: Users,
    title: "Coach Athletes",
    description: "Manage athletes and design training programs",
  },
]

export function RoleSelectionStep({ userData, updateUserData, onNext, onPrev }: RoleSelectionStepProps) {
  const handleRoleSelect = (role: "athlete" | "coach" | "individual") => {
    updateUserData({ role })
  }

  const canProceed = userData.role !== ""

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          What's your role?
        </h2>
        <p className="text-muted-foreground">
          Choose how you'll use Kasoku. You can change this later.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {ROLES.map((role) => {
          const Icon = role.icon
          const isSelected = userData.role === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl text-left transition-all",
                "border-2 active:scale-[0.98]",
                isSelected
                  ? "bg-primary/5 border-primary"
                  : "bg-background border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">
                  {role.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {role.description}
                </div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between max-w-md mx-auto pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
