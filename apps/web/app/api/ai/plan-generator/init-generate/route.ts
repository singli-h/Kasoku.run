/**
 * Init Pipeline: Generation Step API Route
 *
 * Generates structured training plan JSON using generateObject.
 * Takes the planning summary from init-plan and outputs simple, flat JSON.
 * The output is then scaffolded into full in-memory state on the client.
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'

import { SimpleGeneratedPlanSchema } from '@/lib/init-pipeline/schemas'
import {
  GENERATION_SYSTEM_PROMPT,
  buildGenerationPrompt,
  type PlanningContext,
} from '@/lib/init-pipeline/prompts'

export const maxDuration = 60

interface InitGenerateRequest {
  planningSummary: string
  context: PlanningContext
}

export async function POST(req: Request) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse request
    const { planningSummary, context } = (await req.json()) as InitGenerateRequest

    if (!planningSummary || !context) {
      return new Response('Planning summary and context are required', { status: 400 })
    }

    console.log('[init-generate] Starting generation step')
    console.log('[init-generate] Planning summary length:', planningSummary.length)
    console.log('[init-generate] Duration weeks:', context.mesocycle.duration_weeks)

    // Build prompt
    const prompt = buildGenerationPrompt({
      planningSummary,
      context,
    })

    // Generate structured output with simple schema
    const { object, usage } = await generateObject({
      model: openai('gpt-5.2'),
      schema: SimpleGeneratedPlanSchema,
      system: GENERATION_SYSTEM_PROMPT,
      prompt,
    })

    console.log('[init-generate] Complete, tokens:', usage)
    console.log('[init-generate] Generated weeks:', object.microcycles.length)
    console.log(
      '[init-generate] Total sessions:',
      object.microcycles.reduce((acc, w) => acc + w.sessions.length, 0)
    )
    console.log(
      '[init-generate] Total exercises:',
      object.microcycles.reduce(
        (acc, w) => acc + w.sessions.reduce((acc2, s) => acc2 + s.exercises.length, 0),
        0
      )
    )

    return Response.json({ plan: object })
  } catch (error) {
    console.error('[init-generate] Error:', error)

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('[init-generate] Error message:', error.message)
      console.error('[init-generate] Error stack:', error.stack)
    }

    // Check for AI SDK validation errors (includes Zod errors)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('schema') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('parse')
    ) {
      return Response.json(
        {
          error: 'Failed to generate valid plan structure',
          details: errorMessage,
        },
        { status: 422 }
      )
    }

    return new Response('Internal Server Error', { status: 500 })
  }
}
