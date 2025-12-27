"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Sparkles } from "lucide-react"

interface CompletionStepProps {
  onComplete: () => void
  isSubmitting: boolean
}

export function CompletionStep({ onComplete, isSubmitting }: CompletionStepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            You're all set!
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Welcome to Kasoku! Your account has been configured and you're ready to start your training journey.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 max-w-lg mx-auto">
          <h3 className="font-semibold text-foreground mb-4">What happens next?</h3>
          <div className="space-y-3 text-sm text-muted-foreground text-left">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 shrink-0" />
              <span>Your personalized dashboard will be prepared</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 shrink-0" />
              <span>You'll have access to all the features for your plan</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 shrink-0" />
              <span>You can start tracking workouts immediately</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 shrink-0" />
              <span>Check your email for additional setup tips</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={onComplete}
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up your account...
            </>
          ) : (
            <>
              Complete Setup
              <Sparkles className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        
        {isSubmitting && (
          <p className="text-xs text-muted-foreground">
            This may take a few moments while we configure your account.
          </p>
        )}
      </div>
    </div>
  )
} 