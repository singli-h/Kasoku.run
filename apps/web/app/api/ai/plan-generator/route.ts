/**
 * AI Plan Generator API Route
 *
 * Streaming endpoint for the individual user plan generation AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * @see specs/010-individual-first-experience/agent-tools-plan.md
 */

import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { getDbUserId } from '@/lib/user-cache'
import { planGeneratorTools } from '@/lib/changeset/plan-generator/tools'
import { getPlanGeneratorSystemPrompt } from '@/lib/changeset/plan-generator/system-prompt'

export const maxDuration = 60

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
    const { messages, mesocycleId, mesocycleName } = await req.json()

    if (!mesocycleId) {
      return new Response('Mesocycle ID is required', { status: 400 })
    }

    // Build system prompt with mesocycle context
    const systemPrompt = getPlanGeneratorSystemPrompt({
      mesocycleId,
      mesocycleName,
    })

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages)

    console.log('[plan-generator] Messages count:', modelMessages.length)
    console.log('[plan-generator] Mesocycle:', mesocycleId, mesocycleName)
    console.log('[plan-generator] Tools available:', Object.keys(planGeneratorTools))

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: planGeneratorTools,
      providerOptions: {
        openai: {
          reasoningEffort: 'high',      // Enable deep reasoning for plan generation
          reasoningSummary: 'auto',     // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        console.log('[plan-generator] Response text:', text?.substring(0, 200))
        console.log('[plan-generator] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
        console.log('[plan-generator] Tool calls:', toolCalls?.map((t) => t.toolName))
        console.log('[plan-generator] Tokens:', usage)
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[plan-generator] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
