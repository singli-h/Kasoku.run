"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">!</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Kasoku
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your comprehensive training platform for athletes and coaches. 
          Let's get you set up with a personalized experience.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <h3 className="font-semibold text-sm">Choose Your Role</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Athlete or Coach - we'll customize your experience
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <h3 className="font-semibold text-sm">Share Your Details</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Help us understand your goals and experience
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <h3 className="font-semibold text-sm">Start Training</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Access your personalized dashboard and tools
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={onNext}
            size="lg"
            className="min-w-[200px]"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
} 