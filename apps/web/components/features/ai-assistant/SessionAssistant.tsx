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
import { resetExecutionOrderCounter } from '@/lib/changeset/transformations'
import { executeReadTool } from '@/lib/changeset/tool-implementations/read-impl'
import { executeAthleteReadTool } from '@/lib/changeset/tool-implementations/workout-read-impl'
// Note: Rejection prompts removed - AI naturally asks in chat what to change
// Follow-up message injection is NOT part of the design
// See: specs/002-ai-session-assistant/reference/20251221-session-ui-integration.md
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { ChatDrawer, ChatTrigger } from './ChatDrawer'
import { ChatSidebar } from './ChatSidebar'
import { ApprovalBanner } from './ApprovalBanner'
import { SessionAssistantContext } from './SessionAssistantContext'
import { useIsDesktop } from './hooks/useAILayoutMode'
import { useSessionExercisesOptional } from '@/components/features/training/context'
import { useBlockWideExpand } from '@/components/features/plans/individual/PlanAssistantWrapper'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'
import type { ExecutionError, ChangeSet } from '@/lib/changeset/types'

/**
 * Domain type for the assistant.
 * - 'session': Coach session planning (preset_exercise, preset_set)
 * - 'workout': Athlete workout logging (training_exercise, training_set)
 * - 'plan': Plan-level assistant with context-aware prompts (block/week/session/exercise)
 */
export type AssistantDomain = 'session' | 'workout' | 'plan'

interface SessionAssistantProps {
  /** The session ID (session_plan ID for session domain, workout_log ID for workout domain) */
  sessionId: string

  /** The plan ID (required for plan domain, optional for others) */
  planId?: string

  /**
   * Domain for the assistant.
   * - 'session' (default): Coach session planning
   * - 'workout': Athlete workout logging
   * - 'plan': Plan-level assistant with multi-level context
   */
  domain?: AssistantDomain

  /** Database user ID for exercise search visibility filtering */
  dbUserId?: string

  /** Week ID for plan domain context (microcycle ID) */
  weekId?: number | null

  /** Exercise ID for plan domain exercise-level context */
  exerciseId?: string | null

  /** AI context level for plan domain */
  aiContextLevel?: 'block' | 'week' | 'session' | 'exercise'

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

  /**
   * Callback triggered after workout domain execution completes successfully.
   * Use this to invalidate React Query cache and refresh UI.
   * Only called for domain='workout'.
   */
  onWorkoutUpdated?: () => void | Promise<void>

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
  planId,
  domain = 'session',
  dbUserId,
  weekId,
  exerciseId,
  aiContextLevel,
  useInlineMode = false,
  autoCollapseChat = true,
  onWorkoutUpdated,
  children,
}: SessionAssistantProps) {
  // Responsive layout detection
  const isDesktop = useIsDesktop()

  // Block-wide expand context for full-width AI view
  const blockWideExpand = useBlockWideExpand()

  // Get exercises from shared context (single source of truth)
  const exercisesContext = useSessionExercisesOptional()
  const exercises = exercisesContext?.exercises ?? []
  const setExercises = exercisesContext?.setExercises

  const [chatOpen, setChatOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<ExecutionError | undefined>()
  const [streamError, setStreamError] = useState<string | null>(null)
  const [input, setInput] = useState('')

  // Pending tool call info for pause/resume (confirmChangeSet)
  const [pendingToolCall, setPendingToolCall] = useState<{
    toolCallId: string
    toolName: string
  } | null>(null)

  // Track responded tool calls to prevent duplicate submissions (race condition guard)
  const respondedToolCallsRef = useRef<Set<string>>(new Set())

  // Mutex to prevent double-approve race condition (rapid double-click on Apply button)
  const executingMutexRef = useRef(false)

  // Track mounted state to guard against post-unmount operations
  // Must set true in setup (not just useRef init) to survive React Strict Mode re-mount
  const isMountedRef = useRef(true)
  // Ref for stop() to avoid dependency issues in cleanup effect
  const stopRef = useRef<() => void>(() => {})
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Abort AI stream on unmount to prevent orphaned tool calls
      stopRef.current()
    }
  }, [])

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

  // Reuse a single Supabase client for all tool calls (avoid creating per-call)
  // Use a wrapper that always reads latest getToken from ref to survive Clerk session refresh
  const supabaseClientRef = useRef(
    createClientSupabaseClient((...args) => getTokenRef.current(...args))
  )

  // Create transport with API endpoint and domain-specific body
  // - session: /api/ai/session-assistant with sessionId
  // - workout: /api/ai/workout-assistant with workoutLogId
  // - plan: /api/ai/plan-assistant with planId + context fields
  const apiUrl = domain === 'workout'
    ? '/api/ai/workout-assistant'
    : domain === 'plan'
      ? '/api/ai/plan-assistant'
      : '/api/ai/session-assistant'

  const apiBody = domain === 'workout'
    ? { workoutLogId: sessionId }
    : domain === 'plan'
      ? { planId: planId ? Number(planId) : undefined, sessionId, weekId, exerciseId, aiContextLevel }
      : { sessionId }

  const transport = useMemo(() => new DefaultChatTransport({
    api: apiUrl,
    body: apiBody,
    // Truncate verbose tool results in older messages to reduce payload size
    prepareSendMessagesRequest: ({ messages: msgs, body: reqBody }) => {
      const KEEP_RECENT = 4
      if (msgs.length <= KEEP_RECENT) {
        return { body: { ...reqBody, messages: msgs } }
      }

      const trimmedMessages = msgs.map((msg, index) => {
        // Keep recent messages untouched
        if (index >= msgs.length - KEEP_RECENT) return msg
        // Only process assistant messages with tool parts
        if (msg.role !== 'assistant' || !msg.parts) return msg

        const trimmedParts = msg.parts.map((part) => {
          // Truncate tool output in older messages
          const p = part as { type: string; state?: string; output?: unknown }
          if (p.type.startsWith('tool-') && p.state === 'output-available' && p.output != null) {
            const outputStr = typeof p.output === 'string' ? p.output : JSON.stringify(p.output)
            if (outputStr.length > 200) {
              return { ...part, output: outputStr.substring(0, 200) + '...[truncated]' }
            }
          }
          return part
        })
        return { ...msg, parts: trimmedParts }
      })

      return { body: { ...reqBody, messages: trimmedMessages } }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- apiUrl and apiBody are derived from these deps
  }), [sessionId, domain, planId, weekId, exerciseId, aiContextLevel])

  // Track which tool calls have been processed (by onToolCall or effect fallback)
  const processedToolCallsRef = useRef<Set<string>>(new Set())

  // Shared tool call handler — used by both onToolCall callback and effect fallback
  const processToolCall = useCallback(async (
    toolCallId: string,
    toolName: string,
    toolInput: unknown,
    addToolOutputFn: typeof addToolOutputRef.current,
  ) => {
    if (!isMountedRef.current) return

    const supabase = supabaseClientRef.current

    try {
      const toolArgs = (toolInput ?? {}) as Record<string, unknown>

      const result = await handleToolCall(
        toolName,
        toolArgs,
        {
          changeSet: changeSetRef.current,
          sessionId,
          showApprovalWidget: () => {
            setPendingToolCall({ toolCallId, toolName })
            setShowBanner(true)
            setExecutionError(undefined)
          },
          executeReadTool: (name, args) =>
            domain === 'workout'
              ? executeAthleteReadTool(name, args, supabase, dbUserId)
              : executeReadTool(name, args, supabase, dbUserId),
        }
      )

      // If PAUSE, don't return a result yet - wait for user decision
      if (result === 'PAUSE') {
        console.log('[SessionAssistant] Tool paused for user approval:', toolName)
        return
      }

      // For other results, add the tool output
      const output = typeof result === 'string' ? result : JSON.stringify(result)
      console.log('[SessionAssistant] Adding tool output for:', toolName, 'output:', output.substring(0, 100))

      addToolOutputFn({
        tool: toolName,
        toolCallId,
        output,
      })
    } catch (error) {
      console.error('[SessionAssistant] Tool execution error:', error)

      addToolOutputFn({
        tool: toolName,
        toolCallId,
        output: JSON.stringify({
          error: error instanceof Error ? error.message : 'Tool execution failed',
        }),
      })
    }
  }, [sessionId, domain, dbUserId])

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
    // Throttle UI updates to reduce React re-renders during fast streaming
    experimental_throttle: 50,
    // Automatically send when all tool calls have results
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // Handle stream errors (network drops, 500s, token limits, timeouts)
    onError(error) {
      console.error('[SessionAssistant] Stream error:', {
        message: error.message,
        name: error.name,
        constructor: error.constructor?.name,
        stack: error.stack?.substring(0, 300),
      })
      if (isMountedRef.current) {
        setStreamError(error.message || 'Something went wrong. Please try again.')
        setPendingToolCall(null)
      }
    },
    // Handle tool calls from the AI (primary path)
    async onToolCall({ toolCall }) {
      if (!isMountedRef.current) return

      // Deduplicate: skip if already processed by effect fallback
      if (processedToolCallsRef.current.has(toolCall.toolCallId)) {
        console.log('[SessionAssistant] onToolCall skipped (already processed):', toolCall.toolName)
        return
      }
      processedToolCallsRef.current.add(toolCall.toolCallId)

      console.log('[SessionAssistant] onToolCall received:', toolCall.toolName, toolCall.toolCallId)

      const toolInput = ((toolCall as { input?: unknown }).input ?? {})
      await processToolCall(toolCall.toolCallId, toolCall.toolName, toolInput, addToolOutput)
    },
  })

  // Stable refs for cleanup and effect fallback
  stopRef.current = stop
  const addToolOutputRef = useRef(addToolOutput)
  addToolOutputRef.current = addToolOutput

  // Effect-based fallback: detect unprocessed tool parts in messages
  // This handles cases where onToolCall doesn't fire (SDK race conditions, etc.)
  useEffect(() => {
    if (!isMountedRef.current) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant') return

    // Only process when stream is done (status 'ready' or 'error')
    // During streaming, onToolCall should handle it
    if (status === 'streaming' || status === 'submitted') return

    for (const part of lastMessage.parts) {
      if (!part.type.startsWith('tool-')) continue

      const toolPart = part as {
        toolCallId?: string
        toolName?: string
        state?: string
        input?: unknown
      }

      // Only process tools in 'input-available' state (not yet handled)
      if (toolPart.state !== 'input-available') continue
      if (!toolPart.toolCallId || !toolPart.toolName) continue
      if (processedToolCallsRef.current.has(toolPart.toolCallId)) continue

      // Mark as processed
      processedToolCallsRef.current.add(toolPart.toolCallId)

      console.log('[SessionAssistant] Effect fallback processing tool:', toolPart.toolName, toolPart.toolCallId)

      // Extract tool name from part type (format: "tool-{toolName}")
      const toolName = toolPart.toolName
      processToolCall(
        toolPart.toolCallId,
        toolName,
        toolPart.input,
        addToolOutputRef.current,
      )
    }
  }, [messages, status, processToolCall])

  // Derived state
  const isLoading = status === 'submitted' || status === 'streaming'
  const hasError = status === 'error' || !!streamError

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Clear any previous error when user sends a new message
    setStreamError(null)
    sendMessage({ text: input })
    setInput('')
  }, [input, isLoading, sendMessage])

  /**
   * Handle user approval of changes.
   *
   * State management:
   * - Sets isExecuting=true at start, false in finally (always)
   * - Clears pendingToolCall in finally (always)
   * - Reports results back to AI (success or failure)
   * - Calls onWorkoutUpdated for workout domain to refresh React Query cache
   */
  const handleApprove = useCallback(async () => {
    if (!changeSet.changeset || !pendingToolCall) {
      console.warn('[handleApprove] Missing changeset or pendingToolCall, aborting')
      return
    }

    // Mutex guard: prevent concurrent execution from rapid double-clicks
    if (executingMutexRef.current) return
    executingMutexRef.current = true

    // Check if AI was already notified (allows retry without duplicate addToolOutput)
    const alreadyRespondedToAI = respondedToolCallsRef.current.has(pendingToolCall.toolCallId)

    setIsExecuting(true)
    setExecutionError(undefined)

    try {
      // Execute changes using domain-specific execution function
      const result = domain === 'workout'
        ? await executeWorkoutChangeSet(changeSet.changeset, sessionId)
        : await executeChangeSet(changeSet.changeset, exercises, sessionId)

      if (result.status === 'approved') {
        // Success - update UI based on domain
        if (domain !== 'workout' && result.updatedExercises && setExercises) {
          setExercises(result.updatedExercises as SessionPlannerExercise[])
        } else if (domain === 'workout' && onWorkoutUpdated) {
          try {
            await Promise.resolve(onWorkoutUpdated())
          } catch (refreshError) {
            console.warn('[handleApprove] onWorkoutUpdated callback error:', refreshError)
          }
        }

        // Notify AI only if not already responded (retry skips this)
        if (!alreadyRespondedToAI) {
          respondedToolCallsRef.current.add(pendingToolCall.toolCallId)
          addToolOutput({
            tool: pendingToolCall.toolName,
            toolCallId: pendingToolCall.toolCallId,
            output: JSON.stringify(createApprovalResult(true, changeSet.changeset.changeRequests)),
          })
        }

        // Clear changeset and hide banner
        changeSet.clear()
        setShowBanner(false)
        setPendingToolCall(null)
      } else {
        // Execution failed - transition status and keep pendingToolCall for retry
        changeSet.setStatus('execution_failed')
        setExecutionError(result.error)

        if (!alreadyRespondedToAI) {
          respondedToolCallsRef.current.add(pendingToolCall.toolCallId)
          addToolOutput({
            tool: pendingToolCall.toolName,
            toolCallId: pendingToolCall.toolCallId,
            output: JSON.stringify(createExecutionFailureResult(result.error)),
          })
        }
      }
    } catch (error) {
      console.error('[handleApprove] Unexpected error:', error)

      const executionErr = {
        type: 'CRITICAL' as const,
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown error',
        failedRequestIndex: 0,
      }
      changeSet.setStatus('execution_failed')
      setExecutionError(executionErr)

      if (!alreadyRespondedToAI) {
        respondedToolCallsRef.current.add(pendingToolCall.toolCallId)
        addToolOutput({
          tool: pendingToolCall.toolName,
          toolCallId: pendingToolCall.toolCallId,
          output: JSON.stringify(createExecutionFailureResult(executionErr)),
        })
      }
    } finally {
      setIsExecuting(false)
      executingMutexRef.current = false
    }
  }, [changeSet, domain, exercises, sessionId, setExercises, onWorkoutUpdated, pendingToolCall, addToolOutput])

  /**
   * Handle user regeneration request (user clicked "Change" button).
   * Simply returns rejection to AI - AI will ask in chat what to change.
   * NO follow-up prompt injection - feedback comes from chat conversation.
   *
   * IMPORTANT: Changeset is PRESERVED (not cleared) so AI can modify it.
   * Per design: "Restore keyed buffer (not cleared)" - AI corrects via upsert.
   */
  const handleRegenerate = useCallback(() => {
    if (!pendingToolCall) return

    // Only send tool output if AI hasn't been notified yet (e.g. after execution_failed,
    // respondedToolCallsRef already has this ID — skip addToolOutput but still clean up UI)
    if (!respondedToolCallsRef.current.has(pendingToolCall.toolCallId)) {
      respondedToolCallsRef.current.add(pendingToolCall.toolCallId)
      addToolOutput({
        tool: pendingToolCall.toolName,
        toolCallId: pendingToolCall.toolCallId,
        output: JSON.stringify(createApprovalResult(false)),
      })
    }

    // Reset execution order so re-proposed changes start from 1
    resetExecutionOrderCounter()
    // Transition changeset back to "building" state (NOT cleared)
    // AI can modify the existing changes via upsert operations
    changeSet.setStatus('building')
    setShowBanner(false)
    setPendingToolCall(null)
  }, [pendingToolCall, addToolOutput, changeSet])

  /**
   * Handle user dismissal of changes.
   * Note: Dismiss button is removed from UI, but this handler remains for error state dismiss.
   */
  const handleDismiss = useCallback(() => {
    if (!pendingToolCall) return

    // Only send tool output if AI hasn't been notified yet (e.g. after execution_failed,
    // respondedToolCallsRef already has this ID — skip addToolOutput but still clean up UI)
    if (!respondedToolCallsRef.current.has(pendingToolCall.toolCallId)) {
      respondedToolCallsRef.current.add(pendingToolCall.toolCallId)
      addToolOutput({
        tool: pendingToolCall.toolName,
        toolCallId: pendingToolCall.toolCallId,
        output: JSON.stringify(createApprovalResult(false)),
      })
    }

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
    // Abort any in-flight stream first to prevent ghost tool calls
    stop()
    // Clear messages
    setMessages([])
    // Clear any pending changeset
    changeSet.clear()
    setShowBanner(false)
    setExecutionError(undefined)
    setStreamError(null)
    setPendingToolCall(null)
    // Clear tool call tracking
    respondedToolCallsRef.current.clear()
    processedToolCallsRef.current.clear()
  }, [stop, setMessages, changeSet])

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
  // When expanded, sidebar takes full width so no margin needed
  const showSidebar = isDesktop && chatOpen
  const isExpanded = blockWideExpand?.isExpanded ?? false

  return (
    <SessionAssistantContext.Provider value={contextValue}>
      {/* Desktop: Flex layout with sidebar pushing content */}
      <div className="flex min-h-full">
        {/* Main content area - shrinks when sidebar is open, hidden when expanded */}
        <div
          className="flex-1 min-w-0 transition-all duration-300 ease-out"
          style={{
            marginRight: showSidebar && !isExpanded ? 400 : 0,
            display: isExpanded && chatOpen ? 'none' : undefined,
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
            streamError={streamError}
            onRetry={() => setStreamError(null)}
            onStop={stop}
            onClearChat={handleClearChat}
            isExpanded={blockWideExpand?.isExpanded ?? false}
            onExpand={blockWideExpand?.expand}
            onCollapse={blockWideExpand?.collapse}
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
          streamError={streamError}
          onRetry={() => setStreamError(null)}
          onStop={stop}
          onClearChat={handleClearChat}
          isExpanded={blockWideExpand?.isExpanded ?? false}
          onExpand={blockWideExpand?.expand}
          onCollapse={blockWideExpand?.collapse}
        />
      )}

      {/* Chat trigger button - hidden when chat is open */}
      <ChatTrigger
        onClick={() => setChatOpen(true)}
        hasChanges={changeSet.hasPendingChanges()}
        changeCount={changeSet.getPendingCount()}
        hidden={chatOpen}
      />

      {/* Approval banner (overlay mode only) - fixed at bottom of viewport */}
      {!useInlineMode && showBanner && changeSet.changeset && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <ApprovalBanner
            changeset={changeSet.changeset}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
            onDismiss={handleDismiss}
            isExecuting={isExecuting}
            executionError={executionError}
          />
        </div>
      )}
    </SessionAssistantContext.Provider>
  )
}
