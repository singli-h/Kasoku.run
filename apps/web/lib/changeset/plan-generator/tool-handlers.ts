/**
 * Plan Generator: Tool Handlers
 *
 * Connects tool calls to the state management hook.
 * These handlers are designed to be used with Vercel AI SDK's useChat.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  ConfirmPlanChangeSetInput,
  CreateMicrocycleInput,
  CreateSessionPlanExerciseInput,
  CreateSessionPlanInput,
  CreateSessionPlanSetInput,
  DeleteMicrocycleInput,
  DeleteSessionPlanExerciseInput,
  DeleteSessionPlanInput,
  DeleteSessionPlanSetInput,
  GetCurrentPlanStateInput,
  GetPlanGenerationContextInput,
  PlanGeneratorToolName,
  ResetPlanChangeSetInput,
  SearchExercisesForPlanInput,
  UpdateMicrocycleInput,
  UpdateSessionPlanExerciseInput,
  UpdateSessionPlanInput,
  UpdateSessionPlanSetInput,
} from './tools'
import type {
  CurrentPlanState,
  PlanGenerationContext,
  PlanGeneratorToolResult,
} from './types'

// ============================================================================
// Exercise Search Result Type
// ============================================================================

export interface ExerciseSearchResult {
  id: string
  name: string
  description: string | null
  muscle_groups: string[]
  equipment: string[]
}

// ============================================================================
// Handler Interface
// ============================================================================

/**
 * Interface for plan generator tool handlers.
 * This is passed to the AI SDK's onToolCall callback.
 */
export interface PlanGeneratorToolHandlers {
  // Read tools
  getPlanGenerationContext: () => PlanGenerationContext | null
  searchExercisesForPlan: (
    input: SearchExercisesForPlanInput,
    supabase: SupabaseClient
  ) => Promise<ExerciseSearchResult[]>
  getCurrentPlanState: () => CurrentPlanState | null

  // Microcycle tools
  createMicrocycleChangeRequest: (input: CreateMicrocycleInput) => PlanGeneratorToolResult
  updateMicrocycleChangeRequest: (input: UpdateMicrocycleInput) => PlanGeneratorToolResult
  deleteMicrocycleChangeRequest: (input: DeleteMicrocycleInput) => PlanGeneratorToolResult

  // Session plan tools
  createSessionPlanChangeRequest: (input: CreateSessionPlanInput) => PlanGeneratorToolResult
  updateSessionPlanChangeRequest: (input: UpdateSessionPlanInput) => PlanGeneratorToolResult
  deleteSessionPlanChangeRequest: (input: DeleteSessionPlanInput) => PlanGeneratorToolResult

  // Session plan exercise tools
  createSessionPlanExerciseChangeRequest: (
    input: CreateSessionPlanExerciseInput
  ) => PlanGeneratorToolResult
  updateSessionPlanExerciseChangeRequest: (
    input: UpdateSessionPlanExerciseInput
  ) => PlanGeneratorToolResult
  deleteSessionPlanExerciseChangeRequest: (
    input: DeleteSessionPlanExerciseInput
  ) => PlanGeneratorToolResult

  // Session plan set tools
  createSessionPlanSetChangeRequest: (input: CreateSessionPlanSetInput) => PlanGeneratorToolResult
  updateSessionPlanSetChangeRequest: (input: UpdateSessionPlanSetInput) => PlanGeneratorToolResult
  deleteSessionPlanSetChangeRequest: (input: DeleteSessionPlanSetInput) => PlanGeneratorToolResult

  // Coordination tools
  confirmPlanChangeSet: (input: ConfirmPlanChangeSetInput) => PlanGeneratorToolResult
  resetPlanChangeSet: (input: ResetPlanChangeSetInput) => PlanGeneratorToolResult
}

// ============================================================================
// Create Handlers Factory
// ============================================================================

export interface CreateHandlersOptions {
  // From usePlanGeneratorState hook
  upsert: (
    entityType: 'microcycle' | 'session_plan' | 'session_plan_exercise' | 'session_plan_set',
    operationType: 'create' | 'update' | 'delete',
    entityId: string | null,
    proposedData: Record<string, unknown>,
    reasoning?: string
  ) => PlanGeneratorToolResult

  remove: (
    entityType: 'microcycle' | 'session_plan' | 'session_plan_exercise' | 'session_plan_set',
    entityId: string
  ) => void

  clear: () => void

  getCurrentPlanState: () => CurrentPlanState | null

  setStatus: (status: 'building' | 'pending_approval' | 'executing' | 'approved' | 'rejected') => void

  setMetadata: (title: string, description: string) => void

  // External context
  context: PlanGenerationContext | null

  // Supabase client for exercise search
  supabase: SupabaseClient

  // User ID for filtering custom exercises (from auth)
  userId?: string
}

/**
 * Creates tool handlers connected to the plan generator state.
 *
 * @example
 * ```tsx
 * const {
 *   upsert,
 *   remove,
 *   clear,
 *   getCurrentPlanState,
 *   setStatus,
 *   setMetadata,
 * } = usePlanGeneratorState({ debug: true })
 *
 * const handlers = createPlanGeneratorHandlers({
 *   upsert,
 *   remove,
 *   clear,
 *   getCurrentPlanState,
 *   setStatus,
 *   setMetadata,
 *   context: wizardContext,
 *   supabase,
 * })
 * ```
 */
export function createPlanGeneratorHandlers(
  options: CreateHandlersOptions
): PlanGeneratorToolHandlers {
  const {
    upsert,
    clear,
    getCurrentPlanState,
    setStatus,
    setMetadata,
    context,
    supabase,
    userId,
  } = options

  return {
    // ========================================================================
    // Read Tools
    // ========================================================================

    getPlanGenerationContext: () => {
      console.log('[PlanGenerator] getPlanGenerationContext called')
      return context
    },

    searchExercisesForPlan: async (input: SearchExercisesForPlanInput) => {
      console.log('[PlanGenerator] searchExercisesForPlan called', input)
      // Pass userId to include user's custom exercises in search results
      return executeSearchExercisesForPlan(input, supabase, userId)
    },

    getCurrentPlanState: () => {
      console.log('[PlanGenerator] getCurrentPlanState called')
      return getCurrentPlanState()
    },

    // ========================================================================
    // Microcycle Tools
    // ========================================================================

    createMicrocycleChangeRequest: (input: CreateMicrocycleInput) => {
      const { reasoning, ...data } = input
      return upsert('microcycle', 'create', null, data, reasoning)
    },

    updateMicrocycleChangeRequest: (input: UpdateMicrocycleInput) => {
      const { entity_id, reasoning, ...data } = input
      return upsert('microcycle', 'update', entity_id, data, reasoning)
    },

    deleteMicrocycleChangeRequest: (input: DeleteMicrocycleInput) => {
      const { entity_id, reasoning } = input
      return upsert('microcycle', 'delete', entity_id, {}, reasoning)
    },

    // ========================================================================
    // Session Plan Tools
    // ========================================================================

    createSessionPlanChangeRequest: (input: CreateSessionPlanInput) => {
      const { reasoning, ...data } = input
      return upsert('session_plan', 'create', null, data, reasoning)
    },

    updateSessionPlanChangeRequest: (input: UpdateSessionPlanInput) => {
      const { entity_id, reasoning, ...data } = input
      return upsert('session_plan', 'update', entity_id, data, reasoning)
    },

    deleteSessionPlanChangeRequest: (input: DeleteSessionPlanInput) => {
      const { entity_id, reasoning } = input
      return upsert('session_plan', 'delete', entity_id, {}, reasoning)
    },

    // ========================================================================
    // Session Plan Exercise Tools
    // ========================================================================

    createSessionPlanExerciseChangeRequest: (input: CreateSessionPlanExerciseInput) => {
      const { reasoning, ...data } = input
      return upsert('session_plan_exercise', 'create', null, data, reasoning)
    },

    updateSessionPlanExerciseChangeRequest: (input: UpdateSessionPlanExerciseInput) => {
      const { entity_id, reasoning, ...data } = input
      return upsert('session_plan_exercise', 'update', entity_id, data, reasoning)
    },

    deleteSessionPlanExerciseChangeRequest: (input: DeleteSessionPlanExerciseInput) => {
      const { entity_id, reasoning } = input
      return upsert('session_plan_exercise', 'delete', entity_id, {}, reasoning)
    },

    // ========================================================================
    // Session Plan Set Tools
    // ========================================================================

    createSessionPlanSetChangeRequest: (input: CreateSessionPlanSetInput) => {
      const { reasoning, ...data } = input
      return upsert('session_plan_set', 'create', null, data, reasoning)
    },

    updateSessionPlanSetChangeRequest: (input: UpdateSessionPlanSetInput) => {
      const { entity_id, reasoning, ...data } = input
      return upsert('session_plan_set', 'update', entity_id, data, reasoning)
    },

    deleteSessionPlanSetChangeRequest: (input: DeleteSessionPlanSetInput) => {
      const { entity_id, reasoning } = input
      return upsert('session_plan_set', 'delete', entity_id, {}, reasoning)
    },

    // ========================================================================
    // Coordination Tools
    // ========================================================================

    confirmPlanChangeSet: (input: ConfirmPlanChangeSetInput) => {
      console.log('[PlanGenerator] confirmPlanChangeSet called', input)
      setMetadata(input.title, input.description)
      setStatus('pending_approval')
      return {
        success: true,
        message: 'Plan submitted for user approval. Waiting for user to review and approve.',
      }
    },

    resetPlanChangeSet: (input: ResetPlanChangeSetInput) => {
      console.log('[PlanGenerator] resetPlanChangeSet called', input.reason)
      clear()
      return {
        success: true,
        message: 'Plan reset. Ready to start building a new plan.',
      }
    },
  }
}

// ============================================================================
// Exercise Search Implementation
// ============================================================================

/**
 * Search exercises in the database.
 *
 * Uses unified search module from lib/exercises for consistent behavior
 * across all search consumers (UI picker, API routes, AI tools).
 *
 * Supports:
 * - Partial text search on name/description
 * - Equipment tag filtering
 * - User's custom exercises (visibility = 'private')
 * - Global exercises (visibility = 'global')
 * - Exercise type and equipment info for AI context
 */
async function executeSearchExercisesForPlan(
  input: SearchExercisesForPlanInput,
  supabase: SupabaseClient,
  userId?: string
): Promise<ExerciseSearchResult[]> {
  const { query, equipment, exclude_equipment, limit = 10 } = input

  // Import unified search module
  const { searchExercises } = await import('@/lib/exercises')

  // Execute unified search with 'ai' field set for equipment context
  const result = await searchExercises(supabase, {
    query: query?.trim() || undefined,
    equipmentTags: equipment,
    excludeEquipmentTags: exclude_equipment,
    userId: userId,
    limit,
    fields: 'ai', // Include exercise type and equipment tags for AI context
  })

  // Format results for AI tool consumption
  return result.exercises.map((exercise) => ({
    id: String(exercise.id),
    name: exercise.name ?? 'Unknown Exercise',
    description: exercise.description,
    // Include exercise type for AI context (e.g., "warmup", "plyometric", "gym")
    muscle_groups: exercise.exerciseType?.type ? [exercise.exerciseType.type] : [],
    // Now includes equipment from tags (e.g., ["dumbbell", "bench"])
    equipment: exercise.equipment ?? [],
  }))
}

// ============================================================================
// Tool Executor
// ============================================================================

/**
 * Execute a plan generator tool by name.
 *
 * This is the main entry point for processing tool calls from the AI SDK.
 *
 * @example
 * ```tsx
 * // In useChat's onToolCall callback:
 * onToolCall: async ({ toolCall }) => {
 *   return executePlanGeneratorTool(
 *     toolCall.toolName,
 *     toolCall.args,
 *     handlers
 *   )
 * }
 * ```
 */
export async function executePlanGeneratorTool(
  toolName: string,
  args: Record<string, unknown>,
  handlers: PlanGeneratorToolHandlers
): Promise<unknown> {
  console.log(`[PlanGenerator] Executing tool: ${toolName}`, args)

  switch (toolName as PlanGeneratorToolName) {
    // Read tools
    case 'getPlanGenerationContext':
      return handlers.getPlanGenerationContext()

    case 'searchExercisesForPlan':
      // Note: supabase is captured in the handler closure
      return handlers.searchExercisesForPlan(
        args as SearchExercisesForPlanInput,
        {} as SupabaseClient // Placeholder - actual client is in closure
      )

    case 'getCurrentPlanState':
      return handlers.getCurrentPlanState()

    // Microcycle tools
    case 'createMicrocycleChangeRequest':
      return handlers.createMicrocycleChangeRequest(args as CreateMicrocycleInput)

    case 'updateMicrocycleChangeRequest':
      return handlers.updateMicrocycleChangeRequest(args as UpdateMicrocycleInput)

    case 'deleteMicrocycleChangeRequest':
      return handlers.deleteMicrocycleChangeRequest(args as DeleteMicrocycleInput)

    // Session plan tools
    case 'createSessionPlanChangeRequest':
      return handlers.createSessionPlanChangeRequest(args as CreateSessionPlanInput)

    case 'updateSessionPlanChangeRequest':
      return handlers.updateSessionPlanChangeRequest(args as UpdateSessionPlanInput)

    case 'deleteSessionPlanChangeRequest':
      return handlers.deleteSessionPlanChangeRequest(args as DeleteSessionPlanInput)

    // Session plan exercise tools
    case 'createSessionPlanExerciseChangeRequest':
      return handlers.createSessionPlanExerciseChangeRequest(
        args as CreateSessionPlanExerciseInput
      )

    case 'updateSessionPlanExerciseChangeRequest':
      return handlers.updateSessionPlanExerciseChangeRequest(
        args as UpdateSessionPlanExerciseInput
      )

    case 'deleteSessionPlanExerciseChangeRequest':
      return handlers.deleteSessionPlanExerciseChangeRequest(
        args as DeleteSessionPlanExerciseInput
      )

    // Session plan set tools
    case 'createSessionPlanSetChangeRequest':
      return handlers.createSessionPlanSetChangeRequest(args as CreateSessionPlanSetInput)

    case 'updateSessionPlanSetChangeRequest':
      return handlers.updateSessionPlanSetChangeRequest(args as UpdateSessionPlanSetInput)

    case 'deleteSessionPlanSetChangeRequest':
      return handlers.deleteSessionPlanSetChangeRequest(args as DeleteSessionPlanSetInput)

    // Coordination tools
    case 'confirmPlanChangeSet':
      return handlers.confirmPlanChangeSet(args as ConfirmPlanChangeSetInput)

    case 'resetPlanChangeSet':
      return handlers.resetPlanChangeSet(args as ResetPlanChangeSetInput)

    default:
      throw new Error(`Unknown plan generator tool: ${toolName}`)
  }
}
