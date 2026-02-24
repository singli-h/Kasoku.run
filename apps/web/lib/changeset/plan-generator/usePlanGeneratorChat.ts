'use client'

/**
 * Plan Generator: Chat Hook
 *
 * Combines usePlanGeneratorState with Vercel AI SDK's useChat
 * for a complete plan generation experience.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createPlanGeneratorHandlers,
  executePlanGeneratorTool,
  type PlanGeneratorToolHandlers,
} from './tool-handlers'
import { usePlanGeneratorState } from './usePlanGeneratorState'
import type {
  MesocycleData,
  PlanGenerationContext,
  CurrentPlanState,
  PlanGeneratorStatus,
} from './types'

export interface UsePlanGeneratorChatOptions {
  /** Initial mesocycle (pre-created) */
  mesocycle: MesocycleData
  /** Generation context from wizard */
  context: PlanGenerationContext
  /** Supabase client for exercise search (requires Clerk auth) */
  supabase: SupabaseClient
  /** User ID for filtering custom exercises (database user ID) */
  userId?: string
  /** Enable debug logging */
  debug?: boolean
  /** Callback when plan is ready for approval */
  onPlanReady?: () => void
  /** Callback when status changes */
  onStatusChange?: (status: PlanGeneratorStatus) => void
}

export interface UsePlanGeneratorChatReturn {
  // Chat interface
  messages: ReturnType<typeof useChat>['messages']
  input: string
  setInput: (input: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean

  // Plan state
  status: PlanGeneratorStatus | null
  streamError: string | null
  week1OnlyMode: boolean
  currentPlanState: CurrentPlanState | null
  pendingCount: number

  // Actions
  startGeneration: () => void
  approveWeek1: () => void
  resetPlan: () => void

  // Debug
  logs: ReturnType<typeof usePlanGeneratorState>['logs']
}

/**
 * Hook that integrates plan generation state with AI chat.
 */
export function usePlanGeneratorChat(
  options: UsePlanGeneratorChatOptions
): UsePlanGeneratorChatReturn {
  const {
    mesocycle,
    context,
    supabase,
    userId,
    debug = true,
    onPlanReady,
    onStatusChange,
  } = options

  // Local input state
  const [input, setInput] = useState('')

  // Refs for stable callback access (prevent infinite loops)
  const onPlanReadyRef = useRef(onPlanReady)
  const onStatusChangeRef = useRef(onStatusChange)
  const contextRef = useRef(context)
  const supabaseRef = useRef(supabase)
  const userIdRef = useRef(userId)

  // Keep refs updated
  useEffect(() => {
    onPlanReadyRef.current = onPlanReady
    onStatusChangeRef.current = onStatusChange
    contextRef.current = context
    supabaseRef.current = supabase
    userIdRef.current = userId
  })

  // Initialize plan generator state
  const planState = usePlanGeneratorState({
    debug,
    mesocycle,
    context,
  })

  const {
    status,
    week1OnlyMode,
    upsert,
    remove,
    clear,
    getCurrentPlanState,
    setStatus,
    setMetadata,
    setWeek1OnlyMode,
    getPendingCount,
    logs,
  } = planState

  // Stream error state for surfacing AI errors to the user
  const [streamError, setStreamError] = useState<string | null>(null)

  // Refs for plan state callbacks
  const upsertRef = useRef(upsert)
  const removeRef = useRef(remove)
  const clearRef = useRef(clear)
  const getCurrentPlanStateRef = useRef(getCurrentPlanState)
  const setStatusRef = useRef(setStatus)
  const setMetadataRef = useRef(setMetadata)

  useEffect(() => {
    upsertRef.current = upsert
    removeRef.current = remove
    clearRef.current = clear
    getCurrentPlanStateRef.current = getCurrentPlanState
    setStatusRef.current = setStatus
    setMetadataRef.current = setMetadata
  })

  // Create handlers once using refs
  const handlers = useMemo<PlanGeneratorToolHandlers>(() => {
    return createPlanGeneratorHandlers({
      upsert: (...args) => upsertRef.current(...args),
      remove: (...args) => removeRef.current(...args),
      clear: () => clearRef.current(),
      getCurrentPlanState: () => getCurrentPlanStateRef.current(),
      setStatus: (newStatus) => {
        setStatusRef.current(newStatus)
        onStatusChangeRef.current?.(newStatus)
        if (newStatus === 'pending_approval') {
          onPlanReadyRef.current?.()
        }
      },
      setMetadata: (...args) => setMetadataRef.current(...args),
      get context() { return contextRef.current },
      get supabase() { return supabaseRef.current },
      get userId() { return userIdRef.current },
    })
  }, []) // Empty deps - handlers use refs

  // Ref for handlers to use in useChat callback
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  // Create transport once
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/plan-generator',
        body: {
          mesocycleId: mesocycle.id,
          mesocycleName: mesocycle.name,
        },
      }),
    [mesocycle.id, mesocycle.name]
  )

  // Track processed tool calls to deduplicate between onToolCall and effect fallback
  const processedToolCallsRef = useRef<Set<string>>(new Set())

  // Initialize useChat
  const {
    messages,
    setMessages,
    sendMessage,
    status: chatStatus,
    addToolOutput,
  } = useChat({
    transport,
    // Automatically continue after tool calls complete
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // Handle stream errors (network drops, 500s, token limits, timeouts)
    onError(error) {
      console.error('[PlanGeneratorChat] Stream error:', {
        message: error.message,
        name: error.name,
        constructor: error.constructor?.name,
      })
      setStreamError(error.message || 'Plan generation failed. Please try again.')
    },
    async onToolCall({ toolCall }) {
      // Deduplicate: skip if already processed by effect fallback
      if (processedToolCallsRef.current.has(toolCall.toolCallId)) {
        console.log('[PlanGeneratorChat] onToolCall skipped (already processed):', toolCall.toolName)
        return
      }
      processedToolCallsRef.current.add(toolCall.toolCallId)

      console.log('[PlanGeneratorChat] onToolCall received:', toolCall.toolName, toolCall.toolCallId)

      try {
        const toolArgs = ((toolCall as { input?: unknown }).input ?? {}) as Record<string, unknown>

        const result = await executePlanGeneratorTool(
          toolCall.toolName,
          toolArgs as Record<string, unknown>,
          handlersRef.current
        )

        const output = typeof result === 'string' ? result : JSON.stringify(result)
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output,
        })
      } catch (err) {
        console.error('[PlanGeneratorChat] Tool error:', err)

        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: JSON.stringify({
            error: err instanceof Error ? err.message : 'Tool execution failed',
          }),
        })
      }
    },
  })

  // Stable ref for addToolOutput (needed by effect fallback)
  const addToolOutputRef = useRef(addToolOutput)
  addToolOutputRef.current = addToolOutput

  // Effect-based fallback: detect unprocessed tool parts in messages
  // Handles cases where onToolCall doesn't fire (SDK race conditions, etc.)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant') return

    // Only process when stream is done
    if (chatStatus === 'streaming' || chatStatus === 'submitted') return

    for (const part of lastMessage.parts) {
      if (!part.type.startsWith('tool-')) continue

      const toolPart = part as {
        toolCallId?: string
        toolName?: string
        state?: string
        input?: unknown
      }

      if (toolPart.state !== 'input-available') continue
      if (!toolPart.toolCallId || !toolPart.toolName) continue
      if (processedToolCallsRef.current.has(toolPart.toolCallId)) continue

      processedToolCallsRef.current.add(toolPart.toolCallId)

      console.log('[PlanGeneratorChat] Effect fallback processing tool:', toolPart.toolName, toolPart.toolCallId)

      const processAsync = async () => {
        try {
          const toolArgs = (toolPart.input ?? {}) as Record<string, unknown>
          const result = await executePlanGeneratorTool(
            toolPart.toolName!,
            toolArgs,
            handlersRef.current
          )

          const output = typeof result === 'string' ? result : JSON.stringify(result)
          addToolOutputRef.current({
            tool: toolPart.toolName!,
            toolCallId: toolPart.toolCallId!,
            output,
          })
        } catch (err) {
          console.error('[PlanGeneratorChat] Effect fallback tool error:', err)
          addToolOutputRef.current({
            tool: toolPart.toolName!,
            toolCallId: toolPart.toolCallId!,
            output: JSON.stringify({
              error: err instanceof Error ? err.message : 'Tool execution failed',
            }),
          })
        }
      }

      processAsync()
    }
  }, [messages, chatStatus])

  // Derived loading state
  const isLoading = chatStatus === 'submitted' || chatStatus === 'streaming'

  // Actions
  const startGeneration = useCallback(() => {
    console.log('[PlanGeneratorChat] Starting generation')
    setStreamError(null)
    setStatus('building')
    sendMessage({ text: 'Please create a training plan for me based on my profile and preferences.' })
  }, [sendMessage, setStatus])

  const approveWeek1 = useCallback(() => {
    console.log('[PlanGeneratorChat] Approving Week 1')
    setWeek1OnlyMode(false)
    sendMessage({ text: 'Week 1 looks great! Please generate the remaining weeks of the plan.' })
  }, [sendMessage, setWeek1OnlyMode])

  const resetPlan = useCallback(() => {
    console.log('[PlanGeneratorChat] Resetting plan')
    clear()
    setMessages([])
    processedToolCallsRef.current.clear()
  }, [clear, setMessages])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      setStreamError(null)
      sendMessage({ text: input })
      setInput('')
    },
    [input, isLoading, sendMessage]
  )

  const currentPlanState = getCurrentPlanState()

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    status,
    streamError,
    week1OnlyMode,
    currentPlanState,
    pendingCount: getPendingCount(),
    startGeneration,
    approveWeek1,
    resetPlan,
    logs,
  }
}
