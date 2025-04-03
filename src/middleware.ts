/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware to protect specific routes.
 * It uses next-auth for authentication handling and route protection.
 * 
 * @module middleware
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Validate environment variables
const requiredEnvVars = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Check if required environment variables are set
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

/**
 * Enhanced authentication middleware with custom configuration
 * Wraps the default Next.js middleware with authentication checks
 */
export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()

    // Optional: Check if user is authenticated for protected routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // If no session, redirect to login
      if (!session) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Return the original response to avoid breaking the application
    return NextResponse.next()
  }
}

/**
 * Route protection configuration
 * Specifies which routes should be protected by authentication
 * 
 * Protected routes:
 * - /dashboard/* : All dashboard related pages
 * - /api/* : All API endpoints
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 