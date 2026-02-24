/**
 * AI Session Assistant API Route
 *
 * Streaming endpoint for the session planner AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-v1-vision.md
 */

import { streamText, convertToModelMessages, smoothStream } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { coachDomainTools, type CoachToolName } from '@/lib/changeset/tools'
import { buildCoachSystemPrompt } from '@/lib/changeset/prompts/session-planner'
import { executeGetSessionContext } from '@/lib/changeset/tool-implementations/read-impl'

// ============================================================================
// Query Classification for Responsive Reasoning
// ============================================================================

type QueryIntent = 'edit' | 'question' | 'plan'

/** Tool subsets by intent — reduces tool schema tokens sent to OpenAI */
const TOOLS_BY_INTENT: Record<QueryIntent, CoachToolName[]> = {
  // Editing: proposal + confirm tools (most common coach action)
  edit: [
    'createSessionPlanExerciseChangeRequest',
    'updateSessionPlanExerciseChangeRequest',
    'deleteSessionPlanExerciseChangeRequest',
    'createSessionPlanSetChangeRequest',
    'updateSessionPlanSetChangeRequest',
    'deleteSessionPlanSetChangeRequest',
    'confirmChangeSet',
  ],
  // Questions: read tools only
  question: [
    'getSessionContext',
    'searchExercises',
  ],
  // Planning: full tool set for complex session building
  plan: [
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

const REASONING_BY_INTENT: Record<QueryIntent, 'none' | 'low' | 'medium'> = {
  edit: 'none',
  question: 'low',
  plan: 'low',
}

const QUESTION_PATTERNS = /\b(why|what|how|explain|recommend|suggest|should i|tell me|difference|better|worse|benefit|alternative|technique|compare)\b/i
const PLAN_PATTERNS = /\b(build|create session|design|plan|program|periodiz|structure|template)\b/i

function classifyCoachQuery(messages: Array<{ role: string; content?: string }>): QueryIntent {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'user' || !msg.content) continue
    const text = typeof msg.content === 'string' ? msg.content : ''
    if (PLAN_PATTERNS.test(text)) return 'plan'
    if (QUESTION_PATTERNS.test(text)) return 'question'
    return 'edit'
  }
  return 'edit'
}

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Authenticate and parse body in parallel
    const [authResult, body] = await Promise.all([
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

    const { messages, sessionId } = body
    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required', { status: 400 })
    }
    if (messages.length > 100) {
      return new Response('Too many messages', { status: 400 })
    }

    // Resolve DB user ID + session query in parallel (saves ~30-100ms)
    let dbUserId: number
    let session: { id: string; user_id: number | null; name: string | null; description: string | null }
    try {
      const [dbUserIdResult, sessionResult] = await Promise.all([
        getDbUserId(userId),
        supabase
          .from('session_plans')
          .select('id, user_id, name, description')
          .eq('id', sessionId)
          .single(),
      ])

      dbUserId = dbUserIdResult

      const { data, error: sessionError } = sessionResult
      if (sessionError || !data) {
        return new Response('Session not found', { status: 404 })
      }
      session = data
    } catch {
      return new Response('User not found', { status: 404 })
    }

    if (session.user_id !== dbUserId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Fetch session context — pass prefetched session data to skip redundant query
    let sessionContext
    try {
      sessionContext = await executeGetSessionContext(
        { sessionId: String(sessionId), includeHistory: false },
        supabase,
        { id: session.id, name: session.name, description: session.description }
      )
    } catch (error) {
      console.error('[session-assistant] Error fetching context:', error)
    }

    // Build system prompt with context
    const systemPrompt = buildCoachSystemPrompt(sessionContext)

    // Convert UI messages to model messages format
    // UIMessage format (from useChat): { role, parts: [{ type: 'text', text }] }
    // ModelMessage format (for streamText): { role, content: string }
    const modelMessages = await convertToModelMessages(messages)

    // Classify query intent for responsive reasoning + tool filtering
    const intent = classifyCoachQuery(messages)
    const activeTools = TOOLS_BY_INTENT[intent]
    const reasoningEffort = REASONING_BY_INTENT[intent]

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[session-assistant] Messages count:', modelMessages.length)
      console.log('[session-assistant] Intent:', intent, '→ reasoning:', reasoningEffort, '→ tools:', activeTools.length)
    }

    // Stream response with responsive reasoning and dynamic tool filtering
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: coachDomainTools,
      // Dynamic tool filtering: only send relevant tools based on query intent
      activeTools,
      // Smooth word-level streaming for better perceived performance
      experimental_transform: smoothStream(),
      // Prevent stalled streams from hanging the UI
      timeout: {
        chunkMs: 5000,   // Abort if no chunk for 5s
        stepMs: 15000,   // Abort any single tool step after 15s
      },
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
          reasoningEffort,             // Responsive: none for edits, low for questions/planning
          reasoningSummary: 'auto',    // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[session-assistant] Response text:', text?.substring(0, 200))
          console.log('[session-assistant] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
          console.log('[session-assistant] Tool calls:', toolCalls?.map(t => t.toolName))
          console.log('[session-assistant] Tokens:', usage)
        }
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[session-assistant] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
