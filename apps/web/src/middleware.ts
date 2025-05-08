/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Clerk authentication middleware to protect specific routes.
 * It uses clerkMiddleware for authentication handling and route protection.
 * 
 * @module middleware
 */

import { NextResponse, NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserRoleData } from '@/lib/roles'

// Define protected routes that require authentication
const protectedRoutes = [
  '/workout',
  '/plans',
  '/athletes',
  '/insights',
  '/performance',
  '/overview',
  '/settings',
  '/profile',
  '/sessions'
]

// Define onboarding route
const onboardingRoutes = [
  '/onboarding'
]

// This array contains public routes that should be accessible without authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/session',
  '/auth/callback',
  '/auth/sso-callback',
  '/auth',
  // Include API test page in public routes
  '/api-test',
  // Add specific public API endpoints here
  '/api/user-status'  // This endpoint handles its own auth
]

// API routes that should be public (no authentication required)
const publicApiRoutes = [
  '/api/health',      // Health check endpoint if you have one
  '/api/public'       // Any other public APIs
]

/**
 * Middleware enforcing authentication and injecting x-kasoku-userrole header
 */
export default async function middleware(req: NextRequest) {
  // Authenticate the user via Clerk
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const clerkId = authResult
  // Inject cached role data header
  try {
    const roleData = await getUserRoleData(clerkId)
    const headers = new Headers(req.headers)
    headers.set('x-kasoku-userrole', JSON.stringify(roleData))
    return NextResponse.next({ request: { headers } })
  } catch (err) {
    console.error('Error injecting user role header:', err)
    return NextResponse.next()
  }
}

/**
 * Route protection configuration
 * Specifies which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    '/workout/:path*',
    '/plans/:path*',
    '/athletes/:path*',
    '/insights/:path*',
    '/performance/:path*',
    '/overview/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/sessions/:path*',
    '/api/:path*'
  ],
} 