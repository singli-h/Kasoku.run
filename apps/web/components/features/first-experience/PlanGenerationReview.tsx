'use client'

/**
 * PlanGenerationReview
 *
 * Seamless in-place component for AI plan generation and review.
 * Handles: Generation loading → Week 1 review → Full plan → Success
 * No nested stepping - clean single flow.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, MessageCircle, Check, Loader2, Sparkles, ChevronLeft, Calendar, Clock, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ChatSidebar } from '@/components/features/ai-assistant/ChatSidebar'
import { useIsDesktop } from '@/components/features/ai-assistant/hooks/useAILayoutMode'
import { WeekStepper } from './WeekStepper'
import { FirstWorkoutSuccess } from './FirstWorkoutSuccess'
import type { ProposedBlock } from './types'
import type { UIMessage } from '@ai-sdk/react'

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

function formatDays(days: number[]): string {
  return days.sort((a, b) => a - b).map(d => DAY_LABELS[d]).join('/')
}

interface PlanGenerationReviewProps {
  setupContext: SetupContext
  plan: ProposedBlock
  onEditSetup: () => void
  onComplete: (blockId: string) => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: string) => void
}

export function PlanGenerationReview({
  setupContext,
  plan,
  onEditSetup,
  onComplete,
  onStartWorkout,
  onViewBlock,
}: PlanGenerationReviewProps) {
  const [flowState, setFlowState] = useState<FlowState>('generating')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isDesktop = useIsDesktop()

  const firstSession = plan.weeks[0]?.sessions[0]
  const approvedWeeks = flowState === 'generating' || flowState === 'review-week1' || flowState === 'generating-full'
    ? 1
    : plan.weeks.length

  // Simulate initial AI generation
  useEffect(() => {
    if (flowState === 'generating') {
      const timer = setTimeout(() => {
        // Add welcome message
        const welcomeMessage = {
          id: 'welcome-1',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: `Here's Week 1 of your ${plan.name}. I've designed ${plan.weeks[0]?.sessions.length || 3} workouts based on your ${setupContext.focus} goals.\n\nTake a look and let me know if you'd like any adjustments.`,
          }],
        } as UIMessage
        setMessages([welcomeMessage])
        setFlowState('review-week1')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [flowState, plan, setupContext.focus])

  const handleLooksGood = () => {
    setFlowState('generating-full')

    // Simulate generating remaining weeks
    setTimeout(() => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        parts: [{
          type: 'text',
          text: `Great! I've generated the remaining ${plan.weeks.length - 1} weeks based on your Week 1 preferences. The plan progressively builds intensity while keeping the same movement patterns.\n\nReview the full plan and apply when you're ready!`
        }],
      } as UIMessage
      setMessages(prev => [...prev, aiMessage])
      setFlowState('review-full')
    }, 2000)
  }

  const handleApplyPlan = () => {
    setFlowState('applying')
    setTimeout(() => {
      setFlowState('success')
    }, 1500)
  }

  const handleOpenChat = () => {
    setChatOpen(true)
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: input.trim() }],
    } as UIMessage
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: "I've noted your feedback. I can adjust the exercises, sets, or reps. What specific changes would you like?" }],
      } as UIMessage
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }, [input, isLoading])

  const handleClearChat = useCallback(() => {
    setMessages([])
  }, [])

  const handleStartWorkout = () => {
    if (firstSession) {
      onStartWorkout?.(firstSession.id)
    }
  }

  const handleViewBlock = () => {
    onViewBlock?.('mock-block-id')
  }

  // Success screen
  if (flowState === 'success' && firstSession) {
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
                          <GenerationStep label="Analyzed your goals" done />
                          <GenerationStep label="Selected exercises" done />
                          <GenerationStep label="Creating workouts" loading />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Review Week 1 State */}
              {flowState === 'review-week1' && (
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
              {flowState === 'generating-full' && (
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
              {(flowState === 'review-full' || flowState === 'applying') && (
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
