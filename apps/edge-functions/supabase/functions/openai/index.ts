import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "https://deno.land/x/dotenv/load.ts";
// Ensure you have a Deno-compatible way to import these.
// For example, from a CDN like esm.sh or deno.land/x
// This is a placeholder, actual URLs will be needed if not using a build step that handles npm modules.
import OpenAI from "https://esm.sh/openai@4"; // Example, find correct Deno compatible import
import { OpenAiHandler, StreamMode } from "https://esm.sh/openai-partial-stream@0.6.2"; // Example

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

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // Define the tool (function) schema for OpenAI
  const tools = [{
    type: "function",
    function: {
      name: 'generate_exercise_details_for_sessions',
      description: 'Generate narrative feedback and concise exercise metrics for multiple sessions based on training goals and existing session data.',
      parameters: {
        type: 'object',
        properties: {
          feedback: {
            type: 'string',
            description: 'Narrative guidance and coaching advice for the user regarding their overall plan and the generated session details.'
          },
          session_details: {
            type: 'array',
            description: "An array of session objects, each containing the session's ID and the detailed exercise metrics.",
            items: {
              type: 'object',
              properties: {
                sessionId: { type: 'integer', description: "The original ID of the session this detail pertains to." },
                details: {
                  type: 'array',
                  description: "An array of exercise details for this specific session.",
                  items: {
                    type: 'object',
                    properties: {
                      presetId: { type: 'integer', description: "The ID of the exercise preset this detail is for." },
                      name: { type: 'string', description: 'Name of the exercise. Should match the preset name if known.' },
                      part: { type: 'string', description: 'Section or part ID where this exercise instance belongs (e.g., warmup, gym-1, circuit-a). This should match the client-side identifier if provided for an existing exercise.' },
                      supersetId: { type: 'string', description: 'Optional: A unique identifier to group this exercise with others in a superset within the same session and part.' },
                      sets: { type: 'integer', description: "Number of sets." },
                      reps: { type: 'integer', description: "Number of repetitions per set." },
                      effort_pct: { type: 'number', description: "Effort percentage (e.g., 75 for 75%)." },
                      rpe: { type: 'number', description: "Rate of Perceived Exertion (e.g., 8 on a 1-10 scale)." },
                      velocity: { type: 'number', description: "Target velocity in m/s, if applicable." },
                      power: { type: 'number', description: "Target power in watts, if applicable." },
                      distance: { type: 'number', description: "Distance in meters/kilometers, if applicable." },
                      height: { type: 'number', description: "Height in cm/meters, if applicable for jumps." },
                      duration: { type: 'number', description: "Duration in seconds (for timed sets or activities)." },
                      tempo: { type: 'string', description: "Tempo marking (e.g., '2-0-1-0')." },
                      explanation: { type: 'string', description: "Brief explanation or rationale for the prescribed metrics for this specific exercise instance. This is crucial for user understanding." }
                    },
                    required: ['presetId', 'name', 'part', 'explanation'] // Ensure core identifiers and rationale are present
                  }
                }
              },
              required: ['sessionId', 'details']
            }
          }
        },
        required: ['feedback', 'session_details']
      }
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

  try {
    // Request a streaming chat completion using tools
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or your preferred model that supports tools well
      messages: messages,     // Pass client messages directly
      tools: tools,
      tool_choice: { type: "function", function: { name: "generate_exercise_details_for_sessions" } }, // Force this function
      stream: true,
    });

    // openai-partial-stream will parse the arguments of the function call
    // StreamObjectKeyValueTokens should yield the arguments object once parsed
    const handler = new OpenAiHandler(StreamMode.StreamObjectKeyValueTokens); 
    const entityStream = handler.process(stream);

    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      async start(controller) { // Changed from pull to start for processing the whole stream
        try {
          for await (const item of entityStream) {
            // We expect 'item' to be the arguments object of the 'generate_exercise_details_for_sessions' function call
            // once openai-partial-stream has parsed it.
            if (item && typeof item === 'object') { // Check if item is a meaningful object
                 // The item here should be the arguments of the function call,
                 // e.g. { feedback: "...", session_details: [...] }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(item)}\n\n`));
            }
          }
          controller.close();
        } catch (err) {
          console.error('[Edge Function] SSE stream error:', err);
          controller.error(err);
        }
      },
    });
    
    // Set standard SSE headers and our CORS headers
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache, no-transform');
    // responseHeaders.set('Connection', 'keep-alive'); // Often handled by the server

    return new Response(sseStream, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[Edge Function] OpenAI API or streaming error:', error);
    responseHeaders.set('Content-Type', 'application/json');
    // @ts-ignore
    const errorMessage = error.message || 'Internal Server Error';
    // @ts-ignore
    const errorStatus = error.status || 500;
    return new Response(JSON.stringify({ status: 'error', message: `Failed to process request: ${errorMessage}` }), {
      status: errorStatus,
      headers: responseHeaders,
    });
  }
}); 