/**
 * Init Pipeline Module
 *
 * Efficient 3-step plan generation for onboarding flow.
 * 1. Planning (streamText) - AI designs the program
 * 2. Generation (generateObject) - AI outputs simple flat JSON
 * 3. Scaffolding (code) - Transform to full in-memory state
 *
 * Separate from ChangeSet pattern - used only for initial plan creation.
 */

// Simple Schemas (AI output)
export {
  SimpleExerciseSchema,
  SimpleSessionSchema,
  SimpleMicrocycleSchema,
  SimpleGeneratedPlanSchema,
  type SimpleExercise,
  type SimpleSession,
  type SimpleMicrocycle,
  type SimpleGeneratedPlan,
} from './schemas'

// Prompts
export {
  PLANNING_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  buildPlanningPrompt,
  buildGenerationPrompt,
  type PlanningContext,
  type GenerationInput,
} from './prompts'

// Scaffolding
export {
  scaffoldPlan,
  buildExerciseLibraryMap,
  type ScaffoldContext,
  type ScaffoldedPlan,
  type ExerciseLibraryItem,
} from './scaffold'

// Hook
export {
  useInitPipeline,
  type InitPipelineStatus,
  type UseInitPipelineOptions,
  type UseInitPipelineReturn,
} from './useInitPipeline'
