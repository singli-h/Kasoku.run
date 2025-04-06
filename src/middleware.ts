/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware to protect specific routes.
 * It uses Clerk for authentication handling and route protection.
 * 
 * @module middleware
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicPaths = ['/', '/login', '/register', '/api/webhooks/clerk', '/auth/callback'];
const isPublic = createRouteMatcher(publicPaths);

/**
 * Route protection configuration using Clerk's middleware
 */
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  if (!userId && !isPublic(req)) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (userId && (
    req.nextUrl.pathname === '/login' || 
    req.nextUrl.pathname === '/register'
  )) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

/**
 * Route matching configuration
 */
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)"
  ],
}; 