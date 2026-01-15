'use client'

/**
 * PlanReviewOptionC
 *
 * Option C: Compact Segmented Control
 * Week selector as pill tabs, sessions in cards below.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bot, MessageCircle, Check, Loader2, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChatDrawer } from '@/components/features/ai-assistant/ChatDrawer'
import { ChatSidebar } from '@/components/features/ai-assistant/ChatSidebar'
import { useIsDesktop } from '@/components/features/ai-assistant/hooks/useAILayoutMode'
import { WeekSegmentedControl } from './WeekSegmentedControl'
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
        text: "Here's Week 1 of your training plan. I've focused on building a solid foundation with compound movements.\n\nTake a look and let me know if you'd like any adjustments before we continue with the remaining weeks.",
      },
    ],
  } as UIMessage,
]

interface PlanReviewOptionCProps {
  plan: ProposedBlock
  onBack?: () => void
  onStartWorkout?: (sessionId: string) => void
  onViewBlock?: (blockId: string) => void
}

export function PlanReviewOptionC({
  plan,
  onBack,
  onStartWorkout,
  onViewBlock,
}: PlanReviewOptionCProps) {
  const [screenState, setScreenState] = useState<ScreenState>('review')
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const [approvedWeeks, setApprovedWeeks] = useState(1) // Only Week 1 unlocked initially

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isDesktop = useIsDesktop()

  const selectedWeek = plan.weeks[selectedWeekIndex]
  const firstSession = plan.weeks[0]?.sessions[0]
  const isCurrentWeekApproved = selectedWeekIndex < approvedWeeks - 1
  const canApproveMore = approvedWeeks < plan.weeks.length

  const handleApproveWeek = () => {
    if (approvedWeeks < plan.weeks.length) {
      // Unlock next week
      setApprovedWeeks(approvedWeeks + 1)
      setSelectedWeekIndex(approvedWeeks) // Move to newly unlocked week
    } else {
      // All weeks approved, apply plan
      setScreenState('applying')
      setTimeout(() => {
        setScreenState('success')
      }, 1500)
    }
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
        parts: [{ type: 'text', text: "I've noted your feedback. I can adjust the exercises, sets, or reps for this week. What specific changes would you like?" }],
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
          <span className="text-sm text-muted-foreground">Option C: Segmented Control</span>
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
                      <h3 className="font-semibold">
                        {approvedWeeks === 1 ? "Review Week 1" : `Week ${selectedWeekIndex + 1} of ${plan.weeks.length}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {approvedWeeks === 1
                          ? "Let's make sure this looks right before continuing"
                          : canApproveMore
                            ? `${plan.weeks.length - approvedWeeks} weeks remaining`
                            : "All weeks ready for review"
                        }
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

                    <Button
                      onClick={handleApproveWeek}
                      disabled={screenState === 'applying'}
                      className="flex-1"
                    >
                      {screenState === 'applying' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : canApproveMore ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approve & Continue
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
            </motion.div>

            {/* Week Selector + Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-4">
                  {/* Segmented Control */}
                  <div className="flex items-center justify-between mb-4">
                    <WeekSegmentedControl
                      totalWeeks={plan.weeks.length}
                      selectedIndex={selectedWeekIndex}
                      approvedWeeks={approvedWeeks}
                      onSelectWeek={setSelectedWeekIndex}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedWeek?.sessions.length} sessions
                    </span>
                  </div>

                  {/* Week name */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedWeek?.name}</span>
                    {selectedWeek?.isDeload && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Deload
                      </span>
                    )}
                  </div>

                  {/* Sessions */}
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
                </CardContent>
              </Card>
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
