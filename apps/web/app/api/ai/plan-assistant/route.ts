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

import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { coachDomainTools } from '@/lib/changeset/tools'
import { buildPlanAssistantSystemPrompt } from '@/lib/changeset/prompts/plan-assistant'
import { executeGetSessionContext } from '@/lib/changeset/tool-implementations/read-impl'

export const maxDuration = 30

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
  messages: z.array(z.unknown()),
  planId: z.coerce.number().int().positive('Plan ID must be a positive integer'),
  sessionId: z.string().nullable().optional(),
  weekId: z.number().nullable().optional(),
  exerciseId: z.string().nullable().optional(),
  aiContextLevel: z.enum(['block', 'week', 'session', 'exercise']).default('session'),
})

export async function POST(req: Request) {
  try {
    // Authenticate the request
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const dbUserId = await getDbUserId(userId)
    if (!dbUserId) {
      return new Response('User not found', { status: 404 })
    }

    // Parse and validate request body
    let body: z.infer<typeof PlanAssistantRequestSchema>
    try {
      const rawBody = await req.json()
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

    // Get week context if a week is selected
    if (weekId) {
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
          weekContext = {
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
    }

    // Get session context if a session is selected
    if (sessionId) {
      try {
        // Verify session ownership
        const { data: session, error: sessionError } = await supabase
          .from('session_plans')
          .select('id, user_id, name')
          .eq('id', sessionId)
          .single()

        if (!sessionError && session && session.user_id === dbUserId) {
          sessionContext = await executeGetSessionContext(
            { sessionId: String(sessionId), includeHistory: false },
            supabase
          )
        }
      } catch (error) {
        console.error('[plan-assistant] Error fetching session context:', error)
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
    const modelMessages = await convertToModelMessages(messages as UIMessage[])

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[plan-assistant] Context level:', aiContextLevel)
      console.log('[plan-assistant] Plan ID:', planId)
      console.log('[plan-assistant] Week ID:', weekId)
      console.log('[plan-assistant] Session ID:', sessionId)
      console.log('[plan-assistant] Messages count:', modelMessages.length)
      console.log('[plan-assistant] Tools available:', Object.keys(coachDomainTools))
    }

    // Stream response with tool support
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: coachDomainTools,
      providerOptions: {
        openai: {
          reasoningEffort: 'low',
          reasoningSummary: 'auto',
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
    console.error('[plan-assistant] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
