"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
 
export default function SignUpSSOCallback() {
  // Complete the redirect-based social sign-up flow
  return <AuthenticateWithRedirectCallback />
} 