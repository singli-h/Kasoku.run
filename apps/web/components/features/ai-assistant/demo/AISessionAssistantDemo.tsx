"use client"

import { useState, useMemo } from "react"
import { MessageSquare, Sparkles, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChatDrawer } from "./ChatDrawer"
import { ApprovalBanner } from "./ApprovalBanner"
import { ExerciseCardInline, NewExerciseCard } from "./ExerciseCardInline"
import { SupersetContainer } from "./SupersetContainer"
import { mockSession, mockPendingChanges, mockChatHistory, suggestedPrompts } from "./mock-data"
import { ChatMessage, SessionChange, SessionExercise, MockSession } from "./types"
import { toast } from "sonner"

export function AISessionAssistantDemo() {
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Pending changes state
  const [pendingChanges, setPendingChanges] = useState<SessionChange[]>(mockPendingChanges)
  const [isApplied, setIsApplied] = useState(false)

  // Session state
  const [session, setSession] = useState<MockSession>(mockSession)

  const pendingCount = pendingChanges.length

  // Group exercises by superset
  const groupedExercises = useMemo(() => {
    const groups: { type: 'single' | 'superset'; exercises: SessionExercise[]; supersetId?: string }[] = []
    const processedIds = new Set<string>()

    session.exercises.forEach((exercise) => {
      if (processedIds.has(exercise.id)) return

      if (exercise.supersetId) {
        // Find all exercises in this superset
        const supersetExercises = session.exercises.filter(
          (ex) => ex.supersetId === exercise.supersetId
        )
        supersetExercises.forEach((ex) => processedIds.add(ex.id))
        groups.push({
          type: 'superset',
          exercises: supersetExercises,
          supersetId: exercise.supersetId,
        })
      } else {
        processedIds.add(exercise.id)
        groups.push({ type: 'single', exercises: [exercise] })
      }
    })

    return groups
  }, [session.exercises])

  // Get new exercises to add
  const newExercises = useMemo(() => {
    return pendingChanges
      .filter((c) => c.type === 'add' && c.newExercise)
      .map((c) => ({ change: c, exercise: c.newExercise! }))
  }, [pendingChanges])

  // Get change for exercise
  const getChangeForExercise = (exerciseId: string) =>
    pendingChanges.find((c) => c.targetExerciseId === exerciseId)

  // Apply all changes
  const handleApproveAll = () => {
    toast.success(`Applied ${pendingCount} changes to your session`)
    setIsApplied(true)

    // Add confirmation message
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: `Done! I've applied all ${pendingCount} changes. Your session is updated.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  // Regenerate (open chat)
  const handleRegenerate = () => {
    setIsChatOpen(true)
  }

  // Dismiss all changes
  const handleDismiss = () => {
    setPendingChanges([])
    toast("Changes dismissed")
  }

  // Undo
  const handleUndo = () => {
    setPendingChanges(mockPendingChanges)
    setIsApplied(false)
    toast("Changes reverted")
  }

  // Send message
  const sendMessage = (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: getAIResponse(content),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getAIResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase()
    if (lower.includes("log") || lower.includes("performance") || lower.includes("did")) {
      return "Got it! Tell me the details - e.g., 'Squats: 140kg x 5, 160kg x 4, 180kg x 3'. I'll log each set."
    }
    if (lower.includes("regenerate") || lower.includes("different") || lower.includes("again")) {
      // Simulate regenerating changes
      setPendingChanges(mockPendingChanges)
      setIsApplied(false)
      return "I've generated new suggestions. Check them above and approve when ready!"
    }
    if (lower.includes("knee") || lower.includes("hurt") || lower.includes("pain")) {
      return "Sorry to hear that. I can swap squats for leg press or box squats. Want me to prepare those changes?"
    }
    return "Let me know what you'd like to adjust and I'll prepare the changes."
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-sm">AI Assistant Demo</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            v2 Inline
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24">
        {/* Session Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{session.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{session.date}</span>
            <Badge variant="secondary" className="text-xs">
              {session.status}
            </Badge>
          </div>
        </div>

        {/* Approval Banner - shows when changes pending */}
        {(pendingCount > 0 || isApplied) && (
          <div className="mb-4">
            <ApprovalBanner
              changeCount={pendingCount}
              onApproveAll={handleApproveAll}
              onRegenerate={handleRegenerate}
              onDismiss={handleDismiss}
              isApplied={isApplied}
              onUndo={handleUndo}
            />
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-3">
          {groupedExercises.map((group, idx) => {
            if (group.type === 'superset') {
              return (
                <SupersetContainer
                  key={group.supersetId || idx}
                  exercises={group.exercises}
                  changes={pendingChanges}
                />
              )
            }

            const exercise = group.exercises[0]
            const change = getChangeForExercise(exercise.id)

            return (
              <ExerciseCardInline
                key={exercise.id}
                exercise={exercise}
                change={change}
              />
            )
          })}

          {/* New exercises to add */}
          {!isApplied && newExercises.map(({ change, exercise }) => (
            <NewExerciseCard
              key={change.id}
              exercise={exercise}
              change={change}
            />
          ))}
        </div>

        {/* Demo Instructions */}
        {pendingCount === 0 && !isApplied && (
          <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/30 p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Demo Instructions</h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>1. Tap the chat button to talk to AI</li>
              <li>2. Say &quot;regenerate&quot; to see changes again</li>
              <li>3. Changes appear inline on exercises</li>
              <li>4. Approve All or Dismiss with one tap</li>
            </ul>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "transition-all duration-200 hover:scale-105"
        )}
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Drawer */}
      <ChatDrawer
        open={isChatOpen}
        onOpenChange={setIsChatOpen}
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={sendMessage}
        isTyping={isTyping}
        suggestedPrompts={suggestedPrompts}
        pendingCount={0}
        onReviewChanges={() => setIsChatOpen(false)}
      />
    </div>
  )
}
