/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Clerk authentication middleware to protect specific routes.
 * It uses clerkMiddleware for authentication handling and route protection.
 * 
 * @module middleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserRoleData } from '@/lib/roles'

// Match all protected pages and API routes
const isProtectedRoute = createRouteMatcher([
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
])

export default clerkMiddleware(
  async (auth, req) => {
    // Enforce Clerk auth on protected routes
    if (isProtectedRoute(req)) {
      await auth.protect()
    }
    // Retrieve userId via auth(), guard null
    const { userId } = await auth()
    console.log('[Middleware] auth() returned userId:', userId);
    const headers = new Headers(req.headers)
    if (!userId) {
      // If no user, skip role injection
      return NextResponse.next({ request: { headers } })
    }
    // Fetch and inject role data
    try {
      const roleData = await getUserRoleData(userId)
      console.log('[Middleware] roleData from getUserRoleData:', roleData);
      headers.set('x-kasoku-userrole', JSON.stringify(roleData))
      console.log('[Middleware] injecting x-kasoku-userrole header:', JSON.stringify(roleData));
      // Redirect non-coach users from coach-only pages
      const pathname = req.nextUrl.pathname
      if ([
        '/sessions',
        '/athletes',
        '/insights'
      ].some(p => pathname === p || pathname.startsWith(p + '/')) && roleData.role !== 'coach') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (err) {
      console.error('Error injecting user role header:', err)
    }
    return NextResponse.next({ request: { headers } })
  },
  // Enable debug logs in development
  { debug: process.env.NODE_ENV === 'development' }
)

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
  ]
} 