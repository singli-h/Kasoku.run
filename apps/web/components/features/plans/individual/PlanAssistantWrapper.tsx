'use client'

/**
 * PlanAssistantWrapper
 *
 * Integrates the SessionAssistant with PlanContext for the unified plan page.
 * This component bridges the plan-level context with the existing AI assistant
 * infrastructure.
 *
 * Architecture:
 * ```
 * PlanAssistantWrapper
 *   ├── Uses PlanContext for AI context level detection (T046)
 *   ├── Provides SessionExercisesProvider for selected session
 *   ├── Detects exercise-level context when exercise expanded
 *   ├── Handles context switch mid-proposal with persistence (T070)
 *   ├── Provides success flash animation after applying changes (T074)
 *   └── Wraps SessionAssistant with appropriate props
 * ```
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 * @see docs/features/plans/individual/tasks.md T046, T070, T074
 */

import { useMemo, useCallback, useState, useEffect, useRef, createContext, useContext } from 'react'
import { SessionExercisesProvider } from '@/components/features/training/context'
import { SessionAssistant, ConnectedCrossSessionProposal } from '@/components/features/ai-assistant'
import { usePlanContext, type AIContextLevel } from './context'
import type { SessionPlannerExercise } from '@/components/features/training/adapters/session-adapter'
import { cn } from '@/lib/utils'

// ============================================================================
// Block-wide Expand Context (T043)
// ============================================================================

interface BlockWideExpandContextValue {
  /** Whether block-wide proposal is detected */
  isBlockWideProposal: boolean
  /** Whether the view should be expanded (manual or auto) */
  isExpanded: boolean
  /** Whether expansion was triggered manually by user */
  isManuallyExpanded: boolean
  /** Callback to set block-wide detected state */
  setBlockWideDetected: (isBlockWide: boolean) => void
  /** Expand the AI view (manual trigger) */
  expand: () => void
  /** Collapse back to normal view */
  collapse: () => void
  /** Toggle expanded state */
  toggle: () => void
}

const BlockWideExpandContext = createContext<BlockWideExpandContextValue | null>(null)

/**
 * Hook to access block-wide expand state.
 * Use this in layout components to adjust width when block-wide proposals are detected.
 *
 * @see T043
 */
export function useBlockWideExpand(): BlockWideExpandContextValue | null {
  return useContext(BlockWideExpandContext)
}

// ============================================================================
// Success Flash Context (T074)
// ============================================================================

interface SuccessFlashContextValue {
  /** Whether a success flash is currently showing */
  isFlashing: boolean
  /** Trigger a success flash animation */
  triggerFlash: () => void
}

const SuccessFlashContext = createContext<SuccessFlashContextValue | null>(null)

/**
 * Hook to trigger success flash animations after applying AI changes.
 *
 * @example
 * ```tsx
 * const { triggerFlash } = useSuccessFlash()
 *
 * const handleApply = async () => {
 *   await applyChanges()
 *   triggerFlash()
 * }
 * ```
 *
 * @see T074
 */
export function useSuccessFlash(): SuccessFlashContextValue {
  const context = useContext(SuccessFlashContext)
  if (!context) {
    // Return a no-op if outside provider (graceful fallback)
    return { isFlashing: false, triggerFlash: () => {} }
  }
  return context
}

// ============================================================================
// Pending Proposal Context (T070)
// ============================================================================

interface PendingProposalInfo {
  /** The context where the proposal was made */
  contextLabel: string
  /** Session ID where proposal was made (if applicable) */
  sessionId: string | null
  /** Week ID where proposal was made (if applicable) */
  weekId: number | null
}

interface PendingProposalContextValue {
  /** Info about pending proposal from a different context */
  pendingProposal: PendingProposalInfo | null
  /** Set pending proposal info when context switches */
  setPendingProposal: (info: PendingProposalInfo | null) => void
  /** Clear the pending proposal */
  clearPendingProposal: () => void
}

const PendingProposalContext = createContext<PendingProposalContextValue | null>(null)

/**
 * Hook to access pending proposal state when user switches context mid-proposal.
 *
 * @see T070
 */
export function usePendingProposal(): PendingProposalContextValue | null {
  return useContext(PendingProposalContext)
}

/**
 * Context information for exercise-level AI interactions.
 * Used when an exercise is expanded and AI should focus on that exercise.
 *
 * @see T046
 */
export interface ExerciseContext {
  /** The expanded exercise ID */
  exerciseId: string
  /** The exercise name for display */
  exerciseName: string
  /** Number of sets in the exercise */
  setCount: number
  /** Parent session ID */
  sessionId: string
}

/**
 * Full AI context information combining all levels.
 * Provided to consumers for context-aware rendering.
 */
export interface AIContext {
  /** Current context level */
  level: AIContextLevel
  /** Block ID */
  blockId: string
  /** Block name */
  blockName: string
  /** Selected week ID (if any) */
  weekId: number | null
  /** Selected session ID (if any) */
  sessionId: string | null
  /** Session name (if session selected) */
  sessionName: string | null
  /** Exercise context (if exercise expanded) */
  exercise: ExerciseContext | null
}

interface PlanAssistantWrapperProps {
  /** Database user ID for exercise search visibility filtering */
  dbUserId?: string

  /**
   * Use inline mode for proposals.
   * When true, proposals are displayed via ConnectedInlineProposalSection
   * instead of the overlay ApprovalBanner.
   * @default true
   */
  useInlineMode?: boolean

  /** Children to render (the plan page content) */
  children: React.ReactNode
}

/**
 * Adapts session plan exercises to the SessionPlannerExercise format.
 * This is needed for the SessionExercisesProvider.
 */
function adaptExercises(sessionPlan: {
  id?: string
  session_plan_exercises?: Array<{
    id: string | number
    order?: number | null
    exercise_order?: number | null
    exercise_id: string | number | null
    exercise?: {
      id: string | number
      name: string | null
      description?: string | null
      type?: string | null
    } | null
    session_plan_sets?: Array<{
      id: string | number
      set_index: number | null
      reps?: number | null
      weight?: number | null
      distance?: number | null
      performing_time?: number | null
      rest?: number | null
      rpe?: number | null
      tempo?: string | null
    }> | null
  }> | null
} | null): SessionPlannerExercise[] {
  if (!sessionPlan?.session_plan_exercises) return []

  return sessionPlan.session_plan_exercises.map((spe, index) => ({
    id: String(spe.id),
    session_plan_id: sessionPlan.id ?? '',  // Add required field
    exercise_order: spe.order ?? index,  // Add required field (renamed from 'order')
    order: spe.order ?? index,
    exercise_id: spe.exercise_id ? Number(spe.exercise_id) : 0,  // Convert to number
    exercise: spe.exercise ? {
      id: Number(spe.exercise.id),
      name: spe.exercise.name ?? 'Unnamed Exercise',
      description: spe.exercise.description ?? undefined,
      exercise_type_id: undefined,
      video_url: undefined,
      exercise_type: spe.exercise.type ? { type: spe.exercise.type } : undefined,
    } : null,
    sets: (spe.session_plan_sets ?? []).map((set, setIndex) => ({
      id: String(set.id),
      session_plan_exercise_id: String(spe.id),
      set_index: set.set_index ?? setIndex,
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      distance: set.distance ?? null,
      performing_time: set.performing_time ?? null,
      rest: set.rest ?? null,
      rpe: set.rpe ?? null,
      tempo: set.tempo ?? null,
    })),
  }))
}

export function PlanAssistantWrapper({
  dbUserId,
  useInlineMode = true,
  children,
}: PlanAssistantWrapperProps) {
  const planContext = usePlanContext()
  const {
    selectedSession,
    selectedSessionId,
    selectedExerciseId,
    aiContextLevel,
    trainingBlock,
    selectedWeek,
  } = planContext

  // T043: Track block-wide proposal detection for auto-expand
  const [isBlockWideProposal, setIsBlockWideProposal] = useState(false)
  // Manual expansion state (user-triggered via expand button)
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false)

  const handleBlockWideDetected = useCallback((isBlockWide: boolean) => {
    setIsBlockWideProposal(isBlockWide)
  }, [])

  // Manual expand/collapse controls
  const expand = useCallback(() => {
    setIsManuallyExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setIsManuallyExpanded(false)
  }, [])

  const toggle = useCallback(() => {
    setIsManuallyExpanded(prev => !prev)
  }, [])

  // T074: Success flash animation state
  const [isFlashing, setIsFlashing] = useState(false)
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerFlash = useCallback(() => {
    // Clear any existing timeout
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
    }
    setIsFlashing(true)
    // Auto-clear flash after animation duration
    flashTimeoutRef.current = setTimeout(() => {
      setIsFlashing(false)
    }, 1500) // 1.5s for flash animation
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
      }
    }
  }, [])

  const successFlashValue = useMemo((): SuccessFlashContextValue => ({
    isFlashing,
    triggerFlash,
  }), [isFlashing, triggerFlash])

  // T070: Track pending proposal when context switches
  const [pendingProposal, setPendingProposal] = useState<PendingProposalInfo | null>(null)
  const previousContextRef = useRef<{ sessionId: string | null; sessionName: string | null; weekId: number | null }>({
    sessionId: selectedSessionId,
    sessionName: selectedSession?.name ?? null,
    weekId: selectedWeek?.id ?? null,
  })

  // Detect context switch and persist proposal info
  useEffect(() => {
    const prev = previousContextRef.current
    const currentSessionId = selectedSessionId
    const currentWeekId = selectedWeek?.id ?? null

    // Check if context actually changed
    const contextChanged = prev.sessionId !== currentSessionId || prev.weekId !== currentWeekId

    if (contextChanged && isBlockWideProposal) {
      // T070: User switched context while proposal is pending
      // Store the previous context info so user knows where the pending changes are
      const prevContextLabel = prev.sessionId
        ? `Session: ${prev.sessionName ?? 'Workout'}`
        : prev.weekId
          ? `Week ${prev.weekId}`
          : 'Training Block'

      setPendingProposal({
        contextLabel: prevContextLabel,
        sessionId: prev.sessionId,
        weekId: prev.weekId,
      })
    }

    // Update previous context reference
    previousContextRef.current = { sessionId: currentSessionId, sessionName: selectedSession?.name ?? null, weekId: currentWeekId }
  }, [selectedSessionId, selectedSession?.name, selectedWeek?.id, isBlockWideProposal])

  const clearPendingProposal = useCallback(() => {
    setPendingProposal(null)
  }, [])

  const pendingProposalValue = useMemo((): PendingProposalContextValue => ({
    pendingProposal,
    setPendingProposal,
    clearPendingProposal,
  }), [pendingProposal, clearPendingProposal])

  // Memoize block-wide expand context value
  // isExpanded is true if either manually expanded OR auto-expanded from block-wide proposal
  const blockWideExpandValue = useMemo((): BlockWideExpandContextValue => ({
    isBlockWideProposal,
    isExpanded: isManuallyExpanded || isBlockWideProposal,
    isManuallyExpanded,
    setBlockWideDetected: handleBlockWideDetected,
    expand,
    collapse,
    toggle,
  }), [isBlockWideProposal, isManuallyExpanded, handleBlockWideDetected, expand, collapse, toggle])

  // Adapt exercises for the SessionExercisesProvider
  const exercises = useMemo(() => {
    return adaptExercises(selectedSession)
  }, [selectedSession])

  // T046: Detect exercise-level context when exercise expanded
  const exerciseContext = useMemo((): ExerciseContext | null => {
    if (!selectedExerciseId || !selectedSession || !selectedSessionId) return null

    // Find the expanded exercise
    const exercise = selectedSession.session_plan_exercises?.find(
      (e) => String(e.id) === selectedExerciseId
    )
    if (!exercise) return null

    return {
      exerciseId: selectedExerciseId,
      exerciseName: exercise.exercise?.name ?? 'Exercise',
      setCount: exercise.session_plan_sets?.length ?? 0,
      sessionId: selectedSessionId,
    }
  }, [selectedExerciseId, selectedSession, selectedSessionId])

  // Build full AI context for consumers
  const aiContext = useMemo((): AIContext => ({
    level: aiContextLevel,
    blockId: String(trainingBlock.id),
    blockName: trainingBlock.name ?? 'Training Block',
    weekId: selectedWeek?.id ?? null,
    sessionId: selectedSessionId,
    sessionName: selectedSession?.name ?? null,
    exercise: exerciseContext,
  }), [aiContextLevel, trainingBlock, selectedWeek, selectedSessionId, selectedSession, exerciseContext])

  // If no session is selected, render children without SessionAssistant
  // AI assistant requires a valid sessionId to function
  if (!selectedSessionId || !selectedSession) {
    return (
      <BlockWideExpandContext.Provider value={blockWideExpandValue}>
        <SuccessFlashContext.Provider value={successFlashValue}>
          <PendingProposalContext.Provider value={pendingProposalValue}>
            <SessionExercisesProvider initialExercises={[]}>
              {children}
            </SessionExercisesProvider>
          </PendingProposalContext.Provider>
        </SuccessFlashContext.Provider>
      </BlockWideExpandContext.Provider>
    )
  }

  // With a selected session, provide full AI context
  return (
    <BlockWideExpandContext.Provider value={blockWideExpandValue}>
      <SuccessFlashContext.Provider value={successFlashValue}>
        <PendingProposalContext.Provider value={pendingProposalValue}>
          <SessionExercisesProvider initialExercises={exercises}>
            <SessionAssistant
              sessionId={selectedSessionId}
              planId={String(trainingBlock.id)}
              dbUserId={dbUserId}
              useInlineMode={useInlineMode}
              autoCollapseChat={useInlineMode}
            >
              {children}
            </SessionAssistant>
          </SessionExercisesProvider>
        </PendingProposalContext.Provider>
      </SuccessFlashContext.Provider>
    </BlockWideExpandContext.Provider>
  )
}

/**
 * InlineProposalSlot
 *
 * A convenience component to render the inline proposal section.
 * Automatically detects cross-session changes and shows appropriate UI.
 * Auto-expands to full width for block-wide proposals.
 * Must be used inside PlanAssistantWrapper.
 *
 * @see docs/features/plans/individual/tasks.md T030, T043
 */
export function InlineProposalSlot({ className }: { className?: string }) {
  const blockWideContext = useBlockWideExpand()

  return (
    <div
      className={cn(
        'transition-all duration-300',
        blockWideContext?.isExpanded && 'w-full max-w-none',
        className
      )}
    >
      <ConnectedCrossSessionProposal
        className={cn(blockWideContext?.isExpanded && 'w-full')}
        onBlockWideDetected={blockWideContext?.setBlockWideDetected}
      />
    </div>
  )
}

/**
 * Hook to get the current AI context from PlanContext.
 * Useful for components that need to know the current context level
 * for context-aware rendering.
 *
 * @see T046
 */
export function useAIContext(): AIContext {
  const planContext = usePlanContext()
  const {
    selectedSession,
    selectedSessionId,
    selectedExerciseId,
    aiContextLevel,
    trainingBlock,
    selectedWeek,
  } = planContext

  // Find exercise context if expanded
  const exerciseContext = useMemo((): ExerciseContext | null => {
    if (!selectedExerciseId || !selectedSession || !selectedSessionId) return null

    const exercise = selectedSession.session_plan_exercises?.find(
      (e) => String(e.id) === selectedExerciseId
    )
    if (!exercise) return null

    return {
      exerciseId: selectedExerciseId,
      exerciseName: exercise.exercise?.name ?? 'Exercise',
      setCount: exercise.session_plan_sets?.length ?? 0,
      sessionId: selectedSessionId,
    }
  }, [selectedExerciseId, selectedSession, selectedSessionId])

  return useMemo((): AIContext => ({
    level: aiContextLevel,
    blockId: String(trainingBlock.id),
    blockName: trainingBlock.name ?? 'Training Block',
    weekId: selectedWeek?.id ?? null,
    sessionId: selectedSessionId,
    sessionName: selectedSession?.name ?? null,
    exercise: exerciseContext,
  }), [aiContextLevel, trainingBlock, selectedWeek, selectedSessionId, selectedSession, exerciseContext])
}
