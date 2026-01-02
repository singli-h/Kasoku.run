'use client'

/**
 * SessionAssistant Container
 *
 * Main container component that integrates all AI assistant pieces:
 * - ChangeSetProvider for buffer management
 * - useChat from Vercel AI SDK for AI communication
 * - Tool handler for processing AI tool calls
 * - ChatDrawer and ApprovalBanner UI
 *
 * Supports two modes:
 * - Overlay mode (default): ApprovalBanner fixed at bottom
 * - Inline mode: Proposals rendered via InlineProposalSection elsewhere
 *
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 5
 */

import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { useAuth } from '@clerk/nextjs'
import { ChangeSetProvider } from '@/lib/changeset/ChangeSetContext'
import { useChangeSet } from '@/lib/changeset/useChangeSet'
import { handleToolCall, createApprovalResult, createExecutionFailureResult } from '@/lib/changeset/tool-handler'
import { executeChangeSet } from '@/lib/changeset/execute'
import { executeWorkoutChangeSet } from '@/lib/changeset/execute-workout'
import { executeReadTool } from '@/lib/changeset/tool-implementations/read-impl'
import { executeAthleteReadTool } from '@/lib/changeset/tool-implementations/workout-read-impl'
import { buildRejectionFollowUpPrompt, buildExecutionFailurePrompt } from '@/lib/changeset/prompts/session-planner'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { ChatDrawer, ChatTrigger } from './ChatDrawer'
import { ChatSidebar } from './ChatSidebar'
import { ApprovalBanner } from './ApprovalBanner'
import { SessionAssistantContext } from './SessionAssistantContext'
import { useIsDesktop } from './hooks/useAILayoutMode'
import { useSessionExercisesOptional } from '@/components/features/training/context'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'
import type { ExecutionError, ChangeSet } from '@/lib/changeset/types'

/**
 * Domain type for the assistant.
 * - 'session': Coach session planning (preset_exercise, preset_set)
 * - 'workout': Athlete workout logging (training_exercise, training_set)
 */
export type AssistantDomain = 'session' | 'workout'

interface SessionAssistantProps {
  /** The session ID (session_plan ID for session domain, workout_log ID for workout domain) */
  sessionId: number

  /** The plan ID (optional for workout domain) */
  planId?: string

  /**
   * Domain for the assistant.
   * - 'session' (default): Coach session planning
   * - 'workout': Athlete workout logging
   */
  domain?: AssistantDomain

  /**
   * Use inline mode for proposals.
   * When true, the overlay ApprovalBanner is hidden.
   * Use InlineProposalSection component to display proposals.
   */
  useInlineMode?: boolean

  /**
   * Auto-collapse chat when proposals are pending.
   * Only applies when useInlineMode is true.
   */
  autoCollapseChat?: boolean

  /** Children to render inside the context provider */
  children?: React.ReactNode
}

/**
 * SessionAssistant - the main orchestration component.
 *
 * This wraps the inner content with ChangeSetProvider.
 */
export function SessionAssistant(props: SessionAssistantProps) {
  return (
    <ChangeSetProvider>
      <SessionAssistantContent {...props} />
    </ChangeSetProvider>
  )
}

/**
 * Inner content that has access to ChangeSet context.
 */
function SessionAssistantContent({
  sessionId,
  domain = 'session',
  useInlineMode = false,
  autoCollapseChat = true,
  children,
}: SessionAssistantProps) {
  // Responsive layout detection
  const isDesktop = useIsDesktop()

  // Get exercises from shared context (single source of truth)
  const exercisesContext = useSessionExercisesOptional()
  const exercises = exercisesContext?.exercises ?? []
  const setExercises = exercisesContext?.setExercises

  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<ExecutionError | undefined>()
  const [input, setInput] = useState('')

  // Pending tool call info for pause/resume (confirmChangeSet)
  const [pendingToolCall, setPendingToolCall] = useState<{
    toolCallId: string
    toolName: string
  } | null>(null)

  const changeSet = useChangeSet()

  // Auto-collapse chat when proposals are pending (inline mode only)
  useEffect(() => {
    if (useInlineMode && autoCollapseChat && showBanner) {
      setChatOpen(false)
    }
  }, [useInlineMode, autoCollapseChat, showBanner])

  // Get Clerk auth for Supabase client
  const { getToken } = useAuth()

  // Refs for stable access in callbacks (to avoid dependency issues with onToolCall)
  const changeSetRef = useRef(changeSet)
  changeSetRef.current = changeSet
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  // Create transport with API endpoint and ID in body
  // For session domain: /api/ai/session-assistant with sessionId
  // For workout domain: /api/ai/workout-assistant with workoutLogId
  const transport = useMemo(() => new DefaultChatTransport({
    api: domain === 'workout' ? '/api/ai/workout-assistant' : '/api/ai/session-assistant',
    body: domain === 'workout' ? { workoutLogId: sessionId } : { sessionId },
  }), [sessionId, domain])

  // Vercel AI SDK useChat hook with onToolCall for client-side tools
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    addToolOutput,
  } = useChat({
    transport,
    // Automatically send when all tool calls have results
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // Handle tool calls from the AI
    async onToolCall({ toolCall }) {
      console.log('[SessionAssistant] onToolCall received:', toolCall.toolName)

      // Create Supabase client for read operations
      const supabase = createClientSupabaseClient(getTokenRef.current)

      try {
        // AI SDK 6 uses 'input' for tool arguments
        const toolArgs = (toolCall as { input?: unknown }).input ?? {}

        const result = await handleToolCall(
          toolCall.toolName,
          toolArgs as Record<string, unknown>,
          {
            changeSet: changeSetRef.current,
            sessionId,
            showApprovalWidget: () => {
              // Save the tool call info for later (for confirmChangeSet pause/resume)
              setPendingToolCall({ toolCallId: toolCall.toolCallId, toolName: toolCall.toolName })
              // Show the approval banner
              setShowBanner(true)
              setExecutionError(undefined)
            },
            executeReadTool: (name, args) =>
              domain === 'workout'
                ? executeAthleteReadTool(name, args, supabase)
                : executeReadTool(name, args, supabase),
          }
        )

        // If PAUSE, don't return a result yet - wait for user decision
        if (result === 'PAUSE') {
          console.log('[SessionAssistant] Tool paused for user approval:', toolCall.toolName)
          // Don't call addToolOutput - the UI will handle the pending state
          return
        }

        // For other results, add the tool output (NO await to avoid deadlocks)
        const output = typeof result === 'string' ? result : JSON.stringify(result)
        console.log('[SessionAssistant] Adding tool output for:', toolCall.toolName, 'output:', output.substring(0, 100))

        // Call without await - this is critical for the AI SDK pattern
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output,
        })
      } catch (error) {
        console.error('[SessionAssistant] Tool execution error:', error)

        // Report error back to AI
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: JSON.stringify({
            error: error instanceof Error ? error.message : 'Tool execution failed',
          }),
        })
      }
    },
  })

  // Derived state
  const isLoading = status === 'submitted' || status === 'streaming'

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ text: input })
    setInput('')
  }, [input, isLoading, sendMessage])

  /**
   * Handle user approval of changes.
   */
  const handleApprove = useCallback(async () => {
    if (!changeSet.changeset || !pendingToolCall) return

    setIsExecuting(true)
    setExecutionError(undefined)

    try {
      // Execute changes using domain-specific execution function
      const result = domain === 'workout'
        ? await executeWorkoutChangeSet(changeSet.changeset, sessionId)
        : await executeChangeSet(changeSet.changeset, exercises, sessionId)

      if (result.status === 'approved') {
        // Success - update shared exercises context with execution result (session domain only)
        if (domain === 'session' && result.updatedExercises && setExercises) {
          setExercises(result.updatedExercises as SessionPlannerExercise[])
        }

        // Return result to AI (no await to avoid deadlocks)
        addToolOutput({
          tool: pendingToolCall.toolName,
          toolCallId: pendingToolCall.toolCallId,
          output: JSON.stringify(createApprovalResult(true, changeSet.changeset.changeRequests)),
        })

        // Clear changeset
        changeSet.clear()
        setShowBanner(false)
      } else {
        // Execution failed
        setExecutionError(result.error)

        // Return error to AI
        addToolOutput({
          tool: pendingToolCall.toolName,
          toolCallId: pendingToolCall.toolCallId,
          output: JSON.stringify(createExecutionFailureResult(result.error)),
        })

        // Add follow-up message for AI
        sendMessage({
          text: buildExecutionFailurePrompt(result.error?.message || 'Unknown error'),
        })
      }
    } catch (error) {
      console.error('[handleApprove] Error:', error)
      setExecutionError({
        type: 'CRITICAL',
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error',
        failedRequestIndex: 0,
      })
    } finally {
      setIsExecuting(false)
      setPendingToolCall(null)
    }
  }, [changeSet, domain, exercises, sessionId, setExercises, pendingToolCall, addToolOutput, sendMessage])

  /**
   * Handle user regeneration request.
   */
  const handleRegenerate = useCallback(
    (feedback?: string) => {
      if (!pendingToolCall) return

      // Return rejection result to AI (no await)
      addToolOutput({
        tool: pendingToolCall.toolName,
        toolCallId: pendingToolCall.toolCallId,
        output: JSON.stringify(createApprovalResult(false, undefined, feedback)),
      })

      // Add follow-up message
      if (feedback) {
        sendMessage({
          text: buildRejectionFollowUpPrompt(feedback),
        })
      }

      // Clear changeset but keep banner hidden until AI proposes again
      changeSet.clear()
      setShowBanner(false)
      setPendingToolCall(null)
    },
    [pendingToolCall, addToolOutput, sendMessage, changeSet]
  )

  /**
   * Handle user dismissal of changes.
   */
  const handleDismiss = useCallback(() => {
    if (!pendingToolCall) return

    // Return rejection result to AI (no await)
    addToolOutput({
      tool: pendingToolCall.toolName,
      toolCallId: pendingToolCall.toolCallId,
      output: JSON.stringify(createApprovalResult(false)),
    })

    // Clear everything
    changeSet.clear()
    setShowBanner(false)
    setExecutionError(undefined)
    setPendingToolCall(null)
  }, [pendingToolCall, addToolOutput, changeSet])

  /**
   * Handle clearing the chat to start fresh.
   */
  const handleClearChat = useCallback(() => {
    // Clear messages
    setMessages([])
    // Clear any pending changeset
    changeSet.clear()
    setShowBanner(false)
    setExecutionError(undefined)
    setPendingToolCall(null)
  }, [setMessages, changeSet])

  // Context value for inline proposal section
  const contextValue = useMemo(
    () => ({
      hasPendingProposals: showBanner && !!changeSet.changeset,
      changeset: changeSet.changeset,
      isExecuting,
      executionError,
      isChatOpen: chatOpen,
      openChat: () => setChatOpen(true),
      closeChat: () => setChatOpen(false),
      approve: handleApprove,
      regenerate: handleRegenerate,
      dismiss: handleDismiss,
    }),
    [
      showBanner,
      changeSet.changeset,
      isExecuting,
      executionError,
      chatOpen,
      handleApprove,
      handleRegenerate,
      handleDismiss,
    ]
  )

  // On desktop, sidebar pushes content instead of overlaying
  const showSidebar = isDesktop && chatOpen

  return (
    <SessionAssistantContext.Provider value={contextValue}>
      {/* Desktop: Flex layout with sidebar pushing content */}
      <div className="flex min-h-full">
        {/* Main content area - shrinks when sidebar is open */}
        <div
          className="flex-1 min-w-0 transition-all duration-300 ease-out"
          style={{
            marginRight: showSidebar ? 400 : 0,
          }}
        >
          {children}
        </div>

        {/* Desktop: Right sidebar (fixed, pushes content via margin) */}
        {isDesktop && (
          <ChatSidebar
            open={chatOpen}
            onOpenChange={setChatOpen}
            isPinned={sidebarPinned}
            onPinChange={setSidebarPinned}
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onStop={stop}
            onClearChat={handleClearChat}
          />
        )}
      </div>

      {/* Mobile/Tablet: Bottom drawer */}
      {!isDesktop && (
        <ChatDrawer
          open={chatOpen}
          onOpenChange={setChatOpen}
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={stop}
          onClearChat={handleClearChat}
        />
      )}

      {/* Chat trigger button - hidden when chat is open */}
      <ChatTrigger
        onClick={() => setChatOpen(true)}
        hasChanges={changeSet.hasPendingChanges()}
        changeCount={changeSet.getPendingCount()}
        hidden={chatOpen}
      />

      {/* Approval banner (overlay mode only) */}
      {!useInlineMode && showBanner && changeSet.changeset && (
        <ApprovalBanner
          changeset={changeSet.changeset}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onDismiss={handleDismiss}
          isExecuting={isExecuting}
          executionError={executionError}
        />
      )}
    </SessionAssistantContext.Provider>
  )
}
