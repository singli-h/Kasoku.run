/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Clerk authentication middleware to protect specific routes.
 * It uses clerkMiddleware for authentication handling and route protection.
 * 
 * @module middleware
 */

import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/planner',
  '/overview',
  '/settings',
  '/profile'
]

// Define onboarding route
const onboardingRoutes = [
  '/onboarding'
]

// This array contains public routes that should be accessible without authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
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

// Use clerkMiddleware wrapper
export default clerkMiddleware(async (auth, req) => {
  try {
    // Handle public routes
    const url = new URL(req.url)
    const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))
    const isPublicApiRoute = publicApiRoutes.some(route => url.pathname.startsWith(route))
    
    // Log request paths for debugging
    console.log(`[Middleware] Processing ${url.pathname}`)
    
    // Allow public routes and public API routes to pass through
    if (isPublicRoute || isPublicApiRoute) {
      console.log(`[Middleware] Public route: ${url.pathname}`)
      return NextResponse.next()
    }

    // Check if user is authenticated
    const { userId } = await auth()
    console.log(`[Middleware] User auth result: ${userId ? 'Authenticated' : 'Not authenticated'}`)

    // If user is not signed in and trying to access protected route, redirect to sign in
    if (!userId) {
      const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
      const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
      
      // For API routes, return 401 instead of redirecting
      // This is critical for proper API functioning
      if (url.pathname.startsWith('/api/')) {
        console.log(`[Middleware] Unauthorized API access: ${url.pathname}`)
        return NextResponse.json(
          { error: "Unauthorized - User not authenticated" },
          { status: 401 }
        )
      }
      
      if (isProtectedRoute || isOnboardingRoute) {
        console.log(`[Middleware] Redirecting unauthenticated user to login`)
        const signInUrl = new URL('/login', req.url)
        return NextResponse.redirect(signInUrl)
      }
      return NextResponse.next()
    }

    // For signed in users, check onboarding status for protected routes
    const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
    if (userId && isProtectedRoute) {
      try {
        // Use our API endpoint that leverages edge functions with cache-busting
        const timestamp = Date.now();
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user-status?t=${timestamp}`
        console.log(`Checking onboarding status for user ${userId}`)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${req.headers.get('Authorization') || ''}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })

        if (!response.ok) {
          console.error(`Failed to fetch user status: ${response.status}`)
          // On error, allow access to continue rather than blocking the user
          return NextResponse.next()
        }

        const data = await response.json()
        console.log(`Onboarding status: ${data.onboardingCompleted ? 'completed' : 'not completed'}`)
        console.log(`Onboarding raw value: ${JSON.stringify(data)}`)
        console.log(`Onboarding type: ${typeof data.onboardingCompleted}`)

        // If onboarding is not completed, redirect to onboarding
        // Ensure consistent boolean evaluation by using loose equality checking
        // This handles both `false` and falsy values like undefined/null/0/"false"
        if (data.hasOwnProperty('onboardingCompleted') && !data.onboardingCompleted) {
          console.log(`Redirecting to onboarding: User ${userId} has not completed onboarding`)
          const onboardingUrl = new URL('/onboarding', req.url)
          return NextResponse.redirect(onboardingUrl)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, allow access to continue
        return NextResponse.next()
      }
    }

    // Handle users trying to access onboarding after completion
    const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
    if (userId && isOnboardingRoute) {
      try {
        // Use our API endpoint that leverages edge functions with cache-busting
        const timestamp = Date.now();
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user-status?t=${timestamp}`
        console.log(`Checking if user ${userId} has already completed onboarding`)
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${req.headers.get('Authorization') || ''}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })

        if (!response.ok) {
          console.error(`Failed to fetch user status: ${response.status}`)
          // On error, allow access to continue
          return NextResponse.next()
        }

        const data = await response.json()
        console.log(`Onboarding status for redirect check: ${data.onboardingCompleted ? 'completed' : 'not completed'}`)
        console.log(`Onboarding raw value for redirect: ${JSON.stringify(data)}`)
        console.log(`Onboarding type for redirect: ${typeof data.onboardingCompleted}`)

        // If onboarding is completed, redirect to planner
        // Ensure consistent boolean evaluation by checking property existence and using loose equality
        if (data.hasOwnProperty('onboardingCompleted') && data.onboardingCompleted) {
          console.log(`Redirecting to planner: User ${userId} has already completed onboarding`)
          const plannerUrl = new URL('/planner', req.url)
          return NextResponse.redirect(plannerUrl)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, allow access to continue
        return NextResponse.next()
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login
    const signInUrl = new URL('/login', req.url)
    return NextResponse.redirect(signInUrl)
  }
}, {
  debug: process.env.NODE_ENV === 'development' // Enable debug mode in development
})

/**
 * Route protection configuration
 * Specifies which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
} 