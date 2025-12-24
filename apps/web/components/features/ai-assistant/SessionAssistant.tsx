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
 * @see specs/002-ai-session-assistant/reference/20251221-changeset-architecture.md section 5
 */

import { useCallback, useState, useMemo, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
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
import type { SessionExercise, ExerciseLibraryItem } from '@/components/features/plans/session-planner/types'
import type { ExecutionError } from '@/lib/changeset/types'

interface SessionAssistantProps {
  /** The session ID */
  sessionId: number

  /** The plan ID */
  planId: string

  /** Current exercises in the session */
  exercises: SessionExercise[]

  /** Available exercises from the library */
  exerciseLibrary: ExerciseLibraryItem[]

  /** Optional callback when exercises are modified */
  onExercisesChange?: (exercises: SessionExercise[]) => void
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
  exercises,
  onExercisesChange,
}: SessionAssistantProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
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
    // Automatically send when all tool calls have results
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // Handle tool calls from the AI
    async onToolCall({ toolCall }) {
      console.log('[SessionAssistant] onToolCall received:', toolCall.toolName)

      // Create Supabase client for read operations
      const supabase = createClientSupabaseClient(getTokenRef.current)

      try {
        // toolCall may have 'args' or 'input' depending on the SDK version
        const toolArgs = (toolCall as unknown as { args?: unknown; input?: unknown }).args
          ?? (toolCall as unknown as { input?: unknown }).input
          ?? {}

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
      const result = await executeChangeSet(
        changeSet.changeset,
        exercises,
        sessionId
      )

      if (result.status === 'approved') {
        // Success - notify parent to refresh data
        onExercisesChange?.(exercises)

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
  }, [changeSet, exercises, sessionId, onExercisesChange, pendingToolCall, addToolOutput, sendMessage])

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

  return (
    <>
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

      {/* Approval banner */}
      {showBanner && changeSet.changeset && (
        <ApprovalBanner
          changeset={changeSet.changeset}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onDismiss={handleDismiss}
          isExecuting={isExecuting}
          executionError={executionError}
        />
      )}
    </>
  )
}
