import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
// @ts-ignore: import via import_map
import OpenAI from 'openai';
// @ts-ignore: import via import_map
import { createClient as createSupabaseClient } from 'jsr:@supabase/functions-js';

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

  const token = req.headers.get('Authorization');
  const supa = createSupabaseClient({ auth: { token } });
  const { data: { user }, error: authError } = await supa.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
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
      model: 'gpt-4',
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
                  sessionId: { type: 'integer' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        presetId: { type: 'integer' },
                        name: { type: 'string' },
                        part: { type: 'string' },
                        supersetId: { type: 'string' },
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
                        explanation: { type: 'string' },
                      },
                      required: ['presetId','name','part','explanation']
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