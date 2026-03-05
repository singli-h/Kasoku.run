/**
 * Planning Context Chat API Route
 *
 * Streaming AI chat for:
 * 1. Initial season setup -- AI interviews coach to build planning_context
 * 2. Generate Week -- AI receives full context chain and suggests microcycle sessions
 * 3. Weekly insights review -- AI summarizes workout data
 *
 * Request body:
 *   messages:          conversation history
 *   macroContext?:     macrocycle.planning_context.text (dedicated JSONB column)
 *   mesoContext?:      mesocycle.planning_context.text (dedicated JSONB column, NOT metadata)
 *   recentInsights?:   last 3 weekly_insights summaries
 *   athleteEventGroups?: event_group tags (SS/MS/LS)
 *   upcomingRaces?:    races in date range
 *   scheduleNotes?:    training days config
 *   importText?:       CSV or free text from wizard import step
 *   mode?:             'setup' | 'generate' | 'insights' (defaults to 'setup')
 */

import { streamText, smoothStream, type ModelMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'

export const maxDuration = 60

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(10000),
    })
  ).min(1).max(50),
  macroContext: z.string().max(10000).optional(),
  mesoContext: z.string().max(10000).optional(),
  recentInsights: z.array(z.string().max(1000)).max(3).optional(),
  athleteEventGroups: z.array(z.string().max(50)).max(10).optional(),
  upcomingRaces: z.array(z.string().max(200)).max(10).optional(),
  scheduleNotes: z.string().max(1000).optional(),
  importText: z.string().max(20000).optional(),
  mode: z.enum(['setup', 'generate', 'insights']).default('setup'),
})

const SYSTEM_PROMPTS = {
  setup: `You are an expert sports science consultant helping a coach structure their training plan.
Have a natural conversation to understand:
- Season goals and competition targets
- Training philosophy (volume-first, intensity-first, event-specific)
- Athlete group composition (event specialties, experience levels)
- Training schedule per group (days per week, facilities)
- Constraints (injuries, competitions, season dates)
Ask one focused question at a time. End with a "Planning Summary:" when you have enough context.
If the coach provides a CSV or document, extract the periodization philosophy from it.`,

  generate: `You are an expert athletics coach assistant helping generate a training microcycle.
Based on the planning context provided, suggest a specific week of training sessions.
Format each session clearly:
  Day | Session Name | Content
  - List exercises/drills with sets/reps/distances
  - Note SS/MS/LS variants inline (e.g. "LS: 15x200m M:36" | SS/MS: CSD @80%")
  - Flag race-week adjustments if races are upcoming
Be specific and actionable. The coach will review and create the sessions manually.`,

  insights: `You are a training analysis assistant reviewing a completed week of training.
Summarize what happened, identify patterns, flag deviations from the plan, and suggest adjustments.
Return a structured summary with: completion rate, key observations (max 3), and suggested adjustments (max 2).`,
}

export async function POST(req: Request) {
  try {
    const [authResult, body] = await Promise.all([auth(), req.json()])
    const userId = authResult.userId
    if (!userId) return new Response('Unauthorized', { status: 401 })

    if (process.env.AI_ENABLED === 'false') {
      return new Response('AI features temporarily unavailable', { status: 503 })
    }

    const { allowed } = checkServerRateLimit(userId, 20, 60_000)
    if (!allowed) return new Response('Too many requests', { status: 429 })

    try { await getDbUserId(userId) }
    catch { return new Response('User not found', { status: 404 }) }

    let validated: z.infer<typeof RequestSchema>
    try { validated = RequestSchema.parse(body) }
    catch {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemParts: string[] = [SYSTEM_PROMPTS[validated.mode]]

    if (validated.macroContext) {
      systemParts.push(`\n## Season Planning Context\n${validated.macroContext}`)
    }
    if (validated.mesoContext) {
      systemParts.push(`\n## Current Phase Focus\n${validated.mesoContext}`)
    }
    if (validated.recentInsights?.length) {
      systemParts.push(`\n## Recent Weeks (what actually happened)\n${validated.recentInsights.join('\n')}`)
    }
    if (validated.athleteEventGroups?.length) {
      systemParts.push(`\n## Athletes in Group\n${validated.athleteEventGroups.join(', ')} specialists`)
    }
    if (validated.upcomingRaces?.length) {
      systemParts.push(`\n## Upcoming Races\n${validated.upcomingRaces.join('\n')}`)
    }
    if (validated.scheduleNotes) {
      systemParts.push(`\n## Training Schedule\n${validated.scheduleNotes}`)
    }
    if (validated.importText) {
      systemParts.push(`\n## Imported Training Document\n${validated.importText}`)
    }

    // Map validated messages directly to ModelMessage format.
    // Unlike routes that receive UIMessage from useChat hook, this route
    // receives simple {role, content} from a manual fetch call.
    const messages: ModelMessage[] = validated.messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemParts.join('\n\n'),
      messages,
      experimental_transform: smoothStream(),
    })

    return result.toTextStreamResponse()
  } catch (e) {
    console.error('[planning-context-chat] Error:', e)
    return new Response('Internal server error', { status: 500 })
  }
}
