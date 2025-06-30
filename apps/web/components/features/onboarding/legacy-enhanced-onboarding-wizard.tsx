/*
<ai_context>
Enhanced multi-step onboarding wizard for Kasoku running/fitness platform.
Based on patterns from the original web_old onboarding system.
Includes role selection, profile setup, and goal configuration.
</ai_context>
*/

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardContainer } from "@/components/composed/wizard-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { completeOnboardingAction } from "@/actions/auth/user-actions"
import { 
  Activity, 
  Users, 
  Target, 
  Calendar,
  TrendingUp,
  X
} from "lucide-react"
import { motion } from "framer-motion"

interface OnboardingData {
  role: 'athlete' | 'coach' | null
  firstName: string
  lastName: string
  birthdate: string
  height: string
  weight: string
  experience: string
  goals: string[]
  specializations: string[]
  bio: string
}

const wizardSteps = [
  {
    id: "role",
    title: "Role Selection",
    description: "Choose your primary role"
  },
  {
    id: "profile",
    title: "Profile Setup",
    description: "Basic information"
  },
  {
    id: "details",
    title: "Additional Details",
    description: "Experience and goals"
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "Review and complete"
  }
]

const commonGoals = [
  "Weight Loss", "Muscle Gain", "Endurance", "Strength", 
  "Flexibility", "Competition Prep", "General Fitness", "Injury Recovery"
]

const coachSpecializations = [
  "Running", "Strength Training", "Powerlifting", "Olympic Lifting",
  "Bodybuilding", "CrossFit", "Yoga", "Pilates", "Sports Performance"
]

export default function EnhancedOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    role: null,
    firstName: "",
    lastName: "",
    birthdate: "",
    height: "",
    weight: "",
    experience: "",
    goals: [],
    specializations: [],
    bio: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
    // Clear related errors when data is updated
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key]
    })
    setErrors(newErrors)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1: // Role Selection
        if (!data.role) {
          newErrors.role = "Please select your role"
        }
        break
      
      case 2: // Profile Setup
        if (!data.firstName.trim()) newErrors.firstName = "First name is required"
        if (!data.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!data.birthdate) newErrors.birthdate = "Birthdate is required"
        if (data.role === 'athlete') {
          if (!data.height) newErrors.height = "Height is required"
          else if (isNaN(Number(data.height)) || Number(data.height) < 100 || Number(data.height) > 250) {
            newErrors.height = "Height must be between 100-250 cm"
          }
          if (!data.weight) newErrors.weight = "Weight is required"
          else if (isNaN(Number(data.weight)) || Number(data.weight) < 30 || Number(data.weight) > 200) {
            newErrors.weight = "Weight must be between 30-200 kg"
          }
        }
        break
      
      case 3: // Additional Details
        if (!data.experience.trim()) {
          newErrors.experience = data.role === 'athlete' 
            ? "Training experience is required" 
            : "Coaching experience is required"
        }
        if (data.goals.length === 0 && data.role === 'athlete') {
          newErrors.goals = "Please select at least one goal"
        }
        if (data.specializations.length === 0 && data.role === 'coach') {
          newErrors.specializations = "Please select at least one specialization"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      // For now, we'll use the existing completeOnboardingAction
      // In the future, this could be enhanced to save role and additional data
      const result = await completeOnboardingAction(data.firstName, data.lastName)
      
      if (result.isSuccess) {
        toast({
          title: "Welcome to Kasoku!",
          description: "Your profile has been set up successfully.",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string, setter: (items: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item))
    } else {
      setter([...array, item])
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Role Selection
        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold">I am a...</h2>
              <p className="text-muted-foreground">
                Select your role to personalize your experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  id: "athlete",
                  title: "Athlete",
                  description: "Track your performance, set goals, and follow training plans",
                  icon: Activity,
                },
                {
                  id: "coach",
                  title: "Coach", 
                  description: "Manage athletes, analyze performance data, and create training plans",
                  icon: Users,
                },
              ].map((role) => {
                const Icon = role.icon
                const isSelected = data.role === role.id
                return (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => updateData({ role: role.id as 'athlete' | 'coach' })}
                    >
                      <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-full transition-colors ${
                            isSelected 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{role.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
            
            {errors.role && (
              <p className="text-sm text-destructive text-center">{errors.role}</p>
            )}
          </div>
        )

      case 2: // Profile Setup
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Profile Setup</h2>
              <p className="text-muted-foreground">
                Tell us about yourself
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Birthdate</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={data.birthdate}
                    onChange={(e) => updateData({ birthdate: e.target.value })}
                    className={errors.birthdate ? "border-destructive" : ""}
                  />
                  {errors.birthdate && <p className="text-sm text-destructive">{errors.birthdate}</p>}
                </div>

                {data.role === 'athlete' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="175"
                        value={data.height}
                        onChange={(e) => updateData({ height: e.target.value })}
                        className={errors.height ? "border-destructive" : ""}
                      />
                      {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="70"
                        value={data.weight}
                        onChange={(e) => updateData({ weight: e.target.value })}
                        className={errors.weight ? "border-destructive" : ""}
                      />
                      {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )

      case 3: // Additional Details
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {data.role === 'athlete' ? 'Training Experience' : 'Coaching Experience'}
              </h2>
              <p className="text-muted-foreground">
                Help us understand your background
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="experience">
                  {data.role === 'athlete' ? 'Training Experience' : 'Coaching Experience'}
                </Label>
                <Textarea
                  id="experience"
                  placeholder={data.role === 'athlete' 
                    ? "Tell us about your training background, experience level, and any previous sports..."
                    : "Describe your coaching experience, certifications, and areas of expertise..."
                  }
                  value={data.experience}
                  onChange={(e) => updateData({ experience: e.target.value })}
                  className={errors.experience ? "border-destructive" : ""}
                  rows={4}
                />
                {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
              </div>

              {data.role === 'athlete' && (
                <div className="space-y-3">
                  <Label>Training Goals</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonGoals.map((goal) => (
                      <Badge
                        key={goal}
                        variant={data.goals.includes(goal) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(
                          data.goals, 
                          goal, 
                          (goals) => updateData({ goals })
                        )}
                      >
                        {goal}
                        {data.goals.includes(goal) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {errors.goals && <p className="text-sm text-destructive">{errors.goals}</p>}
                </div>
              )}

              {data.role === 'coach' && (
                <div className="space-y-3">
                  <Label>Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {coachSpecializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant={data.specializations.includes(spec) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(
                          data.specializations, 
                          spec, 
                          (specializations) => updateData({ specializations })
                        )}
                      >
                        {spec}
                        {data.specializations.includes(spec) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {errors.specializations && <p className="text-sm text-destructive">{errors.specializations}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit more about yourself..."
                  value={data.bio}
                  onChange={(e) => updateData({ bio: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 4: // Confirmation
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Almost Done!</h2>
              <p className="text-muted-foreground">
                Review your information and complete your profile
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  {data.role === 'athlete' ? (
                    <Activity className="w-5 h-5 text-primary" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{data.firstName} {data.lastName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{data.role}</p>
                  </div>
                </div>

                {data.role === 'athlete' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Height:</span> {data.height} cm
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weight:</span> {data.weight} kg
                    </div>
                  </div>
                )}

                {data.goals.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Goals:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.goals.map((goal) => (
                        <Badge key={goal} variant="secondary" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {data.specializations.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <WizardContainer
      steps={wizardSteps}
      currentStep={currentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onComplete={handleComplete}
      title="Welcome to Kasoku"
      description="Let's set up your profile to get started"
      isLoading={isSubmitting}
      canGoNext={currentStep < wizardSteps.length}
      canGoPrevious={currentStep > 1}
      isLastStep={currentStep === wizardSteps.length}
      className="max-w-2xl"
    >
      {renderStepContent()}
    </WizardContainer>
  )
} 