/**
 * NextAuth Route Handlers
 * This file exports the GET and POST handlers for NextAuth.js API routes
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return NextResponse.json({
    error: 'Authentication is now handled by Clerk',
    message: 'This NextAuth endpoint is no longer in use. Please use Clerk authentication.'
  }, { status: 400 })
}

export async function POST(request: Request) {
  return NextResponse.json({
    error: 'Authentication is now handled by Clerk',
    message: 'This NextAuth endpoint is no longer in use. Please use Clerk authentication.'
  }, { status: 400 })
}
