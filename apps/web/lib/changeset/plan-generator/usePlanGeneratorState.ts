'use client'

/**
 * Plan Generator: State Management Hook
 *
 * Manages in-memory state for the plan generation flow with debug logging.
 * This is a standalone state manager (not using existing ChangeSetContext)
 * to keep individual user onboarding separate from coach/athlete flows.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { useCallback, useMemo, useRef, useState } from 'react'

import {
  generateChangeRequestId,
  generateChangeSetId,
  generateTempId,
  isTempId,
  makeBufferKey,
  sortByExecutionOrder,
} from '../buffer-utils'
import type { BufferKey, ChangeRequest, OperationType } from '../types'
import type {
  CurrentPlanState,
  ENTITY_EXECUTION_ORDER,
  MesocycleData,
  MicrocycleData,
  PlanGenerationContext,
  PlanGeneratorEntityType,
  PlanGeneratorLogEntry,
  PlanGeneratorState,
  PlanGeneratorStatus,
  PlanGeneratorToolResult,
  SessionPlanData,
  SessionPlanExerciseData,
  SessionPlanSetData,
} from './types'

// ============================================================================
// Debug Logger
// ============================================================================

const DEBUG_PREFIX = '[PlanGenerator]'

function formatLogEntry(entry: PlanGeneratorLogEntry): string {
  const parts = [
    DEBUG_PREFIX,
    `[${entry.action}]`,
    entry.entity_type ? `entity=${entry.entity_type}` : '',
    entry.entity_id ? `id=${entry.entity_id}` : '',
    entry.operation ? `op=${entry.operation}` : '',
    `buffer_size=${entry.buffer_size}`,
    `week1_only=${entry.week1_only_mode}`,
  ].filter(Boolean)

  return parts.join(' ')
}

// ============================================================================
// Hook
// ============================================================================

export interface UsePlanGeneratorStateOptions {
  /** Enable debug logging to console */
  debug?: boolean
  /** Initial mesocycle data (pre-created) */
  mesocycle?: MesocycleData
  /** Initial generation context from wizard */
  context?: PlanGenerationContext
}

export interface UsePlanGeneratorStateReturn {
  // State
  state: PlanGeneratorState
  status: PlanGeneratorStatus | null
  week1OnlyMode: boolean
  mesocycle: MesocycleData | null

  // Buffer operations
  upsert: (
    entityType: PlanGeneratorEntityType,
    operationType: OperationType,
    entityId: string | null,
    proposedData: Record<string, unknown>,
    reasoning?: string
  ) => PlanGeneratorToolResult
  remove: (entityType: PlanGeneratorEntityType, entityId: string) => void
  clear: () => void
  snapshot: () => ChangeRequest[]
  getPendingCount: () => number
  hasPendingChanges: () => boolean

  // State setters
  setStatus: (status: PlanGeneratorStatus) => void
  setMetadata: (title: string, description: string) => void
  setWeek1OnlyMode: (enabled: boolean) => void
  setMesocycle: (mesocycle: MesocycleData) => void
  setContext: (context: PlanGenerationContext) => void

  // Merged state view (for agent)
  getCurrentPlanState: () => CurrentPlanState | null

  // Debug
  logs: PlanGeneratorLogEntry[]
}

/**
 * Hook for managing plan generator state.
 *
 * Features:
 * - In-memory keyed buffer with upsert semantics
 * - Week 1 only mode control
 * - Debug logging on each change
 * - Merged state view for agent (getCurrentPlanState)
 *
 * @example
 * ```tsx
 * const {
 *   upsert,
 *   getCurrentPlanState,
 *   week1OnlyMode,
 *   logs,
 * } = usePlanGeneratorState({ debug: true })
 *
 * // Add a microcycle
 * const result = upsert('microcycle', 'create', null, {
 *   mesocycle_id: 'meso-123',
 *   week_number: 1,
 *   name: 'Week 1 - Foundation',
 * })
 *
 * // Get merged state
 * const planState = getCurrentPlanState()
 * ```
 */
export function usePlanGeneratorState(
  options: UsePlanGeneratorStateOptions = {}
): UsePlanGeneratorStateReturn {
  const { debug = true, mesocycle: initialMesocycle, context: initialContext } = options

  // Generate session ID once
  const sessionIdRef = useRef<string>(generateChangeSetId())

  // Core state
  const [buffer, setBuffer] = useState<Map<BufferKey, ChangeRequest>>(() => new Map())
  const [status, setStatusState] = useState<PlanGeneratorStatus | null>(null)
  const [week1OnlyMode, setWeek1OnlyModeState] = useState(true)
  const [mesocycle, setMesocycleState] = useState<MesocycleData | null>(initialMesocycle ?? null)
  const [context, setContextState] = useState<PlanGenerationContext | null>(initialContext ?? null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [toolCallId, setToolCallId] = useState<string | undefined>(undefined)

  // Debug logs (in-memory, limited to last 100 entries)
  const [logs, setLogs] = useState<PlanGeneratorLogEntry[]>([])

  /**
   * Add a log entry.
   */
  const addLog = useCallback(
    (
      action: string,
      extra?: {
        entity_type?: PlanGeneratorEntityType
        entity_id?: string
        operation?: OperationType
        data?: Record<string, unknown>
      }
    ) => {
      const entry: PlanGeneratorLogEntry = {
        timestamp: new Date(),
        action,
        entity_type: extra?.entity_type,
        entity_id: extra?.entity_id,
        operation: extra?.operation,
        data: extra?.data,
        buffer_size: buffer.size,
        week1_only_mode: week1OnlyMode,
      }

      if (debug) {
        console.log(formatLogEntry(entry), extra?.data ?? '')
      }

      setLogs((prev) => [...prev.slice(-99), entry])
    },
    [buffer.size, week1OnlyMode, debug]
  )

  /**
   * Get execution order for an entity type.
   */
  const getExecutionOrder = useCallback((entityType: PlanGeneratorEntityType): number => {
    const orders: Record<PlanGeneratorEntityType, number> = {
      microcycle: 0,
      session_plan: 1,
      session_plan_exercise: 2,
      session_plan_set: 3,
    }
    return orders[entityType] ?? 99
  }, [])

  /**
   * Upsert a change request into the buffer.
   */
  const upsert = useCallback(
    (
      entityType: PlanGeneratorEntityType,
      operationType: OperationType,
      entityId: string | null,
      proposedData: Record<string, unknown>,
      reasoning?: string
    ): PlanGeneratorToolResult => {
      // Week 1 restriction check
      if (week1OnlyMode && entityType === 'microcycle' && operationType === 'create') {
        const weekNumber = proposedData.week_number as number
        if (weekNumber > 1) {
          addLog('BLOCKED_WEEK1_ONLY', {
            entity_type: entityType,
            operation: operationType,
            data: { week_number: weekNumber },
          })
          return {
            success: false,
            error: 'Week 1 must be approved first. Only Week 1 can be created now.',
          }
        }
      }

      // Generate entity ID for creates
      const finalEntityId = entityId ?? generateTempId()

      // Create the change request
      const changeRequest: ChangeRequest = {
        id: generateChangeRequestId(),
        changesetId: sessionIdRef.current,
        operationType,
        entityType,
        entityId: finalEntityId,
        currentData: null, // For first experience, no base data
        proposedData: operationType === 'delete' ? null : proposedData,
        executionOrder: getExecutionOrder(entityType),
        aiReasoning: reasoning,
        createdAt: new Date(),
      }

      // Update buffer
      setBuffer((prev) => {
        const newBuffer = new Map(prev)
        const key = makeBufferKey(entityType, finalEntityId)

        if (operationType === 'delete' && isTempId(finalEntityId)) {
          // Delete with temp ID = remove from buffer entirely
          newBuffer.delete(key)
          addLog('REMOVE_FROM_BUFFER', {
            entity_type: entityType,
            entity_id: finalEntityId,
            operation: operationType,
          })
        } else {
          // Upsert
          newBuffer.set(key, changeRequest)
          addLog('UPSERT', {
            entity_type: entityType,
            entity_id: finalEntityId,
            operation: operationType,
            data: proposedData,
          })
        }

        return newBuffer
      })

      // Set status to building if not already set
      setStatusState((prev) => prev ?? 'building')

      return {
        success: true,
        entity_id: finalEntityId,
        message: `${operationType} ${entityType} added to changeset`,
      }
    },
    [week1OnlyMode, addLog, getExecutionOrder]
  )

  /**
   * Remove a change request from the buffer.
   */
  const remove = useCallback(
    (entityType: PlanGeneratorEntityType, entityId: string) => {
      setBuffer((prev) => {
        const newBuffer = new Map(prev)
        const key = makeBufferKey(entityType, entityId)
        newBuffer.delete(key)
        return newBuffer
      })

      addLog('REMOVE', { entity_type: entityType, entity_id: entityId })
    },
    [addLog]
  )

  /**
   * Clear all state.
   */
  const clear = useCallback(() => {
    setBuffer(new Map())
    setStatusState(null)
    setWeek1OnlyModeState(true)
    setTitle('')
    setDescription('')
    setToolCallId(undefined)
    sessionIdRef.current = generateChangeSetId()

    addLog('CLEAR')
  }, [addLog])

  /**
   * Get a snapshot of the buffer as sorted array.
   */
  const snapshot = useCallback((): ChangeRequest[] => {
    return sortByExecutionOrder(Array.from(buffer.values()))
  }, [buffer])

  /**
   * Get count of pending changes.
   */
  const getPendingCount = useCallback((): number => {
    return buffer.size
  }, [buffer])

  /**
   * Check if there are pending changes.
   */
  const hasPendingChanges = useCallback((): boolean => {
    return buffer.size > 0
  }, [buffer])

  /**
   * Set status.
   */
  const setStatus = useCallback(
    (newStatus: PlanGeneratorStatus) => {
      setStatusState(newStatus)
      addLog('SET_STATUS', { data: { status: newStatus } })
    },
    [addLog]
  )

  /**
   * Set metadata.
   */
  const setMetadata = useCallback(
    (newTitle: string, newDescription: string) => {
      setTitle(newTitle)
      setDescription(newDescription)
      addLog('SET_METADATA', { data: { title: newTitle } })
    },
    [addLog]
  )

  /**
   * Set week1 only mode.
   */
  const setWeek1OnlyMode = useCallback(
    (enabled: boolean) => {
      setWeek1OnlyModeState(enabled)
      addLog('SET_WEEK1_ONLY_MODE', { data: { enabled } })
    },
    [addLog]
  )

  /**
   * Set mesocycle.
   */
  const setMesocycle = useCallback(
    (newMesocycle: MesocycleData) => {
      setMesocycleState(newMesocycle)
      addLog('SET_MESOCYCLE', { data: { id: newMesocycle.id, name: newMesocycle.name } })
    },
    [addLog]
  )

  /**
   * Set context.
   */
  const setContext = useCallback(
    (newContext: PlanGenerationContext) => {
      setContextState(newContext)
      addLog('SET_CONTEXT', { data: { mesocycle_id: newContext.mesocycle_id } })
    },
    [addLog]
  )

  /**
   * Get current plan state (merged view for agent).
   * Builds a hierarchical structure from the flat buffer.
   */
  const getCurrentPlanState = useCallback((): CurrentPlanState | null => {
    if (!mesocycle) {
      return null
    }

    // Get all change requests grouped by entity type
    const changes = Array.from(buffer.values())

    // Build microcycles
    const microcycleChanges = changes.filter(
      (c) => c.entityType === 'microcycle' && c.operationType !== 'delete'
    )
    const sessionPlanChanges = changes.filter(
      (c) => c.entityType === 'session_plan' && c.operationType !== 'delete'
    )
    const exerciseChanges = changes.filter(
      (c) => c.entityType === 'session_plan_exercise' && c.operationType !== 'delete'
    )
    const setChanges = changes.filter(
      (c) => c.entityType === 'session_plan_set' && c.operationType !== 'delete'
    )

    // Build the hierarchy
    const microcycles: MicrocycleData[] = microcycleChanges.map((mc) => {
      const mcData = mc.proposedData as Record<string, unknown>
      const mcId = mc.entityId!

      // Find sessions for this microcycle
      const sessions: SessionPlanData[] = sessionPlanChanges
        .filter((sp) => (sp.proposedData as Record<string, unknown>).microcycle_id === mcId)
        .map((sp) => {
          const spData = sp.proposedData as Record<string, unknown>
          const spId = sp.entityId!

          // Find exercises for this session
          const exercises: SessionPlanExerciseData[] = exerciseChanges
            .filter((ex) => (ex.proposedData as Record<string, unknown>).session_plan_id === spId)
            .map((ex) => {
              const exData = ex.proposedData as Record<string, unknown>
              const exId = ex.entityId!

              // Find sets for this exercise
              const sets: SessionPlanSetData[] = setChanges
                .filter(
                  (s) =>
                    (s.proposedData as Record<string, unknown>).session_plan_exercise_id === exId
                )
                .map((s, idx) => {
                  const sData = s.proposedData as Record<string, unknown>
                  return {
                    id: s.entityId!,
                    // TODO: remove set_number/rest_seconds fallbacks once all in-flight
                    // sessions from before the March 2026 field rename have expired.
                    set_index: (sData.set_index as number) ?? (sData.set_number as number) ?? idx + 1,
                    reps: sData.reps as number | undefined,
                    weight: (sData.weight as number | null | undefined) ?? null,
                    rpe: sData.rpe as number | undefined,
                    rest_time: (sData.rest_time as number | undefined) ?? (sData.rest_seconds as number | undefined),
                    tempo: sData.tempo as string | undefined,
                  }
                })
                .sort((a, b) => a.set_index - b.set_index)

              return {
                id: exId,
                exercise_id: exData.exercise_id as string,
                exercise_name: exData.exercise_name as string,
                exercise_order: exData.exercise_order as number,
                superset_id: (exData.superset_id as number | null) ?? null,
                notes: exData.notes as string | undefined,
                session_plan_sets: sets,
              }
            })
            .sort((a, b) => a.exercise_order - b.exercise_order)

          return {
            id: spId,
            name: spData.name as string,
            day_of_week: spData.day_of_week as string,
            session_type: spData.session_type as string,
            estimated_duration: spData.estimated_duration as number,
            notes: spData.notes as string | undefined,
            session_plan_exercises: exercises,
          }
        })

      return {
        id: mcId,
        mesocycle_id: mcData.mesocycle_id as string,
        week_number: mcData.week_number as number,
        name: mcData.name as string,
        focus: mcData.focus as string | undefined,
        is_deload: (mcData.is_deload as boolean) ?? false,
        session_plans: sessions,
      }
    })

    // Sort microcycles by week number
    microcycles.sort((a, b) => a.week_number - b.week_number)

    // Note: Don't call addLog here - getCurrentPlanState is called during render
    // and logging would cause state updates leading to infinite re-renders

    return {
      mesocycle,
      microcycles,
    }
  }, [mesocycle, buffer])

  // Build full state object
  const state = useMemo<PlanGeneratorState>(
    () => ({
      id: sessionIdRef.current,
      status: status ?? 'building',
      week1_only_mode: week1OnlyMode,
      mesocycle,
      context,
      buffer,
      title,
      description,
      tool_call_id: toolCallId,
      created_at: new Date(),
    }),
    [status, week1OnlyMode, mesocycle, context, buffer, title, description, toolCallId]
  )

  return {
    // State
    state,
    status,
    week1OnlyMode,
    mesocycle,

    // Buffer operations
    upsert,
    remove,
    clear,
    snapshot,
    getPendingCount,
    hasPendingChanges,

    // State setters
    setStatus,
    setMetadata,
    setWeek1OnlyMode,
    setMesocycle,
    setContext,

    // Merged state view
    getCurrentPlanState,

    // Debug
    logs,
  }
}
