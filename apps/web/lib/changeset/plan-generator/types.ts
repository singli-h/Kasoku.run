/**
 * Plan Generator: Type Definitions
 *
 * Types specific to the individual user first-experience plan generation flow.
 * Aligned with database schema (snake_case, matching table/column names).
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import type { ChangeRequest, ChangeSetStatus, OperationType } from '../types'

// ============================================================================
// Entity Types (matching database tables)
// ============================================================================

/**
 * Entity types for plan generation.
 * Maps directly to database tables.
 */
export type PlanGeneratorEntityType =
  | 'microcycle'
  | 'session_plan'
  | 'session_plan_exercise'
  | 'session_plan_set'

/**
 * Execution order for entity types.
 * Lower numbers execute first (parent before child).
 */
export const ENTITY_EXECUTION_ORDER: Record<PlanGeneratorEntityType, number> = {
  microcycle: 0,
  session_plan: 1,
  session_plan_exercise: 2,
  session_plan_set: 3,
}

// ============================================================================
// Current Plan State (merged view for agent)
// ============================================================================

/**
 * Set data within an exercise.
 */
export interface SessionPlanSetData {
  id: string
  set_number: number
  reps?: number
  rpe?: number
  rest_seconds?: number
  tempo?: string
  notes?: string
}

/**
 * Exercise data within a session.
 */
export interface SessionPlanExerciseData {
  id: string
  exercise_id: string
  exercise_name: string
  exercise_order: number
  superset_group?: string
  notes?: string
  session_plan_sets: SessionPlanSetData[]
}

/**
 * Session data within a microcycle (week).
 */
export interface SessionPlanData {
  id: string
  name: string
  day_of_week: string
  session_type: string
  estimated_duration: number
  notes?: string
  session_plan_exercises: SessionPlanExerciseData[]
}

/**
 * Microcycle (week) data.
 */
export interface MicrocycleData {
  id: string
  mesocycle_id: string
  week_number: number
  name: string
  focus?: string
  is_deload: boolean
  session_plans: SessionPlanData[]
}

/**
 * Mesocycle data (pre-created, passed as context).
 */
export interface MesocycleData {
  id: string
  name: string
  goal_type: string
  duration_weeks: number
  user_id: string
}

/**
 * The current plan state as seen by the agent.
 * This is a merged view of base data + pending changes.
 */
export interface CurrentPlanState {
  mesocycle: MesocycleData
  microcycles: MicrocycleData[]
}

// ============================================================================
// Plan Generation Context (input from wizard)
// ============================================================================

/**
 * User preferences from onboarding/wizard.
 */
export interface PlanGenerationPreferences {
  training_days: string[]
  session_duration: number
  equipment: 'full_gym' | 'home' | 'bodyweight' | 'dumbbells'
}

/**
 * User profile data relevant to plan generation.
 */
export interface PlanGenerationUserProfile {
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  primary_goal: string
  secondary_goals: string[]
}

/**
 * Full context for plan generation.
 * Passed to the agent via getPlanGenerationContext tool.
 */
export interface PlanGenerationContext {
  user: PlanGenerationUserProfile
  preferences: PlanGenerationPreferences
  mesocycle_id: string
}

// ============================================================================
// Plan Generator State
// ============================================================================

/**
 * Status specific to plan generator (extends base ChangeSetStatus).
 */
export type PlanGeneratorStatus = ChangeSetStatus

/**
 * The plan generator state.
 */
export interface PlanGeneratorState {
  /** Unique ID for this generation session */
  id: string

  /** Current status in the state machine */
  status: PlanGeneratorStatus

  /** Whether only Week 1 can be created (before user approves Week 1) */
  week1_only_mode: boolean

  /** Pre-created mesocycle data */
  mesocycle: MesocycleData | null

  /** Generation context from wizard */
  context: PlanGenerationContext | null

  /** Keyed buffer of pending changes */
  buffer: Map<string, ChangeRequest>

  /** Title for the changeset (shown in approval UI) */
  title: string

  /** Description for the changeset */
  description: string

  /** Tool call ID for stream synchronization */
  tool_call_id?: string

  /** When this session started */
  created_at: Date
}

// ============================================================================
// Tool Result Types
// ============================================================================

/**
 * Successful tool result with single entity.
 */
export interface ToolResultSuccess {
  success: true
  entity_id?: string
  message: string
}

/**
 * Successful tool result with multiple entities.
 */
export interface ToolResultSuccessMultiple {
  success: true
  entity_ids: string[]
  message: string
}

/**
 * Failed tool result.
 */
export interface ToolResultError {
  success: false
  error: string
}

/**
 * Tool result for confirmation (pauses stream).
 */
export type ToolResultPause = 'PAUSE'

/**
 * Combined tool result type.
 */
export type PlanGeneratorToolResult =
  | ToolResultSuccess
  | ToolResultSuccessMultiple
  | ToolResultError
  | ToolResultPause

// ============================================================================
// Debug Logging
// ============================================================================

/**
 * Log entry for debugging.
 */
export interface PlanGeneratorLogEntry {
  timestamp: Date
  action: string
  entity_type?: PlanGeneratorEntityType
  entity_id?: string
  operation?: OperationType
  data?: Record<string, unknown>
  buffer_size: number
  week1_only_mode: boolean
}
