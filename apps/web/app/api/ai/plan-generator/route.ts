/**
 * AI Plan Generator API Route
 *
 * Streaming endpoint for the individual user plan generation AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { streamText, convertToModelMessages, smoothStream, stepCountIs, type UIMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { planGeneratorTools } from '@/lib/changeset/plan-generator/tools'
import { getPlanGeneratorSystemPrompt } from '@/lib/changeset/plan-generator/system-prompt'

export const maxDuration = 60

/**
 * Zod schema for validating plan generator request body.
 */
const PlanGeneratorRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(8000),
    })
  ).min(1).max(100),
  mesocycleId: z.coerce.number().int().positive('Mesocycle ID must be a positive integer'),
  mesocycleName: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  let userId: string | undefined
  try {
    // Authenticate and parse body in parallel
    const [authResult, body] = await Promise.all([
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

    // Validate request body with Zod
    let validatedBody: z.infer<typeof PlanGeneratorRequestSchema>
    try {
      validatedBody = PlanGeneratorRequestSchema.parse(body)
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error instanceof z.ZodError ? error.issues : 'Failed to parse request'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, mesocycleId, mesocycleName } = validatedBody

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
      mesocycleId: String(mesocycleId),
      mesocycleName: mesocycleName ?? mesocycle.name ?? undefined,
    })

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages as unknown as UIMessage[])

    if (process.env.NODE_ENV === 'development') {
      console.log('[plan-generator] Messages count:', modelMessages.length)
      console.log('[plan-generator] Mesocycle:', mesocycleId, mesocycleName)
      console.log('[plan-generator] Tools available:', Object.keys(planGeneratorTools))
    }

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      maxOutputTokens: 16384,
      system: systemPrompt,
      messages: modelMessages,
      tools: planGeneratorTools,
      stopWhen: stepCountIs(20),
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
    console.error('[plan-generator] Error:', { userId, error })
    return new Response('Internal Server Error', { status: 500 })
  }
}
