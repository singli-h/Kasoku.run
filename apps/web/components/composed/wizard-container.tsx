/*
<ai_context>
Reusable wizard container component for multi-step processes like MesoWizard.
Based on patterns from the original Kasoku web_old MesoWizard implementation.
</ai_context>
*/

"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WizardStep {
  id: string
  title: string
  description?: string
}

interface WizardContainerProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange?: (step: number) => void
  onNext?: () => void
  onPrevious?: () => void
  onComplete?: () => void
  children: React.ReactNode
  title: string
  description?: string
  isLoading?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  nextLabel?: string
  previousLabel?: string
  isLastStep?: boolean
  showProgress?: boolean
  className?: string
}

export function WizardContainer({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onComplete,
  children,
  title,
  description,
  isLoading = false,
  canGoNext = true,
  canGoPrevious = true,
  nextLabel = "Next",
  previousLabel = "Previous",
  isLastStep = false,
  showProgress = true,
  className = ""
}: WizardContainerProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete()
    } else if (onNext) {
      onNext()
    }
  }

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
    }
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isClickable = onStepChange && (isCompleted || isActive)

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepChange(stepNumber)}
                disabled={!isClickable}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                  }
                  ${isClickable ? "hover:opacity-80 cursor-pointer" : "cursor-default"}
                `}
              >
                {stepNumber}
              </button>
              
              <div className="ml-2 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-2 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          {steps[currentStep - 1]?.description && (
            <p className="text-muted-foreground">
              {steps[currentStep - 1].description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={!canGoPrevious || currentStep === 1 || isLoading}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{previousLabel}</span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canGoNext || isLoading}
          className="flex items-center space-x-2"
        >
          <span>{isLastStep ? "Complete" : nextLabel}</span>
          {!isLastStep && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
} 