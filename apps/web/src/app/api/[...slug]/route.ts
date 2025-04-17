import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

async function proxy(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // Authenticate via Clerk
  const { userId } = await auth();
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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  const url = `${supabaseUrl}/functions/v1/api/${apiPath}`;
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

  // Proxy the request
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
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