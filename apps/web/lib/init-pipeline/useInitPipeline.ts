'use client'

/**
 * Init Pipeline Hook
 *
 * Orchestrates the 3-step plan generation pipeline:
 * 1. Planning step (streamText) - generates planning summary
 * 2. Generation step (generateObject) - generates simple structured JSON
 * 3. Scaffolding step (code) - transforms to full in-memory state
 */

import { useState, useCallback, useRef } from 'react'
import type { SimpleGeneratedPlan } from './schemas'
import type { PlanningContext } from './prompts'
import {
  scaffoldPlan,
  buildExerciseLibraryMap,
  type ScaffoldedPlan,
} from './scaffold'

// ============================================================================
// Types
// ============================================================================

export type InitPipelineStatus =
  | 'idle'
  | 'fetching-exercises'
  | 'planning'
  | 'generating'
  | 'scaffolding'
  | 'complete'
  | 'error'

export interface UseInitPipelineOptions {
  /** User and preference context for plan generation */
  context: PlanningContext
  /** Mesocycle ID for scaffolding (can be temp ID before save) */
  mesocycleId: string
  /** Callback when pipeline completes successfully */
  onComplete?: (plan: ScaffoldedPlan) => void
  /** Callback on error */
  onError?: (error: string) => void
}

export interface UseInitPipelineReturn {
  // State
  status: InitPipelineStatus
  planningSummary: string
  /** Simple AI-generated plan (before scaffolding) */
  simplePlan: SimpleGeneratedPlan | null
  /** Full scaffolded plan (after scaffolding) */
  scaffoldedPlan: ScaffoldedPlan | null
  error: string | null

  // Actions
  startPipeline: () => Promise<void>
  reset: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useInitPipeline(options: UseInitPipelineOptions): UseInitPipelineReturn {
  const { context, mesocycleId, onComplete, onError } = options

  // State
  const [status, setStatus] = useState<InitPipelineStatus>('idle')
  const [planningSummary, setPlanningSummary] = useState('')
  const [simplePlan, setSimplePlan] = useState<SimpleGeneratedPlan | null>(null)
  const [scaffoldedPlan, setScaffoldedPlan] = useState<ScaffoldedPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate starts
  const isRunningRef = useRef(false)

  // Reset function
  const reset = useCallback(() => {
    setStatus('idle')
    setPlanningSummary('')
    setSimplePlan(null)
    setScaffoldedPlan(null)
    setError(null)
    isRunningRef.current = false
  }, [])

  // Main pipeline function
  const startPipeline = useCallback(async () => {
    if (isRunningRef.current) {
      console.log('[useInitPipeline] Already running, skipping')
      return
    }

    isRunningRef.current = true
    setError(null)

    try {
      // ========================================
      // Step 0: Fetch exercise library
      // ========================================
      setStatus('fetching-exercises')
      console.log('[useInitPipeline] Fetching exercise library...')

      const exerciseLibrary = await fetchExerciseLibrary(
        context.preferences.equipment_tags,
        context.preferences.equipment
      )
      if (!exerciseLibrary.length) {
        throw new Error('No exercises available for plan generation. Please add exercises first.')
      }

      // ========================================
      // Step 1: Planning (streaming)
      // ========================================
      setStatus('planning')
      console.log('[useInitPipeline] Starting planning step with', exerciseLibrary.length, 'exercises...')

      // Pass exercise library to planning step so AI knows valid exercise IDs
      const summary = await runPlanningStep(context, exerciseLibrary, (partial) => {
        setPlanningSummary(partial)
      })

      setPlanningSummary(summary)
      console.log('[useInitPipeline] Planning complete, summary length:', summary.length)

      // ========================================
      // Step 2: Generation (structured output)
      // ========================================
      setStatus('generating')
      console.log('[useInitPipeline] Starting generation step...')

      const plan = await runGenerationStep(summary, context)

      setSimplePlan(plan)
      console.log('[useInitPipeline] Generation complete, microcycles:', plan.microcycles.length)

      // ========================================
      // Step 3: Scaffolding (code transformation)
      // ========================================
      setStatus('scaffolding')
      console.log('[useInitPipeline] Starting scaffolding step...')

      // Build exercise library map for name lookup
      const exerciseLibraryMap = buildExerciseLibraryMap(
        exerciseLibrary.map((e) => ({ id: Number(e.id), name: e.name }))
      )

      const scaffolded = scaffoldPlan(plan, {
        mesocycleId,
        exerciseLibrary: exerciseLibraryMap,
      })

      setScaffoldedPlan(scaffolded)
      console.log('[useInitPipeline] Scaffolding complete, microcycles:', scaffolded.microcycles.length)

      // ========================================
      // Complete
      // ========================================
      setStatus('complete')
      onComplete?.(scaffolded)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Pipeline failed'
      console.error('[useInitPipeline] Error:', errorMessage)
      setError(errorMessage)
      setStatus('error')
      onError?.(errorMessage)
    } finally {
      isRunningRef.current = false
    }
  }, [context, mesocycleId, onComplete, onError])

  return {
    status,
    planningSummary,
    simplePlan,
    scaffoldedPlan,
    error,
    startPipeline,
    reset,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

interface ExerciseLibraryItem {
  id: string
  name: string
  exercise_type?: string | null
  equipment?: string[]
  contraindications?: string[]
}

async function fetchExerciseLibrary(
  equipmentTags?: string[],
  fallbackEquipment?: string
): Promise<ExerciseLibraryItem[]> {
  try {
    const normalizedTags = Array.isArray(equipmentTags)
      ? equipmentTags.map((tag) => tag.trim()).filter(Boolean)
      : []
    const fallbackTags =
      !normalizedTags.length && fallbackEquipment && fallbackEquipment !== 'full_gym'
        ? [fallbackEquipment]
        : []

    const response = await fetch('/api/exercises/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment_tags: normalizedTags.length ? normalizedTags : fallbackTags,
        limit: 100,
      }),
    })

    if (!response.ok) {
      console.warn('[useInitPipeline] Exercise library fetch failed, using empty list')
      return []
    }

    const data = await response.json()
    return data.exercises ?? data ?? []
  } catch (err) {
    console.warn('[useInitPipeline] Exercise library fetch error:', err)
    return []
  }
}

async function runPlanningStep(
  context: PlanningContext,
  exerciseLibrary: ExerciseLibraryItem[],
  onPartial: (partial: string) => void
): Promise<string> {
  // Pass exercise library to planning step so AI uses real exercise IDs
  const response = await fetch('/api/ai/plan-generator/init-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context,
      exerciseLibrary: exerciseLibrary.map((e) => ({
        id: Number(e.id),
        name: e.name,
        exercise_type: e.exercise_type ?? null,
        equipment: e.equipment ?? [],
        contraindications: e.contraindications ?? [],
      })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Planning failed: ${response.status}`)
  }

  // Read streaming response
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    result += chunk
    onPartial(result)
  }

  return result
}

async function runGenerationStep(
  planningSummary: string,
  context: PlanningContext
): Promise<SimpleGeneratedPlan> {
  const response = await fetch('/api/ai/plan-generator/init-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planningSummary,
      context,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMsg = errorData.error || `Generation failed: ${response.status}`
    const details = errorData.details ? ` (${errorData.details})` : ''
    console.error('[useInitPipeline] Generation error details:', errorData)
    throw new Error(errorMsg + details)
  }

  const { plan } = await response.json()
  return plan
}
