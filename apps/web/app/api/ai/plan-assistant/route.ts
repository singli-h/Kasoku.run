/**
 * AI Plan Assistant API Route
 *
 * Unified streaming endpoint for the plan-level AI assistant.
 * Supports context-aware prompts at different levels:
 * - Session level: Works on specific session exercises
 * - Week level: Works across sessions in a week
 * - Block level: Works across the entire training block
 *
 * Uses Vercel AI SDK with tool calling.
 *
 * @see docs/features/plans/individual/IMPLEMENTATION_PLAN.md
 */

import { streamText, convertToModelMessages, smoothStream, stepCountIs, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { coachDomainTools, type CoachToolName } from '@/lib/changeset/tools'
import { buildPlanAssistantSystemPrompt } from '@/lib/changeset/prompts/plan-assistant'
import { executeGetSessionContext } from '@/lib/changeset/tool-implementations/read-impl'

// ============================================================================
// Query Classification for Responsive Reasoning
// ============================================================================

type QueryIntent = 'edit' | 'question' | 'structural'

/** Tool subsets by intent — reduces tool schema tokens sent to OpenAI */
const TOOLS_BY_INTENT: Record<QueryIntent, CoachToolName[]> = {
  // Editing: exercise + set + confirm (most common action)
  edit: [
    'createSessionPlanExerciseChangeRequest',
    'updateSessionPlanExerciseChangeRequest',
    'deleteSessionPlanExerciseChangeRequest',
    'createSessionPlanSetChangeRequest',
    'updateSessionPlanSetChangeRequest',
    'deleteSessionPlanSetChangeRequest',
    'searchExercises',
    'confirmChangeSet',
  ],
  // Questions: read tools only
  question: [
    'getSessionContext',
    'searchExercises',
  ],
  // Structural: full tool set for block/week-wide changes, session creation
  structural: [
    'getSessionContext',
    'searchExercises',
    'createSessionPlanChangeRequest',
    'updateSessionPlanChangeRequest',
    'createSessionPlanExerciseChangeRequest',
    'updateSessionPlanExerciseChangeRequest',
    'deleteSessionPlanExerciseChangeRequest',
    'createSessionPlanSetChangeRequest',
    'updateSessionPlanSetChangeRequest',
    'deleteSessionPlanSetChangeRequest',
    'confirmChangeSet',
    'resetChangeSet',
  ],
}

// Reasoning effort per intent: 'none' = instant (no thinking), 'low' = light reasoning
const REASONING_BY_INTENT: Record<QueryIntent, 'none' | 'low' | 'medium'> = {
  edit: 'none',
  question: 'low',
  structural: 'low',
}

const QUESTION_PATTERNS = /\b(why|what|how|explain|recommend|suggest|should i|tell me|difference|better|worse|benefit|alternative|technique|compare)\b/i
const STRUCTURAL_PATTERNS = /\b(deload|block.wide|every session|every workout|all weeks|entire block|whole program|throughout|across all|replace all|volume|periodiz)/i

function classifyPlanQuery(messages: Array<{ role: string; content?: string }>): QueryIntent {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'user' || !msg.content) continue
    const text = typeof msg.content === 'string' ? msg.content : ''
    if (STRUCTURAL_PATTERNS.test(text)) return 'structural'
    if (QUESTION_PATTERNS.test(text)) return 'question'
    return 'edit'
  }
  return 'edit'
}

export const maxDuration = 120

/**
 * Row type for microcycle data from Supabase query
 */
interface MicrocycleRow {
  id: number
  name: string | null
  start_date: string | null
  end_date: string | null
  session_plans?: SessionPlanRow[]
}

/**
 * Row type for session plan data from Supabase query
 */
interface SessionPlanRow {
  id: string
  name: string | null
  day: number | null
}

/**
 * Row type for session plan with exercises from Supabase query
 */
interface SessionPlanWithExercisesRow {
  id: string
  name: string | null
  day: number | null
  session_plan_exercises?: SessionPlanExerciseRow[]
}

/**
 * Row type for session plan exercise from Supabase query
 */
interface SessionPlanExerciseRow {
  id: string
  exercise_order: number | null
  exercise: { id: number; name: string | null } | null
}

/**
 * Zod schema for validating plan assistant request body.
 * Ensures all required fields are present and properly typed.
 */
const PlanAssistantRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(100),
  planId: z.coerce.number().int().positive('Plan ID must be a positive integer'),
  sessionId: z.string().nullable().optional(),
  weekId: z.number().nullable().optional(),
  exerciseId: z.string().nullable().optional(),
  aiContextLevel: z.enum(['block', 'week', 'session', 'exercise']).default('session'),
})

export async function POST(req: Request) {
  let userId: string | undefined
  try {
    // Authenticate and parse body in parallel
    const [authResult, rawBody] = await Promise.all([
      auth(),
      req.json(),
    ])

    userId = authResult.userId
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Kill switch: flip AI_ENABLED=false in Vercel dashboard to disable AI without redeploying
    if (process.env.AI_ENABLED === 'false') {
      return new Response('AI features are temporarily unavailable', { status: 503 })
    }

    // Rate limit: 20 requests per minute per user
    const { allowed, remaining } = checkServerRateLimit(userId, 20, 60_000)
    if (!allowed) {
      return new Response('Too many requests. Please wait a moment.', {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      })
    }

    // Resolve DB user ID (throws if user not found)
    let dbUserId: number
    try {
      dbUserId = await getDbUserId(userId)
    } catch {
      return new Response('User not found', { status: 404 })
    }

    // Validate request body
    let body: z.infer<typeof PlanAssistantRequestSchema>
    try {
      body = PlanAssistantRequestSchema.parse(rawBody)
    } catch (error) {
      console.error('[plan-assistant] Invalid request:', error)
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error instanceof z.ZodError ? error.issues : 'Failed to parse request'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { messages, planId, sessionId, weekId, exerciseId, aiContextLevel = 'session' } = body

    // Fetch plan with ownership check and context in a single query
    let sessionContext
    let weekContext
    let planContext

    const { data: planData, error: planError } = await supabase
      .from('mesocycles')
      .select(`
        id,
        user_id,
        name,
        description,
        start_date,
        end_date,
        microcycles (
          id,
          name,
          start_date,
          end_date,
          session_plans (
            id,
            name,
            day
          )
        )
      `)
      .eq('id', planId)
      .single()

    if (planError || !planData) {
      return new Response('Plan not found', { status: 404 })
    }

    if (planData.user_id !== dbUserId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Build plan context from the combined query result
    planContext = {
      id: planData.id,
      name: planData.name,
      description: planData.description,
      startDate: planData.start_date,
      endDate: planData.end_date,
      weeks: planData.microcycles?.map((w: MicrocycleRow) => ({
        id: w.id,
        name: w.name,
        startDate: w.start_date,
        endDate: w.end_date,
        sessions: w.session_plans?.map((s: SessionPlanRow) => ({
          id: s.id,
          name: s.name,
          day: s.day,
        })) ?? [],
      })) ?? [],
    }

    // Fetch week and session context in parallel (both are independent after plan ownership check)
    const [weekResult, sessionResult] = await Promise.all([
      // Get week context if a week is selected
      weekId ? (async () => {
        try {
          const { data: weekData } = await supabase
            .from('microcycles')
            .select(`
              id,
              name,
              start_date,
              end_date,
              session_plans (
                id,
                name,
                day,
                session_plan_exercises (
                  id,
                  exercise_order,
                  exercise:exercises (
                    id,
                    name
                  )
                )
              )
            `)
            .eq('id', weekId)
            .single()

          if (weekData) {
            return {
              id: weekData.id,
              name: weekData.name,
              startDate: weekData.start_date,
              endDate: weekData.end_date,
              sessions: weekData.session_plans?.map((s: SessionPlanWithExercisesRow) => ({
                id: s.id,
                name: s.name,
                day: s.day,
                exerciseCount: s.session_plan_exercises?.length ?? 0,
                exercises: s.session_plan_exercises?.map((e: SessionPlanExerciseRow) => ({
                  id: e.id,
                  name: e.exercise?.name ?? undefined,
                })) ?? [],
              })) ?? [],
            }
          }
        } catch (error) {
          console.error('[plan-assistant] Error fetching week context:', error)
        }
        return undefined
      })() : Promise.resolve(undefined),

      // Get session context if a session is selected
      sessionId ? (async () => {
        try {
          const { data: session, error: sessionError } = await supabase
            .from('session_plans')
            .select('id, user_id, name')
            .eq('id', sessionId)
            .single()

          if (!sessionError && session && session.user_id === dbUserId) {
            return await executeGetSessionContext(
              { sessionId: String(sessionId), includeHistory: false },
              supabase
            )
          }
        } catch (error) {
          console.error('[plan-assistant] Error fetching session context:', error)
        }
        return undefined
      })() : Promise.resolve(undefined),
    ])

    weekContext = weekResult
    sessionContext = sessionResult

    // Verify week belongs to this plan (prevents IDOR — user can't pass arbitrary weekId)
    if (weekId && planData.microcycles) {
      const planWeekIds = new Set(
        planData.microcycles.map((w: MicrocycleRow) => w.id)
      )
      if (!planWeekIds.has(weekId)) {
        return new Response('Week does not belong to this plan', { status: 403 })
      }
    }

    // Verify session belongs to this plan (if provided)
    if (sessionId && planData.microcycles) {
      const planSessionIds = new Set(
        planData.microcycles.flatMap((w: MicrocycleRow) =>
          w.session_plans?.map((s: SessionPlanRow) => s.id) ?? []
        )
      )
      if (!planSessionIds.has(sessionId)) {
        return new Response('Session does not belong to this plan', { status: 403 })
      }
    }

    // Build system prompt with context
    const systemPrompt = buildPlanAssistantSystemPrompt({
      aiContextLevel,
      planContext,
      weekContext,
      sessionContext,
      selectedWeekId: weekId,
      selectedSessionId: sessionId,
      selectedExerciseId: exerciseId,
    })

    // Convert UI messages to model messages format
    // Cast: Zod validates as unknown[], but convertToModelMessages expects UIMessage[]
    const modelMessages = await convertToModelMessages(messages as UIMessage[])

    // Classify query intent for responsive reasoning + tool filtering
    const intent = classifyPlanQuery(messages as Array<{ role: string; content?: string }>)
    const activeTools = TOOLS_BY_INTENT[intent]
    const reasoningEffort = REASONING_BY_INTENT[intent]

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[plan-assistant] Context level:', aiContextLevel)
      console.log('[plan-assistant] Plan ID:', planId)
      console.log('[plan-assistant] Intent:', intent, '→ reasoning:', reasoningEffort, '→ tools:', activeTools.length)
    }

    // Stream response with responsive reasoning and dynamic tool filtering
    const result = streamText({
      model: openai('gpt-5.2'),
      maxOutputTokens: 16384,
      system: systemPrompt,
      messages: modelMessages,
      tools: coachDomainTools,
      // Dynamic tool filtering: only send relevant tools based on query intent
      activeTools,
      stopWhen: stepCountIs(20),
      // Smooth word-level streaming for better perceived performance
      experimental_transform: smoothStream(),
      // Step 0: use classified tools. Step 1+: expand to full set for confirmChangeSet etc.
      prepareStep: ({ stepNumber, messages: stepMessages }) => {
        if (stepNumber > 0) {
          return { activeTools: Object.keys(coachDomainTools) as CoachToolName[] }
        }
        if (stepMessages.length > 12) {
          const systemMsgs = stepMessages.filter(m => m.role === 'system')
          const nonSystemMsgs = stepMessages.filter(m => m.role !== 'system')
          return { messages: [...systemMsgs, ...nonSystemMsgs.slice(-8)] }
        }
        return undefined
      },
      providerOptions: {
        openai: {
          reasoningEffort,             // Responsive: none for edits, low for questions/structural
          reasoningSummary: 'auto',    // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[plan-assistant] Response text:', text?.substring(0, 200))
          console.log('[plan-assistant] Tool calls:', toolCalls?.map(t => t.toolName))
          console.log('[plan-assistant] Tokens:', usage)
        }
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[plan-assistant] Error:', { userId, error })
    return new Response('Internal Server Error', { status: 500 })
  }
}
