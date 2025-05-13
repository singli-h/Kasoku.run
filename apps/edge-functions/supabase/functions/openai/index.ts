import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "https://deno.land/x/dotenv/load.ts";

/**
 * Edge function to stream OpenAI chat completions with structured feedback and exercise details.
 */
// @ts-ignore: Deno global provided by Supabase edge runtime
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const { trainingGoals, sessions } = payload;
  if (!trainingGoals || !Array.isArray(sessions)) {
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid request payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // @ts-ignore: Deno.env provided at runtime
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ status: 'error', message: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Define function-calling schema with feedback and session_details
  const functionsSchema = [{
    name: 'generate_exercise_details_for_sessions',
    description: 'Generate narrative feedback and concise exercise metrics for multiple sessions',
    parameters: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          description: 'Narrative guidance for the user'
        },
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
                    name: { type: 'string', description: 'Name of the exercise' },
                    part: { type: 'string', description: 'Section or part ID for the exercise' },
                    supersetId: { type: 'string', description: 'Optional superset identifier for grouping exercises' },
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
                  required: ['presetId', 'explanation']
                }
              }
            },
            required: ['sessionId', 'details']
          }
        }
      },
      required: ['feedback', 'session_details']
    }
  }];

  const systemPrompt = `
You are an expert strength-and-conditioning coach and a streaming JSON-output specialist.
Review and improve each session and fill in missing exercise metrics based on the training goals and your knowledge. 
Provide first a narrative 'feedback' section, then 'session_details' matching the JSON schema exactly.
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify({ trainingGoals, sessions }, null, 2) }
  ];

  // Call OpenAI with streaming
  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'o4-mini-2025-04-16',
      messages,
      functions: functionsSchema,
      function_call: 'auto',
      stream: true
    })
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error('[OpenAI] API error:', aiRes.status, errText);
    return new Response(JSON.stringify({ status: 'error', message: `OpenAI API error (${aiRes.status})` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Proxy the event stream back to the client
  return new Response(aiRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform'
    }
  });
}); 