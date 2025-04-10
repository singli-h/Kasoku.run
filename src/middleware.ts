import { getAuth } from "@clerk/nextjs/server"
import { NextResponse, NextRequest } from "next/server"

// Define routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/webhook',
  '/_next',
  '/favicon.ico',
]

// Define routes that require authentication
const protectedRoutes = [
  '/planner',
  '/dashboard',
  '/profile',
  '/settings',
  '/workouts',
]

// Define onboarding-related routes
const onboardingRoutes = [
  '/onboarding',
]

export default async function middleware(req: NextRequest) {
  const auth = getAuth(req)
  
  try {
    const url = new URL(req.url)

    // Skip middleware for public routes and static files
    if (publicRoutes.some(route => url.pathname.startsWith(route)) || 
        url.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)) {
      return
    }

    // If user is not signed in and trying to access protected route, redirect to sign in
    if (!auth.userId) {
      const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
      const isOnboardingRoute = onboardingRoutes.some(route => url.pathname.startsWith(route))
      
      if (isProtectedRoute || isOnboardingRoute) {
        const signInUrl = new URL('/login', req.url)
        return NextResponse.redirect(signInUrl)
      }
    }

    // Check onboarding status for protected routes
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

    // If we get here and the user is not authenticated, protect the route
    if (!auth.userId) {
      const signInUrl = new URL('/login', req.url)
      return NextResponse.redirect(signInUrl)
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login
    const signInUrl = new URL('/login', req.url)
    return NextResponse.redirect(signInUrl)
  }
} 