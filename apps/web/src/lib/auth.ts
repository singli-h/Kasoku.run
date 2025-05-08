import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Enforces Clerk authentication in Route Handlers.
 * Returns the Clerk userId or a NextResponse redirect for unauthenticated requests.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
} 