/**
 * NextAuth Configuration and Route Handlers
 * 
 * This file configures the authentication system using NextAuth.js.
 * It sets up various authentication providers, session handling,
 * and database integration with Supabase.
 * 
 * @module auth/[...nextauth]/route
 */

import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
//import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

/**
 * Type Declaration for Extended Session
 * Extends the default NextAuth Session type to include additional user properties
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;           // Required user ID field
      email?: string | null;    // Optional email
      name?: string | null;     // Optional name
      image?: string | null;    // Optional profile image
    };
  }
}

/**
 * NextAuth Configuration Options
 * Defines the complete authentication setup for the application
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Email Authentication Provider Configuration
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "",
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "",
    }),
  ],

  /**
   * Session Configuration
   * Uses JWT strategy for session management with 30-day expiration
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  /**
   * Authentication Callbacks
   * Custom functions to handle various authentication events
   */
  callbacks: {
    /**
     * JWT Callback
     * Executed whenever a JWT is created or updated
     * 
     * @param {Object} params - Callback parameters
     * @param {Object} params.token - The JWT token
     * @param {Object} params.user - The user object (only available on sign in)
     * @param {Object} params.account - The provider account (only available on sign in)
     */
    async jwt({ token, user, account }) {
      // Store user ID in token during sign-in
      if (user) {
        token.userId = user.id;
      }
      // Store OAuth access token if available
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    /**
     * Session Callback
     * Executed whenever a session is checked
     * 
     * @param {Object} params - Callback parameters
     * @param {Object} params.session - The session object
     * @param {Object} params.token - The JWT token
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },

  /**
   * Database Adapter Configuration
   * Integrates NextAuth with Supabase for user data storage
   */
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }),

  /**
   * Custom Pages Configuration
   * Defines custom routes for authentication pages
   */
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  // Security Configuration
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  /**
   * Cookie Security Settings
   * Configures secure cookie handling based on environment
   */
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

/**
 * NextAuth Route Handlers
 * Exports GET and POST handlers for API routes
 */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
