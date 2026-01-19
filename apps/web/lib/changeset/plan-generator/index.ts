/**
 * Plan Generator Module
 *
 * State management and tools for AI-powered plan generation
 * in the individual user first-experience flow.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

// Types
export type {
  CurrentPlanState,
  MesocycleData,
  MicrocycleData,
  PlanGenerationContext,
  PlanGenerationPreferences,
  PlanGenerationUserProfile,
  PlanGeneratorEntityType,
  PlanGeneratorLogEntry,
  PlanGeneratorState,
  PlanGeneratorStatus,
  PlanGeneratorToolResult,
  SessionPlanData,
  SessionPlanExerciseData,
  SessionPlanSetData,
  ToolResultError,
  ToolResultPause,
  ToolResultSuccess,
  ToolResultSuccessMultiple,
} from './types'

export { ENTITY_EXECUTION_ORDER } from './types'

// Hooks
export {
  usePlanGeneratorState,
  type UsePlanGeneratorStateOptions,
  type UsePlanGeneratorStateReturn,
} from './usePlanGeneratorState'

// Tools
export {
  // Tool schemas
  getPlanGenerationContextSchema,
  searchExercisesForPlanSchema,
  getCurrentPlanStateSchema,
  createMicrocycleSchema,
  updateMicrocycleSchema,
  deleteMicrocycleSchema,
  createSessionPlanSchema,
  updateSessionPlanSchema,
  deleteSessionPlanSchema,
  createSessionPlanExerciseSchema,
  updateSessionPlanExerciseSchema,
  deleteSessionPlanExerciseSchema,
  createSessionPlanSetSchema,
  updateSessionPlanSetSchema,
  deleteSessionPlanSetSchema,
  confirmPlanChangeSetSchema,
  resetPlanChangeSetSchema,
  // Tool collections
  planGeneratorReadTools,
  microcycleTools,
  sessionPlanTools,
  sessionPlanExerciseTools,
  sessionPlanSetTools,
  planGeneratorCoordinationTools,
  planGeneratorTools,
  // Types
  type PlanGeneratorToolName,
  type GetPlanGenerationContextInput,
  type SearchExercisesForPlanInput,
  type GetCurrentPlanStateInput,
  type CreateMicrocycleInput,
  type UpdateMicrocycleInput,
  type DeleteMicrocycleInput,
  type CreateSessionPlanInput,
  type UpdateSessionPlanInput,
  type DeleteSessionPlanInput,
  type CreateSessionPlanExerciseInput,
  type UpdateSessionPlanExerciseInput,
  type DeleteSessionPlanExerciseInput,
  type CreateSessionPlanSetInput,
  type UpdateSessionPlanSetInput,
  type DeleteSessionPlanSetInput,
  type ConfirmPlanChangeSetInput,
  type ResetPlanChangeSetInput,
} from './tools'

// Tool Handlers
export {
  createPlanGeneratorHandlers,
  executePlanGeneratorTool,
  type PlanGeneratorToolHandlers,
  type CreateHandlersOptions,
  type ExerciseSearchResult,
} from './tool-handlers'

// System Prompt
export {
  PLAN_GENERATOR_SYSTEM_PROMPT,
  getPlanGeneratorSystemPrompt,
} from './system-prompt'

// Chat Hook
export {
  usePlanGeneratorChat,
  type UsePlanGeneratorChatOptions,
  type UsePlanGeneratorChatReturn,
} from './usePlanGeneratorChat'
