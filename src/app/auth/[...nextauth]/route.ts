/**
 * NextAuth Route Handlers
 * This file exports the GET and POST handlers for NextAuth.js API routes
 */

import NextAuth from "next-auth";
import { authOptions } from "./options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
