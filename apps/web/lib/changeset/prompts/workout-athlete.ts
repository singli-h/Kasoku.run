/**
 * ChangeSet Pattern: System Prompt for Athlete Workout Assistant
 *
 * Defines the AI persona and instructions for the athlete domain.
 * Athletes use this assistant to log performance and modify their workouts.
 *
 * Key differences from coach domain:
 * - Focus on logging actual performance vs planning
 * - Shows prescribed vs actual data for comparison
 * - No delete operations (athletes swap or skip instead)
 * - Works with workout_log_* entities
 *
 * @see specs/005-ai-athlete-workout/spec.md
 */

import type { WorkoutContext } from '../tool-implementations/workout-read-impl'

/**
 * System prompt for the Athlete Workout AI assistant.
 *
 * Optimized for low token count and high accuracy:
 * 1. PERSONA - Identity and capabilities (~50 tokens)
 * 2. RULES - Hard constraints with ID mapping (~150 tokens)
 * 3. EXAMPLE - Concrete tool call demonstration (~120 tokens)
 * 4. CONTEXT_SECTION - Dynamic workout state (variable)
 *
 * Total static: ~320 tokens (down from ~1,120)
 */
export function buildAthleteSystemPrompt(workoutContext?: WorkoutContext): string {
  const contextSection = workoutContext ? buildContextSection(workoutContext) : ''

  return `${PERSONA}

${RULES}

${EXAMPLE}

${contextSection}`
}

const PERSONA = `You are a training assistant helping athletes log performance and adjust workouts. Be brief and supportive. Propose changes using tools, then call confirmChangeSet for review.`

const RULES = `## Rules

### Logging Sets
- **Log a set**: createWorkoutLogSetChangeRequest with workoutLogExerciseId + setIndex from context.
- **Add extra sets**: Same tool, use the next setIndex (e.g., 3 sets exist → setIndex: 4).
- **Update a logged set**: updateWorkoutLogSetChangeRequest with the workoutLogSetId shown in context.
- **Skip a set**: createWorkoutLogSetChangeRequest with completed: false.

### Exercises
- **Add new exercise**: createWorkoutLogExerciseChangeRequest. Do NOT use this for adding sets.
- **Swap exercise**: updateWorkoutLogExerciseChangeRequest with new exerciseId from searchExercises results.
- **Session notes**: updateWorkoutLogChangeRequest.

### Workflow
- Always call confirmChangeSet after proposing changes with a clear title and description.
- Use IDs exactly as shown in context — never fabricate IDs.
- Delete tools only work on temp-IDs (proposals). Mark real sets as skipped (completed: false) instead.
- Use contraindication tags from searchExercises to avoid exercises conflicting with reported pain.
- If the athlete mentions pain, suggest consulting their coach.
- Supersets: exercises sharing the same supersetId are grouped back-to-back. Preserve grouping when swapping.`

const EXAMPLE = `## Example

Given context:
1. Bench Press (workoutLogExerciseId: "42")
   Set 1 (workoutLogSetId: "101"): prescribed 8×100kg → 8×100kg RPE8
   Set 2: prescribed 8×100kg → not logged

User: "I did set 2 at 100kg for 7, RPE 9"
→ createWorkoutLogSetChangeRequest({ workoutLogExerciseId: "42", setIndex: 2, reps: 7, weight: 100, rpe: 9, reasoning: "Logging set 2" })

User: "Actually set 1 was 95kg not 100"
→ updateWorkoutLogSetChangeRequest({ workoutLogSetId: "101", weight: 95, reasoning: "Correcting set 1 weight" })

User: "Add a 4th set at 90kg for 10"
→ createWorkoutLogSetChangeRequest({ workoutLogExerciseId: "42", setIndex: 4, reps: 10, weight: 90, reasoning: "Adding extra set" })`

/**
 * Builds the context section with current workout state.
 */
function buildContextSection(context: WorkoutContext): string {
  const progressInfo = `${context.progress.completedSets}/${context.progress.totalSets} sets completed${context.progress.skippedSets > 0 ? ` (${context.progress.skippedSets} skipped)` : ''}`

  const exerciseList = context.exercises
    .map((ex, idx) => {
      const setInfo = ex.sets
        .map((set) => {
          const prescribed = set.prescribed
          const actual = set.actual
          const prescribedStr = prescribed.reps
            ? `${prescribed.reps}×${prescribed.weight ?? '?'}kg`
            : 'not specified'
          // Include workoutLogSetId for logged sets (needed for updateWorkoutLogSetChangeRequest)
          const setIdStr = actual ? ` (workoutLogSetId: "${set.id}")` : ''
          const actualStr = actual
            ? actual.completed
              ? `${actual.reps}×${actual.weight ?? '?'}kg RPE${actual.rpe ?? '?'}`
              : 'skipped'
            : 'not logged'
          return `   Set ${set.setIndex}${setIdStr}: prescribed ${prescribedStr} → ${actualStr}`
        })
        .join('\n')

      return `${idx + 1}. ${ex.exerciseName} (workoutLogExerciseId: "${ex.workoutLogExerciseId}")
${setInfo || '   No sets defined'}${ex.notes ? `\n   Notes: ${ex.notes}` : ''}`
    })
    .join('\n\n')

  return `## Current Workout
Session: ${context.session.name} (workoutLogId: "${context.session.id}")
Status: ${context.session.sessionStatus} | Progress: ${progressInfo}${context.session.notes ? `\nNotes: ${context.session.notes}` : ''}

${exerciseList || 'No exercises in this workout.'}`
}

// DEPRECATED: These functions are no longer needed with goal-oriented prompting.
// Tool results contain sufficient context for the agent to adapt.
// Keeping exports for backwards compatibility.

/**
 * @deprecated Tool results guide agent behavior naturally. No longer needed.
 */
export function buildRejectionFollowUpPrompt(_feedback: string): string {
  // No longer used - tool result from confirmChangeSet includes revision guidance
  return ''
}

/**
 * @deprecated Tool results guide agent behavior naturally. No longer needed.
 */
export function buildExecutionFailurePrompt(_errorMessage: string): string {
  // No longer used - tool result includes error context
  return ''
}
