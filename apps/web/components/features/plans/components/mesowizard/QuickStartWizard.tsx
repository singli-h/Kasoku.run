/**
 * QuickStartWizard - Simplified Training Block Creation for Individuals
 * 3-step wizard: Block Settings → Week Setup → AI Review
 *
 * Features localStorage persistence to preserve user input across refreshes
 */

"use client"

import { useState, useMemo, useEffect, useCallback, memo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, ArrowRight, Calendar, Clock, Dumbbell, Target, Zap } from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Equipment Selection
import { EquipmentSelector, type EquipmentCategory } from "@/components/features/equipment"

// AI Plan Generation
import { PlanGenerationReview } from "@/components/features/first-experience"

// Duration presets in weeks
const DURATION_PRESETS = [
  { value: 4, label: "4 weeks", description: "Quick focus" },
  { value: 6, label: "6 weeks", description: "Standard block" },
  { value: 8, label: "8 weeks", description: "Extended training" },
] as const

// Training focus options
const FOCUS_OPTIONS = [
  { value: "strength", label: "Strength", icon: Dumbbell, description: "Build raw power" },
  { value: "endurance", label: "Endurance", icon: Zap, description: "Improve stamina" },
  { value: "general", label: "General Fitness", icon: Target, description: "All-around training" },
] as const

// Days of the week
const DAYS_OF_WEEK = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const

// Template configurations matching EmptyTrainingState
const TEMPLATE_CONFIGS: Record<string, { name: string; focus: "strength" | "endurance" | "general"; durationWeeks: number; trainingDays: number[] }> = {
  "strength-foundation": {
    name: "Strength Foundation",
    focus: "strength",
    durationWeeks: 4,
    trainingDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  },
  "ppl-split": {
    name: "PPL Split",
    focus: "general",
    durationWeeks: 6,
    trainingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
  },
  "upper/lower": {
    name: "Upper/Lower",
    focus: "strength",
    durationWeeks: 4,
    trainingDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  },
}

// Step 1 Schema
const blockSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  durationWeeks: z.number().min(1).max(12),
  focus: z.enum(["strength", "endurance", "general"]),
  notes: z.string().optional(),  // User-provided context/guidelines for AI
})

// Step 2 Schema
const weekSetupSchema = z.object({
  trainingDays: z.array(z.number()).min(1, "Select at least one training day"),
  equipment: z.array(z.string()).min(1, "Select at least one equipment type"),
})

type BlockSettingsData = z.infer<typeof blockSettingsSchema>
type WeekSetupData = z.infer<typeof weekSetupSchema>

type WizardStep = "settings" | "week" | "review"

// ============================================================================
// LocalStorage Persistence
// ============================================================================

const STORAGE_KEY = "kasoku:quick-start-wizard"
const STORAGE_EXPIRY_HOURS = 24 // Clear stale data after 24 hours

interface WizardPersistedState {
  currentStep: WizardStep
  blockSettings: BlockSettingsData | null
  weekSetup: Partial<WeekSetupData> | null
  savedAt: number // timestamp for expiry check
}

/**
 * Load wizard state from localStorage
 * Returns null if no data, expired, or invalid
 */
function loadWizardState(): WizardPersistedState | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const state: WizardPersistedState = JSON.parse(stored)

    // Check expiry
    const expiryMs = STORAGE_EXPIRY_HOURS * 60 * 60 * 1000
    if (Date.now() - state.savedAt > expiryMs) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return state
  } catch {
    // Invalid JSON or other error - clear and return null
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/**
 * Save wizard state to localStorage
 */
function saveWizardState(state: Omit<WizardPersistedState, "savedAt">): void {
  if (typeof window === "undefined") return

  try {
    const persistedState: WizardPersistedState = {
      ...state,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState))
  } catch {
    // Storage full or other error - silently fail
    console.warn("[QuickStartWizard] Failed to save state to localStorage")
  }
}

/**
 * Clear wizard state from localStorage
 */
function clearWizardState(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

// ============================================================================

interface QuickStartWizardProps {
  onComplete?: () => void
}

export function QuickStartWizard({ onComplete }: QuickStartWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentStep, setCurrentStep] = useState<WizardStep>("settings")
  const [blockSettings, setBlockSettings] = useState<BlockSettingsData | null>(null)
  const [weekSetup, setWeekSetup] = useState<Partial<WeekSetupData> | null>(null)

  // Get template from URL params and resolve config
  const templateParam = searchParams.get("template")
  const templateConfig = useMemo(() => {
    if (!templateParam) return null
    return TEMPLATE_CONFIGS[templateParam] || null
  }, [templateParam])

  // Load persisted state on mount (client-side only)
  useEffect(() => {
    const savedState = loadWizardState()
    if (savedState) {
      // Only restore if no template is being applied (template takes priority)
      if (!templateParam) {
        setCurrentStep(savedState.currentStep)
        setBlockSettings(savedState.blockSettings)
        setWeekSetup(savedState.weekSetup)
      }
    }
    setIsHydrated(true)
  }, [templateParam])

  // Save state to localStorage whenever it changes
  const persistState = useCallback(() => {
    if (!isHydrated) return // Don't save during hydration
    saveWizardState({
      currentStep,
      blockSettings,
      weekSetup,
    })
  }, [isHydrated, currentStep, blockSettings, weekSetup])

  useEffect(() => {
    persistState()
  }, [persistState])

  // For progress bar, only count settings and week steps (review is a different experience)
  const steps: WizardStep[] = ["settings", "week"]
  const currentStepIndex = currentStep === "review" ? 1 : steps.indexOf(currentStep)
  const progress = currentStep === "review" ? 100 : ((currentStepIndex + 1) / steps.length) * 100

  const handleSettingsComplete = (data: BlockSettingsData) => {
    setBlockSettings(data)
    setCurrentStep("week")
  }

  const handleBlockSettingsChange = useCallback((data: Partial<BlockSettingsData>) => {
    // Persist partial block settings as user types (before they click Next)
    setBlockSettings(prev => prev ? { ...prev, ...data } : data as BlockSettingsData)
  }, [])

  const handleWeekSetupChange = useCallback((data: Partial<WeekSetupData>) => {
    setWeekSetup(data)
  }, [])

  const handleWeekComplete = (data: WeekSetupData) => {
    if (!blockSettings) return
    setWeekSetup(data)
    setCurrentStep("review")
  }

  const handleBack = () => {
    if (currentStep === "week") {
      setCurrentStep("settings")
    } else if (currentStep === "review") {
      setCurrentStep("week")
    }
  }

  const handleCancel = () => {
    // Clear persisted state when user explicitly cancels
    clearWizardState()
    router.push("/plans")
  }

  const handleEditSetup = () => {
    setCurrentStep("week")
  }

  const handlePlanComplete = (_blockId: number) => {
    // Clear wizard persistence — success screen handles navigation
    clearWizardState()
  }

  // Stable callbacks for review step
  const handleStartWorkout = useCallback((workoutLogId: string) => {
    router.push(`/workout/${workoutLogId}`)
  }, [router])

  const handleViewBlock = useCallback((blockId: number) => {
    router.push(`/plans/${blockId}`)
  }, [router])

  // Review step is a full-page experience
  // Create data inline only when rendering review to avoid hook dependency issues
  if (currentStep === "review" && blockSettings && weekSetup) {
    return (
      <PlanGenerationReviewWrapper
        blockSettings={blockSettings}
        weekSetup={weekSetup}
        onEditSetup={handleEditSetup}
        onComplete={handlePlanComplete}
        onStartWorkout={handleStartWorkout}
        onViewBlock={handleViewBlock}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </h2>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Navigation */}
      {currentStep !== "settings" && (
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
      {currentStep === "settings" && (
        <BlockSettingsStep
          onComplete={handleSettingsComplete}
          onCancel={handleCancel}
          onChange={handleBlockSettingsChange}
          initialData={blockSettings || undefined}
          templateConfig={templateConfig}
        />
      )}

      {currentStep === "week" && (
        <WeekSetupStep
          onComplete={handleWeekComplete}
          onBack={handleBack}
          onChange={handleWeekSetupChange}
          blockName={blockSettings?.name || "Training Block"}
          defaultTrainingDays={templateConfig?.trainingDays}
          initialData={weekSetup || undefined}
        />
      )}
    </div>
  )
}

/**
 * Step 1: Block Settings
 */
function BlockSettingsStep({
  onComplete,
  onCancel,
  onChange,
  initialData,
  templateConfig,
}: {
  onComplete: (data: BlockSettingsData) => void
  onCancel: () => void
  onChange?: (data: Partial<BlockSettingsData>) => void
  initialData?: BlockSettingsData
  templateConfig?: { name: string; focus: "strength" | "endurance" | "general"; durationWeeks: number; trainingDays: number[] } | null
}) {
  // Merge template config with initial data, prioritizing initialData if user already edited
  const defaultValues = useMemo(() => {
    if (initialData) return initialData
    if (templateConfig) {
      return {
        name: templateConfig.name,
        durationWeeks: templateConfig.durationWeeks,
        focus: templateConfig.focus,
      }
    }
    return {
      name: "",
      durationWeeks: 6,
      focus: "general" as const,
    }
  }, [initialData, templateConfig])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlockSettingsData>({
    resolver: zodResolver(blockSettingsSchema),
    defaultValues,
  })

  const durationWeeks = watch("durationWeeks")
  const focus = watch("focus")
  const name = watch("name")
  const notes = watch("notes")

  // Notify parent of changes for persistence
  useEffect(() => {
    onChange?.({ name, durationWeeks, focus, notes })
  }, [name, durationWeeks, focus, notes, onChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Create Training Block
        </CardTitle>
        <CardDescription>
          Set up your new training block in just a few steps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
          {/* Block Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Block Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Spring Strength Block"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Duration Presets */}
          <div className="space-y-3">
            <Label>Duration</Label>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_PRESETS.map((preset) => {
                const isSelected = durationWeeks === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setValue("durationWeeks", preset.value)}
                    className={`
                      flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors cursor-pointer
                      ${isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                  >
                    <span className="text-lg font-semibold">{preset.label}</span>
                    <span className={`text-xs ${isSelected ? "text-primary/70" : "text-muted-foreground"}`}>
                      {preset.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Training Focus */}
          <div className="space-y-3">
            <Label>Training Focus</Label>
            <div className="grid grid-cols-3 gap-3">
              {FOCUS_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = focus === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue("focus", option.value as BlockSettingsData["focus"])}
                    className={`
                      flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-colors cursor-pointer
                      ${isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? "text-primary" : ""}`} />
                    <span className="font-semibold">{option.label}</span>
                    <span className={`text-xs text-center ${isSelected ? "text-primary/70" : "text-muted-foreground"}`}>
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes - Training Context */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Training Notes <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="• Injuries: e.g., 'Bad lower back - avoid heavy deadlifts'
• Goals: e.g., 'Training for a marathon in 6 months'
• Focus: e.g., 'Prioritize upper body this block'
• Preferences: e.g., 'No burpees, prefer supersets'"
              className="min-h-[100px] resize-none"
              {...register("notes")}
            />
            <p className="text-xs text-muted-foreground">
              This helps personalize your workout recommendations
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Step 2: Week Setup
 */
function WeekSetupStep({
  onComplete,
  onBack,
  onChange,
  blockName,
  defaultTrainingDays,
  initialData,
}: {
  onComplete: (data: WeekSetupData) => void
  onBack: () => void
  onChange?: (data: Partial<WeekSetupData>) => void
  blockName: string
  defaultTrainingDays?: number[]
  initialData?: Partial<WeekSetupData>
}) {
  // Determine default values: prioritize saved data, then template, then fallback
  const resolvedDefaults = useMemo(() => ({
    trainingDays: initialData?.trainingDays || defaultTrainingDays || [1, 3, 5],
    equipment: initialData?.equipment || ["bodyweight", "dumbbells", "bench"],
  }), [initialData, defaultTrainingDays])

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<WeekSetupData>({
    resolver: zodResolver(weekSetupSchema),
    defaultValues: resolvedDefaults,
  })

  const trainingDays = watch("trainingDays") || []
  const equipment = watch("equipment") || []

  // Notify parent of changes for persistence
  useEffect(() => {
    onChange?.({ trainingDays, equipment })
  }, [trainingDays, equipment, onChange])

  const toggleDay = (day: number) => {
    const newDays = trainingDays.includes(day)
      ? trainingDays.filter((d) => d !== day)
      : [...trainingDays, day]
    setValue("trainingDays", newDays, { shouldValidate: true })
  }

  const handleEquipmentChange = (categories: EquipmentCategory[]) => {
    setValue("equipment", categories, { shouldValidate: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Set Your Schedule & Equipment
        </CardTitle>
        <CardDescription>
          Choose your training days and available equipment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
          {/* Training Days Selection */}
          <div className="space-y-3">
            <Label>Training Days</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = trainingDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors
                      ${isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-muted-foreground/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <span className="font-semibold">{day.label}</span>
                    {isSelected && <Dumbbell className="h-4 w-4 mt-1" />}
                  </button>
                )
              })}
            </div>
            {errors.trainingDays && (
              <p className="text-sm text-destructive">{errors.trainingDays.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {trainingDays.length} workout{trainingDays.length !== 1 ? "s" : ""} per week selected
            </p>
          </div>

          {/* Equipment Selection */}
          <div className="space-y-3">
            <EquipmentSelector
              value={equipment as EquipmentCategory[]}
              onChange={handleEquipmentChange}
              showPresets={true}
              showCategories={true}
              compact={false}
            />
            {errors.equipment && (
              <p className="text-sm text-destructive">{errors.equipment.message}</p>
            )}
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Your Training Block Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Block: {blockName}</li>
                <li>• {trainingDays.length} workout{trainingDays.length !== 1 ? "s" : ""} per week</li>
                <li>• {equipment.length} equipment type{equipment.length !== 1 ? "s" : ""}</li>
                <li>• Starting {new Date().getDay() === 1 ? 'this' : 'next'} Monday</li>
              </ul>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="gap-2">
              Generate with AI
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Wrapper component for PlanGenerationReview that handles memoization
 * This prevents re-renders by keeping props stable
 */
const PlanGenerationReviewWrapper = memo(function PlanGenerationReviewWrapper({
  blockSettings,
  weekSetup,
  onEditSetup,
  onComplete,
  onStartWorkout,
  onViewBlock,
}: {
  blockSettings: BlockSettingsData
  weekSetup: Partial<WeekSetupData>
  onEditSetup: () => void
  onComplete: (blockId: number) => void
  onStartWorkout: (sessionId: string) => void
  onViewBlock: (blockId: number) => void
}) {
  // Create data once on initial render using refs
  const initialDataRef = useRef<{
    mesocycle: {
      name: string
      goal_type: string
      duration_weeks: number
      start_date: string
    }
    setupContext: {
      blockName: string
      trainingDays: number[]
      durationMinutes: number
      equipment: string[]
      focus: string
      notes?: string
    }
  } | null>(null)

  if (!initialDataRef.current) {
    const trainingDays = weekSetup.trainingDays || []
    const equipment = weekSetup.equipment || []

    // Calculate next Monday for consistent week-start alignment
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dow = now.getDay()
    const daysUntilMonday = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow
    now.setDate(now.getDate() + daysUntilMonday)
    const startDate = now.toISOString().split('T')[0]

    initialDataRef.current = {
      mesocycle: {
        name: blockSettings.name,
        goal_type: blockSettings.focus,
        duration_weeks: blockSettings.durationWeeks,
        start_date: startDate,
      },
      setupContext: {
        blockName: blockSettings.name,
        trainingDays,
        durationMinutes: 45,
        equipment,
        focus: blockSettings.focus,
        notes: blockSettings.notes,
      },
    }
  }

  const { mesocycle, setupContext } = initialDataRef.current

  return (
    <PlanGenerationReview
      setupContext={setupContext}
      mesocycle={mesocycle}
      onEditSetup={onEditSetup}
      onComplete={onComplete}
      onStartWorkout={onStartWorkout}
      onViewBlock={onViewBlock}
    />
  )
})
