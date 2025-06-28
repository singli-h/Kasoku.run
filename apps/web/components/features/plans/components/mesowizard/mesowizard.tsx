/**
 * MesoWizard - Main Component
 * Multi-step wizard for creating comprehensive training plans
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  CheckCircle,
  MapPin,
  Calendar,
  Target,
  Users
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

// Step Components
import { PlanTypeSelection, type PlanType } from "./plan-type-selection"
import { PlanConfiguration, type PlanConfiguration as PlanConfigurationType } from "./plan-configuration"
import { SessionPlanning, type SessionPlan } from "./session-planning"
import { PlanReview } from "./plan-review"

// Types
interface WizardStep {
  id: string
  title: string
  description: string
  component: React.ReactNode
  isCompleted: boolean
  isActive: boolean
}

interface MesoWizardState {
  planType: PlanType | null
  configuration: PlanConfigurationType | null
  sessionPlan: SessionPlan | null
  // Future steps will add more state properties
}

const WIZARD_STEPS = [
  {
    id: 'plan-type',
    title: 'Plan Type',
    description: 'Choose your training plan structure',
    icon: Target
  },
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Plan details and duration',
    icon: Calendar
  },
  {
    id: 'athlete-assignment',
    title: 'Athlete Assignment',
    description: 'Assign to athletes or groups',
    icon: Users
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Confirm and create your plan',
    icon: CheckCircle
  }
]

export function MesoWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardState, setWizardState] = useState<MesoWizardState>({
    planType: null,
    configuration: null,
    sessionPlan: null
  })

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  // Handle plan type selection
  const handlePlanTypeSelect = (planType: PlanType) => {
    setWizardState(prev => ({ ...prev, planType }))
  }

  // Handle plan configuration
  const handlePlanConfigChange = (configuration: PlanConfigurationType) => {
    setWizardState(prev => ({ ...prev, configuration }))
  }

  // Handle session plan changes
  const handleSessionPlanChange = (sessionPlan: SessionPlan) => {
    setWizardState(prev => ({ ...prev, sessionPlan }))
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Check if current step is completed
  const isCurrentStepCompleted = () => {
    switch (currentStep) {
      case 0: // Plan Type Selection
        return wizardState.planType !== null
      case 1: // Plan Configuration
        return wizardState.configuration !== null && 
               wizardState.configuration.name.trim() !== '' &&
               wizardState.configuration.intensity.primaryGoal !== '' &&
               wizardState.configuration.intensity.focusAreas.length > 0
      case 2: // Session Planning
        return wizardState.sessionPlan !== null &&
               wizardState.sessionPlan.sessions.some(s => s.exercises.length > 0)
      default:
        return false
    }
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PlanTypeSelection
            selectedPlanType={wizardState.planType}
            onPlanTypeSelect={handlePlanTypeSelect}
            onNext={handleNext}
          />
        )
      case 1:
        if (!wizardState.planType) {
          return (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Please select a plan type first</h3>
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )
        }
        return (
          <PlanConfiguration
            planType={wizardState.planType}
            configuration={wizardState.configuration}
            onConfigurationChange={handlePlanConfigChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 2:
        if (!wizardState.planType || !wizardState.configuration) {
          return (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Please complete previous steps</h3>
              <p className="text-muted-foreground mb-6">
                Plan type and configuration are required for session planning.
              </p>
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )
        }
        
        return (
          <SessionPlanning
            planType={wizardState.planType}
            configuration={wizardState.configuration}
            sessionPlan={wizardState.sessionPlan}
            onSessionPlanChange={handleSessionPlanChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 3:
        if (!wizardState.planType || !wizardState.configuration || !wizardState.sessionPlan) {
          return (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Please complete previous steps</h3>
              <p className="text-muted-foreground mb-6">
                All previous steps must be completed before reviewing your plan.
              </p>
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )
        }
        return (
          <PlanReview
            planType={wizardState.planType}
            configuration={wizardState.configuration}
            sessionPlan={wizardState.sessionPlan}
            onSubmit={() => {
              // Handle final plan submission
              console.log('Plan submitted successfully!')
              // You can add actual submission logic here
            }}
            onPrevious={handlePrevious}
            onEdit={(step: number) => {
              // Allow editing previous steps
              setCurrentStep(step)
            }}
          />
        )
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              This step will be implemented in future tasks.
            </p>
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          className="text-4xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          MesoWizard
        </motion.h1>
        <motion.p 
          className="text-xl text-muted-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Create comprehensive training plans with intelligent guidance
        </motion.p>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </CardTitle>
            <Badge variant="outline">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {WIZARD_STEPS[currentStep].description}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`transition-all duration-200 ${
                isActive 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : isCompleted 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-muted bg-muted/20'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-full ${
                      isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">{step.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Selected Plan Info */}
      {wizardState.planType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/30 rounded-lg p-4 border"
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-medium">
                Current Selection: {wizardState.planType.charAt(0).toUpperCase() + wizardState.planType.slice(1)}
              </h4>
              <p className="text-sm text-muted-foreground">
                You can change this selection by going back to the first step
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 