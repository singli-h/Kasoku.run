"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, User, Target, Calendar } from "lucide-react"
import { OnboardingData } from "../onboarding-wizard"

interface AthleteDetailsStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

// Common track and field events
const EVENTS = [
  "100m", "200m", "400m", "800m", "1500m", "5000m", "10000m", "Marathon",
  "110m Hurdles", "400m Hurdles", "3000m Steeplechase",
  "High Jump", "Pole Vault", "Long Jump", "Triple Jump",
  "Shot Put", "Discus", "Hammer", "Javelin",
  "Decathlon", "Heptathlon"
]

export function AthleteDetailsStep({ userData, updateUserData, onNext, onPrev }: AthleteDetailsStepProps) {
  const handleEventToggle = (event: string, checked: boolean) => {
    const currentEvents = userData.events || []
    if (checked) {
      updateUserData({ events: [...currentEvents, event] })
    } else {
      updateUserData({ events: currentEvents.filter(e => e !== event) })
    }
  }

  const canProceed = userData.firstName && userData.lastName

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

      <div className="max-w-2xl mx-auto space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate">Date of Birth</Label>
              <Input
                id="birthdate"
                type="date"
                value={userData.birthdate}
                onChange={(e) => updateUserData({ birthdate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={userData.height}
                onChange={(e) => updateUserData({ height: e.target.value })}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={userData.weight}
                onChange={(e) => updateUserData({ weight: e.target.value })}
                placeholder="70"
              />
            </div>
          </div>
        </div>

        {/* Training Background */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Training Background
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trainingHistory">Training Experience</Label>
              <Textarea
                id="trainingHistory"
                value={userData.trainingHistory}
                onChange={(e) => updateUserData({ trainingHistory: e.target.value })}
                placeholder="Tell us about your training background, years of experience, previous coaches, etc."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainingGoals">Training Goals</Label>
              <Textarea
                id="trainingGoals"
                value={userData.trainingGoals}
                onChange={(e) => updateUserData({ trainingGoals: e.target.value })}
                placeholder="What are your current training goals? What do you want to achieve?"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Your Events
          </h3>
          <p className="text-sm text-muted-foreground">
            Select the events you compete in or are interested in training for.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {EVENTS.map((event) => (
              <div key={event} className="flex items-center space-x-2">
                <Checkbox
                  id={event}
                  checked={userData.events?.includes(event) || false}
                  onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
                />
                <Label htmlFor={event} className="text-sm font-normal">
                  {event}
                </Label>
              </div>
            ))}
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