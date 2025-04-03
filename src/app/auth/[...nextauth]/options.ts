/**
 * NextAuth Configuration Options
 * 
 * This file contains the configuration for NextAuth.js including
 * providers, callbacks, and database integration.
 */

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabase";

/**
 * Type Declaration for Extended Session
 * This type augmentation is used by NextAuth throughout the application.
 * The Session interface is used implicitly when accessing session.user.id
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;           // Required user ID field
      email?: string | null;    // Optional email
      name?: string | null;     // Optional name
      image?: string | null;    // Optional profile image
      role?: string;
    };
    supabaseAccessToken?: string;
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      
      // If using OAuth, get the access token
      if (account?.access_token) {
        token.accessToken = account.access_token;
        
        // Store the token for Supabase usage
        token.supabaseAccessToken = account.access_token;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.supabaseAccessToken = token.supabaseAccessToken as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (!user.email) return false;

      if (account?.provider === "google") {
        try {
          // Create or update user profile in Supabase
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

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