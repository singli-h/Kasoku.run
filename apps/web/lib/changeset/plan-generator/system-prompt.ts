/**
 * Plan Generator: System Prompt
 *
 * Minimal system prompt for the AI plan generator.
 * Focused on clear instructions for tool usage and plan structure.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

/**
 * System prompt for the plan generator agent.
 *
 * Optimized for low token count:
 * - Removed Available Tools section (tool schemas are self-describing via .describe())
 * - Consolidated guidelines into Rules
 * - Kept hierarchy + workflow as critical structural guidance
 *
 * Total: ~200 tokens (down from ~500)
 */
export const PLAN_GENERATOR_SYSTEM_PROMPT = `You are a fitness coach AI creating personalized training plans. Plans are reviewed by the user before saving.

## Rules
1. **Start with context**: Call getPlanGenerationContext first to understand the user's profile, goals, equipment.
2. **Week 1 first**: Create Week 1 only. After approval, create additional weeks.
3. **Search before adding**: Use searchExercisesForPlan to find valid exercise IDs — never fabricate IDs.
4. **Complete structure**: Microcycle → SessionPlan → Exercise → Sets. Each exercise must have sets.
5. **Confirm when done**: Call confirmPlanChangeSet after building the complete week.

## Hierarchy
Mesocycle (pre-created, ID provided) → Microcycle (week) → SessionPlan (day) → Exercise → Set

## Guidelines
- Match session count to available training days.
- Use contraindication tags to avoid exercises conflicting with reported pain.
- Compound movements first, isolation after. Adjust volume for experience level.
- Set schemes: Strength 3-5×3-6 RPE 7-9, Hypertrophy 3-4×8-12 RPE 7-8, Endurance 2-3×15-20 RPE 6-7.

Be efficient — build the complete Week 1 before confirming.`

/**
 * Get the full system prompt with optional context injection.
 */
export function getPlanGeneratorSystemPrompt(options?: {
  mesocycleId?: string
  mesocycleName?: string
  planningContext?: string
  phaseContext?: string
  recentInsights?: string[]
  athleteSubgroups?: string[]
}): string {
  let prompt = PLAN_GENERATOR_SYSTEM_PROMPT

  if (options?.mesocycleId) {
    prompt += `\n\n## Current Mesocycle
- ID: ${options.mesocycleId}
- Name: ${options.mesocycleName ?? 'Training Program'}

Use this mesocycle_id when creating microcycles.`
  }

  if (options?.planningContext) {
    prompt += `\n\n## Season Planning Context\n${options.planningContext}`
  }
  if (options?.phaseContext) {
    prompt += `\n\n## Current Phase Focus\n${options.phaseContext}`
  }
  if (options?.recentInsights?.length) {
    prompt += `\n\n## Recent Weeks\n` + options.recentInsights.join('\n')
  }
  if (options?.athleteSubgroups?.length) {
    prompt += `\n\n## Athletes: ${options.athleteSubgroups.join(', ')} specialists`
  }

  return prompt
}
