/**
 * Authentication Middleware Configuration
 * 
 * This file sets up Next.js authentication middleware to protect specific routes.
 * It uses next-auth for authentication handling and route protection.
 * 
 * @module middleware
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Enhanced authentication middleware with custom configuration
 * Wraps the default Next.js middleware with authentication checks
 */
export default withAuth(
  function middleware() {
    // This function can be expanded to include custom middleware logic
    // such as headers modification, request/response transformation, etc.
    return NextResponse.next();
  },
  {
    callbacks: {
      // Currently set to always authorize (development mode)
      // TODO: Implement proper authorization logic
      authorized: () => true,
      // Production authorization check example:
      //authorized: ({ token }) => !!token,
    },
  }
);

/**
 * Route protection configuration
 * Specifies which routes should be protected by authentication
 * 
 * Protected routes:
 * - /dashboard/* : All dashboard related pages
 * - /api/* : All API endpoints
 */
export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}; 