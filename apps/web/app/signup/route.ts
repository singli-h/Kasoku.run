import { NextResponse } from "next/server"

export function GET() {
  // Permanent redirect for legacy /signup to /sign-up
  return NextResponse.redirect(new URL("/sign-up", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), 308)
}


