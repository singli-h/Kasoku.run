"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Users, Trophy, User } from "lucide-react"
import { OnboardingData } from "../onboarding-wizard"

interface RoleSelectionStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

export function RoleSelectionStep({ userData, updateUserData, onNext, onPrev }: RoleSelectionStepProps) {
  const handleRoleSelect = (role: "athlete" | "coach" | "individual") => {
    updateUserData({ role })
  }

  const canProceed = userData.role !== ""

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          What's your role?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose your primary role to get a personalized experience. 
          You can always change this later in your settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Athlete Card */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            userData.role === "athlete"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:ring-1 hover:ring-primary/50"
          }`}
          onClick={() => handleRoleSelect("athlete")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Train with a Coach</CardTitle>
            <CardDescription>
              I'm an athlete working with a coach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Follow coach's training plans
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Log workouts and sessions
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Track performance metrics
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Card - Train Myself */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            userData.role === "individual"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:ring-1 hover:ring-primary/50"
          }`}
          onClick={() => handleRoleSelect("individual")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Train Myself</CardTitle>
            <CardDescription>
              I want to create my own training plans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Create your Training Blocks
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Log workouts with AI assistance
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Track your own progress
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Card */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            userData.role === "coach"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:ring-1 hover:ring-primary/50"
          }`}
          onClick={() => handleRoleSelect("coach")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Coach Athletes</CardTitle>
            <CardDescription>
              I manage athletes and create programs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Manage athlete groups
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Create training plans
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                Analyze performance data
              </div>
            </div>
          </CardContent>
        </Card>
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