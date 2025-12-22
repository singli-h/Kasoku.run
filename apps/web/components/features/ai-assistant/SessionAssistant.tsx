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

import { useCallback, useState, useEffect, useMemo } from 'react'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
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

  // Track processed tool call IDs to avoid double-processing
  const [processedToolCalls] = useState(() => new Set<string>())

  // Pending tool call info for pause/resume
  const [pendingToolCall, setPendingToolCall] = useState<{
    toolCallId: string
    toolName: string
  } | null>(null)

  const changeSet = useChangeSet()

  // Get Clerk auth for Supabase client
  const { getToken } = useAuth()

  // Create transport with API endpoint and session ID in body
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/session-assistant',
    body: { sessionId },
  }), [sessionId])

  // Vercel AI SDK useChat hook (v5 API)
  const {
    messages,
    sendMessage,
    status,
    stop,
    addToolOutput,
  } = useChat({
    transport,
  })

  // Derived state
  const isLoading = status === 'submitted' || status === 'streaming'

  // Handle tool calls from messages
  useEffect(() => {
    const processToolCalls = async () => {
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'assistant') return

      // Check for tool parts that need client-side handling
      for (const part of lastMessage.parts) {
        // Check for dynamic tool parts (tools without execute functions)
        if (part.type === 'dynamic-tool' && part.state === 'input-available') {
          const toolCallId = part.toolCallId
          if (processedToolCalls.has(toolCallId)) continue
          processedToolCalls.add(toolCallId)

          await handleToolInvocation(part.toolName, toolCallId, part.input)
        }
      }
    }

    processToolCalls()
  }, [messages])

  /**
   * Handle a tool invocation from the AI.
   */
  const handleToolInvocation = useCallback(async (
    toolName: string,
    toolCallId: string,
    toolInput: unknown
  ) => {
    // Create Supabase client for read operations
    const supabase = createClientSupabaseClient(getToken)

    const result = await handleToolCall(
      toolName,
      toolInput as Record<string, unknown>,
      {
        changeSet,
        sessionId,
        showApprovalWidget: () => {
          // Save the tool call info for later
          setPendingToolCall({ toolCallId, toolName })
          // Show the approval banner
          setShowBanner(true)
          setExecutionError(undefined)
        },
        executeReadTool: (name, args) => executeReadTool(name, args, supabase),
      }
    )

    // If PAUSE, don't return a result yet - wait for user decision
    if (result === 'PAUSE') {
      return
    }

    // For other results, add the tool output
    await addToolOutput({
      tool: toolName,
      toolCallId,
      output: result,
    })
  }, [changeSet, sessionId, getToken, addToolOutput])

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

        // Return result to AI
        await addToolOutput({
          tool: pendingToolCall.toolName,
          toolCallId: pendingToolCall.toolCallId,
          output: createApprovalResult(true, changeSet.changeset.changeRequests),
        })

        // Clear changeset
        changeSet.clear()
        setShowBanner(false)
      } else {
        // Execution failed
        setExecutionError(result.error)

        // Return error to AI
        await addToolOutput({
          tool: pendingToolCall.toolName,
          toolCallId: pendingToolCall.toolCallId,
          output: createExecutionFailureResult(result.error),
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
    async (feedback?: string) => {
      if (!pendingToolCall) return

      // Return rejection result to AI
      await addToolOutput({
        tool: pendingToolCall.toolName,
        toolCallId: pendingToolCall.toolCallId,
        output: createApprovalResult(false, undefined, feedback),
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
  const handleDismiss = useCallback(async () => {
    if (!pendingToolCall) return

    // Return rejection result to AI
    await addToolOutput({
      tool: pendingToolCall.toolName,
      toolCallId: pendingToolCall.toolCallId,
      output: createApprovalResult(false),
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
