import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

async function proxy(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // Authenticate via Clerk token or session cookie
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized - User not authenticated' },
      { status: 401 }
    );
  }

  // Build the path to call in Supabase Edge Functions
  const slug = params.slug;
  if (!slug || slug.length === 0) {
    return NextResponse.json(
      { error: 'Bad Request - No API path provided' },
      { status: 400 }
    );
  }
  const apiPath = slug.join('/');

  // Prepare fetch to Supabase Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Missing Supabase base URL');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  // Build target URL with query parameters
  const base = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const apiUrl = `${base}/functions/v1/api/${apiPath}`;
  const urlObj = new URL(apiUrl);
  urlObj.search = request.nextUrl.search;
  const method = request.method;

  // Read body for methods that include one
  let body: any;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      body = await request.json();
    } catch (err) {
      console.error('Failed to parse request body:', err);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
  }

  // Proxy the request to Supabase Edge Function
  const response = await fetch(urlObj.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  // Forward status and JSON response
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

// Export all HTTP methods
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy; 