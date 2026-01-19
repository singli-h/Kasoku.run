'use client'

/**
 * PlanGenerationReview
 *
 * Seamless in-place component for AI plan generation and review.
 * Handles: Generation loading → Week 1 review → Full plan → Success
 * Now integrated with real AI tools via usePlanGeneratorChat.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MessageCircle, Check, Loader2, Sparkles, ChevronLeft, Calendar, Clock, Dumbbell } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ChatSidebar } from '@/components/features/ai-assistant/ChatSidebar'
import { useIsDesktop } from '@/components/features/ai-assistant/hooks/useAILayoutMode'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { usePlanGeneratorChat } from '@/lib/changeset/plan-generator'
import type { MesocycleData, PlanGenerationContext, CurrentPlanState } from '@/lib/changeset/plan-generator'
import { WeekStepper } from './WeekStepper'
import { FirstWorkoutSuccess } from './FirstWorkoutSuccess'
import type { ProposedBlock, ProposedWeek, ProposedSession, ProposedExercise, ProposedSet } from './types'

type FlowState = 'generating' | 'review-week1' | 'generating-full' | 'review-full' | 'applying' | 'success'

interface SetupContext {
  blockName: string
  trainingDays: number[]
  durationMinutes: number
  equipment: string[]
  focus: string
}

const DAY_LABELS: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
}

function formatDays(days: number[]): string {
  return days.sort((a, b) => a - b).map(d => DAY_LABELS[d]).join('/')
}

/**
 * Convert CurrentPlanState (from AI) to ProposedBlock (for UI)
 */
function convertToProposedBlock(planState: CurrentPlanState | null, setupContext: SetupContext): ProposedBlock | null {
  if (!planState || !planState.mesocycle) return null

  const weeks: ProposedWeek[] = planState.microcycles.map((microcycle) => {
    const sessions: ProposedSession[] = microcycle.session_plans.map((session) => {
      const exercises: ProposedExercise[] = session.session_plan_exercises.map((exercise) => {
        const sets: ProposedSet[] = exercise.session_plan_sets.map((set) => ({
          reps: set.reps ?? 10,
          weight: null,
          restSeconds: set.rest_seconds ?? 60,
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
      id: microcycle.id,
      weekNumber: microcycle.week_number,
      name: microcycle.name,
      sessions,
      isDeload: microcycle.is_deload,
    }
  })

  return {
    name: planState.mesocycle.name,
    description: `AI-generated ${planState.mesocycle.goal_type} program`,
    durationWeeks: planState.mesocycle.duration_weeks,
    focus: setupContext.focus,
    weeks,
  }
}

interface PlanGenerationReviewProps {
  setupContext: SetupContext
  /** Pre-created mesocycle data */
  mesocycle: MesocycleData
  /** Generation context from wizard */
  generationContext: PlanGenerationContext
  onEditSetup: () => void
  onComplete: (blockId: string) => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: string) => void
}

export function PlanGenerationReview({
  setupContext,
  mesocycle,
  generationContext,
  onEditSetup,
  onComplete,
  onStartWorkout,
  onViewBlock,
}: PlanGenerationReviewProps) {
  const [flowState, setFlowState] = useState<FlowState>('generating')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  const isDesktop = useIsDesktop()
  const { getToken } = useAuth()

  // Stabilize getToken with a ref to prevent infinite re-renders
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  // Create Supabase client with Clerk auth (only once)
  const supabase = useMemo(
    () => createClientSupabaseClient(() => getTokenRef.current()),
    [] // Empty deps - client created once, uses ref for fresh token
  )

  // Track week1OnlyMode in a ref to avoid stale closure in callback
  const week1OnlyModeRef = useRef(true)

  // Stable callback for status changes
  const handleStatusChange = useCallback((newStatus: import('@/lib/changeset/plan-generator').PlanGeneratorStatus) => {
    console.log('[PlanGenerationReview] Status changed:', newStatus)
    if (newStatus === 'pending_approval') {
      // AI finished building, show review
      if (week1OnlyModeRef.current) {
        setFlowState('review-week1')
      } else {
        setFlowState('review-full')
      }
    }
  }, [])

  // Initialize plan generator chat
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    status,
    week1OnlyMode,
    currentPlanState,
    pendingCount,
    startGeneration,
    approveWeek1,
    resetPlan,
  } = usePlanGeneratorChat({
    mesocycle,
    context: generationContext,
    supabase,
    debug: true,
    onStatusChange: handleStatusChange,
  })

  // Keep ref in sync
  week1OnlyModeRef.current = week1OnlyMode

  // Chat drawer state
  const [chatOpen, setChatOpen] = useState(false)

  // Track if generation has started to prevent duplicate starts
  const generationStartedRef = useRef(false)

  // Convert AI plan state to UI format
  const plan = useMemo(
    () => convertToProposedBlock(currentPlanState, setupContext),
    [currentPlanState, setupContext]
  )

  const firstSession = plan?.weeks[0]?.sessions[0]
  const approvedWeeks = flowState === 'generating' || flowState === 'review-week1' || flowState === 'generating-full'
    ? 1
    : (plan?.weeks.length ?? 1)

  // Start generation on mount (only once)
  useEffect(() => {
    if (flowState === 'generating' && status === null && !generationStartedRef.current) {
      generationStartedRef.current = true
      console.log('[PlanGenerationReview] Starting generation...')
      startGeneration()
    }
  }, [flowState, status, startGeneration])

  // Watch for plan state changes during generation
  useEffect(() => {
    if (flowState === 'generating' && currentPlanState && currentPlanState.microcycles.length > 0) {
      // Plan has content, transition to review
      console.log('[PlanGenerationReview] Plan built, transitioning to review')
      setFlowState('review-week1')
    }
  }, [flowState, currentPlanState])

  // Watch for full plan generation
  useEffect(() => {
    if (flowState === 'generating-full' && currentPlanState && currentPlanState.microcycles.length > 1) {
      console.log('[PlanGenerationReview] Full plan ready')
      setFlowState('review-full')
    }
  }, [flowState, currentPlanState])

  const handleLooksGood = useCallback(() => {
    setFlowState('generating-full')
    approveWeek1()
  }, [approveWeek1])

  const handleApplyPlan = useCallback(() => {
    setFlowState('applying')
    // TODO: Execute database save
    setTimeout(() => {
      setFlowState('success')
      onComplete(mesocycle.id)
    }, 1500)
  }, [mesocycle.id, onComplete])

  const handleOpenChat = useCallback(() => {
    setChatOpen(true)
  }, [])

  const handleClearChat = useCallback(() => {
    resetPlan()
    setFlowState('generating')
  }, [resetPlan])

  const handleStartWorkout = useCallback(() => {
    if (firstSession) {
      onStartWorkout?.(firstSession.id)
    }
  }, [firstSession, onStartWorkout])

  const handleViewBlock = useCallback(() => {
    onViewBlock?.(mesocycle.id)
  }, [mesocycle.id, onViewBlock])

  // Success screen
  if (flowState === 'success' && plan && firstSession) {
    return (
      <FirstWorkoutSuccess
        blockName={plan.name}
        workoutsThisWeek={plan.weeks[0]?.sessions.length || 0}
        firstSession={{
          name: firstSession.name,
          dayOfWeek: firstSession.dayOfWeek,
          exerciseCount: firstSession.exercises.length,
          estimatedDuration: firstSession.estimatedDuration,
        }}
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
                disabled={flowState === 'generating' || flowState === 'generating-full' || flowState === 'applying'}
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
      <div className="flex min-h-[60vh]">
        <div
          className="flex-1 min-w-0 transition-all duration-300"
          style={{
            marginRight: isDesktop && chatOpen ? 400 : 0,
          }}
        >
          <div className="space-y-6">
            {/* Generating State */}
            <AnimatePresence mode="wait">
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
                        <h3 className="font-semibold text-lg mb-2">Building Week 1...</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Designing workouts based on your {setupContext.focus} goals
                        </p>
                        <div className="w-full max-w-xs space-y-2">
                          <GenerationStep label="Analyzing your goals" done={pendingCount > 0} loading={pendingCount === 0} />
                          <GenerationStep label="Selecting exercises" done={pendingCount > 5} loading={pendingCount > 0 && pendingCount <= 5} />
                          <GenerationStep label="Creating workouts" loading={pendingCount > 5} />
                        </div>
                        {/* Debug info */}
                        <div className="mt-4 text-xs text-muted-foreground">
                          Status: {status} | Changes: {pendingCount}
                        </div>
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
                            Review and adjust before we generate the full plan
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleOpenChat}
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat with AI
                        </Button>
                        <Button onClick={handleLooksGood} className="flex-1">
                          <Check className="h-4 w-4 mr-2" />
                          Looks Good
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <WeekStepper
                    weeks={plan.weeks}
                    selectedIndex={selectedWeekIndex}
                    approvedWeeks={approvedWeeks}
                    onSelectWeek={setSelectedWeekIndex}
                  />
                </motion.div>
              )}

              {/* Generating Full Plan State */}
              {flowState === 'generating-full' && plan && (
                <motion.div
                  key="generating-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">Generating remaining weeks...</h3>
                          <p className="text-sm text-muted-foreground">
                            Building on your Week 1 preferences
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <WeekStepper
                    weeks={plan.weeks}
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
                            Review the full plan and apply when ready
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleOpenChat}
                          disabled={flowState === 'applying'}
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat with AI
                        </Button>
                        <Button
                          onClick={handleApplyPlan}
                          disabled={flowState === 'applying'}
                          className="flex-1"
                        >
                          {flowState === 'applying' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Apply Plan
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <WeekStepper
                    weeks={plan.weeks}
                    selectedIndex={selectedWeekIndex}
                    approvedWeeks={approvedWeeks}
                    onSelectWeek={setSelectedWeekIndex}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop: Chat Sidebar */}
        {isDesktop && (
          <ChatSidebar
            open={chatOpen}
            onOpenChange={setChatOpen}
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onClearChat={handleClearChat}
          />
        )}
      </div>

      {/* Mobile: Chat Drawer */}
      {!isDesktop && (
        <ChatDrawer
          open={chatOpen}
          onOpenChange={setChatOpen}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onClearChat={handleClearChat}
        />
      )}
    </div>
  )
}

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
