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
export default clerkMiddleware()

/**
 * Route protection configuration
 * Specifies which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/planner/:path*',
    '/overview/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/api/:path*'
  ],
} 