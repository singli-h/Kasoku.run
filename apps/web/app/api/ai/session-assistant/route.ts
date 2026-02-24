/**
 * AI Session Assistant API Route
 *
 * Streaming endpoint for the session planner AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-v1-vision.md
 */

import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { coachDomainTools } from '@/lib/changeset/tools'
import { buildCoachSystemPrompt } from '@/lib/changeset/prompts/session-planner'
import { executeGetSessionContext } from '@/lib/changeset/tool-implementations/read-impl'

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

    // Resolve DB user ID (throws if user not found)
    let dbUserId: number
    try {
      dbUserId = await getDbUserId(userId)
    } catch {
      return new Response('User not found', { status: 404 })
    }

    // Verify session ownership
    const sessionResult = await supabase.from('session_plans').select('id, user_id, name').eq('id', sessionId).single()

    const { data: session, error: sessionError } = sessionResult
    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }

    if (session.user_id !== dbUserId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Fetch session context (non-blocking — AI can still use getSessionContext tool)
    let sessionContext
    try {
      sessionContext = await executeGetSessionContext(
        { sessionId: String(sessionId), includeHistory: false },
        supabase
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

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[session-assistant] Messages count:', modelMessages.length)
      console.log('[session-assistant] Raw messages:', JSON.stringify(messages.map((m: { role: string; parts?: Array<{ type?: string }> }) => ({
        role: m.role,
        partsCount: m.parts?.length,
        partTypes: m.parts?.map((p) => p.type)
      }))))
      console.log('[session-assistant] Model messages:', JSON.stringify(modelMessages.map((m: { role: string; content?: unknown }) => ({
        role: m.role,
        contentType: typeof m.content,
        contentPreview: typeof m.content === 'string' ? m.content.substring(0, 100) : Array.isArray(m.content) ? `array[${m.content.length}]` : 'other'
      }))))
      console.log('[session-assistant] Tools available:', Object.keys(coachDomainTools))
    }

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: coachDomainTools,
      providerOptions: {
        openai: {
          reasoningEffort: 'low',       // Low effort for interactive chat responsiveness
          reasoningSummary: 'auto',     // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        console.log('[session-assistant] Response text:', text?.substring(0, 200))
        console.log('[session-assistant] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
        console.log('[session-assistant] Tool calls:', toolCalls?.map(t => t.toolName))
        console.log('[session-assistant] Tokens:', usage)
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[session-assistant] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
