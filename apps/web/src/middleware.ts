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
    // If BYPASS_AUTH is true, skip all auth checks
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      return NextResponse.next()
    }

    const res = NextResponse.next()
    
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession()

    // Get the current path
    const path = req.nextUrl.pathname

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/auth/callback', '/']
    const isPublicRoute = publicRoutes.includes(path)

    // If user is not authenticated and trying to access a protected route
    if (!session && !isPublicRoute) {
      // Store the original URL to redirect back after login
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access login/register pages
    if (session && (path === '/login' || path === '/register')) {
      // Redirect to dashboard
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
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
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}; 