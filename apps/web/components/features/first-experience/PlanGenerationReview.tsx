'use client'

/**
 * PlanGenerationReview
 *
 * Seamless in-place component for AI plan generation and review.
 * Uses Init Pipeline for efficient 3-step generation.
 * Flow: Generation → Week 1 Review → Full Plan Review → Apply → Success
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Bot, Check, Loader2, Sparkles, ChevronLeft, Calendar, Clock, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInitPipeline, type PlanningContext, type ScaffoldedPlan } from '@/lib/init-pipeline'
import { saveGeneratedPlanAction } from '@/actions/plans/save-generated-plan-action'
import { WeekStepper } from './WeekStepper'
import { FirstWorkoutSuccess } from './FirstWorkoutSuccess'
import type { ProposedBlock, ProposedWeek, ProposedSession, ProposedExercise, ProposedSet } from './types'

// ============================================================================
// Types
// ============================================================================

type FlowState = 'generating' | 'review-week1' | 'review-full' | 'applying' | 'success'

interface SetupContext {
  blockName: string
  trainingDays: number[]
  durationMinutes: number
  equipment: string[]
  focus: string
  notes?: string
}

interface MesocycleSetupData {
  /** Block name */
  name: string
  /** Goal/focus type */
  goal_type?: string
  /** Duration in weeks */
  duration_weeks: number
  /** Start date (ISO string, defaults to today) */
  start_date?: string
}

// ============================================================================
// Helpers
// ============================================================================

const DAY_LABELS: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
}

const NUMBER_TO_DAY_NAME: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
}

function formatDays(days: number[]): string {
  return [...days].sort((a, b) => a - b).map(d => DAY_LABELS[d]).join('/')
}

/**
 * Convert ScaffoldedPlan (from Init Pipeline) to ProposedBlock (for UI)
 */
function convertToProposedBlock(plan: ScaffoldedPlan | null, mesocycle: MesocycleSetupData): ProposedBlock | null {
  if (!plan) return null

  const weeks: ProposedWeek[] = plan.microcycles.map((mc) => {
    const sessions: ProposedSession[] = mc.session_plans.map((session) => {
      const exercises: ProposedExercise[] = session.session_plan_exercises.map((exercise) => {
        const sets: ProposedSet[] = exercise.session_plan_sets.map((set) => ({
          reps: set.reps ?? 10,
          weight: set.weight ?? null,
          restSeconds: set.rest_time ?? 60,
          rpe: set.rpe ?? null,
        }))

        return {
          exerciseId: parseInt(exercise.exercise_id) || 0,
          exerciseName: exercise.exercise_name,
          sets,
          notes: exercise.notes,
        }
      })

      return {
        id: session.id,
        name: session.name,
        dayOfWeek: DAY_NAME_TO_NUMBER[session.day_of_week.toLowerCase()] ?? 1,
        exercises,
        estimatedDuration: session.estimated_duration,
      }
    })

    return {
      id: mc.id,
      weekNumber: mc.week_number,
      name: mc.name,
      sessions,
      isDeload: mc.is_deload,
    }
  })

  return {
    name: mesocycle.name,
    description: `AI-generated training program`,
    durationWeeks: plan.microcycles.length,
    focus: mesocycle.goal_type || 'general',
    weeks,
  }
}

/**
 * Convert SetupContext to PlanningContext for Init Pipeline
 */
function buildPlanningContext(setupContext: SetupContext, mesocycle: MesocycleSetupData, experienceLevel?: string): PlanningContext {
  return {
    user: {
      experience_level: experienceLevel || 'intermediate',
      primary_goal: setupContext.focus,
      secondary_goals: [],
    },
    preferences: {
      training_days: setupContext.trainingDays.map(d => NUMBER_TO_DAY_NAME[d]),
      session_duration: setupContext.durationMinutes,
      equipment: setupContext.equipment.length ? setupContext.equipment.join(', ') : 'full_gym',
      equipment_tags: setupContext.equipment,
    },
    mesocycle: {
      name: mesocycle.name,
      duration_weeks: mesocycle.duration_weeks,
    },
    notes: setupContext.notes,
  }
}

// ============================================================================
// Props
// ============================================================================

interface PlanGenerationReviewProps {
  setupContext: SetupContext
  /** Mesocycle setup data (will be created on save) */
  mesocycle: MesocycleSetupData
  /** User's experience level from their athlete profile. Fallback: 'intermediate' */
  experienceLevel?: string
  onEditSetup: () => void
  /** Called when plan is saved, with the created mesocycle ID */
  onComplete: (blockId: number) => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: number) => void
}

// ============================================================================
// Component
// ============================================================================

export function PlanGenerationReview({
  setupContext,
  mesocycle,
  experienceLevel,
  onEditSetup,
  onComplete,
  onStartWorkout,
  onViewBlock,
}: PlanGenerationReviewProps) {
  const [flowState, setFlowState] = useState<FlowState>('generating')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [showFullPlan, setShowFullPlan] = useState(false)
  const [savedMesocycleId, setSavedMesocycleId] = useState<number | null>(null)
  const [savedWorkoutLogId, setSavedWorkoutLogId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Build planning context
  const planningContext = useMemo(
    () => buildPlanningContext(setupContext, mesocycle, experienceLevel),
    [setupContext, mesocycle, experienceLevel]
  )

  // Generate a temporary mesocycle ID for scaffolding
  const tempMesocycleId = useMemo(() => crypto.randomUUID(), [])

  // Track if pipeline has started
  const pipelineStartedRef = useRef(false)
  const applyingRef = useRef(false)

  // Initialize Init Pipeline
  const {
    status: pipelineStatus,
    planningSummary,
    simplePlan,
    scaffoldedPlan,
    error: pipelineError,
    startPipeline,
    reset: resetPipeline,
  } = useInitPipeline({
    context: planningContext,
    mesocycleId: tempMesocycleId,
    onComplete: () => {
      console.log('[PlanGenerationReview] Pipeline complete')
      setFlowState('review-week1')
    },
    onError: (err) => {
      console.error('[PlanGenerationReview] Pipeline error:', err)
    },
  })

  // Convert to UI format
  const plan = useMemo(
    () => convertToProposedBlock(scaffoldedPlan, mesocycle),
    [scaffoldedPlan, mesocycle]
  )

  // Get visible weeks based on showFullPlan
  const visibleWeeks = useMemo(() => {
    if (!plan) return []
    return showFullPlan ? plan.weeks : plan.weeks.slice(0, 1)
  }, [plan, showFullPlan])

  const firstSession = plan?.weeks[0]?.sessions[0]
  const approvedWeeks = showFullPlan ? (plan?.weeks.length ?? 1) : 1

  // Start pipeline on mount
  useEffect(() => {
    if (flowState === 'generating' && !pipelineStartedRef.current) {
      pipelineStartedRef.current = true
      console.log('[PlanGenerationReview] Starting Init Pipeline...')
      startPipeline()
    }
  }, [flowState, startPipeline])

  // Handle "Looks Good" - reveal full plan
  const handleLooksGood = useCallback(() => {
    setShowFullPlan(true)
    setFlowState('review-full')
  }, [])

  // Handle "Apply Plan" - save to database
  const handleApplyPlan = useCallback(async () => {
    if (!scaffoldedPlan || applyingRef.current) return
    applyingRef.current = true

    setFlowState('applying')
    setSaveError(null)
    console.log('[PlanGenerationReview] Saving plan...')

    // Build mesocycle creation data
    const startDate = mesocycle.start_date || new Date().toISOString().split('T')[0]

    const result = await saveGeneratedPlanAction({
      mesocycle: {
        name: mesocycle.name,
        focus: mesocycle.goal_type || setupContext.focus,
        durationWeeks: mesocycle.duration_weeks,
        startDate,
        equipment: setupContext.equipment.join(', '),
        description: simplePlan?.plan_description,
      },
      plan: scaffoldedPlan,
    })

    if (result.isSuccess && result.data) {
      console.log('[PlanGenerationReview] Plan saved successfully, mesocycle:', result.data.mesocycleId)
      setSavedMesocycleId(result.data.mesocycleId)
      setSavedWorkoutLogId(result.data.firstWorkoutLogId)
      setFlowState('success')
    } else {
      console.error('[PlanGenerationReview] Save failed:', result.message)
      setSaveError(result.message || 'Failed to save plan. Please try again.')
      setFlowState('review-full')
      applyingRef.current = false
    }
  }, [scaffoldedPlan, simplePlan, mesocycle, setupContext])

  // Handle retry
  const handleRetry = useCallback(() => {
    pipelineStartedRef.current = false
    resetPipeline()
    setFlowState('generating')
  }, [resetPipeline])

  const handleStartWorkout = useCallback(() => {
    if (savedWorkoutLogId) {
      if (savedMesocycleId) {
        onComplete(savedMesocycleId)
      }
      onStartWorkout?.(savedWorkoutLogId)
    }
  }, [savedWorkoutLogId, savedMesocycleId, onComplete, onStartWorkout])

  const handleViewBlock = useCallback(() => {
    if (savedMesocycleId) {
      onComplete(savedMesocycleId)
      onViewBlock?.(savedMesocycleId)
    }
  }, [savedMesocycleId, onComplete, onViewBlock])

  // Success screen
  if (flowState === 'success' && plan) {
    return (
      <FirstWorkoutSuccess
        blockName={plan.name}
        workoutsThisWeek={plan.weeks[0]?.sessions.length || 0}
        firstSession={savedWorkoutLogId && firstSession ? {
          name: firstSession.name,
          dayOfWeek: firstSession.dayOfWeek,
          exerciseCount: firstSession.exercises.length,
          estimatedDuration: firstSession.estimatedDuration,
        } : undefined}
        onStartWorkout={handleStartWorkout}
        onViewBlock={handleViewBlock}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Collapsed Context Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDays(setupContext.trainingDays)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{setupContext.durationMinutes} min</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Dumbbell className="h-4 w-4" />
                  <span className="capitalize">{setupContext.equipment[0] || 'Full Gym'}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditSetup}
                disabled={flowState === 'generating' || flowState === 'applying'}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Edit Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Generating State */}
          {flowState === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Building Your Plan...</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Designing workouts based on your {setupContext.focus} goals
                    </p>
                    <div className="w-full max-w-xs space-y-2">
                      <GenerationStep
                        label="Loading exercises"
                        done={pipelineStatus !== 'idle' && pipelineStatus !== 'fetching-exercises'}
                        loading={pipelineStatus === 'fetching-exercises'}
                      />
                      <GenerationStep
                        label="Planning your program"
                        done={pipelineStatus === 'generating' || pipelineStatus === 'scaffolding' || pipelineStatus === 'complete'}
                        loading={pipelineStatus === 'planning'}
                      />
                      <GenerationStep
                        label="Generating workouts"
                        done={pipelineStatus === 'scaffolding' || pipelineStatus === 'complete'}
                        loading={pipelineStatus === 'generating'}
                      />
                      <GenerationStep
                        label="Building your plan"
                        done={pipelineStatus === 'complete'}
                        loading={pipelineStatus === 'scaffolding'}
                      />
                    </div>

                    {/* Show planning summary as it streams */}
                    {pipelineStatus === 'planning' && planningSummary && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg text-left text-xs text-muted-foreground max-h-32 overflow-y-auto w-full">
                        {planningSummary.slice(0, 300)}...
                      </div>
                    )}

                    {/* Error state */}
                    {pipelineStatus === 'error' && pipelineError && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-destructive">{pipelineError}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Review Week 1 State */}
          {flowState === 'review-week1' && plan && (
            <motion.div
              key="review-week1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">Here's Week 1 of your plan</h3>
                      <p className="text-sm text-muted-foreground">
                        Review before seeing the full {plan.weeks.length}-week plan
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleLooksGood} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Looks Good - Show Full Plan
                  </Button>
                </CardContent>
              </Card>

              <WeekStepper
                weeks={visibleWeeks}
                selectedIndex={selectedWeekIndex}
                approvedWeeks={approvedWeeks}
                onSelectWeek={setSelectedWeekIndex}
              />
            </motion.div>
          )}

          {/* Review Full Plan State */}
          {(flowState === 'review-full' || flowState === 'applying') && plan && (
            <motion.div
              key="review-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">Your {plan.weeks.length}-week plan is ready</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and apply when you're ready
                      </p>
                    </div>
                  </div>

                  {saveError && (
                    <div className="mb-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">{saveError}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleApplyPlan}
                    disabled={flowState === 'applying'}
                    className="w-full"
                  >
                    {flowState === 'applying' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {saveError ? 'Retry' : 'Apply Plan'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <WeekStepper
                weeks={visibleWeeks}
                selectedIndex={selectedWeekIndex}
                approvedWeeks={approvedWeeks}
                onSelectWeek={setSelectedWeekIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function GenerationStep({ label, done, loading }: { label: string; done?: boolean; loading?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done && <Check className="h-4 w-4 text-primary" />}
      {loading && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
      {!done && !loading && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
      <span className={done ? 'text-foreground' : loading ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}
