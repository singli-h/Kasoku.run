/**
 * AI Session Assistant API Route
 *
 * Streaming endpoint for the session planner AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/002-ai-session-assistant/reference/20251221-session-v1-vision.md
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { coachDomainTools } from '@/lib/changeset/tools'
import { buildSystemPrompt } from '@/lib/changeset/prompts/session-planner'
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
    const systemPrompt = buildSystemPrompt(sessionContext)

    // Stream response with tool support
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      tools: coachDomainTools,
      onFinish: ({ usage }) => {
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
