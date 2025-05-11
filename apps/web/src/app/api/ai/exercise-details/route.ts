import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client with server-only API key
// For development builds, use a mock function if no API key is available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : {
    chat: {
      completions: {
        create: async () => ({
          choices: [{
            message: {
              function_call: {
                arguments: JSON.stringify({
                  details: [{
                    presetId: 1,
                    sets: 3,
                    reps: 8,
                    effort_pct: 75,
                    explanation: "Development mock response - no OpenAI API key provided."
                  }]
                })
              }
            }
          }]
        })
      }
    }
  };

/**
 * POST /api/ai/exercise-details
 * Request body: { sessionId: number, sessionName: string, weekday: string, trainingGoals: string, exercises: Array<{presetId:number,name:string,type:string,existing:object}> }
 * Returns: { status: 'success', data: Array<{ presetId:number, sets?:number, reps?:number, effort_pct?:number, rpe?:number, velocity?:number, power?:number, distance?:number, height?:number, duration?:number, tempo?:string, explanation:string }> }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, sessionName, weekday, trainingGoals, exercises } = body;
    if (!sessionId || !Array.isArray(exercises)) {
      return NextResponse.json({ status: 'error', message: 'Invalid request payload' }, { status: 400 });
    }

    // Define function schema to enforce JSON output
    const functions = [{
      name: 'generate_exercise_details',
      description: 'Generate concise exercise metrics and explanations based on training goals',
      parameters: {
        type: 'object',
        properties: {
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
        required: ['details']
      }
    }];

    // Construct system & user messages
    const system = `You are an expert strength-and‐conditioning coach and a JSON-output specialist. Your job is to review a list of exercises in a training plan and automatically fill in missing "exercise details" for each, choosing only the minimal, most relevant variables per exercise based on the session's name, weekday, and the user's training goal. If an exercise already has some details, you can improve or refine them rather than overwrite them if needed. Every filled‐in exercise must include a very concise "reason" (≤ 30 words) explaining your choice.

Key behaviors:
1. Prioritize relative intensity (% of 1RM) for barbell and machine lifts, especially in group‐training mode.  
2. Use absolute values (weight_kg, distance_m, ball_weight_kg, etc.) for non‐barbell exercises (e.g. medicine‐ball throws, sled drags).  
3. Only include variables that are essential for the exercise and training goal—omit any others.  
4. Your "reason" must be a single sentence, ≤ 30 words, describing why you chose those variables.  
5. Always obey the JSON schema below exactly; do not output any extra properties or free text outside the JSON object.  
6. If your first output is invalid JSON, correct it on the next turn, outputting only the corrected JSON.`;
    const userMessage = {
      role: 'user',
      content: JSON.stringify({ 
        sessionName,
        weekday, 
        trainingGoals, 
        exercises 
      }, null, 2)
    };

    // Call OpenAI with function calling to get structured output
    const response = await openai.chat.completions.create({
      model: 'o4-mini-2025-04-16',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage.content }
      ],
      functions,
      function_call: { name: 'generate_exercise_details' }
    });

    const choice = response.choices?.[0];
    const functionCall = choice?.message?.function_call;
    if (!functionCall?.arguments) {
      throw new Error('OpenAI did not return a valid function call');
    }
    const parsed = JSON.parse(functionCall.arguments);
    const details = parsed.details;

    return NextResponse.json({ status: 'success', data: details });
  } catch (err: any) {
    console.error('[AI] Error generating exercise details:', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
} 