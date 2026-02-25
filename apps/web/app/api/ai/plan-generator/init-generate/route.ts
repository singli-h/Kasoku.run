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
import { z } from 'zod'
import { checkServerRateLimit } from '@/lib/rate-limit-server'

import { SimpleGeneratedPlanSchema } from '@/lib/init-pipeline/schemas'
import {
  GENERATION_SYSTEM_PROMPT,
  buildGenerationPrompt,
} from '@/lib/init-pipeline/prompts'

export const maxDuration = 60

/**
 * Zod schema for validating init-generate request body.
 */
const InitGenerateRequestSchema = z.object({
  planningSummary: z.string().min(1).max(10_000),
  context: z.object({
    user: z.object({
      experience_level: z.string(),
      primary_goal: z.string(),
      secondary_goals: z.array(z.string()).optional(),
    }),
    preferences: z.object({
      training_days: z.array(z.string()).min(1),
      session_duration: z.number().int().min(15).max(180),
      equipment: z.string(),
      equipment_tags: z.array(z.string()).optional(),
    }),
    mesocycle: z.object({
      name: z.string(),
      duration_weeks: z.number().int().min(1).max(12),
    }),
    notes: z.string().optional(),
  }),
})

export async function POST(req: Request) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Rate limit: 5 requests per minute (expensive generateObject call)
    const { allowed, remaining } = checkServerRateLimit(userId, 5, 60_000)
    if (!allowed) {
      return new Response('Too many requests. Please wait a moment.', {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      })
    }

    // Validate request body
    let body: z.infer<typeof InitGenerateRequestSchema>
    try {
      body = InitGenerateRequestSchema.parse(await req.json())
    } catch (error) {
      return new Response(
        error instanceof z.ZodError ? JSON.stringify({ error: 'Invalid request', details: error.issues }) : 'Invalid request body',
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { planningSummary, context } = body

    if (process.env.NODE_ENV === 'development') {
      console.log('[init-generate] Starting generation step')
      console.log('[init-generate] Planning summary length:', planningSummary.length)
      console.log('[init-generate] Duration weeks:', context.mesocycle.duration_weeks)
    }

    // Build prompt
    const prompt = buildGenerationPrompt({ planningSummary, context })

    // Generate structured output with simple schema
    const { object, usage } = await generateObject({
      model: openai('gpt-5.2'),
      schema: SimpleGeneratedPlanSchema,
      system: GENERATION_SYSTEM_PROMPT,
      prompt,
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[init-generate] Complete, tokens:', usage)
      console.log('[init-generate] Generated weeks:', object.microcycles.length)
      console.log(
        '[init-generate] Total sessions:',
        object.microcycles.reduce((acc, w) => acc + w.sessions.length, 0)
      )
    }

    return Response.json({ plan: object })
  } catch (error) {
    console.error('[init-generate] Error:', error)

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
