/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Clerk authentication middleware to protect specific routes.
 * It uses clerkMiddleware for authentication handling and route protection.
 * 
 * @module middleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes using createRouteMatcher
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/planner(.*)',
  '/overview(.*)',
  '/settings(.*)',
  '/onboarding(.*)'
]);

// Configure the Clerk middleware
export default clerkMiddleware(async (auth, req) => {
  // Protect routes that match the isProtectedRoute pattern
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

/**
 * Route protection configuration
 * Specifies which routes should be processed by the middleware
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always process API routes
    '/(api|trpc)(.*)',
  ],
}; 