/**
 * AI Workout Assistant API Route
 *
 * Streaming endpoint for the athlete workout AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * Authentication:
 * - Verifies user is authenticated
 * - Verifies user has an athlete record
 * - Verifies the workout belongs to that athlete
 *
 * @see specs/005-ai-athlete-workout/spec.md
 */

import { streamText, convertToModelMessages, smoothStream, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { athleteDomainTools, type AthleteToolName } from '@/lib/changeset/tools'
import { buildAthleteSystemPrompt } from '@/lib/changeset/prompts/workout-athlete'
import { executeGetWorkoutContext } from '@/lib/changeset/tool-implementations/workout-read-impl'

// ============================================================================
// Query Classification for Responsive Reasoning
// ============================================================================

type QueryIntent = 'log' | 'question' | 'modify'

/**
 * Tool subsets by intent — reduces tool schema tokens sent to OpenAI.
 *
 * Design principle: `log` must cover ALL common workout page actions
 * (set logging, notes, basic adds). Only strip tools the model never
 * needs for that intent. `question` is the aggressive strip — read-only.
 *
 * Verified against spec acceptance scenarios (US-1 through US-4).
 */
const TOOLS_BY_INTENT: Record<QueryIntent, AthleteToolName[]> = {
  // Logging: set + exercise + notes + confirm (covers US-1, US-2.2, US-2.3, US-4)
  // Strips only: getWorkoutContext (already in system prompt), resetChangeSet, delete tools
  log: [
    'createWorkoutLogSetChangeRequest',
    'updateWorkoutLogSetChangeRequest',
    'createWorkoutLogExerciseChangeRequest',
    'updateWorkoutLogChangeRequest',
    'searchExercises',
    'confirmChangeSet',
  ],
  // Questions: read tools only (covers US-3.1, US-3.2)
  question: [
    'getWorkoutContext',
    'searchExercises',
  ],
  // Modifications: full tool set for swaps, complex changes (covers US-2.1, US-3.3)
  modify: [
    'getWorkoutContext',
    'searchExercises',
    'createWorkoutLogSetChangeRequest',
    'updateWorkoutLogSetChangeRequest',
    'deleteWorkoutLogSetChangeRequest',
    'createWorkoutLogExerciseChangeRequest',
    'updateWorkoutLogExerciseChangeRequest',
    'deleteWorkoutLogExerciseChangeRequest',
    'updateWorkoutLogChangeRequest',
    'confirmChangeSet',
    'resetChangeSet',
  ],
}

const REASONING_BY_INTENT: Record<QueryIntent, 'none' | 'low' | 'medium'> = {
  log: 'none',
  question: 'low',
  modify: 'none',
}

// Patterns for classifying user intent
// Order matters: modify checked first, then question, then default to log
const QUESTION_PATTERNS = /\b(why|what|how|explain|recommend|suggest|should i|tell me|difference|better|worse|benefit|alternative|technique|form|injur|pain|hurt|find|search|show me|give me)/i
const MODIFY_PATTERNS = /\b(swap|replace|switch|instead|change exercise|remove exercise|reorder|superset|drop set)\b/i

/**
 * Classify the user's latest message to determine reasoning effort and active tools.
 * Simple keyword heuristic — zero latency cost.
 *
 * Verified against spec scenarios:
 * - US-1 (logging): all default to 'log' ✅
 * - US-2 (modifications): "swap/replace/instead" → 'modify', "add X" → 'log' (has createExercise) ✅
 * - US-3 (search): "what/find/show me" → 'question' ✅, follow-up "instead" → 'modify' ✅
 * - US-4 (notes): default 'log' (has updateWorkoutLog) ✅
 */
function classifyQuery(messages: Array<{ role: string; content?: string }>): QueryIntent {
  // Find the last user message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'user' || !msg.content) continue
    const text = typeof msg.content === 'string' ? msg.content : ''
    if (MODIFY_PATTERNS.test(text)) return 'modify'
    if (QUESTION_PATTERNS.test(text)) return 'question'
    return 'log' // Default: assume logging (most common workout action)
  }
  return 'log'
}

export const maxDuration = 60

const WorkoutAssistantRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(100),
  workoutLogId: z.string().min(1, 'Workout Log ID is required'),
})

export async function POST(req: Request) {
  try {
    // Authenticate and parse body in parallel
    const [authResult, rawBody] = await Promise.all([
      auth(),
      req.json(),
    ])

    const { userId } = authResult
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Rate limit: 20 requests per minute per user
    const { allowed, remaining } = checkServerRateLimit(userId, 20, 60_000)
    if (!allowed) {
      return new Response('Too many requests. Please wait a moment.', {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      })
    }

    // Validate request body
    let body: z.infer<typeof WorkoutAssistantRequestSchema>
    try {
      body = WorkoutAssistantRequestSchema.parse(rawBody)
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error instanceof z.ZodError ? error.issues : 'Failed to parse request'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, workoutLogId } = body

    // Resolve DB user ID (throws if user not found)
    let dbUserId: number
    try {
      dbUserId = await getDbUserId(userId)
    } catch {
      return new Response('User not found', { status: 404 })
    }

    // Athlete + workout queries in parallel — expanded workout select includes
    // all fields needed by context, avoiding a redundant query later
    const [athleteResult, workoutResult] = await Promise.all([
      supabase.from('athletes').select('id').eq('user_id', dbUserId).single(),
      supabase.from('workout_logs')
        .select('id, athlete_id, session_status, date_time, notes, session_plans(id, name)')
        .eq('id', workoutLogId)
        .single(),
    ])

    const { data: athlete, error: athleteError } = athleteResult
    if (athleteError || !athlete) {
      console.error('[workout-assistant] Athlete not found for user:', dbUserId)
      return new Response('Athlete record not found', { status: 403 })
    }

    // Verify workout ownership (fetched in parallel above)
    const { data: workout, error: workoutError } = workoutResult
    if (workoutError || !workout) {
      return new Response('Workout not found', { status: 404 })
    }

    if (workout.athlete_id !== athlete.id) {
      console.error('[workout-assistant] Athlete', athlete.id, 'tried to access workout owned by', workout.athlete_id)
      return new Response('Forbidden', { status: 403 })
    }

    // Get workout context for system prompt — pass prefetched workout data to skip redundant query
    let workoutContext
    try {
      workoutContext = await executeGetWorkoutContext(
        { workoutLogId: String(workoutLogId), includeHistory: false },
        supabase,
        {
          id: workout.id,
          session_status: workout.session_status,
          date_time: workout.date_time,
          notes: workout.notes,
          session_plans: workout.session_plans as unknown as { id: string; name: string } | null,
        }
      )
    } catch (error) {
      console.error('[workout-assistant] Error fetching context:', error)
      // Continue without context - AI can still use getWorkoutContext tool
    }

    // Build system prompt with context
    const systemPrompt = buildAthleteSystemPrompt(workoutContext)

    // Convert UI messages to model messages format
    // Cast: Zod validates as unknown[], but convertToModelMessages expects UIMessage[]
    const modelMessages = await convertToModelMessages(messages as UIMessage[])

    // Classify query intent for responsive reasoning + tool filtering
    const intent = classifyQuery(messages as Array<{ role: string; content?: string }>)
    const activeTools = TOOLS_BY_INTENT[intent]
    const reasoningEffort = REASONING_BY_INTENT[intent]

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[workout-assistant] Workout ID:', workoutLogId)
      console.log('[workout-assistant] Athlete ID:', athlete.id)
      console.log('[workout-assistant] Messages count:', modelMessages.length)
      console.log('[workout-assistant] Intent:', intent, '→ reasoning:', reasoningEffort, '→ tools:', activeTools.length)
    }

    // Stream response with responsive reasoning and dynamic tool filtering
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: athleteDomainTools,
      // Dynamic tool filtering: only send relevant tools based on query intent
      // Reduces tool schema tokens from ~1,650 (11 tools) to ~300-450 (2-3 tools) for logging
      activeTools,
      // Smooth word-level streaming for better perceived performance
      experimental_transform: smoothStream(),
      // Prevent stalled streams from hanging the UI
      timeout: {
        chunkMs: 5000,   // Abort if no chunk for 5s
        stepMs: 15000,   // Abort any single tool step after 15s
      },
      // Step 0: use classified tools. Step 1+: expand to full set (follow-up after tool calls)
      prepareStep: ({ stepNumber, messages: stepMessages }) => {
        if (stepNumber > 0) {
          // After tool calls, give model access to all tools for confirmChangeSet etc.
          return { activeTools: Object.keys(athleteDomainTools) as AthleteToolName[] }
        }
        // Step 0: prune old messages for long conversations
        if (stepMessages.length > 12) {
          const systemMsgs = stepMessages.filter(m => m.role === 'system')
          const nonSystemMsgs = stepMessages.filter(m => m.role !== 'system')
          return { messages: [...systemMsgs, ...nonSystemMsgs.slice(-8)] }
        }
        return undefined
      },
      providerOptions: {
        openai: {
          reasoningEffort,             // Responsive: none for logging, low for questions
          reasoningSummary: 'auto',    // Stream condensed reasoning to client
          textVerbosity: 'low',        // Shorter responses = faster streaming completion
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[workout-assistant] Response text:', text?.substring(0, 200))
          console.log('[workout-assistant] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
          console.log('[workout-assistant] Tool calls:', toolCalls?.map((t) => t.toolName))
          console.log('[workout-assistant] Tokens:', usage)
        }
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[workout-assistant] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
