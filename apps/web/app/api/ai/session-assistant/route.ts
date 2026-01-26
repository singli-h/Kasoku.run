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
import { coachDomainTools } from '@/lib/changeset/tools'
import { buildCoachSystemPrompt } from '@/lib/changeset/prompts/session-planner'
import { executeGetSessionContext } from '@/lib/changeset/tool-implementations/read-impl'

export const maxDuration = 30

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

    // Parse request body
    const { messages, sessionId } = await req.json()

    if (!sessionId) {
      return new Response('Session ID is required', { status: 400 })
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('session_plans')
      .select('id, user_id, name')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }

    if (session.user_id !== dbUserId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Get session context for system prompt
    let sessionContext
    try {
      sessionContext = await executeGetSessionContext(
        { sessionId: String(sessionId), includeHistory: false },
        supabase
      )
    } catch (error) {
      console.error('[session-assistant] Error fetching context:', error)
      // Continue without context - AI can still use getSessionContext tool
    }

    // Build system prompt with context
    const systemPrompt = buildCoachSystemPrompt(sessionContext)

    // Convert UI messages to model messages format
    // UIMessage format (from useChat): { role, parts: [{ type: 'text', text }] }
    // ModelMessage format (for streamText): { role, content: string }
    const modelMessages = await convertToModelMessages(messages)

    // Debug: Log the messages structure to see if tool results are included
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

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: coachDomainTools,
      providerOptions: {
        openai: {
          reasoningEffort: 'high',      // Enable deep reasoning for complex planning
          reasoningSummary: 'auto',     // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        console.log('[session-assistant] Response text:', text?.substring(0, 200))
        console.log('[session-assistant] Reasoning:', reasoning ? reasoning.substring(0, 200) : 'none')
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
