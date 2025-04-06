import { NextResponse } from 'next/server'

// This route will be refactored for Clerk authentication
export async function GET(request: Request) {
  // Placeholder for Clerk auth callback handling
  console.log('Auth callback triggered - will be replaced with Clerk implementation')
  
  // Default redirect to dashboard
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
} 