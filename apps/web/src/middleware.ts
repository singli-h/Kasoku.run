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
  '/settings'
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
  '/api'
]

// Use clerkMiddleware wrapper
export default clerkMiddleware(async (auth, req) => {
  try {
    // Handle public routes
    const url = new URL(req.url)
    const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))
    if (isPublicRoute) return NextResponse.next()

    // Check if user is authenticated
    const { userId } = await auth()

    // If user is not signed in and trying to access protected route, redirect to sign in
    if (!userId) {
      const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
      const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
      
      if (isProtectedRoute || isOnboardingRoute) {
        const signInUrl = new URL('/login', req.url)
        return NextResponse.redirect(signInUrl)
      }
      return NextResponse.next()
    }

    // For signed in users, check onboarding status for protected routes
    const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
    if (userId && isProtectedRoute) {
      try {
        // Use the API endpoint instead of calling Supabase directly
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user-status`
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${req.headers.get('Authorization') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error('Failed to fetch user status')
          return NextResponse.next()
        }

        const data = await response.json()

        // If onboarding is not completed, redirect to onboarding
        if (!data.onboardingCompleted) {
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
        // Use the API endpoint instead of calling Supabase directly
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/user-status`
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${req.headers.get('Authorization') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error('Failed to fetch user status')
          return NextResponse.next()
        }

        const data = await response.json()

        // If onboarding is completed, redirect to planner
        if (data.onboardingCompleted) {
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