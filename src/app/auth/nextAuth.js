// /pages/api/auth/[...nextauth].ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
// import { SupabaseAdapter } from "@next-auth/supabase-adapter";
// import { createClient } from "@supabase/supabase-js";

export default NextAuth({
  // 1. Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: process.env.EMAIL_SERVER_PORT!,
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],

  // 2. Use JWT or database sessions
  // If you want to remain loosely coupled, you can rely on JWT-based sessions:
  session: {
    strategy: "jwt",
  },

  // 3. Callbacks: you can store user ID in the token
  callbacks: {
    async jwt({ token, user, account }) {
      // When user signs in, store user.id
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the user ID from token into session
      if (token && session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },

  // 4. (Optional) If you do want a NextAuth <-> Supabase Adapter:
  // adapter: SupabaseAdapter({
  //   url: process.env.SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!, // or anon key if minimal
  //   ...
  // }),

  // 5. Ensure you provide a strong secret
  secret: process.env.NEXTAUTH_SECRET,
});
