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

// This array contains public routes and paths that should be accessible without authentication
const publicRoutes = [
  '/',
  '/login(.*)',
  '/register(.*)',
  '/auth/session(.*)',
  '/auth/callback(.*)',
  '/auth(.*)',
  '/api(.*)',
  '/login/sso-callback(.*)'
];

// Configure the Clerk middleware
export default clerkMiddleware(async (auth, req) => {
  // Allow public routes to bypass authentication
  const isPublicRoute = publicRoutes.some(pattern => {
    return new RegExp(`^${pattern.replace(/\*$/, '.*')}$`).test(req.url);
  });

  if (isPublicRoute) {
    return;
  }

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
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}; 