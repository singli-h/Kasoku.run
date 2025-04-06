/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware to protect specific routes.
 * It uses Clerk for authentication handling and route protection.
 * 
 * @module middleware
 */

import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Route protection configuration using Clerk's middleware
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;
  
  // Define public routes
  const isPublicRoute = 
    path === '/' || 
    path === '/login' || 
    path === '/register' || 
    path === '/auth/callback' || 
    path.startsWith('/api/webhooks/clerk');
  
  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return Response.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access login/register pages
  if (userId && (path === '/login' || path === '/register')) {
    return Response.redirect(new URL('/dashboard', req.url));
  }
});

/**
 * Route matching configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/webhooks routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/webhooks/).*)',
  ],
}; 