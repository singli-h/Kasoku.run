'use client'

/**
 * PlanReviewScreen
 *
 * Main container for the Plan Review UI.
 * Clean, minimal design matching existing app style.
 * Framer Motion for smooth page transitions.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, SkipForward, Dumbbell, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ChatSidebar } from '@/components/features/ai-assistant/ChatSidebar'
import { useIsDesktop } from '@/components/features/ai-assistant/hooks/useAILayoutMode'
import { PlanApprovalBar } from './PlanApprovalBar'
import { WeekCarousel } from './WeekCarousel'
import { ProposedSessionCard } from './ProposedSessionCard'
import { FirstWorkoutSuccess } from './FirstWorkoutSuccess'
import type { ProposedBlock } from './types'
import type { UIMessage } from '@ai-sdk/react'

type ScreenState = 'review' | 'applying' | 'success'

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: "I've created a 4-week Strength Foundation plan for you with 3 workouts per week. Each workout focuses on compound movements to build strength progressively.\n\nWould you like me to explain the exercise choices, or make any adjustments to the plan?",
      },
    ],
  } as UIMessage,
]

interface PlanReviewScreenProps {
  plan: ProposedBlock
  onBack?: () => void
  onSkipToManual?: () => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: string) => void
}

export function PlanReviewScreen({
  plan,
  onBack,
  onSkipToManual,
  onStartWorkout,
  onViewBlock,
}: PlanReviewScreenProps) {
  const [screenState, setScreenState] = useState<ScreenState>('review')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isDesktop = useIsDesktop()

  const stats = useMemo(() => {
    const totalWeeks = plan.weeks.length
    const workoutsPerWeek = plan.weeks[0]?.sessions.length || 0
    const totalExercises = plan.weeks.reduce((sum, week) => {
      return sum + week.sessions.reduce((sessionSum, session) => {
        return sessionSum + session.exercises.length
      }, 0)
    }, 0)
    return { totalWeeks, workoutsPerWeek, totalExercises }
  }, [plan])

  const selectedWeek = plan.weeks[selectedWeekIndex]
  const firstSession = plan.weeks[0]?.sessions[0]

  const handleApply = () => {
    setScreenState('applying')
    setTimeout(() => {
      setScreenState('success')
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
      const aiResponses: Record<string, string> = {
        'arm': "I'll add more arm exercises to balance out the program. I'm adding bicep curls to the Push day and hammer curls to the Pull day.",
        'leg': "I can adjust the leg work for you. Would you like me to add more leg exercises, reduce the volume, or swap specific movements?",
        'deadlift': "I understand you'd like to avoid deadlifts. I'll replace them with Good Mornings or Hip Thrusts. Which would you prefer?",
        'default': "I can help you adjust the plan. I can add or remove exercises, adjust sets and reps, change workout days, or modify the focus. What changes would you like?",
      }

      const inputLower = input.toLowerCase()
      let responseText = aiResponses.default
      if (inputLower.includes('arm') || inputLower.includes('bicep')) {
        responseText = aiResponses.arm
      } else if (inputLower.includes('leg')) {
        responseText = aiResponses.leg
      } else if (inputLower.includes('deadlift')) {
        responseText = aiResponses.deadlift
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: responseText }],
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
  if (screenState === 'success' && firstSession) {
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

  // Review screen
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
          <Button variant="ghost" size="sm" onClick={onSkipToManual}>
            <SkipForward className="h-4 w-4 mr-2" />
            Manual Setup
          </Button>
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
            <PlanApprovalBar
              totalWeeks={stats.totalWeeks}
              workoutsPerWeek={stats.workoutsPerWeek}
              totalExercises={stats.totalExercises}
              isApplying={screenState === 'applying'}
              onChat={handleOpenChat}
              onApply={handleApply}
            />

            {/* Block Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate">{plan.name}</h1>
                <p className="text-sm text-muted-foreground line-clamp-1">{plan.description}</p>
              </div>
              <Badge variant="outline" className="hidden sm:flex gap-1">
                <Target className="w-3 h-3" />
                {plan.focus}
              </Badge>
            </motion.div>

            {/* Week Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <WeekCarousel
                weeks={plan.weeks}
                selectedIndex={selectedWeekIndex}
                onSelectWeek={setSelectedWeekIndex}
              />
            </motion.div>

            {/* Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{selectedWeek?.name} Workouts</h2>
                <span className="text-sm text-muted-foreground">
                  {selectedWeek?.sessions.length} sessions
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedWeekIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {selectedWeek?.sessions.map((session, index) => (
                    <ProposedSessionCard
                      key={session.id}
                      session={session}
                      defaultExpanded={index === 0}
                      index={index}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
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
