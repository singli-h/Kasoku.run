"use client"

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStep } from '../types'

interface WizardProgressProps {
  steps: WizardStep[]
  onStepClick?: (stepId: number) => void
}

export function WizardProgress({ steps, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                step.isCompleted && "bg-primary border-primary text-primary-foreground",
                step.isActive && !step.isCompleted && "border-primary bg-background text-primary",
                !step.isActive && !step.isCompleted && "border-muted-foreground/30 bg-background text-muted-foreground",
                onStepClick && (step.isCompleted || step.isActive) && "cursor-pointer hover:opacity-80"
              )}
              onClick={() => {
                if (onStepClick && (step.isCompleted || step.isActive)) {
                  onStepClick(step.id)
                }
              }}
            >
              {step.isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>

            {/* Step Details */}
            <div className="ml-3 flex-1">
              <div className={cn(
                "text-sm font-medium",
                step.isActive && "text-primary",
                step.isCompleted && "text-foreground",
                !step.isActive && !step.isCompleted && "text-muted-foreground"
              )}>
                {step.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-4",
                step.isCompleted ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 