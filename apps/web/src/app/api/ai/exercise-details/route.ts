import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/ai/exercise-details
 * Request body: {
 *   trainingGoals: string,
 *   sessions: Array<{
 *     sessionId: number,
 *     sessionName: string,
 *     weekday: string,
 *     exercises: Array<{ presetId: number, name: string, type: string, existing: object }>
 *   }>
 * }
 * Returns: { status: 'success', data: Array<{ sessionId: number, details: Array<ExerciseDetail> }> }
 */
export async function POST(req: NextRequest) {
  try {
    // Lazy-load API key to avoid build-time errors
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ status: 'error', message: 'OpenAI API key not configured' }, { status: 500 });
    }
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    const body = await req.json();
    const { trainingGoals, sessions } = body;
    if (!trainingGoals || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Invalid request payload' }, { status: 400 });
    }

    // Define JSON schema for multi-session response
    const functions = [{
      name: 'generate_exercise_details_for_sessions',
      description: 'Generate concise exercise metrics and explanations for multiple sessions',
      parameters: {
        type: 'object',
        properties: {
          session_details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sessionId: { type: 'integer' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      presetId: { type: 'integer' },
                      sets: { type: 'integer' },
                      reps: { type: 'integer' },
                      effort_pct: { type: 'number' },
                      rpe: { type: 'number' },
                      velocity: { type: 'number' },
                      power: { type: 'number' },
                      distance: { type: 'number' },
                      height: { type: 'number' },
                      duration: { type: 'number' },
                      tempo: { type: 'string' },
                      explanation: { type: 'string' }
                    },
                    required: ['presetId','explanation']
                  }
                }
              },
              required: ['sessionId','details']
            }
          }
        },
        required: ['session_details']
      }
    }];

    // System prompt
    const system = `You are an expert strength-and-conditioning coach and a JSON-output specialist. ` +
                   `Review and improveeach session (with name and weekday) and fill in missing exercise metrics based on the training goals. ` +
                   `For barbell/machine lifts prefer relative intensity (%1RM), for other exercises use absolute values. ` +
                   `Return JSON matching the defined schema exactly.`;

    // Build messages
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ trainingGoals, sessions }, null, 2) }
    ];

    // Invoke OpenAI with timeout and faster model to avoid server timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    let response;
    try {
      // @ts-ignore: cast messages to any for SDK compatibility
      response = await openai.chat.completions.create({
        model: 'o4-mini-2025-04-16',
        messages: messages as any,
        functions,
        function_call: 'auto'
      }, { signal: controller.signal });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return NextResponse.json({ status: 'error', message: 'AI request timed out' }, { status: 504 });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const choice = response.choices?.[0];
    if (!choice?.message.function_call?.arguments) {
      return NextResponse.json({ status: 'error', message: 'No valid AI response' }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(choice.message.function_call.arguments);
    } catch {
      return NextResponse.json({ status: 'error', message: 'Failed to parse AI JSON' }, { status: 500 });
    }
    const session_details = parsed.session_details;

    return NextResponse.json({ status: 'success', data: session_details });
  } catch (err: any) {
    console.error('[AI] Error generating exercise details:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 