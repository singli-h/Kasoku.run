"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Users, Award, BookOpen } from "lucide-react"
import { OnboardingData } from "../onboarding-wizard"

interface CoachDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

// Common coaching specializations
const SPECIALIZATIONS = [
  "Sprints & Hurdles",
  "Middle Distance",
  "Long Distance",
  "Jumping Events",
  "Throwing Events",
  "Multi-Events",
  "General Track & Field",
  "Strength & Conditioning",
  "Youth Development",
  "Elite Performance"
]

// Experience levels
const EXPERIENCE_LEVELS = [
  "New Coach (0-1 years)",
  "Developing Coach (2-5 years)",
  "Experienced Coach (6-10 years)",
  "Veteran Coach (11-20 years)",
  "Master Coach (20+ years)"
]

export function CoachDetailsStep({ userData, updateUserData, onNext, onPrev }: CoachDetailsStepProps) {
  const canProceed = userData.firstName && userData.lastName

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

      <div className="max-w-2xl mx-auto space-y-6">
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
                value={userData.firstName}
                onChange={(e) => updateUserData({ firstName: e.target.value })}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={userData.lastName}
                onChange={(e) => updateUserData({ lastName: e.target.value })}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date of Birth</Label>
            <Input
              id="birthdate"
              type="date"
              value={userData.birthdate}
              onChange={(e) => updateUserData({ birthdate: e.target.value })}
            />
          </div>
        </div>

        {/* Coaching Background */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Coaching Background
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Primary Specialization</Label>
              <Select
                value={userData.specialization}
                onValueChange={(value) => updateUserData({ specialization: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your coaching specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Coaching Experience</Label>
              <Select
                value={userData.experience}
                onValueChange={(value) => updateUserData({ experience: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sportFocus">Sport Focus</Label>
              <Input
                id="sportFocus"
                value={userData.sportFocus}
                onChange={(e) => updateUserData({ sportFocus: e.target.value })}
                placeholder="e.g., Track & Field, Cross Country, Road Racing"
              />
            </div>
          </div>
        </div>

        {/* Coaching Philosophy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Coaching Philosophy
          </h3>
          <div className="space-y-2">
            <Label htmlFor="coachingPhilosophy">Your Coaching Philosophy</Label>
            <Textarea
              id="coachingPhilosophy"
              value={userData.coachingPhilosophy}
              onChange={(e) => updateUserData({ coachingPhilosophy: e.target.value })}
              placeholder="Describe your coaching philosophy, approach to training, and what you believe makes athletes successful..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This helps us understand your approach and can be shared with potential athletes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
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