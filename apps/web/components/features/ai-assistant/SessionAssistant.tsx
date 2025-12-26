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
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { useAuth } from '@clerk/nextjs'
import { ChangeSetProvider } from '@/lib/changeset/ChangeSetContext'
import { useChangeSet } from '@/lib/changeset/useChangeSet'
import { handleToolCall, createApprovalResult, createExecutionFailureResult } from '@/lib/changeset/tool-handler'
import { executeChangeSet } from '@/lib/changeset/execute'
import { executeReadTool } from '@/lib/changeset/tool-implementations/read-impl'
import { buildRejectionFollowUpPrompt, buildExecutionFailurePrompt } from '@/lib/changeset/prompts/session-planner'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { ChatDrawer, ChatTrigger } from './ChatDrawer'
import { ApprovalBanner } from './ApprovalBanner'
import { SessionAssistantContext } from './SessionAssistantContext'
import { useSessionExercisesOptional } from '@/components/features/training/context'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'
import type { ExecutionError, ChangeSet } from '@/lib/changeset/types'

// ============================================================================
// LocalStorage Persistence for Chat Messages
// ============================================================================
const STORAGE_KEY_PREFIX = 'kasoku_ai_session_'
const getStorageKey = (sessionId: number) => `${STORAGE_KEY_PREFIX}${sessionId}`

interface PersistedState {
  messages: UIMessage[]
  changeset: ChangeSet | null
  showBanner: boolean
  timestamp: number
}

// 24 hour expiry for persisted state
const EXPIRY_MS = 24 * 60 * 60 * 1000

function loadPersistedState(sessionId: number): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getStorageKey(sessionId))
    if (!stored) return null
    const parsed = JSON.parse(stored) as PersistedState
    // Check expiry
    if (Date.now() - parsed.timestamp > EXPIRY_MS) {
      localStorage.removeItem(getStorageKey(sessionId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function savePersistedState(sessionId: number, state: Partial<PersistedState>) {
  if (typeof window === 'undefined') return
  try {
    const existing = loadPersistedState(sessionId) || { messages: [], changeset: null, showBanner: false, timestamp: Date.now() }
    const updated = { ...existing, ...state, timestamp: Date.now() }
    localStorage.setItem(getStorageKey(sessionId), JSON.stringify(updated))
  } catch (e) {
    console.warn('[SessionAssistant] Failed to persist state:', e)
  }
}

function clearPersistedState(sessionId: number) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(getStorageKey(sessionId))
  } catch {
    // Ignore
  }
}

interface SessionAssistantProps {
  /** The session ID */
  sessionId: number

  /** The plan ID */
  planId: string

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
  useInlineMode = false,
  autoCollapseChat = true,
  children,
}: SessionAssistantProps) {
  // Get exercises from shared context (single source of truth)
  const exercisesContext = useSessionExercisesOptional()
  const exercises = exercisesContext?.exercises ?? []
  const setExercises = exercisesContext?.setExercises

  // Load persisted state on mount
  const [initialState] = useState(() => loadPersistedState(sessionId))

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(initialState?.showBanner ?? false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<ExecutionError | undefined>()
  const [input, setInput] = useState('')

  // Pending tool call info for pause/resume (confirmChangeSet)
  const [pendingToolCall, setPendingToolCall] = useState<{
    toolCallId: string
    toolName: string
  } | null>(null)

  const changeSet = useChangeSet()

  // Restore changeset from localStorage on mount
  useEffect(() => {
    if (initialState?.changeset && !changeSet.changeset) {
      // Restore each change request
      initialState.changeset.changeRequests.forEach(req => {
        changeSet.upsert(req)
      })
    }
  }, []) // Only on mount

  // Auto-collapse chat when proposals are pending (inline mode only)
  useEffect(() => {
    if (useInlineMode && autoCollapseChat && showBanner) {
      setDrawerOpen(false)
    }
  }, [useInlineMode, autoCollapseChat, showBanner])

  // Persist showBanner and changeset state
  useEffect(() => {
    savePersistedState(sessionId, {
      showBanner,
      changeset: changeSet.changeset,
    })
  }, [sessionId, showBanner, changeSet.changeset])

  // Get Clerk auth for Supabase client
  const { getToken } = useAuth()

  // Refs for stable access in callbacks (to avoid dependency issues with onToolCall)
  const changeSetRef = useRef(changeSet)
  changeSetRef.current = changeSet
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  // Create transport with API endpoint and session ID in body
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/session-assistant',
    body: { sessionId },
  }), [sessionId])

  // Vercel AI SDK useChat hook with onToolCall for client-side tools
  const {
    messages,
    sendMessage,
    status,
    stop,
    addToolOutput,
  } = useChat({
    transport,
    // Restore messages from localStorage
    messages: initialState?.messages,
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
            executeReadTool: (name, args) => executeReadTool(name, args, supabase),
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

  // Persist messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      savePersistedState(sessionId, { messages })
    }
  }, [sessionId, messages])

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
      // Execute changes - exercises already in correct type
      const result = await executeChangeSet(
        changeSet.changeset,
        exercises,
        sessionId
      )

      if (result.status === 'approved') {
        // Success - update shared exercises context with execution result
        if (result.updatedExercises && setExercises) {
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
  }, [changeSet, exercises, sessionId, setExercises, pendingToolCall, addToolOutput, sendMessage])

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

  // Context value for inline proposal section
  const contextValue = useMemo(
    () => ({
      hasPendingProposals: showBanner && !!changeSet.changeset,
      changeset: changeSet.changeset,
      isExecuting,
      executionError,
      isChatOpen: drawerOpen,
      openChat: () => setDrawerOpen(true),
      closeChat: () => setDrawerOpen(false),
      approve: handleApprove,
      regenerate: handleRegenerate,
      dismiss: handleDismiss,
    }),
    [
      showBanner,
      changeSet.changeset,
      isExecuting,
      executionError,
      drawerOpen,
      handleApprove,
      handleRegenerate,
      handleDismiss,
    ]
  )

  return (
    <SessionAssistantContext.Provider value={contextValue}>
      {/* Children (for custom layouts with inline proposals) */}
      {children}

      {/* Chat trigger button */}
      <ChatTrigger
        onClick={() => setDrawerOpen(true)}
        hasChanges={changeSet.hasPendingChanges()}
        changeCount={changeSet.getPendingCount()}
      />

      {/* Chat drawer */}
      <ChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
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
