/**
 * MesoWizard - Training Plan Creation Wizard
 * Orchestrates the multi-step plan creation flow
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlanTypeSelection, type PlanType } from "./plan-type-selection"
import { PlanConfiguration } from "./PlanConfiguration"
import { SessionPlanning } from "./session-planning"
import { PlanReview } from "./PlanReview"
import type { PlanData } from "./types"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type WizardStep = 'type' | 'config' | 'sessions' | 'review'

export function MesoWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('type')
  const [planData, setPlanData] = useState<Partial<PlanData>>({})

  const steps: WizardStep[] = ['type', 'config', 'sessions', 'review']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleTypeSelection = (type: PlanType) => {
    setPlanData({ ...planData, type })
    setCurrentStep('config')
  }

  const handleConfigComplete = (config: Partial<PlanData>) => {
    setPlanData({ ...planData, ...config })
    setCurrentStep('sessions')
  }

  const handleSessionsComplete = (sessions: any[]) => {
    setPlanData({ ...planData, sessions })
    setCurrentStep('review')
  }

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleCancel = () => {
    router.push('/plans')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </h2>
          <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Navigation */}
      {currentStep !== 'type' && (
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-background rounded-lg">
        {currentStep === 'type' && (
          <PlanTypeSelection
            onSelect={handleTypeSelection}
            onCancel={handleCancel}
          />
        )}

        {currentStep === 'config' && planData.type && (
          <PlanConfiguration
            planType={planData.type}
            onComplete={handleConfigComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 'sessions' && planData.type && (
          <SessionPlanning
            planType={planData.type}
            planData={planData as PlanData}
            onComplete={handleSessionsComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 'review' && (
          <PlanReview
            planData={planData as PlanData}
            onBack={handleBack}
            onComplete={() => router.push('/plans')}
          />
        )}
      </div>
    </div>
  )
}
