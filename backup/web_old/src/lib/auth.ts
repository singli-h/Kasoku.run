import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Enforces Clerk authentication in Route Handlers.
 * Returns the Clerk userId or a NextResponse redirect for unauthenticated requests.
 */
export async function requireAuth() {
  const authResult = await auth();
  console.log('[Auth] auth() result:', authResult);
  const { userId } = authResult;
  console.log('[Auth] userId:', userId);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
}
