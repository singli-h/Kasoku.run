"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Users, Award, BookOpen, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingData } from "../onboarding-wizard"

interface CoachDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

// Common coaching specializations
const SPECIALIZATIONS = [
  { id: "sprints-hurdles", label: "Sprints & Hurdles" },
  { id: "middle-distance", label: "Middle Distance" },
  { id: "long-distance", label: "Long Distance" },
  { id: "jumping-events", label: "Jumping Events" },
  { id: "throwing-events", label: "Throwing Events" },
  { id: "multi-events", label: "Multi-Events" },
  { id: "general-track", label: "General Track & Field" },
  { id: "strength-conditioning", label: "Strength & Conditioning" },
  { id: "youth-development", label: "Youth Development" },
  { id: "elite-performance", label: "Elite Performance" },
] as const

// Experience levels
const EXPERIENCE_LEVELS = [
  {
    id: "new",
    label: "New Coach",
    description: "0-1 years experience",
  },
  {
    id: "developing",
    label: "Developing",
    description: "2-5 years experience",
  },
  {
    id: "experienced",
    label: "Experienced",
    description: "6-10 years experience",
  },
  {
    id: "veteran",
    label: "Veteran",
    description: "11-20 years experience",
  },
  {
    id: "master",
    label: "Master",
    description: "20+ years experience",
  },
] as const

// Sport focus options
const SPORT_FOCUS_OPTIONS = [
  { id: "track-field", label: "Track & Field" },
  { id: "cross-country", label: "Cross Country" },
  { id: "road-racing", label: "Road Racing" },
  { id: "marathon", label: "Marathon" },
  { id: "triathlon", label: "Triathlon" },
  { id: "combined-events", label: "Combined Events" },
] as const

export function CoachDetailsStep({ userData, updateUserData, onNext, onPrev }: CoachDetailsStepProps) {
  const [firstName, setFirstName] = useState(userData.firstName || "")
  const [lastName, setLastName] = useState(userData.lastName || "")
  const [birthdate, setBirthdate] = useState(userData.birthdate || "")
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(
    userData.specialization ? userData.specialization.split(",").map(s => s.trim()).filter(Boolean) : []
  )
  const [selectedExperience, setSelectedExperience] = useState(userData.experience || "")
  const [selectedSportFocus, setSelectedSportFocus] = useState<string[]>(
    userData.sportFocus ? userData.sportFocus.split(",").map(s => s.trim()).filter(Boolean) : []
  )
  const [coachingPhilosophy, setCoachingPhilosophy] = useState(userData.coachingPhilosophy || "")

  const handleSpecializationToggle = (specId: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(specId)
        ? prev.filter((s) => s !== specId)
        : [...prev, specId]
    )
  }

  const handleSportFocusToggle = (sportId: string) => {
    setSelectedSportFocus((prev) =>
      prev.includes(sportId)
        ? prev.filter((s) => s !== sportId)
        : [...prev, sportId]
    )
  }

  const handleSubmit = () => {
    if (!firstName || !lastName) return

    // Convert selected IDs to labels for storage
    const specializationLabels = selectedSpecializations
      .map((id) => SPECIALIZATIONS.find((s) => s.id === id)?.label)
      .filter(Boolean)
      .join(", ")

    const sportFocusLabels = selectedSportFocus
      .map((id) => SPORT_FOCUS_OPTIONS.find((s) => s.id === id)?.label)
      .filter(Boolean)
      .join(", ")

    updateUserData({
      firstName,
      lastName,
      birthdate,
      specialization: specializationLabels,
      experience: selectedExperience,
      sportFocus: sportFocusLabels,
      coachingPhilosophy,
    })
    onNext()
  }

  const canProceed = firstName && lastName

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Tell us about your coaching
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Help us understand your coaching background and philosophy so we can provide
          the best tools for managing your athletes.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
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
          </div>
        </div>

        {/* Coaching Specializations - Clickable Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Coaching Specializations
          </h3>
          <p className="text-sm text-muted-foreground">
            Select all areas you specialize in
          </p>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => {
              const isSelected = selectedSpecializations.includes(spec.id)
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleSpecializationToggle(spec.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
                    "border-2 min-h-[44px] active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {spec.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Experience Level - Direct Click Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Coaching Experience</Label>
            <p className="text-sm text-muted-foreground mt-1">
              How long have you been coaching?
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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

        {/* Sport Focus - Clickable Tags */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Sport Focus</Label>
            <p className="text-sm text-muted-foreground mt-1">
              What sports do you primarily coach?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPORT_FOCUS_OPTIONS.map((sport) => {
              const isSelected = selectedSportFocus.includes(sport.id)
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleSportFocusToggle(sport.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
                    "border-2 min-h-[44px] active:scale-95",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {sport.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Coaching Philosophy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Coaching Philosophy
          </h3>
          <div className="space-y-2">
            <Label htmlFor="coachingPhilosophy">Your Coaching Philosophy (Optional)</Label>
            <Textarea
              id="coachingPhilosophy"
              value={coachingPhilosophy}
              onChange={(e) => setCoachingPhilosophy(e.target.value)}
              placeholder="Describe your coaching philosophy, approach to training, and what you believe makes athletes successful..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This helps us understand your approach and can be shared with potential athletes.
            </p>
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
