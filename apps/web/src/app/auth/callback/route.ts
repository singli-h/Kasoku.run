import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  console.log('Auth callback triggered - redirecting to dashboard since we use Clerk now')
  
  // Clerk handles its own auth, so we just need to redirect
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
} 