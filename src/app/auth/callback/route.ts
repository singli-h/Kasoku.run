import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // In development with BYPASS_AUTH, redirect to dashboard
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .single()

    // If onboarding not completed, redirect to onboarding
    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
} 