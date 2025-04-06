/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware to protect specific routes.
 * Will be updated to use Clerk for authentication handling and route protection.
 * 
 * @module middleware
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Placeholder for Clerk middleware implementation
export async function middleware(req: NextRequest) {
  // This will be replaced with Clerk middleware
  return NextResponse.next()
}

/**
 * Route protection configuration
 * Specifies which routes should be protected by authentication
 * 
 * Protected routes:
 * - /dashboard/* : All dashboard related pages
 * - /api/* : All API endpoints that require auth
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/public).*)',
  ],
}; 