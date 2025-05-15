import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "https://deno.land/x/dotenv/load.ts";

/**
 * Edge function to stream OpenAI chat completions with structured feedback and exercise details.
 */

// Define allowed origins for CORS
const allowedOrigins = [
  'https://www.kasoku.run',
  'https://kasoku.run',
  'http://localhost:3000', // Common CRA/Next.js dev port
  'http://localhost:3001', // Common Vite dev port
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  // Add any other localhost ports you use for development
];

// Helper function to set CORS headers
const setCorsHeaders = (responseHeaders: Headers, requestOrigin: string | null) => {
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    responseHeaders.set('Access-Control-Allow-Origin', requestOrigin);
  } else if (allowedOrigins.length > 0 && !requestOrigin) {
    // Fallback or default if needed, or handle as a disallowed origin.
    // For now, if no origin is present but we have a list, we might allow the first one,
    // or choose not to set the header, effectively blocking.
    // Let's be restrictive: if origin is not in the list, or not present, don't allow.
  }
  responseHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info'); // Added common Supabase headers
  responseHeaders.set('Access-Control-Max-Age', '86400'); // 24 hours
};

// @ts-ignore: Deno global provided by Supabase edge runtime
Deno.serve(async (req: Request) => {
  const requestOrigin = req.headers.get('Origin');
  const responseHeaders = new Headers();
  setCorsHeaders(responseHeaders, requestOrigin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  // Ensure the origin is allowed for non-OPTIONS requests
  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return new Response(JSON.stringify({ status: 'error', message: 'Origin not allowed' }), {
      status: 403, // Forbidden
      headers: {
        'Content-Type': 'application/json',
        // No CORS headers here for disallowed origins
      }
    });
  }
  // If requestOrigin is null but we expect it (e.g. browser clients), it might also be a security concern.
  // For simplicity, we proceed if it passed the OPTIONS preflight or is a same-origin/non-browser request.

  if (req.method !== 'POST') {
    responseHeaders.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ status: 'error', message: 'Method Not Allowed' }), { 
      status: 405, 
      headers: responseHeaders 
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    responseHeaders.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }), {
      status: 400,
      headers: responseHeaders
    });
  }
  const { trainingGoals, sessions } = payload;
  if (!trainingGoals || !Array.isArray(sessions)) {
    responseHeaders.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ status: 'error', message: 'Invalid request payload' }), {
      status: 400,
      headers: responseHeaders
    });
  }

  // @ts-ignore: Deno.env provided at runtime
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    responseHeaders.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ status: 'error', message: 'OpenAI API key not configured' }), {
      status: 500,
      headers: responseHeaders
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
      model: 'gpt-4o-mini',
      messages,
      functions: functionsSchema,
      function_call: 'auto',
      stream: true
    })
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error('[OpenAI] API error:', aiRes.status, errText);
    responseHeaders.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ status: 'error', message: `OpenAI API error (${aiRes.status})` }), {
      status: 500,
      headers: responseHeaders
    });
  }

  // Proxy the event stream back to the client
  // Ensure specific CORS headers for the stream response
  const streamResponseHeaders = new Headers(aiRes.headers); // Copy existing headers from AI response
  setCorsHeaders(streamResponseHeaders, requestOrigin); // Apply our CORS policy
  streamResponseHeaders.set('Content-Type', 'text/event-stream'); // Ensure correct content type
  streamResponseHeaders.set('Cache-Control', 'no-cache, no-transform'); // Ensure no caching

  return new Response(aiRes.body, {
    status: 200,
    headers: streamResponseHeaders
  });
}); 