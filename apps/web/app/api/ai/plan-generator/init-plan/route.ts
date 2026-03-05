/**
 * Init Pipeline: Planning Step API Route
 *
 * Streams a training plan outline based on user context.
 * The output is passed to init-generate for structured JSON generation.
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { checkServerRateLimit } from '@/lib/rate-limit-server'

import {
  PLANNING_SYSTEM_PROMPT,
  buildPlanningPrompt,
} from '@/lib/init-pipeline/prompts'

export const maxDuration = 60 // Increased for thinking model

/**
 * Zod schema for validating init-plan request body.
 */
const InitPlanRequestSchema = z.object({
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
  exerciseLibrary: z.array(z.object({
    id: z.number(),
    name: z.string(),
    exercise_type: z.string().nullable().optional(),
    equipment: z.array(z.string()).optional(),
    contraindications: z.array(z.string()).optional(),
  })).default([]),
})

export async function POST(req: Request) {
  let userId: string | undefined
  try {
    // Authenticate and parse body in parallel
    const [authResult, rawBody] = await Promise.all([auth(), req.json()])
    userId = authResult.userId
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Kill switch: flip AI_ENABLED=false in Vercel dashboard to disable AI without redeploying
    if (process.env.AI_ENABLED === 'false') {
      return new Response('AI features are temporarily unavailable', { status: 503 })
    }

    // Rate limit: 5 requests per minute (expensive reasoningEffort: 'high')
    const { allowed, remaining } = checkServerRateLimit(userId, 5, 60_000)
    if (!allowed) {
      return new Response('Too many requests. Please wait a moment.', {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      })
    }

    // Validate request body
    let body: z.infer<typeof InitPlanRequestSchema>
    try {
      body = InitPlanRequestSchema.parse(rawBody)
    } catch (error) {
      return new Response(
        error instanceof z.ZodError ? JSON.stringify({ error: 'Invalid request', details: error.issues }) : 'Invalid request body',
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { context, exerciseLibrary } = body

    if (process.env.NODE_ENV === 'development') {
      console.log('[init-plan] Starting planning step')
      console.log('[init-plan] Context:', {
        experience: context.user.experience_level,
        goal: context.user.primary_goal,
        days: context.preferences.training_days.length,
        weeks: context.mesocycle.duration_weeks,
      })
      console.log('[init-plan] Exercise library size:', exerciseLibrary.length)
    }

    // Build prompt with exercise library
    const userPrompt = buildPlanningPrompt(context, exerciseLibrary)

    // Stream response with GPT-5.3 thinking mode for deep reasoning
    const result = streamText({
      model: openai('gpt-5.2'),
      maxOutputTokens: 32768,
      system: PLANNING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
        },
      },
      onFinish: ({ text, usage }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[init-plan] Complete, tokens:', usage)
          console.log('[init-plan] Output preview:', text?.substring(0, 200))
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[init-plan] Error:', { userId, error })
    return new Response('Internal Server Error', { status: 500 })
  }
}
