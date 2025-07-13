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
  Sparkles,
  List,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Step Components
import { PlanTypeSelection, type PlanType } from "./plan-type-selection"
import { PlanConfiguration, type PlanConfiguration as PlanConfigurationType } from "./plan-configuration"
import { SessionPlanning, type SessionPlan } from "./session-planning"
import { PlanReview } from "./plan-review"

// Actions
import { 
  getMacrocyclesAction, 
  getMesocyclesByMacrocycleAction, 
  getMicrocyclesByMesocycleAction,
  deleteMacrocycleAction,
  deleteMesocycleAction,
  deleteMicrocycleAction
} from "@/actions/training/training-plan-actions"

// Types
import { MacrocycleWithDetails, MesocycleWithDetails, MicrocycleWithDetails } from "@/types/training"

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

interface ExistingPlansState {
  macrocycles: MacrocycleWithDetails[]
  mesocycles: MesocycleWithDetails[]
  microcycles: MicrocycleWithDetails[]
  isLoading: boolean
  error: string | null
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

// Error Boundary Component
function PlanErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (error: Error) => {
      setHasError(true)
      setError(error)
    }

    window.addEventListener('error', (e) => handleError(e.error))
    window.addEventListener('unhandledrejection', (e) => handleError(new Error(e.reason)))

    return () => {
      window.removeEventListener('error', (e) => handleError(e.error))
      window.removeEventListener('unhandledrejection', (e) => handleError(new Error(e.reason)))
    }
  }, [])

  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while loading the plan wizard. Please refresh the page and try again.
            {error && (
              <details className="mt-4 text-sm">
                <summary>Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

// Existing Plans Viewer Component
function ExistingPlansViewer({ existingPlans, onRefresh, onDelete, onEdit }: {
  existingPlans: ExistingPlansState
  onRefresh: () => void
  onDelete: (type: PlanType, id: number) => void
  onEdit: (type: PlanType, plan: any) => void
}) {
  const { toast } = useToast()

  const handleDelete = async (type: PlanType, id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      let result
      if (type === 'macrocycle') {
        result = await deleteMacrocycleAction(id)
      } else if (type === 'mesocycle') {
        result = await deleteMesocycleAction(id)
      } else if (type === 'microcycle') {
        result = await deleteMicrocycleAction(id)
      }

      if (result?.isSuccess) {
        toast({
          title: "Plan Deleted",
          description: `${name} has been deleted successfully.`,
          variant: "default"
        })
        onRefresh()
      } else {
        throw new Error(result?.message || "Failed to delete plan")
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete plan",
        variant: "destructive"
      })
    }
  }

  const PlanCard = ({ plan, type }: { plan: any, type: PlanType }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              type === 'macrocycle' ? 'bg-blue-100 text-blue-700' :
              type === 'mesocycle' ? 'bg-green-100 text-green-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {type === 'macrocycle' ? <Calendar className="h-4 w-4" /> :
               type === 'mesocycle' ? <Target className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant={type === 'macrocycle' ? 'default' : type === 'mesocycle' ? 'secondary' : 'outline'}>
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        )}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(type, plan)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(type, plan.id, plan.name)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (existingPlans.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Training Plans</h3>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (existingPlans.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load existing plans: {existingPlans.error}
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const allPlans = [
    ...existingPlans.macrocycles.map(p => ({ ...p, type: 'macrocycle' as const })),
    ...existingPlans.mesocycles.map(p => ({ ...p, type: 'mesocycle' as const })),
    ...existingPlans.microcycles.map(p => ({ ...p, type: 'microcycle' as const }))
  ].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Training Plans</h3>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {allPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Training Plans Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first training plan to get started with structured training.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {allPlans.map((plan) => (
            <PlanCard key={`${plan.type}-${plan.id}`} plan={plan} type={plan.type} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MesoWizard() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create')
  const [wizardState, setWizardState] = useState<MesoWizardState>({
    planType: null,
    configuration: null,
    sessionPlan: null,
    isLoading: false,
    errors: {},
    hasUnsavedChanges: false
  })

  const [existingPlans, setExistingPlans] = useState<ExistingPlansState>({
    macrocycles: [],
    mesocycles: [],
    microcycles: [],
    isLoading: false,
    error: null
  })

  // Load existing plans
  const loadExistingPlans = useCallback(async () => {
    setExistingPlans(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const macrocyclesResult = await getMacrocyclesAction()
      // For now, only load macrocycles (mesocycles and microcycles would need specific parent IDs)

      setExistingPlans(prev => ({
        ...prev,
        macrocycles: macrocyclesResult.isSuccess ? macrocyclesResult.data : [],
        mesocycles: [], // Would need to load these separately with parent IDs
        microcycles: [], // Would need to load these separately with parent IDs
        isLoading: false,
        error: !macrocyclesResult.isSuccess ? macrocyclesResult.message : null
      }))
    } catch (error) {
      setExistingPlans(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load plans"
      }))
    }
  }, [])

  // Load existing plans on mount
  useEffect(() => {
    loadExistingPlans()
  }, [loadExistingPlans])

  // Handle editing existing plan
  const handleEditExistingPlan = useCallback((type: PlanType, plan: any) => {
    setActiveTab('create')
    setWizardState({
      planType: type,
      configuration: {
        name: plan.name,
        description: plan.description || '',
        duration: {
          weeks: Math.ceil((new Date(plan.end_date).getTime() - new Date(plan.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate: plan.start_date,
          endDate: plan.end_date
        },
        intensity: {
          level: 5,
          focusAreas: [],
          primaryGoal: '',
          secondaryGoals: []
        },
        assignment: {
          type: 'individual',
          athleteIds: [],
          groupIds: plan.athlete_group_id ? [plan.athlete_group_id.toString()] : [],
          isTemplate: false
        },
        advanced: {
          autoProgression: true,
          deloadWeeks: type === 'macrocycle',
          customizations: plan.metadata || {}
        }
      },
      sessionPlan: null,
      isLoading: false,
      errors: {},
      hasUnsavedChanges: false
    })
    setCurrentStep(1) // Skip plan type selection
  }, [])

  // Handle deleting existing plan
  const handleDeleteExistingPlan = useCallback((type: PlanType, id: number) => {
    // This is handled in the ExistingPlansViewer component
    loadExistingPlans()
  }, [loadExistingPlans])

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
          // Convert lastSaved string back to Date object if it exists
          if (draft.lastSaved && typeof draft.lastSaved === 'string') {
            draft.lastSaved = new Date(draft.lastSaved)
          }
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

  // Handle final form submission to Supabase
  const handleSubmit = useCallback(async () => {
    if (!wizardState.planType || !wizardState.configuration || !wizardState.sessionPlan) {
      toast({
        title: "Incomplete Plan",
        description: "Please complete all steps before submitting.",
        variant: "destructive"
      })
      return
    }

    setWizardState(prev => ({ ...prev, isLoading: true }))

    try {
      // Import the training plan actions and session plan actions
      const { 
        createMacrocycleAction, 
        createMesocycleAction, 
        createMicrocycleAction 
      } = await import("@/actions/training/training-plan-actions")
      
      const { 
        saveSessionPlanAction 
      } = await import("@/actions/training/session-plan-actions")

      let result
      const { planType, configuration, sessionPlan } = wizardState

      // Create the appropriate plan type in Supabase using correct schema
      if (planType === 'macrocycle') {
        result = await createMacrocycleAction({
          name: configuration.name,
          description: configuration.description,
          start_date: configuration.duration.startDate,
          end_date: configuration.duration.endDate,
          athlete_group_id: configuration.assignment.groupIds[0] ? parseInt(configuration.assignment.groupIds[0]) : undefined
        })
      } else if (planType === 'mesocycle') {
        result = await createMesocycleAction({
          name: configuration.name,
          description: configuration.description,
          start_date: configuration.duration.startDate,
          end_date: configuration.duration.endDate,
          macrocycle_id: undefined, // Would need parent macrocycle selection
          metadata: {
            intensity: configuration.intensity,
            assignment: configuration.assignment
          }
        })
      } else if (planType === 'microcycle') {
        result = await createMicrocycleAction({
          name: configuration.name,
          description: configuration.description,
          start_date: configuration.duration.startDate,
          end_date: configuration.duration.endDate,
          mesocycle_id: undefined // Would need parent mesocycle selection
        })
      }

      if (result?.isSuccess) {
        let sessionsMessage = ""
        
        // Save session plans if they exist
        if (sessionPlan && sessionPlan.sessions.length > 0) {
          try {
            // Convert session plan data to the format expected by the action
            const sessionPlanData = {
              name: configuration.name,
              description: configuration.description,
              microcycleId: planType === 'microcycle' ? result.data.id : undefined,
              athleteGroupId: configuration.assignment.groupIds[0] ? parseInt(configuration.assignment.groupIds[0]) : undefined,
              sessions: sessionPlan.sessions.map(session => ({
                id: session.id,
                name: session.name,
                description: session.description,
                day: session.day,
                week: session.week,
                exercises: session.exercises.map(exercise => ({
                  id: exercise.id,
                  exerciseId: exercise.exerciseId,
                  order: exercise.order,
                  supersetId: exercise.supersetId,
                  sets: exercise.sets.map(set => ({
                    setIndex: set.setIndex,
                    reps: set.reps,
                    weight: set.weight,
                    rpe: set.rpe,
                    restTime: set.restTime,
                    distance: set.distance,
                    duration: set.duration,
                    power: set.power,
                    velocity: set.velocity,
                    effort: set.effort,
                    height: set.height,
                    resistance: set.resistance,
                    resistance_unit_id: set.resistance_unit_id,
                    tempo: set.tempo,
                    metadata: set.metadata,
                    notes: set.notes,
                    completed: set.completed
                  })),
                  notes: exercise.notes,
                  restTime: exercise.restTime
                })),
                estimatedDuration: session.estimatedDuration,
                focus: session.focus,
                notes: session.notes
              }))
            }

            const sessionResult = await saveSessionPlanAction(sessionPlanData)
            
            if (sessionResult.isSuccess) {
              sessionsMessage = ` with ${sessionResult.data.length} training sessions`
            } else {
              console.error('Failed to save session plans:', sessionResult.message)
              // Don't fail the whole operation, just warn
              toast({
                title: "Session Plans Warning",
                description: "Plan created but some sessions may not have saved correctly.",
                variant: "destructive"
              })
            }
          } catch (sessionError) {
            console.error('Error saving session plans:', sessionError)
            // Don't fail the whole operation
          }
        }
        
        // Clear draft from localStorage
        localStorage.removeItem('mesowizard_draft')
        
        toast({
          title: "Plan Created Successfully",
          description: `Your ${planType} has been created and saved to the database${sessionsMessage}.`,
          variant: "default"
        })

        // Reset wizard state
        setWizardState({
          planType: null,
          configuration: null,
          sessionPlan: null,
          isLoading: false,
          errors: {},
          hasUnsavedChanges: false
        })
        setCurrentStep(0)
        
        // Refresh existing plans to show the new one
        await loadExistingPlans()
      } else {
        throw new Error(result?.message || "Failed to create plan")
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
      toast({
        title: "Plan Creation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setWizardState(prev => ({ ...prev, isLoading: false }))
    }
  }, [wizardState, toast, loadExistingPlans])

  // Handle editing a specific step
  const handleEditStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
      setCurrentStep(stepIndex)
    }
  }, [])

  // Enhanced step validation
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
          if (!config.duration?.startDate) {
            errors.push('Start date is required')
          }
          if (!config.duration?.endDate) {
            errors.push('End date is required')
          }
        }
        break
      case 2: // Session Planning
        if (!wizardState.sessionPlan) {
          errors.push('Session plan is required')
        } else {
          const plan = wizardState.sessionPlan
          const sessionsWithExercises = plan.sessions.filter(s => s.exercises.length > 0)
          
          // More lenient validation - at least 1 session required
          if (sessionsWithExercises.length === 0) {
            errors.push('At least one session with exercises is required')
          }
          
          // Optional recommendation instead of strict requirement
          if (sessionsWithExercises.length === 1 && wizardState.configuration?.duration.weeks && wizardState.configuration.duration.weeks > 2) {
            // Only show warning for longer plans, not error
            // errors.push('Consider adding more sessions for better training coverage')
          }
          
          // Validate each session has proper exercise configuration - more lenient
          plan.sessions.forEach((session, index) => {
            if (session.exercises.length > 0) {
              const invalidExercises = session.exercises.filter(ex => 
                !ex.sets || ex.sets.length === 0 || 
                ex.sets.every(set => !set.reps && !set.duration && !set.distance)
              )
              if (invalidExercises.length > 0) {
                errors.push(`Session ${index + 1} has exercises with incomplete set configurations. Please add reps, duration, or distance to each set.`)
              }
            }
          })
        }
        break
      case 3: // Review - comprehensive validation
        // Get all validation errors across all steps
        for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
          const stepErrors = validateStep(i)
          errors.push(...stepErrors)
        }
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
      return
    }
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
      setWizardState(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, [currentStep]: [] } 
      }))
    }
  }, [currentStep, validateStep])

  // Handle previous step navigation
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

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
        return null
    }
  }

  return (
    <PlanErrorBoundary>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'existing')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Plan
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Existing Plans
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-8">
            {/* Enhanced Header with Status */}
            <div className="text-center space-y-4">
              <motion.h1 
                className="text-4xl font-bold tracking-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Create Training Plan
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Design comprehensive training programs with AI-powered insights and evidence-based periodization.
              </motion.p>
            </div>

            {/* Status and Progress Bar */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Plan Creation</h2>
                      <p className="text-sm text-muted-foreground">
                        {progressInfo.completed} of {progressInfo.total} steps completed
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <AnimatePresence mode="wait">
                    {wizardState.isLoading && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                      >
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {wizardState.lastSaved && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      <Save className="h-3 w-3" />
                      <span>Last saved: {new Date(wizardState.lastSaved).toLocaleTimeString()}</span>
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
                        {WIZARD_STEPS[currentStep]?.helpText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressInfo.percentage} className="w-32" />
                      <span className="text-sm font-medium">{Math.round(progressInfo.percentage)}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {WIZARD_STEPS.map((step, index) => (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg transition-all duration-200",
                          index === currentStep && "bg-primary/5 border-2 border-primary/20",
                          index < currentStep && "bg-green-50 border-2 border-green-200",
                          index > currentStep && "bg-muted/50 border-2 border-muted-foreground/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          index === currentStep && "bg-primary text-primary-foreground",
                          index < currentStep && "bg-green-500 text-white",
                          index > currentStep && "bg-muted text-muted-foreground"
                        )}>
                          {index < currentStep ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            index === currentStep && "text-primary",
                            index < currentStep && "text-green-700",
                            index > currentStep && "text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {step.description}
                          </p>
                        </div>
                        {index < WIZARD_STEPS.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={ANIMATION_VARIANTS.slideIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="existing" className="space-y-8">
            <div className="text-center space-y-4">
              <motion.h1 
                className="text-4xl font-bold tracking-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Your Training Plans
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Manage and review your existing training plans, or create new ones based on proven templates.
              </motion.p>
            </div>

            <ExistingPlansViewer 
              existingPlans={existingPlans}
              onRefresh={loadExistingPlans}
              onDelete={handleDeleteExistingPlan}
              onEdit={handleEditExistingPlan}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PlanErrorBoundary>
  )
} 