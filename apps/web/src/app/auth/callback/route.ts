import { NextResponse } from 'next/server'

/**
 * Generic auth callback handler that redirects to the appropriate page
 * This is kept for backward compatibility and redirects to the main workout page
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/planner'
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
} 