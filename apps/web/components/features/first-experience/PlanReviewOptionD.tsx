'use client'

/**
 * PlanReviewOptionD
 *
 * Option D: Vertical Stepper Style
 * Two-step approval flow:
 * 1. Review & approve Week 1
 * 2. Generate remaining weeks & apply plan
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bot, MessageCircle, Check, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ChatSidebar } from '@/components/features/ai-assistant/ChatSidebar'
import { useIsDesktop } from '@/components/features/ai-assistant/hooks/useAILayoutMode'
import { WeekStepper } from './WeekStepper'
import { FirstWorkoutSuccess } from './FirstWorkoutSuccess'
import type { ProposedBlock } from './types'
import type { UIMessage } from '@ai-sdk/react'

type FlowStep = 'review-week1' | 'generating' | 'review-full' | 'applying' | 'success'

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "Here's Week 1 of your training plan. I've focused on building a solid foundation with compound movements.\n\nTake a look and let me know if you'd like any adjustments before I generate the remaining weeks.",
      },
    ],
  } as UIMessage,
]

interface PlanReviewOptionDProps {
  plan: ProposedBlock
  onBack?: () => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: string) => void
}

export function PlanReviewOptionD({
  plan,
  onBack,
  onStartWorkout,
  onViewBlock,
}: PlanReviewOptionDProps) {
  const [flowStep, setFlowStep] = useState<FlowStep>('review-week1')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isDesktop = useIsDesktop()

  const firstSession = plan.weeks[0]?.sessions[0]

  // Determine how many weeks are unlocked based on flow step
  const approvedWeeks = flowStep === 'review-week1' || flowStep === 'generating' ? 1 : plan.weeks.length

  const handleApproveWeek1 = () => {
    setFlowStep('generating')

    // Simulate AI generating remaining weeks
    setTimeout(() => {
      // Add AI message about generating remaining weeks
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        parts: [{
          type: 'text',
          text: "Great! Based on your Week 1 preferences, I've generated the remaining 3 weeks. The plan progressively increases intensity while maintaining the same movement patterns you'll learn in Week 1.\n\nReview the full plan and apply when you're ready!"
        }],
      } as UIMessage
      setMessages(prev => [...prev, aiMessage])

      setFlowStep('review-full')
    }, 2000)
  }

  const handleApplyPlan = () => {
    setFlowStep('applying')
    setTimeout(() => {
      setFlowStep('success')
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
    setMessages(INITIAL_MESSAGES)
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
  if (flowStep === 'success' && firstSession) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b"
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">
            {flowStep === 'review-week1' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
        </div>
      </motion.div>

      {/* Main layout */}
      <div className="flex min-h-[calc(100vh-57px)]">
        <div
          className="flex-1 min-w-0 transition-all duration-300"
          style={{
            marginRight: isDesktop && chatOpen ? 400 : 0,
          }}
        >
          <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
            {/* Approval Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <AnimatePresence mode="wait">
                        {flowStep === 'review-week1' && (
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <h3 className="font-semibold">Review Week 1</h3>
                            <p className="text-sm text-muted-foreground">
                              Let's make sure this looks right before generating the full plan
                            </p>
                          </motion.div>
                        )}
                        {flowStep === 'generating' && (
                          <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <h3 className="font-semibold flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating remaining weeks...
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Building on your Week 1 preferences
                            </p>
                          </motion.div>
                        )}
                        {flowStep === 'review-full' && (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <h3 className="font-semibold flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              Full Plan Ready
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Review all {plan.weeks.length} weeks and apply when ready
                            </p>
                          </motion.div>
                        )}
                        {flowStep === 'applying' && (
                          <motion.div
                            key="applying"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <h3 className="font-semibold flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating your plan...
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Setting up your training block
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                      flowStep === 'review-week1'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {flowStep === 'review-week1' ? '1' : <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 h-0.5 bg-muted">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{
                          width: flowStep === 'review-week1' ? '0%' : '100%'
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                      flowStep === 'review-full' || flowStep === 'applying'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleOpenChat}
                      disabled={flowStep === 'generating' || flowStep === 'applying'}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with AI
                    </Button>

                    {flowStep === 'review-week1' && (
                      <Button onClick={handleApproveWeek1} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Looks Good
                      </Button>
                    )}

                    {flowStep === 'generating' && (
                      <Button disabled className="flex-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </Button>
                    )}

                    {flowStep === 'review-full' && (
                      <Button onClick={handleApplyPlan} className="flex-1">
                        <Check className="h-4 w-4 mr-2" />
                        Apply Plan
                      </Button>
                    )}

                    {flowStep === 'applying' && (
                      <Button disabled className="flex-1">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Week Stepper */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <WeekStepper
                weeks={plan.weeks}
                selectedIndex={selectedWeekIndex}
                approvedWeeks={approvedWeeks}
                onSelectWeek={setSelectedWeekIndex}
              />
            </motion.div>
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
