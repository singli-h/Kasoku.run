"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingData } from "../onboarding-wizard"

// Training goal options for individual users
const TRAINING_GOALS = [
  { id: "build-strength", label: "Build Strength" },
  { id: "lose-weight", label: "Lose Weight" },
  { id: "improve-endurance", label: "Improve Endurance" },
  { id: "build-muscle", label: "Build Muscle" },
  { id: "improve-flexibility", label: "Improve Flexibility" },
  { id: "general-fitness", label: "General Fitness" },
  { id: "train-for-event", label: "Train for an Event" },
  { id: "improve-speed", label: "Improve Speed" },
  { id: "recover-from-injury", label: "Recover from Injury" },
  { id: "maintain-fitness", label: "Maintain Fitness" },
] as const

// Experience level options
const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to structured training (0-1 years)",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Consistent training experience (1-3 years)",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Extensive training background (3+ years)",
  },
] as const

interface IndividualDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

export function IndividualDetailsStep({
  userData,
  updateUserData,
  onNext,
  onPrev,
}: IndividualDetailsStepProps) {
  // Parse existing goals from comma-separated string
  const parseGoals = (goalsString: string): string[] => {
    if (!goalsString) return []
    return goalsString.split(",").map((g) => g.trim()).filter(Boolean)
  }

  const [firstName, setFirstName] = useState(userData.firstName || "")
  const [lastName, setLastName] = useState(userData.lastName || "")
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    parseGoals(userData.individualTrainingGoals)
  )
  const [selectedExperience, setSelectedExperience] = useState<string>(
    userData.individualExperienceLevel || ""
  )
  const [birthdate, setBirthdate] = useState(userData.birthdate || "")
  const [hasAttempted, setHasAttempted] = useState(false)

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleSubmit = () => {
    setHasAttempted(true)
    if (!firstName || !lastName || selectedGoals.length === 0 || !selectedExperience) {
      return
    }

    // Convert selected goal IDs to labels for storage
    const goalLabels = selectedGoals
      .map((id) => TRAINING_GOALS.find((g) => g.id === id)?.label)
      .filter(Boolean)
      .join(", ")

    updateUserData({
      firstName,
      lastName,
      birthdate,
      individualTrainingGoals: goalLabels,
      individualExperienceLevel: selectedExperience,
      // TODO: Available equipment will be collected during first plan creation
      // This provides better context and doesn't overwhelm the onboarding flow
      availableEquipment: [],
    })
    onNext()
  }

  const canProceed = firstName && lastName && selectedGoals.length > 0 && selectedExperience

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Tell us about your training
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This helps us personalize your experience and provide better AI
          assistance for your training plans.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="w-5 h-5 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date of Birth</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Used to calculate age categories and personalize training
            </p>
          </div>
        </div>

        {/* Training Goals - Clickable Tags */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">What are your training goals?</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select all that apply
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRAINING_GOALS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id)
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
                    "border-2 min-h-[44px] active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {goal.label}
                </button>
              )
            })}
          </div>
          {hasAttempted && selectedGoals.length === 0 && (
            <p className="text-sm text-destructive">
              Please select at least one training goal
            </p>
          )}
        </div>

        {/* Experience Level - Direct Click Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-base">What's your experience level?</Label>
            <p className="text-sm text-muted-foreground mt-1">
              This helps us tailor workout complexity
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = selectedExperience === level.id
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedExperience(level.id)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg text-center transition-colors",
                    "border-2 min-h-[80px] active:scale-[0.98]",
                    isSelected
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="font-semibold text-base sm:text-lg">{level.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {level.description}
                  </span>
                </button>
              )
            })}
          </div>
          {hasAttempted && !selectedExperience && (
            <p className="text-sm text-destructive">
              Please select your experience level
            </p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between max-w-2xl mx-auto pt-4">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
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
