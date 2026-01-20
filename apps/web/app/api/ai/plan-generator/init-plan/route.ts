/**
 * Init Pipeline: Planning Step API Route
 *
 * Streams a training plan outline based on user context.
 * The output is passed to init-generate for structured JSON generation.
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'

import {
  PLANNING_SYSTEM_PROMPT,
  buildPlanningPrompt,
  type PlanningContext,
} from '@/lib/init-pipeline/prompts'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request
    const { context } = (await req.json()) as { context: PlanningContext }

    if (!context) {
      return new Response('Context is required', { status: 400 })
    }

    console.log('[init-plan] Starting planning step')
    console.log('[init-plan] Context:', {
      experience: context.user.experience_level,
      goal: context.user.primary_goal,
      days: context.preferences.training_days.length,
      duration: context.preferences.session_duration,
      weeks: context.mesocycle.duration_weeks,
    })

    // Build prompt
    const userPrompt = buildPlanningPrompt(context)

    // Stream response
    const result = streamText({
      model: openai('gpt-4o'),
      system: PLANNING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      onFinish: ({ text, usage }) => {
        console.log('[init-plan] Complete, tokens:', usage)
        console.log('[init-plan] Output preview:', text?.substring(0, 200))
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[init-plan] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
