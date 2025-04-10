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
import type { NextRequest } from "next/server"

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

export default clerkMiddleware(async (auth, req) => {
  try {
    // Handle public routes
    const url = new URL(req.url)
    const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route))
    if (isPublicRoute) return

    // If user is not signed in and trying to access protected route, redirect to sign in
    if (!auth.userId) {
      const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
      const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
      
      if (isProtectedRoute || isOnboardingRoute) {
        const signInUrl = new URL('/login', req.url)
        return NextResponse.redirect(signInUrl)
      }
      return
    }

    // For signed in users, check onboarding status for protected routes
    const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
    if (auth.userId && isProtectedRoute) {
      try {
        // Create Supabase admin client URLs
        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseAdminUrl || !supabaseAdminKey) {
          console.error('Missing Supabase admin credentials')
          return
        }

        // Fetch onboarding status
        const response = await fetch(
          `${supabaseAdminUrl}/rest/v1/users?clerk_id=eq.${auth.userId}&select=onboarding_completed`,
          {
            headers: {
              'apikey': supabaseAdminKey,
              'Authorization': `Bearer ${supabaseAdminKey}`
            }
          }
        )

        if (!response.ok) {
          console.error('Failed to fetch user status')
          return
        }

        const [user] = await response.json()

        // If onboarding is not completed, redirect to onboarding
        if (!user?.onboarding_completed) {
          const onboardingUrl = new URL('/onboarding', req.url)
          return NextResponse.redirect(onboardingUrl)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, allow access to continue
        return
      }
    }

    // Handle users trying to access onboarding after completion
    const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
    if (auth.userId && isOnboardingRoute) {
      try {
        const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseAdminUrl || !supabaseAdminKey) {
          console.error('Missing Supabase admin credentials')
          return
        }

        const response = await fetch(
          `${supabaseAdminUrl}/rest/v1/users?clerk_id=eq.${auth.userId}&select=onboarding_completed`,
          {
            headers: {
              'apikey': supabaseAdminKey,
              'Authorization': `Bearer ${supabaseAdminKey}`
            }
          }
        )

        if (!response.ok) {
          console.error('Failed to fetch user status')
          return
        }

        const [user] = await response.json()

        // If onboarding is completed, redirect to planner
        if (user?.onboarding_completed) {
          const plannerUrl = new URL('/planner', req.url)
          return NextResponse.redirect(plannerUrl)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // On error, allow access to continue
        return
      }
    }

    // Protect the route
    await auth.protect()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login
    const signInUrl = new URL('/login', req.url)
    return NextResponse.redirect(signInUrl)
  }
})

/**
 * Route protection configuration
 * Specifies which routes should be processed by the middleware
 */
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
} 