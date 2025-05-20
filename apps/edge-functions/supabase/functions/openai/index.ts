import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
// @ts-ignore: import via import_map
import OpenAI from 'openai';

// @ts-ignore: Deno global
declare const Deno: any;

Deno.serve(async (req: Request) => {
  const headers = new Headers({ ...corsHeaders, 'Content-Type': 'application/json' });
  headers.set('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400, headers });
  }

  const messages = body.messages;
  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid request payload: "messages" array is required.' }), { status: 400, headers });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not set' }), { status: 500, headers });
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 3000,
      messages,
      functions: [{
        name: 'generate_exercise_details_for_sessions',
        description: 'Generate narrative feedback and concise exercise metrics for multiple sessions based on training goals and existing session data.',
        parameters: {
          type: 'object',
          properties: {
            feedback: { type: 'string', description: 'Narrative guidance and coaching advice.' },
            session_details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: { type: 'integer', description: 'Session identifier.' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        originalId: { type: 'integer', description: 'Original exercise ID from the database.' },
                        name: { type: 'string', description: 'Name of the exercise.' },
                        part: { type: 'string', description: 'Section of the workout (e.g., warmup, gym).' },
                        supersetId: { type: 'integer', description: 'Superset group ID for this exercise, if applicable.' },
                        sets: { type: 'integer', description: 'Number of sets.' },
                        reps: { type: 'integer', description: 'Number of repetitions.' },
                        rest: { type: 'integer', description: 'Rest time in seconds.' },
                        weight: { type: 'number', description: 'Weight in kg.' },
                        effort: { type: 'number', description: 'Effort percentage or RPE.' },
                        rpe: { type: 'number', description: 'Rate of perceived exertion.' },
                        velocity: { type: 'number', description: 'Movement velocity.' },
                        power: { type: 'number', description: 'Power output.' },
                        distance: { type: 'number', description: 'Distance in meters for sprint or drill.' },
                        height: { type: 'number', description: 'Height in meters for plyometric.' },
                        duration: { type: 'number', description: 'Duration in seconds for drills.' },
                        tempo: { type: 'string', description: 'Tempo notation, e.g., "3-1-1".' },
                      },
                      required: ['originalId','name','part','sets','reps','effort','rest']
                    }
                  }
                },
                required: ['sessionId','details']
              }
            }
          },
          required: ['feedback','session_details']
        }
      }],
      function_call: { name: 'generate_exercise_details_for_sessions' }
    });

    const call = res.choices?.[0]?.message?.function_call;
    if (!call?.arguments) {
      return new Response(JSON.stringify({ error: 'No function payload returned by AI.' }), { status: 502, headers });
    }

    let payload;
    try {
      payload = JSON.parse(call.arguments as string);
    } catch (e) {
      console.error('[Edge Function] JSON parse error:', e);
      return new Response(JSON.stringify({ error: 'Malformed JSON from AI.' }), { status: 502, headers });
    }

    return new Response(JSON.stringify(payload), { status: 200, headers });
  } catch (err: any) {
    console.error('[Edge Function] OpenAI error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
}); 