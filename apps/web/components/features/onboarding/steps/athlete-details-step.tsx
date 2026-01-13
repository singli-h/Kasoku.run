"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, User, Target, Calendar, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingData } from "../onboarding-wizard"

interface AthleteDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

// Training goal options for athletes
const TRAINING_GOALS = [
  { id: "improve-speed", label: "Improve Speed" },
  { id: "build-strength", label: "Build Strength" },
  { id: "improve-endurance", label: "Improve Endurance" },
  { id: "compete-at-higher-level", label: "Compete at Higher Level" },
  { id: "qualify-for-event", label: "Qualify for an Event" },
  { id: "set-personal-best", label: "Set Personal Best" },
  { id: "improve-technique", label: "Improve Technique" },
  { id: "recover-from-injury", label: "Recover from Injury" },
  { id: "off-season-training", label: "Off-Season Training" },
  { id: "maintain-fitness", label: "Maintain Fitness" },
] as const

// Experience level options
const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to track & field (0-2 years)",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Club/school level (2-5 years)",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Competitive athlete (5+ years)",
  },
  {
    id: "elite",
    label: "Elite",
    description: "National/international level",
  },
] as const

// Common track and field events
const EVENTS = [
  "100m", "200m", "400m", "800m", "1500m", "5000m", "10000m", "Marathon",
  "110m Hurdles", "400m Hurdles", "3000m Steeplechase",
  "High Jump", "Pole Vault", "Long Jump", "Triple Jump",
  "Shot Put", "Discus", "Hammer", "Javelin",
  "Decathlon", "Heptathlon"
]

export function AthleteDetailsStep({ userData, updateUserData, onNext, onPrev }: AthleteDetailsStepProps) {
  // Parse existing goals from comma-separated string
  const parseGoals = (goalsString: string): string[] => {
    if (!goalsString) return []
    return goalsString.split(",").map((g) => g.trim()).filter(Boolean)
  }

  const [firstName, setFirstName] = useState(userData.firstName || "")
  const [lastName, setLastName] = useState(userData.lastName || "")
  const [birthdate, setBirthdate] = useState(userData.birthdate || "")
  const [height, setHeight] = useState(userData.height || "")
  const [weight, setWeight] = useState(userData.weight || "")
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    parseGoals(userData.trainingGoals)
  )
  const [selectedExperience, setSelectedExperience] = useState<string>(
    userData.trainingHistory || ""
  )
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    userData.events || []
  )

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleEventToggle = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    )
  }

  const handleSubmit = () => {
    if (!firstName || !lastName) return

    // Convert selected goal IDs to labels for storage
    const goalLabels = selectedGoals
      .map((id) => TRAINING_GOALS.find((g) => g.id === id)?.label)
      .filter(Boolean)
      .join(", ")

    updateUserData({
      firstName,
      lastName,
      birthdate,
      height,
      weight,
      trainingGoals: goalLabels,
      trainingHistory: selectedExperience,
      events: selectedEvents,
    })
    onNext()
  }

  const canProceed = firstName && lastName

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Help us understand your athletic background and goals so we can provide
          the best training experience.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of Birth</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>
          </div>
        </div>

        {/* Training Goals - Clickable Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Training Goals
          </h3>
          <p className="text-sm text-muted-foreground">
            Select all that apply to your current training focus
          </p>
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
        </div>

        {/* Experience Level - Direct Click Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Experience Level</Label>
            <p className="text-sm text-muted-foreground mt-1">
              This helps us tailor training intensity and complexity
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EXPERIENCE_LEVELS.map((level) => {
              const isSelected = selectedExperience === level.id
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedExperience(level.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg text-center transition-colors",
                    "border-2 min-h-[72px] active:scale-[0.98]",
                    isSelected
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="font-semibold text-sm sm:text-base">{level.label}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">
                    {level.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Events - Clickable Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Your Events
          </h3>
          <p className="text-sm text-muted-foreground">
            Select the events you compete in or are interested in training for
          </p>
          <div className="flex flex-wrap gap-2">
            {EVENTS.map((event) => {
              const isSelected = selectedEvents.includes(event)
              return (
                <button
                  key={event}
                  type="button"
                  onClick={() => handleEventToggle(event)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                    "border-2 min-h-[40px] active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {event}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto pt-4">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
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
