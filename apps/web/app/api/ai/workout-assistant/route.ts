/**
 * AI Workout Assistant API Route
 *
 * Streaming endpoint for the athlete workout AI assistant.
 * Uses Vercel AI SDK with tool calling.
 *
 * Authentication:
 * - Verifies user is authenticated
 * - Verifies user has an athlete record
 * - Verifies the workout belongs to that athlete
 *
 * @see specs/005-ai-athlete-workout/spec.md
 */

import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { auth } from '@clerk/nextjs/server'
import supabase from '@/lib/supabase-server'
import { getDbUserId } from '@/lib/user-cache'
import { checkServerRateLimit } from '@/lib/rate-limit-server'
import { athleteDomainTools } from '@/lib/changeset/tools'
import { buildAthleteSystemPrompt } from '@/lib/changeset/prompts/workout-athlete'
import { executeGetWorkoutContext } from '@/lib/changeset/tool-implementations/workout-read-impl'

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

    // Rate limit: 20 requests per minute per user
    const { allowed, remaining } = checkServerRateLimit(userId, 20, 60_000)
    if (!allowed) {
      return new Response('Too many requests. Please wait a moment.', {
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) },
      })
    }

    const { messages, workoutLogId } = body
    if (!workoutLogId) {
      return new Response('Workout Log ID is required', { status: 400 })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required', { status: 400 })
    }
    if (messages.length > 100) {
      return new Response('Too many messages', { status: 400 })
    }

    // Resolve DB user ID (throws if user not found)
    let dbUserId: number
    try {
      dbUserId = await getDbUserId(userId)
    } catch {
      return new Response('User not found', { status: 404 })
    }

    // Athlete + workout queries can run in parallel (both depend on dbUserId)
    const [athleteResult, workoutResult] = await Promise.all([
      supabase.from('athletes').select('id').eq('user_id', dbUserId).single(),
      supabase.from('workout_logs').select('id, athlete_id, session_status').eq('id', workoutLogId).single(),
    ])

    const { data: athlete, error: athleteError } = athleteResult
    if (athleteError || !athlete) {
      console.error('[workout-assistant] Athlete not found for user:', dbUserId)
      return new Response('Athlete record not found', { status: 403 })
    }

    // Verify workout ownership (fetched in parallel above)
    const { data: workout, error: workoutError } = workoutResult
    if (workoutError || !workout) {
      return new Response('Workout not found', { status: 404 })
    }

    if (workout.athlete_id !== athlete.id) {
      console.error('[workout-assistant] Athlete', athlete.id, 'tried to access workout owned by', workout.athlete_id)
      return new Response('Forbidden', { status: 403 })
    }

    // Get workout context for system prompt
    let workoutContext
    try {
      workoutContext = await executeGetWorkoutContext(
        { workoutLogId: String(workoutLogId), includeHistory: false },
        supabase
      )
    } catch (error) {
      console.error('[workout-assistant] Error fetching context:', error)
      // Continue without context - AI can still use getWorkoutContext tool
    }

    // Build system prompt with context
    const systemPrompt = buildAthleteSystemPrompt(workoutContext)

    // Convert UI messages to model messages format
    const modelMessages = await convertToModelMessages(messages)

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[workout-assistant] Workout ID:', workoutLogId)
      console.log('[workout-assistant] Athlete ID:', athlete.id)
      console.log('[workout-assistant] Messages count:', modelMessages.length)
      console.log('[workout-assistant] Tools available:', Object.keys(athleteDomainTools))
    }

    // Stream response with tool support and reasoning mode
    const result = streamText({
      model: openai('gpt-5.2'),
      system: systemPrompt,
      messages: modelMessages,
      tools: athleteDomainTools,
      providerOptions: {
        openai: {
          reasoningEffort: 'low',       // Low effort for interactive chat responsiveness
          reasoningSummary: 'auto',     // Stream condensed reasoning to client
        },
      },
      onFinish: ({ text, toolCalls, usage, reasoning }) => {
        console.log('[workout-assistant] Response text:', text?.substring(0, 200))
        console.log('[workout-assistant] Reasoning:', reasoning ? JSON.stringify(reasoning).substring(0, 200) : 'none')
        console.log('[workout-assistant] Tool calls:', toolCalls?.map((t) => t.toolName))
        console.log('[workout-assistant] Tokens:', usage)
      },
    })

    // Return streaming response with tool support
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[workout-assistant] Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
