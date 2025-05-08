import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { UserRoleData } from '@/lib/roles'
import { NextRequest } from 'next/server'

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

/**
 * Attempt to read user role data from injected header.
 * Returns null if header missing or invalid.
 */
export function getRoleDataFromHeader(req: NextRequest): UserRoleData | null {
  const raw = req.headers.get('x-kasoku-userrole')
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserRoleData
  } catch {
    return null
  }
} 