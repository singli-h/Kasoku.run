/**
 * MesoWizard - Enhanced Main Component
 * Multi-step wizard for creating comprehensive training plans with improved UX
 */

"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  CheckCircle,
  MapPin,
  Calendar,
  Target,
  Users,
  AlertCircle,
  Save,
  RefreshCw,
  Clock,
  BookOpen,
  ChevronRight,
  Info,
  Sparkles
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

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
  icon: React.ComponentType<any>
  isCompleted: boolean
  isActive: boolean
  validationErrors?: string[]
  helpText: string
}

interface MesoWizardState {
  planType: PlanType | null
  configuration: PlanConfigurationType | null
  sessionPlan: SessionPlan | null
  isLoading: boolean
  errors: Record<string, string[]>
  hasUnsavedChanges: boolean
  lastSaved?: Date
}

const WIZARD_STEPS = [
  {
    id: 'plan-type',
    title: 'Plan Type',
    description: 'Choose your training plan structure',
    icon: Target,
    helpText: 'Select the type of training plan that best fits your goals and timeline.'
  },
  {
    id: 'configuration',
    title: 'Configuration',
    description: 'Set plan details and parameters',
    icon: Calendar,
    helpText: 'Configure your plan duration, intensity, and specific goals.'
  },
  {
    id: 'session-planning',
    title: 'Session Planning',
    description: 'Design your training sessions',
    icon: Users,
    helpText: 'Create detailed training sessions with exercises and progressions.'
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Confirm and create your plan',
    icon: CheckCircle,
    helpText: 'Review all details and finalize your comprehensive training plan.'
  }
] as const

const ANIMATION_VARIANTS = {
  slideIn: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  fadeIn: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }
}

export function MesoWizard() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardState, setWizardState] = useState<MesoWizardState>({
    planType: null,
    configuration: null,
    sessionPlan: null,
    isLoading: false,
    errors: {},
    hasUnsavedChanges: false
  })

  // Auto-save functionality with debouncing
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (wizardState.hasUnsavedChanges) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(saveInterval)
  }, [wizardState.hasUnsavedChanges])

  // Handle auto-save with better error handling
  const handleAutoSave = useCallback(async () => {
    try {
      // Save to localStorage as backup
      const saveData = {
        ...wizardState,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem('mesowizard_draft', JSON.stringify(saveData))
      
      setWizardState(prev => ({ 
        ...prev, 
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }))
      
      // Show subtle save indication
      toast({
        title: "Progress Saved",
        description: "Your work has been automatically saved.",
        variant: "default",
        duration: 2000
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
      toast({
        title: "Auto-save Failed",
        description: "Unable to save progress. Please save manually.",
        variant: "destructive",
        duration: 3000
      })
    }
  }, [wizardState, toast])

  // Load draft from localStorage on mount with better error handling
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('mesowizard_draft')
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (draft.planType || draft.configuration || draft.sessionPlan) {
          setWizardState(prev => ({ ...prev, ...draft }))
          toast({
            title: "Draft Restored",
            description: "Your previous work has been restored.",
            variant: "default"
          })
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
      toast({
        title: "Draft Load Failed",
        description: "Unable to restore previous work.",
        variant: "destructive"
      })
    }
  }, [toast])

  // Enhanced validation for each step with comprehensive checks
  const validateStep = useCallback((stepIndex: number): string[] => {
    const errors: string[] = []
    
    switch (stepIndex) {
      case 0: // Plan Type Selection
        if (!wizardState.planType) {
          errors.push('Please select a plan type')
        }
        break
      case 1: // Plan Configuration
        if (!wizardState.configuration) {
          errors.push('Plan configuration is required')
        } else {
          const config = wizardState.configuration
          if (!config.name?.trim()) {
            errors.push('Plan name is required')
          }
          if (config.name && config.name.trim().length < 3) {
            errors.push('Plan name must be at least 3 characters')
          }
          if (!config.intensity?.primaryGoal) {
            errors.push('Primary goal is required')
          }
          if (!config.intensity?.focusAreas?.length) {
            errors.push('At least one focus area is required')
          }
          if (!config.duration?.weeks || config.duration.weeks < 1) {
            errors.push('Valid duration is required')
          }
        }
        break
      case 2: // Session Planning
        if (!wizardState.sessionPlan) {
          errors.push('Session plan is required')
        } else {
          const plan = wizardState.sessionPlan
          const sessionsWithExercises = plan.sessions.filter(s => s.exercises.length > 0)
          if (sessionsWithExercises.length === 0) {
            errors.push('At least one session with exercises is required')
          }
          if (sessionsWithExercises.length < 2) {
            errors.push('At least 2 sessions are recommended for an effective plan')
          }
        }
        break
      case 3: // Review
        // Comprehensive validation happens in the review step
        break
    }
    
    return errors
  }, [wizardState])

  // Calculate progress with validation status
  const progressInfo = useMemo(() => {
    const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100
    const completedSteps = WIZARD_STEPS.filter((_, index) => index < currentStep).length
    const totalSteps = WIZARD_STEPS.length
    
    return {
      percentage: progress,
      completed: completedSteps,
      total: totalSteps,
      remaining: totalSteps - completedSteps - 1
    }
  }, [currentStep])

  // Check if current step is valid
  const isCurrentStepValid = useCallback(() => {
    const errors = validateStep(currentStep)
    return errors.length === 0
  }, [currentStep, validateStep])

  // Handle plan type selection with validation
  const handlePlanTypeSelect = useCallback((planType: PlanType) => {
    setWizardState(prev => ({ 
      ...prev, 
      planType, 
      hasUnsavedChanges: true,
      errors: { ...prev.errors, planType: [] }
    }))
  }, [])

  // Handle plan configuration with validation
  const handlePlanConfigChange = useCallback((configuration: PlanConfigurationType) => {
    setWizardState(prev => ({ 
      ...prev, 
      configuration, 
      hasUnsavedChanges: true,
      errors: { ...prev.errors, configuration: [] }
    }))
  }, [])

  // Handle session plan changes with validation
  const handleSessionPlanChange = useCallback((sessionPlan: SessionPlan) => {
    setWizardState(prev => ({ 
      ...prev, 
      sessionPlan, 
      hasUnsavedChanges: true,
      errors: { ...prev.errors, sessionPlan: [] }
    }))
  }, [])

  // Enhanced navigation with validation
  const handleNext = useCallback(() => {
    const errors = validateStep(currentStep)
    
    if (errors.length > 0) {
      setWizardState(prev => ({
        ...prev,
        errors: { ...prev.errors, [currentStep]: errors }
      }))
      
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive"
      })
      return
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      setWizardState(prev => ({
        ...prev,
        errors: { ...prev.errors, [currentStep]: [] }
      }))
    }
  }, [currentStep, validateStep, toast])

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  // Handle final submission with comprehensive validation
  const handleSubmit = useCallback(async () => {
    setWizardState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Validate all steps before submission
      const allErrors: string[] = []
      for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
        const stepErrors = validateStep(i)
        allErrors.push(...stepErrors)
      }
      
      if (allErrors.length > 0) {
        throw new Error(`Validation failed: ${allErrors.join(', ')}`)
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Here you would implement the actual submission logic
      // await submitPlanAction(wizardState)
      
      toast({
        title: "Plan Created Successfully!",
        description: "Your training plan has been created and saved.",
        variant: "default"
      })
      
      // Clear draft after successful submission
      localStorage.removeItem('mesowizard_draft')
      
      // Reset wizard state
      setWizardState({
        planType: null,
        configuration: null,
        sessionPlan: null,
        isLoading: false,
        errors: {},
        hasUnsavedChanges: false
      })
      
    } catch (error) {
      console.error('Submission failed:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to create plan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setWizardState(prev => ({ ...prev, isLoading: false }))
    }
  }, [validateStep, toast, wizardState])

  // Handle step editing from review
  const handleEditStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex)
  }, [])

  // Render current step content with enhanced error handling
  const renderStepContent = () => {
    const stepErrors = wizardState.errors[currentStep] || []
    
    const commonProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      isLoading: wizardState.isLoading
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {stepErrors.length > 0 && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="space-y-1">
                    {stepErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <PlanTypeSelection
              selectedPlanType={wizardState.planType}
              onPlanTypeSelect={handlePlanTypeSelect}
              {...commonProps}
            />
          </div>
        )
      case 1:
        if (!wizardState.planType) {
          return (
            <div className="text-center py-16 space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Plan Type Required</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please select a plan type before proceeding to configuration.
                </p>
              </div>
              <Button variant="outline" onClick={handlePrevious} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )
        }
        return (
          <div className="space-y-6">
            {stepErrors.length > 0 && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="space-y-1">
                    {stepErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <PlanConfiguration
              planType={wizardState.planType}
              configuration={wizardState.configuration}
              onConfigurationChange={handlePlanConfigChange}
              {...commonProps}
            />
          </div>
        )
      case 2:
        if (!wizardState.planType || !wizardState.configuration) {
          return (
            <div className="text-center py-16 space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Previous Steps Required</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Plan type and configuration are required for session planning.
                </p>
              </div>
              <Button variant="outline" onClick={handlePrevious} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          )
        }
        
        return (
          <div className="space-y-6">
            {stepErrors.length > 0 && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="space-y-1">
                    {stepErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <SessionPlanning
              planType={wizardState.planType}
              configuration={wizardState.configuration}
              sessionPlan={wizardState.sessionPlan}
              onSessionPlanChange={handleSessionPlanChange}
              {...commonProps}
            />
          </div>
        )
      case 3:
        if (!wizardState.planType || !wizardState.configuration || !wizardState.sessionPlan) {
          return (
            <div className="text-center py-16 space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Complete All Steps</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  All previous steps must be completed before reviewing your plan.
                </p>
              </div>
              <Button variant="outline" onClick={handlePrevious} className="mt-4">
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
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            onEdit={handleEditStep}
            isLoading={wizardState.isLoading}
          />
        )
      default:
        return (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This step will be implemented in future updates.
              </p>
            </div>
            <Button variant="outline" onClick={handlePrevious} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                MesoWizard
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Create comprehensive training plans with intelligent guidance and professional-grade structure
            </p>
          </motion.div>
          
          {/* Enhanced status indicators */}
          <div className="flex items-center justify-center gap-4 text-sm">
            {wizardState.hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Auto-saving...</span>
              </motion.div>
            )}
            {wizardState.lastSaved && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                <Save className="h-3 w-3" />
                <span>Last saved: {wizardState.lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Progress Section */}
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {WIZARD_STEPS[currentStep].helpText}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {Math.round(progressInfo.percentage)}% Complete
                </Badge>
                {wizardState.hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Save className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{progressInfo.completed} completed</span>
                <span>{progressInfo.remaining} remaining</span>
              </div>
              <Progress value={progressInfo.percentage} className="h-3" />
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Step Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentStep
            const isActive = index === currentStep
            const hasErrors = wizardState.errors[index]?.length > 0
            const isAccessible = index <= currentStep

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`group cursor-pointer ${isAccessible ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                onClick={() => isAccessible && setCurrentStep(index)}
              >
                <Card className={`transition-all duration-300 ${
                  isActive 
                    ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg' 
                    : isCompleted 
                      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                      : hasErrors
                        ? 'border-red-200 bg-red-50 hover:bg-red-100'
                        : 'border-muted bg-muted/20 hover:bg-muted/30'
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`relative p-3 rounded-full transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isActive 
                            ? 'bg-primary/15 text-primary' 
                            : hasErrors
                              ? 'bg-red-100 text-red-600'
                              : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : hasErrors ? (
                          <AlertCircle className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                        {isActive && (
                          <div className="absolute -inset-1 bg-primary/20 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">{step.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.description}
                        </p>
                        {isAccessible && (
                          <div className="flex items-center justify-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            {index < currentStep ? 'Edit' : index === currentStep ? 'Current' : 'Next'}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Enhanced Step Content */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={ANIMATION_VARIANTS.slideIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Enhanced Plan Summary */}
        {wizardState.planType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-xl p-6 border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-lg">
                  Current Plan: {wizardState.planType.charAt(0).toUpperCase() + wizardState.planType.slice(1)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {wizardState.configuration && (
                    <>
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{wizardState.configuration.name || 'Unnamed Plan'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Duration:</span>
                        <span>{wizardState.configuration.duration.weeks} weeks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Goal:</span>
                        <span>{wizardState.configuration.intensity.primaryGoal || 'Not set'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
} 