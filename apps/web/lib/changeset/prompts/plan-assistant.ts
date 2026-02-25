/**
 * ChangeSet Pattern: System Prompt for Plan Assistant
 *
 * Defines the AI persona and instructions for the unified plan page.
 * Supports context-aware prompts at different levels:
 * - Session level: Works on specific session exercises
 * - Week level: Works across sessions in a week
 * - Block level: Works across the entire training block
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import type { SessionContext } from '../tool-implementations/read-impl'

/**
 * AI context level for the plan assistant.
 */
type AIContextLevel = 'block' | 'week' | 'session' | 'exercise'

/**
 * Plan-level context for the AI.
 */
interface PlanContext {
  id: number
  name: string | null
  description: string | null
  startDate: string | null
  endDate: string | null
  weeks: Array<{
    id: number
    name: string | null
    startDate: string | null
    endDate: string | null
    sessions: Array<{
      id: string
      name: string | null
      day: number | null
    }>
  }>
}

/**
 * Week-level context for the AI.
 */
interface WeekContext {
  id: number
  name: string | null
  startDate: string | null
  endDate: string | null
  sessions: Array<{
    id: string
    name: string | null
    day: number | null
    exerciseCount: number
    exercises: Array<{
      id: string | number
      name: string | undefined
    }>
  }>
}

/**
 * Parameters for building the plan assistant system prompt.
 */
interface PlanAssistantPromptParams {
  aiContextLevel: AIContextLevel
  planContext?: PlanContext
  weekContext?: WeekContext
  sessionContext?: SessionContext
  selectedWeekId?: number | null
  selectedSessionId?: string | null
  selectedExerciseId?: string | null
}

/**
 * System prompt for the Plan Assistant AI (unified plan page).
 *
 * Optimized for low token count and high accuracy:
 * 1. PERSONA - Identity (~30 tokens)
 * 2. Level guidance - Context-specific instructions (variable)
 * 3. RULES - Tool usage constraints (~120 tokens)
 * 4. CONTEXT_SECTION - Dynamic plan state (variable)
 *
 * Total static: ~250 tokens (down from ~800)
 */
export function buildPlanAssistantSystemPrompt(params: PlanAssistantPromptParams): string {
  const contextSection = buildContextSection(params)
  const levelGuidance = buildLevelGuidance(params.aiContextLevel)

  return `${PERSONA}

${levelGuidance}

${RULES}

${contextSection}`
}

const PERSONA = `You are a strength and conditioning coach assistant helping manage training plans. Be concise and action-oriented. Propose changes using tools, then call confirmChangeSet for review.`

/**
 * Build guidance specific to the current context level.
 */
function buildLevelGuidance(level: AIContextLevel): string {
  switch (level) {
    case 'exercise':
      return `## Current Focus: Exercise Level

You are focused on a specific exercise. Help with:
- Modifying sets (reps, weight, rest, RPE, tempo)
- Adding or removing sets
- Adjusting exercise parameters

Changes will only affect this specific exercise.`

    case 'session':
      return `## Current Focus: Session Level

You are focused on a single workout session. Help with:
- Adding, removing, or swapping exercises
- Modifying exercise order
- Creating supersets
- Adjusting sets for any exercise in this session

By default, changes will only affect this session.

**Cross-Session Requests**: If the user mentions a different day (e.g., "Add pull-ups to Wednesday" while viewing Monday), use the session ID from the week context for that day. Include session_plan_id in your change requests to target the correct session.`

    case 'week':
      return `## Current Focus: Week Level

You are viewing a week of training. You can help with:
- Adding exercises to specific days (e.g., "Add pull-ups to Wednesday")
- Changes across multiple sessions (e.g., "Add planks to every workout")
- Volume/intensity adjustments (e.g., "Make this a deload week" → reduce volume ~40%, maintain exercises)

When the user mentions a day name, find the matching session ID from context and apply changes there.`

    case 'block':
      return `## Current Focus: Block Level

You are viewing the entire training block. You can help with:
- Block-wide changes (e.g., "Replace all barbell exercises with dumbbells", "Add face pulls to every push day")
- Understanding overall program structure
- Answering questions about the training plan

For block-wide changes: summarize scope first ("X exercises across Y weeks"), apply to each session individually, then confirmChangeSet with a descriptive title.`

    default:
      return ''
  }
}

const RULES = `## Rules

### Tool Usage
- **Add exercise**: createSessionPlanExerciseChangeRequest. Then use the returned entityId (e.g., "temp-...") as sessionPlanExerciseId when creating sets.
- **Swap exercise**: updateSessionPlanExerciseChangeRequest with new exerciseId from searchExercises.
- **Add/update sets**: Always include sessionPlanExerciseId (use numeric ID from context for existing exercises).
- **Session metadata**: updateSessionPlanChangeRequest for name/description.
- **Week-level changes**: Apply to each session individually using session IDs from context.
- Always call confirmChangeSet after proposing changes with a clear title and description.
- Use IDs exactly as shown in context — never fabricate IDs.

### Supersets
- Group exercises by assigning the same supersetId (numeric: "1", "2", "3").
- Check context for existing IDs. New superset = next available number. Add to existing = same ID. Remove = null.

### Exercise Grouping
- Different stimulus → SEPARATE exercises. Training method → SAME exercise with multiple sets.
- If the user specifies how to group, always follow their instructions.`

/**
 * Builds the context section with current state at the appropriate level.
 */
function buildContextSection(params: PlanAssistantPromptParams): string {
  const { aiContextLevel, planContext, weekContext, sessionContext, selectedWeekId, selectedSessionId } = params

  const sections: string[] = []

  // Always include plan overview if available
  if (planContext) {
    const weekCount = planContext.weeks.length
    const totalSessions = planContext.weeks.reduce((sum, w) => sum + w.sessions.length, 0)

    sections.push(`## Training Block Overview

**Block**: ${planContext.name || 'Unnamed Block'} (ID: ${planContext.id})
${planContext.description ? `**Description**: ${planContext.description}` : ''}
**Duration**: ${planContext.startDate || '?'} to ${planContext.endDate || '?'}
**Structure**: ${weekCount} weeks, ${totalSessions} total sessions`)
  }

  // Include week details if at week level or below
  if (weekContext && (aiContextLevel === 'week' || aiContextLevel === 'session' || aiContextLevel === 'exercise')) {
    const sessionList = weekContext.sessions
      .sort((a, b) => (a.day ?? 7) - (b.day ?? 7))
      .map(s => {
        const dayName = getDayName(s.day)
        return `- ${dayName}: ${s.name || 'Unnamed'} (ID: ${s.id}) - ${s.exerciseCount} exercises`
      })
      .join('\n')

    sections.push(`## Current Week

**Week**: ${weekContext.name || 'Unnamed Week'} (ID: ${weekContext.id})
**Duration**: ${weekContext.startDate || '?'} to ${weekContext.endDate || '?'}
${selectedWeekId === weekContext.id ? '**Status**: Currently selected' : ''}

**Sessions**:
${sessionList || 'No sessions in this week.'}`)
  }

  // Include full session context if at session level or below
  if (sessionContext && (aiContextLevel === 'session' || aiContextLevel === 'exercise')) {
    const exerciseList = sessionContext.exercises
      .map((ex, idx) => {
        const setCount = ex.sets.length
        const setInfo = setCount > 0 ? `${setCount} sets` : 'no sets'
        const supersetInfo = ex.supersetId ? ` [SS:${ex.supersetId}]` : ''
        return `${idx + 1}. ${ex.exerciseName} (ID: ${ex.id}) - ${setInfo}${supersetInfo}`
      })
      .join('\n')

    sections.push(`## Current Session

**Session**: ${sessionContext.session.name || 'Unnamed Session'} (ID: ${sessionContext.session.id})
${sessionContext.session.description ? `**Description**: ${sessionContext.session.description}` : ''}
${selectedSessionId === sessionContext.session.id ? '**Status**: Currently selected' : ''}

**Exercises**:
${exerciseList || 'No exercises in this session yet.'}`)
  }

  // Add guidance for using the context
  if (sections.length > 0) {
    sections.push(`Use this context to understand what already exists before proposing changes.`)
  }

  return sections.join('\n\n')
}

/**
 * Get day name from day number.
 */
function getDayName(day: number | null): string {
  if (day === null) return 'Unscheduled'
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? '—'
}

export type { AIContextLevel, PlanContext, WeekContext, PlanAssistantPromptParams }
