/**
 * AI Plan Generator API Route
 *
 * Streaming endpoint for the individual user plan generation AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { streamText, convertToModelMessages, smoothStream } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { planGeneratorTools } from '@/lib/changeset/plan-generator/tools'
import { getPlanGeneratorSystemPrompt } from '@/lib/changeset/plan-generator/system-prompt'

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

    // Rate limit: 10 requests per minute per user (plan generation is expensive)
    const { allowed, remaining } = checkServerRateLimit(userId, 10, 60_000)
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
    const { messages, mesocycleId, mesocycleName } = body

    if (!mesocycleId) {
      return new Response('Mesocycle ID is required', { status: 400 })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required', { status: 400 })
    }
    if (messages.length > 100) {
      return new Response('Too many messages', { status: 400 })
    }

    // Verify mesocycle ownership
    const { data: mesocycle, error: mesocycleError } = await supabase
      .from('mesocycles')
      .select('id, user_id, name')
      .eq('id', mesocycleId)
      .single()

    if (mesocycleError || !mesocycle) {
      return new Response('Mesocycle not found', { status: 404 })
    }

    if (mesocycle.user_id !== dbUserId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Build system prompt with mesocycle context
    const systemPrompt = getPlanGeneratorSystemPrompt({
      mesocycleId,
      mesocycleName: mesocycleName ?? mesocycle.name,
    })

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages)

    if (process.env.NODE_ENV === 'development') {
      console.log('[plan-generator] Messages count:', modelMessages.length)
      console.log('[plan-generator] Mesocycle:', mesocycleId, mesocycleName)
      console.log('[plan-generator] Tools available:', Object.keys(planGeneratorTools))
    }

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: planGeneratorTools,
      // Smooth word-level streaming for better perceived performance
      experimental_transform: smoothStream(),
      providerOptions: {
        openai: {
          reasoningEffort: 'medium',    // Medium effort balances quality and speed for plan generation
          reasoningSummary: 'auto',     // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[plan-generator] Response text:', text?.substring(0, 200))
          console.log('[plan-generator] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
          console.log('[plan-generator] Tool calls:', toolCalls?.map((t) => t.toolName))
          console.log('[plan-generator] Tokens:', usage)
        }
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[plan-generator] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
