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
import { athleteDomainTools } from '@/lib/changeset/tools'
import { buildAthleteSystemPrompt } from '@/lib/changeset/prompts/workout-athlete'
import { executeGetWorkoutContext } from '@/lib/changeset/tool-implementations/workout-read-impl'

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
    const { messages, workoutLogId } = await req.json()

    if (!workoutLogId) {
      return new Response('Workout Log ID is required', { status: 400 })
    }

    // Get athlete record for this user
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', dbUserId)
      .single()

    if (athleteError || !athlete) {
      console.error('[workout-assistant] Athlete not found for user:', dbUserId)
      return new Response('Athlete record not found', { status: 403 })
    }

    // Verify workout ownership
    const { data: workout, error: workoutError } = await supabase
      .from('workout_logs')
      .select('id, athlete_id, session_status')
      .eq('id', workoutLogId)
      .single()

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

    // Debug logging
    console.log('[workout-assistant] Workout ID:', workoutLogId)
    console.log('[workout-assistant] Athlete ID:', athlete.id)
    console.log('[workout-assistant] Messages count:', modelMessages.length)
    console.log('[workout-assistant] Tools available:', Object.keys(athleteDomainTools))

    // Stream response with tool support
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: modelMessages,
      tools: athleteDomainTools,
      onFinish: ({ text, toolCalls, usage }) => {
        console.log('[workout-assistant] Response text:', text?.substring(0, 200))
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
