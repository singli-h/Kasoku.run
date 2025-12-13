/*
<ai_context>
Next.js 16 Proxy Pattern (formerly middleware.ts)

This file contains lightweight authentication checks and route redirection for the Kasoku.run platform.
Following Next.js 16 best practices, this proxy is NOT used for authorization - all security
decisions are made at multiple layers for defense in depth.

Security Model (Defense in Depth):
1. Proxy Layer (THIS FILE): Initial auth check + redirect unauthenticated users to sign-in
2. Server Actions: Verify userId and ownership before mutations via await auth()
3. Database Layer: RLS policies auto-filter queries by user_id

Key Next.js 16 Changes:
- Renamed from middleware.ts to proxy.ts (required in Next.js 16)
- Proxy is intended for lightweight, real-time adjustments (redirects, header modifications)
- NOT a security boundary - always verify auth at data access layer
- Follows defense-in-depth principle per Next.js 16 security model

Migration Date: 2025-12-12
Next.js Version: 16.0.10
Clerk Version: 6.34.1

References:
- Next.js 16 Proxy Docs: https://nextjs.org/docs/app/getting-started/proxy
- Security Best Practices: apps/web/docs/security/rbac-implementation.md
- Middleware→Proxy Migration: https://nextjs.org/docs/messages/middleware-to-proxy
</ai_context>
*/

// @ts-expect-error - TypeScript module resolution issue with @clerk/nextjs 6.36.2 in workspace setup
// The exports exist at runtime (verified in node_modules/@clerk/nextjs/dist/types/server/index.d.ts)
// but TypeScript can't resolve them properly. This is a known issue with npm workspaces.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/athletes(.*)",
  "/plans(.*)",
  "/workout(.*)",
  "/performance(.*)",
  "/settings(.*)",
  "/profile(.*)",
  "/tasks(.*)",
  "/kb(.*)",
  "/copilot(.*)",
  "/onboarding(.*)"
])

// Routes that should skip onboarding check (public and auth routes)
const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/contact(.*)", 
  "/pricing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)"
])

// The onboarding route itself
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"])

export default clerkMiddleware(async (auth: any, req: any) => {
  try {
    const { userId, redirectToSignIn } = await auth()
    const request = req as NextRequest

    // If user is not authenticated and trying to access protected route
    if (!userId && isProtectedRoute(request)) {
      return redirectToSignIn({ returnBackUrl: request.url })
    }

    // Only check onboarding for authenticated users on protected routes
    if (userId && isProtectedRoute(request)) {
      
      // If user is on onboarding route, allow access without additional checks
      // The onboarding page itself will handle the auth state properly
      if (isOnboardingRoute(request)) {
        return NextResponse.next()
      }
      
      // For non-onboarding protected routes, we would ideally check if onboarding is needed
      // However, to avoid recursive auth() calls during middleware execution,
      // we'll let the individual pages handle onboarding checks
      // 
      // If onboarding is incomplete, the individual pages will detect this
      // and redirect to /onboarding as needed
    }

    // Continue with the request
    return NextResponse.next()
  } catch (error) {
    console.error('[Proxy Error]:', error)
    // Continue with request even if proxy fails (fail-open for availability)
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|__nextjs_original-stack-frames|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
