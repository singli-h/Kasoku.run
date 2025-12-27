"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Check, Star, Zap } from "lucide-react"
import { OnboardingData } from "../onboarding-wizard"

interface SubscriptionStepProps {
  userData: OnboardingData
  updateUserData: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

export function SubscriptionStep({ userData, updateUserData, onNext, onPrev }: SubscriptionStepProps) {
  const handleSubscriptionSelect = (subscription: "free" | "paid") => {
    updateUserData({ subscription })
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Choose your plan
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start with our free plan and upgrade anytime as your training needs grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            userData.subscription === "free" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:ring-1 hover:ring-primary/50"
          }`}
          onClick={() => handleSubscriptionSelect("free")}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Free Plan</CardTitle>
            <CardDescription>
              Perfect for getting started with basic training tracking
            </CardDescription>
            <div className="text-3xl font-bold text-foreground mt-4">
              $0<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Basic workout tracking</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Performance analytics</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Training calendar</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Mobile app access</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Community support</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Great for individual athletes and new coaches
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
            userData.subscription === "paid" 
              ? "ring-2 ring-primary bg-primary/5" 
              : "hover:ring-1 hover:ring-primary/50"
          }`}
          onClick={() => handleSubscriptionSelect("paid")}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              POPULAR
            </span>
          </div>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Pro Plan</CardTitle>
            <CardDescription>
              Advanced features for serious athletes and professional coaches
            </CardDescription>
            <div className="text-3xl font-bold text-foreground mt-4">
              $19<span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Everything in Free</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Advanced periodization</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Team management tools</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Custom training templates</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">Priority support</span>
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-primary mr-3" />
                <span className="text-sm">API access</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Perfect for coaches managing multiple athletes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">
          You can upgrade or downgrade your plan at any time. No long-term commitments.
        </p>
      </div>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={onNext}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 