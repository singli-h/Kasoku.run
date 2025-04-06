/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware using Clerk.
 * 
 */

import { clerkMiddleware } from '@clerk/nextjs/server'

// Export the Clerk middleware directly
export default clerkMiddleware()

// Configure which routes use the middleware
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    // Match API routes
    '/(api|trpc)(.*)',
  ],
} 